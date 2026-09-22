import { parseWav, encodeWavPcm16Mono } from "./wav";

// 20ms @ 8kHz, 16-bit mono PCM little-endian - AudioSocket's native frame format.
const FRAME_BYTES = 320;
const FRAME_MS = 20;
const CALL_SAMPLE_RATE = 8000;

/** Linear interpolation resample of mono PCM16 samples to a new sample rate. */
function resampleLinear(samples: Int16Array, fromRate: number, toRate: number): Int16Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const idx0 = Math.floor(srcPos);
    const idx1 = Math.min(idx0 + 1, samples.length - 1);
    const frac = srcPos - idx0;
    out[i] = Math.round(samples[idx0] * (1 - frac) + samples[idx1] * frac);
  }
  return out;
}

/**
 * Converts a WAV buffer (whatever sample rate the TTS engine produced) to
 * raw 8kHz mono PCM16LE bytes - AudioSocket's native audio format, so this
 * is just a resample, no format conversion needed.
 */
export function convertWavToPcm16_8k(wavBuffer: Buffer): Buffer {
  const { sampleRate, samples } = parseWav(wavBuffer);
  const resampled = resampleLinear(samples, sampleRate, CALL_SAMPLE_RATE);
  const out = Buffer.alloc(resampled.length * 2);
  for (let i = 0; i < resampled.length; i++) {
    out.writeInt16LE(resampled[i], i * 2);
  }
  return out;
}

/** Builds a canonical 8kHz mono WAV from raw PCM16LE call audio - the inverse of `convertWavToPcm16_8k`. */
export function buildWavFromPcm16_8k(pcm: Buffer): Buffer {
  const sampleCount = Math.floor(pcm.length / 2);
  const samples = new Int16Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = pcm.readInt16LE(i * 2);
  }
  return encodeWavPcm16Mono(samples, CALL_SAMPLE_RATE);
}

/** RMS energy of a raw PCM16LE frame - used for VAD. */
export function pcm16FrameEnergy(frame: Buffer): number {
  let sumSquares = 0;
  const sampleCount = Math.floor(frame.length / 2);
  for (let i = 0; i < sampleCount; i++) {
    const sample = frame.readInt16LE(i * 2);
    sumSquares += sample * sample;
  }
  return Math.sqrt(sumSquares / sampleCount);
}

/**
 * Sends PCM16 audio to the caller as real-time-paced 20ms frames so
 * playback doesn't outrun the call. Returns early (without throwing) if
 * `signal` fires mid-playback - that's how barge-in cuts audio off
 * immediately (AudioSocket has no separate playback buffer to flush;
 * simply stopping mid-stream is enough).
 */
export async function sendPaced(
  pcm: Buffer,
  sendFrame: (frame: Buffer) => void,
  signal: AbortSignal
): Promise<void> {
  for (let offset = 0; offset < pcm.length; offset += FRAME_BYTES) {
    if (signal.aborted) return;
    const frame = pcm.subarray(offset, offset + FRAME_BYTES);
    sendFrame(frame);
    await sleep(FRAME_MS, signal);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
