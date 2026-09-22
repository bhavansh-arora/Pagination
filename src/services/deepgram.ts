import { createClient, LiveTranscriptionEvents, type LiveClient } from "@deepgram/sdk";
import { config } from "../config";

const deepgram = createClient(config.deepgram.apiKey);

export type CallLanguage = "en" | "hi";

export interface DeepgramHandlers {
  /** Fired once a transcript is final (end of an utterance), with the detected language. */
  onFinalTranscript: (text: string, language: CallLanguage) => void;
  /** Fired the moment Deepgram's VAD detects the caller has started talking. */
  onSpeechStarted: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Opens a Deepgram live-transcription socket tuned for Twilio's inbound
 * phone audio (8kHz mu-law). Uses Nova-3's multilingual mode so the caller
 * can freely code-switch between English and Hindi turn to turn.
 */
export function openDeepgramConnection(handlers: DeepgramHandlers): LiveClient {
  const connection = deepgram.listen.live({
    model: "nova-3",
    language: "multi",
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
    smart_format: true,
    punctuate: true,
    interim_results: true,
    vad_events: true,
    endpointing: 300,
    utterance_end_ms: 1000,
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0];
    const text = alt?.transcript?.trim();
    if (text && data.is_final && data.speech_final) {
      // Multilingual responses carry a `languages` array (dominant language
      // first); the SDK's types predate this field, hence the cast.
      const detected = (alt as { languages?: string[] })?.languages?.[0];
      const language: CallLanguage = detected === "hi" ? "hi" : "en";
      handlers.onFinalTranscript(text, language);
    }
  });

  connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
    handlers.onSpeechStarted();
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    handlers.onError?.(err);
  });

  return connection;
}

/** Forward a raw mu-law audio chunk from Twilio straight to Deepgram. */
export function sendAudio(connection: LiveClient, payload: Buffer): void {
  connection.send(new Uint8Array(payload).buffer);
}
