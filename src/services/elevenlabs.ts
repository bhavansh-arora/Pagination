import WebSocket from "ws";
import { config } from "../config";

export interface TtsTurn {
  /** Queue another chunk of text to be spoken (called as the LLM streams). */
  sendText: (text: string) => void;
  /** No more text is coming for this turn; let the audio finish streaming out. */
  end: () => void;
  /** Barge-in / interruption: stop synthesis immediately, no more audio. */
  abort: () => void;
}

/**
 * Opens one ElevenLabs streaming TTS connection for a single assistant
 * turn. Requesting output_format=ulaw_8000 means the audio ElevenLabs
 * returns is already in the exact format Twilio's Media Streams expects,
 * so chunks can be forwarded to Twilio with no re-encoding.
 */
export function synthesizeTurn(
  onAudioChunk: (base64Payload: string) => void,
  onDone: () => void
): TtsTurn {
  const url =
    `wss://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}/stream-input` +
    `?model_id=${config.elevenlabs.modelId}&output_format=ulaw_8000`;

  const ws = new WebSocket(url, {
    headers: { "xi-api-key": config.elevenlabs.apiKey },
  });

  let aborted = false;
  let opened = false;
  const pending: string[] = [];
  let endRequested = false;

  const flushPending = () => {
    for (const text of pending.splice(0)) {
      ws.send(JSON.stringify({ text }));
    }
    if (endRequested) {
      ws.send(JSON.stringify({ text: "" }));
    }
  };

  ws.on("open", () => {
    opened = true;
    ws.send(
      JSON.stringify({
        text: " ",
        voice_settings: { stability: 0.45, similarity_boost: 0.8, speed: 1.0 },
        generation_config: { chunk_length_schedule: [50, 90, 120, 150] },
      })
    );
    flushPending();
  });

  ws.on("message", (raw) => {
    if (aborted) return;
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.audio) {
        onAudioChunk(msg.audio as string);
      }
      if (msg.isFinal) {
        ws.close();
      }
    } catch {
      // ignore malformed frames
    }
  });

  ws.on("close", () => {
    if (!aborted) onDone();
  });

  ws.on("error", () => {
    if (!aborted) onDone();
  });

  return {
    sendText(text: string) {
      if (aborted || !text) return;
      if (opened) {
        ws.send(JSON.stringify({ text: text + " " }));
      } else {
        pending.push(text + " ");
      }
    },
    end() {
      endRequested = true;
      if (opened) {
        ws.send(JSON.stringify({ text: "" }));
      }
    },
    abort() {
      aborted = true;
      try {
        ws.terminate();
      } catch {
        // already closed
      }
    },
  };
}
