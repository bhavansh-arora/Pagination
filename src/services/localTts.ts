import { config } from "../config";

const DEVANAGARI = /[ऀ-ॿ]/;

/** Which local engine a chunk of text should be spoken by, decided purely from its own script. */
export function detectSpokenLanguage(text: string): "en" | "hi" {
  return DEVANAGARI.test(text) ? "hi" : "en";
}

/**
 * Synthesizes speech via the local tts-service (tts-service/server.py):
 * Piper for Hindi, MeloTTS's Indian-accented English speaker for English.
 * No cloud TTS API is involved - this is a plain HTTP call to a process
 * running on this machine (or one you control on your own network).
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const language = detectSpokenLanguage(text);

  const res = await fetch(`${config.tts.serviceUrl}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  if (!res.ok) {
    throw new Error(`Local TTS service error ${res.status}: ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
