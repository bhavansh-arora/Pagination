import { config } from "../config";

export interface TranscriptionResult {
  text: string;
  language: "en" | "hi";
}

/**
 * Sends a buffered utterance (8kHz mono WAV) to the local tts-service's
 * /transcribe endpoint, which runs a self-hosted Whisper model. No cloud
 * STT API is involved - this is a plain HTTP call to a process on this
 * machine (or one you control on your own network).
 */
export async function transcribeSpeech(wavBuffer: Buffer): Promise<TranscriptionResult> {
  const res = await fetch(`${config.localSpeechServiceUrl}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "audio/wav" },
    body: wavBuffer,
  });

  if (!res.ok) {
    throw new Error(`Local STT service error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { text: string; language: string };
  return { text: data.text, language: data.language === "hi" ? "hi" : "en" };
}
