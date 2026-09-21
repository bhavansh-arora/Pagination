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

  elevenlabs: {
    apiKey: required("ELEVENLABS_API_KEY"),
    voiceId: required("ELEVENLABS_VOICE_ID"),
    modelId: process.env.ELEVENLABS_MODEL_ID ?? "eleven_turbo_v2_5",
  },
};
