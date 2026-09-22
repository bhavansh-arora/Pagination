import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  // HTTP health-check server.
  port: Number(process.env.PORT ?? 3000),

  // Asterisk's AudioSocket() dialplan application connects here. No cloud
  // telephony API/account is involved - whatever SIP trunk you point
  // Asterisk at is entirely swappable without touching this app.
  audioSocketPort: Number(process.env.AUDIOSOCKET_PORT ?? 8090),

  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  },

  // Fully self-hosted speech (STT + TTS) - see tts-service/. No cloud speech API involved.
  localSpeechServiceUrl: process.env.LOCAL_SPEECH_SERVICE_URL ?? "http://127.0.0.1:8001",
};
