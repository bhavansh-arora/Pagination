import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  publicHost: required("PUBLIC_HOST"),

  twilio: {
    accountSid: required("TWILIO_ACCOUNT_SID"),
    authToken: required("TWILIO_AUTH_TOKEN"),
    phoneNumber: required("TWILIO_PHONE_NUMBER"),
  },

  deepgram: {
    apiKey: required("DEEPGRAM_API_KEY"),
  },

  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  },

  // Fully self-hosted TTS - see tts-service/. No cloud TTS API involved.
  tts: {
    serviceUrl: process.env.LOCAL_TTS_URL ?? "http://127.0.0.1:8001",
    ffmpegPath: process.env.FFMPEG_PATH ?? "ffmpeg",
  },
};
