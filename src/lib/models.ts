import type { Depth, Tone, ResponseLength } from "./db";

export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", blurb: "Deepest thinking & nuance" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", blurb: "Fast, sharp, great value" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", blurb: "Instant replies, lowest cost" },
] as const;

export const DEFAULT_MODEL = MODELS[0].id;

export const DEPTHS: { id: Depth; label: string; blurb: string }[] = [
  { id: "fast", label: "Quick", blurb: "Snappy, conversational answers" },
  { id: "balanced", label: "Balanced", blurb: "Thoughtful but quick" },
  { id: "deep", label: "Deep", blurb: "Reflects more before answering" },
];

export const TONES: { id: Tone; label: string }[] = [
  { id: "warm", label: "Warm & caring" },
  { id: "direct", label: "Direct" },
  { id: "motivational", label: "Motivational" },
  { id: "calm", label: "Calm & grounding" },
  { id: "playful", label: "Playful" },
  { id: "analytical", label: "Analytical" },
  { id: "spiritual", label: "Spiritual" },
  { id: "no-nonsense", label: "Tough love" },
];

export const LENGTHS: { id: ResponseLength; label: string }[] = [
  { id: "concise", label: "Short & punchy" },
  { id: "balanced", label: "Balanced" },
  { id: "detailed", label: "In-depth" },
];

export const BRAND_COLORS = ["#7c3aed", "#4f46e5", "#0ea5e9", "#0d9488", "#16a34a", "#ea580c", "#e11d48", "#db2777", "#0f172a"];
