import fs from "fs";
import path from "path";
import { config } from "../config";
import { encodeWavPcm16Mono } from "../utils/wav";

const SAMPLE_RATE = 8000;
const INITIAL_CAPACITY_SAMPLES = SAMPLE_RATE * 60 * 10; // pre-allocate 10 minutes, doubles if a call runs longer

/**
 * Produces one time-aligned, mixed recording per call: both the caller's
 * and the agent's audio are written into the same sample buffer at the
 * wall-clock offset each frame actually arrived at, so overlapping speech
 * (e.g. barge-in) sums correctly instead of the two sides just being
 * concatenated out of sync.
 */
export class CallRecorder {
  private readonly startedAt = Date.now();
  private samples = new Int16Array(INITIAL_CAPACITY_SAMPLES);
  private writtenSamples = 0;

  addCallerFrame(frame: Buffer): void {
    this.mixFrame(frame);
  }

  addAgentFrame(frame: Buffer): void {
    this.mixFrame(frame);
  }

  private mixFrame(frame: Buffer): void {
    const sampleCount = Math.floor(frame.length / 2);
    if (sampleCount === 0) return;

    const offset = Math.round(((Date.now() - this.startedAt) / 1000) * SAMPLE_RATE);
    this.ensureCapacity(offset + sampleCount);

    for (let i = 0; i < sampleCount; i++) {
      const idx = offset + i;
      const mixed = this.samples[idx] + frame.readInt16LE(i * 2);
      this.samples[idx] = Math.max(-32768, Math.min(32767, mixed));
    }
    this.writtenSamples = Math.max(this.writtenSamples, offset + sampleCount);
  }

  private ensureCapacity(neededSamples: number): void {
    if (neededSamples <= this.samples.length) return;
    const grown = new Int16Array(Math.max(neededSamples, this.samples.length * 2));
    grown.set(this.samples);
    this.samples = grown;
  }

  /** Writes the mixed recording to disk and returns its path, or null if nothing was ever recorded. */
  save(callId: string): string | null {
    if (this.writtenSamples === 0) return null;
    const wav = encodeWavPcm16Mono(this.samples.subarray(0, this.writtenSamples), SAMPLE_RATE);
    const filePath = path.join(config.recordingsDir, `${callId}.wav`);
    fs.writeFileSync(filePath, wav);
    return filePath;
  }
}
