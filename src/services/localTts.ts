import { config } from "../config";

const DEVANAGARI = /[ऀ-ॿ]/;

/** Which local engine a chunk of text should be spoken by, decided purely from its own script. */
export function detectSpokenLanguage(text: string): "en" | "hi" {
  return DEVANAGARI.test(text) ? "hi" : "en";
}

export interface VoiceChoice {
  /** Piper voice id, e.g. "hi_IN-pratham-medium". */
  voiceHi: string;
  /** MeloTTS speaker id, e.g. "EN_INDIA". */
  voiceEn: string;
}

async function callSynthesize(text: string, language: "en" | "hi", voice: string): Promise<Buffer> {
  const res = await fetch(`${config.localSpeechServiceUrl}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, voice }),
  });

  if (!res.ok) {
    throw new Error(`Local TTS service error ${res.status}: ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Synthesizes speech via the local tts-service (tts-service/server.py):
 * Piper for Hindi, MeloTTS for English - which specific voice/speaker is
 * used is per-agent (see the voice catalog in voices.ts). No cloud TTS API
 * is involved - this is a plain HTTP call to a process running on this
 * machine (or one you control on your own network).
 */
export async function synthesizeSpeech(text: string, voices: VoiceChoice): Promise<Buffer> {
  const language = detectSpokenLanguage(text);
  const voice = language === "hi" ? voices.voiceHi : voices.voiceEn;
  return callSynthesize(text, language, voice);
}

/** Synthesizes a specific voice/language explicitly - used by the voice-picker preview, not auto-detected. */
export async function synthesizeWithVoice(text: string, language: "en" | "hi", voiceId: string): Promise<Buffer> {
  return callSynthesize(text, language, voiceId);
}
