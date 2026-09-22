import { pcm16FrameEnergy } from "./audio";

const FRAME_MS = 20; // matches AudioSocket's frame size (320 bytes @ 8kHz, 16-bit mono)
const SPEECH_START_FRAMES = 2; // ~40ms of sustained energy before declaring speech (avoids clicks/pops)
const PRE_ROLL_FRAMES = 5; // ~100ms of audio kept from just before speech is confirmed, so onsets aren't clipped
const SILENCE_HANGOVER_MS = Number(process.env.VAD_SILENCE_HANGOVER_MS ?? 700);
const SILENCE_HANGOVER_FRAMES = Math.round(SILENCE_HANGOVER_MS / FRAME_MS);
const MAX_UTTERANCE_MS = 30_000; // hard cap so a stuck-open line can't buffer forever
const ENERGY_THRESHOLD = Number(process.env.VAD_ENERGY_THRESHOLD ?? 500);

/**
 * A simple energy-based voice-activity detector, replacing what Deepgram's
 * hosted VAD used to do. Fed one 20ms PCM16 frame at a time; buffers audio
 * while the caller is talking and fires `onUtteranceEnded` with the whole
 * utterance once a sustained pause follows it.
 *
 * This is deliberately simple (no ML model, no new dependency) - telephone
 * audio quality varies a lot by line and handset, so `VAD_ENERGY_THRESHOLD`
 * is very likely to need tuning per deployment; see the README.
 */
export class UtteranceDetector {
  private state: "silence" | "speech" = "silence";
  private speechFrameStreak = 0;
  private silenceFrameStreak = 0;
  private frames: Buffer[] = [];
  private frameCount = 0;
  private preRoll: Buffer[] = [];

  constructor(
    private readonly onSpeechStarted: () => void,
    private readonly onUtteranceEnded: (pcm: Buffer) => void
  ) {}

  pushFrame(frame: Buffer): void {
    const isLoud = pcm16FrameEnergy(frame) > ENERGY_THRESHOLD;

    if (this.state === "silence") {
      this.preRoll.push(frame);
      if (this.preRoll.length > PRE_ROLL_FRAMES) this.preRoll.shift();

      if (isLoud) {
        this.speechFrameStreak++;
        if (this.speechFrameStreak >= SPEECH_START_FRAMES) {
          this.beginUtterance();
        }
      } else {
        this.speechFrameStreak = 0;
      }
      return;
    }

    // state === "speech"
    this.frames.push(frame);
    this.frameCount++;
    this.silenceFrameStreak = isLoud ? 0 : this.silenceFrameStreak + 1;

    const finishedBySilence = this.silenceFrameStreak >= SILENCE_HANGOVER_FRAMES;
    const finishedByMaxDuration = this.frameCount * FRAME_MS >= MAX_UTTERANCE_MS;

    if (finishedBySilence || finishedByMaxDuration) {
      this.endUtterance();
    }
  }

  /** Call when the call ends, in case an utterance was left mid-buffer. */
  reset(): void {
    this.state = "silence";
    this.speechFrameStreak = 0;
    this.silenceFrameStreak = 0;
    this.frames = [];
    this.frameCount = 0;
    this.preRoll = [];
  }

  private beginUtterance(): void {
    this.state = "speech";
    this.speechFrameStreak = 0;
    this.silenceFrameStreak = 0;
    this.frames = [...this.preRoll];
    this.frameCount = this.frames.length;
    this.preRoll = [];
    this.onSpeechStarted();
  }

  private endUtterance(): void {
    const audio = Buffer.concat(this.frames);
    this.state = "silence";
    this.frames = [];
    this.frameCount = 0;
    this.silenceFrameStreak = 0;
    this.onUtteranceEnded(audio);
  }
}
