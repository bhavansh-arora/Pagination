import type WebSocket from "ws";
import type { LiveClient } from "@deepgram/sdk";
import { openDeepgramConnection, sendAudio } from "./deepgram";
import { streamReply, type ChatMessage } from "./anthropic";
import { synthesizeTurn, type TtsTurn } from "./elevenlabs";
import { SentenceSplitter } from "../utils/sentenceSplitter";

const GREETING = "Hey, thanks for calling! What can I help you with?";

interface AssistantTurn {
  abortController: AbortController;
  tts: TtsTurn;
}

/**
 * Owns the whole lifecycle of one phone call: the Twilio media-stream
 * socket, the Deepgram STT connection, the Claude conversation, and the
 * ElevenLabs TTS turn currently being spoken. One instance per call.
 */
export class CallSession {
  private streamSid: string | null = null;
  private deepgramConn: LiveClient | null = null;
  private history: ChatMessage[] = [];
  private currentTurn: AssistantTurn | null = null;
  private isAgentSpeaking = false;

  constructor(private readonly ws: WebSocket) {}

  handleTwilioMessage(raw: WebSocket.RawData): void {
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.event) {
      case "start":
        this.streamSid = msg.start.streamSid;
        this.startDeepgram();
        this.speakGreeting();
        break;
      case "media":
        if (this.deepgramConn) {
          sendAudio(this.deepgramConn, Buffer.from(msg.media.payload, "base64"));
        }
        break;
      case "stop":
        this.cleanup();
        break;
      default:
        // "mark", "dtmf", "connected" — nothing to do for this MVP.
        break;
    }
  }

  private startDeepgram(): void {
    this.deepgramConn = openDeepgramConnection({
      onFinalTranscript: (text) => this.handleUserUtterance(text),
      onSpeechStarted: () => this.handleBargeIn(),
      onError: (err) => console.error("Deepgram error:", err),
    });
  }

  private speakGreeting(): void {
    this.history.push({ role: "assistant", content: GREETING });
    this.speak(GREETING);
  }

  private handleBargeIn(): void {
    if (!this.isAgentSpeaking || !this.currentTurn) return;
    this.currentTurn.abortController.abort();
    this.currentTurn.tts.abort();
    this.currentTurn = null;
    this.isAgentSpeaking = false;
    if (this.streamSid) {
      this.ws.send(JSON.stringify({ event: "clear", streamSid: this.streamSid }));
    }
  }

  private handleUserUtterance(text: string): void {
    if (this.isAgentSpeaking) this.handleBargeIn();
    this.history.push({ role: "user", content: text });
    this.runAssistantTurn();
  }

  /** Speaks a fixed string directly, bypassing the LLM (used for the greeting). */
  private speak(text: string): void {
    const abortController = new AbortController();
    const tts = synthesizeTurn(
      (chunk) => this.sendAudioToTwilio(chunk),
      () => this.onTurnDone(abortController)
    );
    this.currentTurn = { abortController, tts };
    this.isAgentSpeaking = true;
    tts.sendText(text);
    tts.end();
  }

  private runAssistantTurn(): void {
    const abortController = new AbortController();
    const splitter = new SentenceSplitter();
    let assistantText = "";

    const tts = synthesizeTurn(
      (chunk) => this.sendAudioToTwilio(chunk),
      () => this.onTurnDone(abortController)
    );
    this.currentTurn = { abortController, tts };
    this.isAgentSpeaking = true;

    (async () => {
      try {
        for await (const delta of streamReply(this.history, abortController.signal)) {
          assistantText += delta;
          for (const chunk of splitter.push(delta)) tts.sendText(chunk);
        }
        const rest = splitter.flush();
        if (rest) tts.sendText(rest);
        tts.end();
        if (assistantText.trim()) {
          this.history.push({ role: "assistant", content: assistantText.trim() });
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Assistant turn failed:", err);
        }
      }
    })();
  }

  private onTurnDone(abortController: AbortController): void {
    if (this.currentTurn?.abortController === abortController) {
      this.currentTurn = null;
      this.isAgentSpeaking = false;
    }
  }

  private sendAudioToTwilio(base64Payload: string): void {
    if (!this.streamSid) return;
    this.ws.send(
      JSON.stringify({
        event: "media",
        streamSid: this.streamSid,
        media: { payload: base64Payload },
      })
    );
  }

  cleanup(): void {
    this.currentTurn?.abortController.abort();
    this.currentTurn?.tts.abort();
    this.currentTurn = null;
    try {
      this.deepgramConn?.requestClose();
    } catch {
      // already closed
    }
    this.deepgramConn = null;
  }
}
