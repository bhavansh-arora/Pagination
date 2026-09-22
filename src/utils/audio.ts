import { spawn } from "child_process";
import { config } from "../config";

// 8kHz, 8-bit mu-law -> 1 byte/sample -> 160 bytes = 20ms, Twilio's native frame size.
const FRAME_BYTES = 160;
const FRAME_MS = 20;

/** Converts a WAV buffer (any sample rate/format) to raw 8kHz mono mu-law via ffmpeg. */
export function convertWavToMulaw8k(wavBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(config.tts.ffmpegPath, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-ar",
      "8000",
      "-ac",
      "1",
      "-f",
      "mulaw",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    let stderr = "";

    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });

    ffmpeg.stdin.on("error", () => {
      // Swallow EPIPE if ffmpeg exits before we finish writing (shouldn't
      // happen for well-formed WAV input, but avoid an unhandled throw).
    });
    ffmpeg.stdin.write(wavBuffer);
    ffmpeg.stdin.end();
  });
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
