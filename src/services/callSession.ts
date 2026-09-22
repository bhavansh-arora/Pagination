import type WebSocket from "ws";
import { streamReply, type ChatMessage } from "./anthropic";
import { synthesizeSpeech } from "./localTts";
import { transcribeSpeech } from "./localStt";
import { convertWavToMulaw8k, buildWavFromMulaw8k, sendPaced } from "../utils/audio";
import { UtteranceDetector } from "../utils/vad";
import { SentenceSplitter } from "../utils/sentenceSplitter";
import { AsyncQueue } from "../utils/asyncQueue";

const GREETING = "Hey, thanks for calling! What can I help you with?";

interface AssistantTurn {
  abortController: AbortController;
}

/**
 * Owns the whole lifecycle of one phone call: the Twilio media-stream
 * socket, the local voice-activity detector + speech-to-text, the Claude
 * conversation, and the locally-synthesized speech currently being spoken.
 * One instance per call.
 */
export class CallSession {
  private streamSid: string | null = null;
  private utteranceDetector: UtteranceDetector | null = null;
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
        this.startUtteranceDetector();
        this.speakGreeting();
        break;
      case "media":
        this.utteranceDetector?.pushFrame(Buffer.from(msg.media.payload, "base64"));
        break;
      case "stop":
        this.cleanup();
        break;
      default:
        // "mark", "dtmf", "connected" — nothing to do for this MVP.
        break;
    }
  }

  private startUtteranceDetector(): void {
    this.utteranceDetector = new UtteranceDetector(
      () => this.handleBargeIn(),
      (mulawAudio) => this.handleUtteranceAudio(mulawAudio)
    );
  }

  /** Transcribes a just-finished utterance locally and feeds it into the conversation. */
  private async handleUtteranceAudio(mulawAudio: Buffer): Promise<void> {
    try {
      const wavBuffer = buildWavFromMulaw8k(mulawAudio);
      const { text, language } = await transcribeSpeech(wavBuffer);
      const trimmed = text.trim();
      if (!trimmed) return; // likely a VAD false trigger (noise burst) with nothing recognizable
      this.handleUserUtterance(trimmed, language);
    } catch (err) {
      console.error("STT failed:", err);
    }
  }

  private speakGreeting(): void {
    this.history.push({ role: "assistant", content: GREETING });
    const abortController = new AbortController();
    this.currentTurn = { abortController };
    this.isAgentSpeaking = true;

    (async () => {
      try {
        const wavBuffer = await synthesizeSpeech(GREETING);
        if (abortController.signal.aborted) return;
        const mulaw = convertWavToMulaw8k(wavBuffer);
        await sendPaced(mulaw, (chunk) => this.sendAudioToTwilio(chunk), abortController.signal);
      } catch (err) {
        if (!abortController.signal.aborted) console.error("Greeting TTS failed:", err);
      }
    })().finally(() => this.onTurnDone(abortController));
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

  private handleUserUtterance(text: string, language: "en" | "hi"): void {
    if (this.isAgentSpeaking) this.handleBargeIn();
    // Tag the turn with the detected language so Claude reliably replies in
    // kind; the system prompt tells it to treat this as metadata, not text.
    this.history.push({ role: "user", content: `[lang: ${language}] ${text}` });
    this.runAssistantTurn();
  }

  /**
   * Runs a full assistant turn as a three-stage pipeline so nothing waits
   * on anything it doesn't have to:
   *   LLM tokens -> sentence chunks -> [synthesis] -> audio -> [playback]
   * Synthesis of sentence N+1 starts as soon as sentence N is done
   * synthesizing, while N is still being played out - that overlap is what
   * keeps gaps between sentences to a minimum on CPU-only TTS.
   */
  private runAssistantTurn(): void {
    const abortController = new AbortController();
    const splitter = new SentenceSplitter();
    const sentenceQueue = new AsyncQueue<string>();
    const audioQueue = new AsyncQueue<Buffer>();
    let assistantText = "";

    this.currentTurn = { abortController };
    this.isAgentSpeaking = true;

    const pipeline = Promise.all([
      this.runSynthesisStage(sentenceQueue, audioQueue, abortController.signal),
      this.runPlaybackStage(audioQueue, abortController.signal),
    ]);
    pipeline.finally(() => this.onTurnDone(abortController));

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

  /** Synthesizes queued sentences in order, one at a time, feeding finished audio onward immediately. */
  private async runSynthesisStage(
    sentenceQueue: AsyncQueue<string>,
    audioQueue: AsyncQueue<Buffer>,
    signal: AbortSignal
  ): Promise<void> {
    try {
      for await (const sentence of sentenceQueue) {
        if (signal.aborted) return;
        try {
          const wavBuffer = await synthesizeSpeech(sentence);
          if (signal.aborted) return;
          audioQueue.push(convertWavToMulaw8k(wavBuffer));
        } catch (err) {
          if (!signal.aborted) console.error("TTS synthesis failed:", err);
        }
      }
    } finally {
      audioQueue.close();
    }
  }

  /** Plays synthesized audio in order, one clip at a time, real-time paced. */
  private async runPlaybackStage(audioQueue: AsyncQueue<Buffer>, signal: AbortSignal): Promise<void> {
    for await (const mulaw of audioQueue) {
      if (signal.aborted) return;
      await sendPaced(mulaw, (chunk) => this.sendAudioToTwilio(chunk), signal);
    }
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
    this.utteranceDetector?.reset();
    this.utteranceDetector = null;
  }
}
