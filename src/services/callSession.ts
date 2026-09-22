import type WebSocket from "ws";
import type { LiveClient } from "@deepgram/sdk";
import { openDeepgramConnection, sendAudio, type CallLanguage } from "./deepgram";
import { streamReply, type ChatMessage } from "./anthropic";
import { synthesizeSpeech } from "./localTts";
import { convertWavToMulaw8k, sendPaced } from "../utils/audio";
import { SentenceSplitter } from "../utils/sentenceSplitter";
import { AsyncQueue } from "../utils/asyncQueue";

const GREETING = "Hey, thanks for calling! What can I help you with?";

interface AssistantTurn {
  abortController: AbortController;
}

/**
 * Owns the whole lifecycle of one phone call: the Twilio media-stream
 * socket, the Deepgram STT connection, the Claude conversation, and the
 * locally-synthesized speech currently being spoken. One instance per call.
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
      onFinalTranscript: (text, language) => this.handleUserUtterance(text, language),
      onSpeechStarted: () => this.handleBargeIn(),
      onError: (err) => console.error("Deepgram error:", err),
    });
  }

  private speakGreeting(): void {
    this.history.push({ role: "assistant", content: GREETING });
    const abortController = new AbortController();
    this.currentTurn = { abortController };
    this.isAgentSpeaking = true;

    this.speakSentence(GREETING, abortController.signal)
      .catch((err) => console.error("Greeting TTS failed:", err))
      .finally(() => this.onTurnDone(abortController));
  }

  private handleBargeIn(): void {
    if (!this.isAgentSpeaking || !this.currentTurn) return;
    this.currentTurn.abortController.abort();
    this.currentTurn = null;
    this.isAgentSpeaking = false;
    if (this.streamSid) {
      this.ws.send(JSON.stringify({ event: "clear", streamSid: this.streamSid }));
    }
  }

  private handleUserUtterance(text: string, language: CallLanguage): void {
    if (this.isAgentSpeaking) this.handleBargeIn();
    // Tag the turn with the detected language so Claude reliably replies in
    // kind; the system prompt tells it to treat this as metadata, not text.
    this.history.push({ role: "user", content: `[lang: ${language}] ${text}` });
    this.runAssistantTurn();
  }

  private runAssistantTurn(): void {
    const abortController = new AbortController();
    const splitter = new SentenceSplitter();
    const sentenceQueue = new AsyncQueue<string>();
    let assistantText = "";

    this.currentTurn = { abortController };
    this.isAgentSpeaking = true;

    this.drainSpeechQueue(sentenceQueue, abortController.signal).finally(() =>
      this.onTurnDone(abortController)
    );

    (async () => {
      try {
        for await (const delta of streamReply(this.history, abortController.signal)) {
          assistantText += delta;
          for (const chunk of splitter.push(delta)) sentenceQueue.push(chunk);
        }
        const rest = splitter.flush();
        if (rest) sentenceQueue.push(rest);
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Assistant turn failed:", err);
        }
      } finally {
        sentenceQueue.close();
        if (assistantText.trim()) {
          this.history.push({ role: "assistant", content: assistantText.trim() });
        }
      }
    })();
  }

  /** Speaks queued sentences one at a time, in order, as they arrive from the LLM stream. */
  private async drainSpeechQueue(queue: AsyncQueue<string>, signal: AbortSignal): Promise<void> {
    for await (const sentence of queue) {
      if (signal.aborted) return;
      try {
        await this.speakSentence(sentence, signal);
      } catch (err) {
        if (!signal.aborted) console.error("TTS failed:", err);
      }
    }
  }

  private async speakSentence(text: string, signal: AbortSignal): Promise<void> {
    const wavBuffer = await synthesizeSpeech(text);
    if (signal.aborted) return;
    const mulaw = await convertWavToMulaw8k(wavBuffer);
    if (signal.aborted) return;
    await sendPaced(mulaw, (chunk) => this.sendAudioToTwilio(chunk), signal);
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
    this.currentTurn = null;
    try {
      this.deepgramConn?.requestClose();
    } catch {
      // already closed
    }
    this.deepgramConn = null;
  }
}
