export interface VoiceOption {
  id: string;
  language: "en" | "hi";
  engine: "piper" | "melo";
  label: string;
  accent: string;
}

/**
 * Every voice this app can speak with. Hindi voices are separate Piper
 * model files that must be downloaded (see tts-service/README.md); English
 * "voices" are just different speakers within the one MeloTTS checkpoint,
 * so they all work with no extra download.
 */
export const VOICE_CATALOG: VoiceOption[] = [
  { id: "hi_IN-pratham-medium", language: "hi", engine: "piper", label: "Pratham", accent: "Hindi - male" },
  { id: "hi_IN-priyamvada-medium", language: "hi", engine: "piper", label: "Priyamvada", accent: "Hindi - female" },
  { id: "EN_INDIA", language: "en", engine: "melo", label: "Indian English", accent: "English - Indian accent" },
  { id: "EN-US", language: "en", engine: "melo", label: "American English", accent: "English - US accent" },
  { id: "EN-BR", language: "en", engine: "melo", label: "British English", accent: "English - British accent" },
  { id: "EN-AU", language: "en", engine: "melo", label: "Australian English", accent: "English - Australian accent" },
  { id: "EN-Default", language: "en", engine: "melo", label: "Default English", accent: "English - neutral accent" },
];

const SAMPLE_TEXT: Record<"en" | "hi", string> = {
  en: "Hey, thanks for calling! What can I help you with today?",
  hi: "नमस्ते, कॉल करने के लिए धन्यवाद! मैं आपकी कैसे मदद कर सकता हूँ?",
};

export function getVoice(id: string): VoiceOption | undefined {
  return VOICE_CATALOG.find((v) => v.id === id);
}

export function sampleTextFor(language: "en" | "hi"): string {
  return SAMPLE_TEXT[language];
}
