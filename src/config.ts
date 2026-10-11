import "dotenv/config";
import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

export const config = {
  // HTTP health-check + admin API server.
  port: Number(process.env.PORT ?? 3000),

  // Asterisk's AudioSocket() dialplan application connects here. No cloud
  // telephony API/account is involved - whatever SIP trunk you point
  // Asterisk at is entirely swappable without touching this app. The
  // protocol has no auth, so this only binds beyond localhost if you
  // explicitly widen it - see audioSocketServer.ts.
  audioSocketPort: Number(process.env.AUDIOSOCKET_PORT ?? 8090),
  audioSocketHost: process.env.AUDIOSOCKET_HOST || "127.0.0.1",

  anthropic: {
    apiKey: required("ANTHROPIC_API_KEY"),
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  },

  // Fully self-hosted speech (STT + TTS) - see tts-service/. No cloud speech API involved.
  localSpeechServiceUrl: process.env.LOCAL_SPEECH_SERVICE_URL ?? "http://127.0.0.1:8001",

  // Shared secret guarding every admin surface: the /dashboard WebSocket,
  // the setup chatbot, voice previews, call logs/recordings, and telephony
  // config - all of it can run real billed conversations or expose call
  // transcripts, so all of it sits behind the same gate. Required reading
  // if this server is reachable from anywhere beyond localhost - see README.
  adminToken: process.env.ADMIN_TOKEN || null,

  // Where the SQLite database and call recordings live on disk.
  dbPath: process.env.DB_PATH || path.join(dataDir, "voice-agent.sqlite3"),
  recordingsDir: process.env.RECORDINGS_DIR || path.join(dataDir, "recordings"),
};
