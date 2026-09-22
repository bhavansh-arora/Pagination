import { parseWav } from "./wav";

// 8kHz, 8-bit mu-law -> 1 byte/sample -> 160 bytes = 20ms, Twilio's native frame size.
const FRAME_BYTES = 160;
const FRAME_MS = 20;
const TWILIO_SAMPLE_RATE = 8000;

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
 * Faithful port of the ITU-T G.191 reference table-free mu-law encoder
 * (the same algorithm used in the official G.711 conformance test code).
 * Encodes one 16-bit linear PCM sample to one mu-law byte.
 */
function linearToMulawByte(sample: number): number {
  const absno = sample < 0 ? Math.min(((~sample) >> 2) + 33, 0x1fff) : Math.min((sample >> 2) + 33, 0x1fff);

  let i = absno >> 6;
  let segno = 1;
  while (i !== 0) {
    segno++;
    i >>= 1;
  }

  const highNibble = 0x0008 - segno;
  const lowNibble = 0x000f - ((absno >> segno) & 0x000f);

  let byte = (highNibble << 4) | lowNibble;
  if (sample >= 0) byte |= 0x0080;
  return byte & 0xff;
}

function pcm16ToMulaw(samples: Int16Array): Buffer {
  const out = Buffer.alloc(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = linearToMulawByte(samples[i]);
  }
  return out;
}

/**
 * Converts a WAV buffer (whatever sample rate the TTS engine produced) to
 * raw 8kHz mono mu-law bytes, entirely in-process - no ffmpeg subprocess,
 * so there's no per-sentence process-spawn latency on the hot path.
 */
export function convertWavToMulaw8k(wavBuffer: Buffer): Buffer {
  const { sampleRate, samples } = parseWav(wavBuffer);
  const resampled = resampleLinear(samples, sampleRate, TWILIO_SAMPLE_RATE);
  return pcm16ToMulaw(resampled);
}

/**
 * Sends mu-law audio to Twilio as real-time-paced 20ms frames so playback
 * doesn't outrun the call. Returns early (without throwing) if `signal` fires
 * mid-playback - that's how barge-in cuts audio off immediately.
 */
export async function sendPaced(
  mulaw: Buffer,
  sendFrame: (base64Payload: string) => void,
  signal: AbortSignal
): Promise<void> {
  for (let offset = 0; offset < mulaw.length; offset += FRAME_BYTES) {
    if (signal.aborted) return;
    const frame = mulaw.subarray(offset, offset + FRAME_BYTES);
    sendFrame(frame.toString("base64"));
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
