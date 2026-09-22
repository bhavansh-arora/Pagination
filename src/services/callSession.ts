import { streamReply, type ChatMessage } from "./anthropic";
import { synthesizeSpeech } from "./localTts";
import { transcribeSpeech } from "./localStt";
import { convertWavToPcm16_8k, buildWavFromPcm16_8k, sendPaced } from "../utils/audio";
import { UtteranceDetector } from "../utils/vad";
import { SentenceSplitter } from "../utils/sentenceSplitter";
import { AsyncQueue } from "../utils/asyncQueue";

const GREETING = "Hey, thanks for calling! What can I help you with?";

/** How the call session talks to whatever's actually carrying the audio (AudioSocket, or anything else later). */
export interface CallTransport {
  sendAudio: (pcmFrame: Buffer) => void;
  hangup: () => void;
}

interface AssistantTurn {
  abortController: AbortController;
}

/**
 * Owns the whole lifecycle of one phone call: the local voice-activity
 * detector + speech-to-text, the Claude conversation, and the
 * locally-synthesized speech currently being spoken. One instance per call.
 * Deliberately knows nothing about how audio actually reaches the caller -
 * that's the transport's job - so swapping the telephony layer later never
 * touches this file.
 */
export class CallSession {
  private utteranceDetector: UtteranceDetector;
  private history: ChatMessage[] = [];
  private currentTurn: AssistantTurn | null = null;
  private isAgentSpeaking = false;

  constructor(private readonly transport: CallTransport) {
    this.utteranceDetector = new UtteranceDetector(
      () => this.handleBargeIn(),
      (pcmAudio) => this.handleUtteranceAudio(pcmAudio)
    );
    this.speakGreeting();
  }

  /** Feed one 20ms PCM16 8kHz frame of caller audio in. */
  onAudioFrame(pcmFrame: Buffer): void {
    this.utteranceDetector.pushFrame(pcmFrame);
  }

  /** Transcribes a just-finished utterance locally and feeds it into the conversation. */
  private async handleUtteranceAudio(pcmAudio: Buffer): Promise<void> {
    try {
      const wavBuffer = buildWavFromPcm16_8k(pcmAudio);
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
        const pcm = convertWavToPcm16_8k(wavBuffer);
        await sendPaced(pcm, (frame) => this.transport.sendAudio(frame), abortController.signal);
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
          audioQueue.push(convertWavToPcm16_8k(wavBuffer));
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
    for await (const pcm of audioQueue) {
      if (signal.aborted) return;
      await sendPaced(pcm, (frame) => this.transport.sendAudio(frame), signal);
    }
  }

  private onTurnDone(abortController: AbortController): void {
    if (this.currentTurn?.abortController === abortController) {
      this.currentTurn = null;
      this.isAgentSpeaking = false;
    }
  }

  cleanup(): void {
    this.currentTurn?.abortController.abort();
    this.currentTurn = null;
  }
}
