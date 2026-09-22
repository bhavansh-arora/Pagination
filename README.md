# Voice Agent

A phone-based conversational agent that answers real phone calls and talks
back like a person, not a script-reading bot. It's bilingual: callers can
speak English or Hindi and switch between them mid-call, and the agent
answers in kind, in an Indian-accented voice. Every part of speech
processing — hearing the caller and speaking back — is fully self-hosted;
no cloud speech API is involved.

It's built from independent pieces wired together over a phone call, rather
than one bundled "speech-to-speech" API:

- **Speech-to-text:** fully self-hosted, no cloud STT API at all. A local
  voice-activity detector (`src/utils/vad.ts`) buffers and segments the
  caller's audio itself, and each finished utterance is transcribed by a
  self-hosted [Whisper](https://github.com/SYSTRAN/faster-whisper) model
  (via `faster-whisper`) running in `tts-service/`, which also reports
  whether it heard English or Hindi.
- **Conversation:** [Claude](https://www.anthropic.com) generates replies
  with a system prompt tuned for spoken, human-sounding dialogue in either
  language — short turns, contractions, no lists or markdown, natural
  acknowledgements — and always answers in whichever language the caller
  just used.
- **Text-to-speech:** also fully self-hosted. The same local service runs
  two more open-source models in-process: [Piper](https://github.com/OHF-Voice/piper1-gpl)
  for Hindi (a native Hindi voice), and [MeloTTS](https://github.com/myshell-ai/MeloTTS)'s
  `EN_INDIA` speaker for English (English spoken with an Indian accent).
  The Node server picks which one to call per sentence just by checking
  whether that sentence contains Devanagari script.
- **Telephony:** [Twilio](https://www.twilio.com) answers/places the call
  and streams call audio to and from this server over a WebSocket
  ([Media Streams](https://www.twilio.com/docs/voice/media-streams)). This
  is the one piece that's inherently a cloud service — actual phone lines
  aren't something you can self-host.

Text streams from Claude straight into TTS sentence-by-sentence (instead of
waiting for the full reply), and the agent supports **barge-in**: if the
caller starts talking while the agent is still speaking, playback stops
immediately and the agent listens, the way a real conversation works.

## How a call flows

1. Someone calls your Twilio number → Twilio POSTs to `/voice/incoming-call`.
2. That webhook responds with TwiML telling Twilio to open a bidirectional
   audio stream to `wss://<host>/media-stream`.
3. Inbound audio frames are fed frame-by-frame into the local voice-activity
   detector, which buffers audio while the caller is talking and fires once
   a sustained pause follows it.
4. That buffered utterance is sent to the local Whisper model to transcribe.
   The resulting text, tagged with its detected language, is sent to Claude
   as the next turn in the conversation.
5. As Claude streams its reply, completed sentences are sent to the local
   `tts-service` (Piper for Hindi sentences, MeloTTS for English ones),
   converted to Twilio's 8kHz mu-law format in-process (no subprocess per
   sentence), and played out in real-time-paced 20ms frames. Synthesis of
   the next sentence starts as soon as the current one finishes rendering
   — it doesn't wait for the current one to finish *playing* — so there's
   minimal dead air between sentences.
6. If the voice-activity detector notices the caller speaking again before
   the agent finishes, the in-flight turn is aborted mid-playback and
   Twilio's buffer is cleared — the agent yields the floor immediately.

### On latency

Everything above is tuned to minimize latency within a CPU-only, fully
self-hosted setup, but there's a real ceiling, and it's worth being honest
about where it is:

- **Text-to-speech:** Piper (Hindi) is fast enough for real-time synthesis
  on CPU alone. MeloTTS (English) is heavier and takes noticeably longer
  per sentence on CPU than a cloud TTS API would. The pipelining in step 5
  hides most of that *between* sentences, but the first sentence of a
  reply still has to actually finish rendering before anything plays —
  there's no way around that on CPU.
- **Speech-to-text:** this is where self-hosting costs the most latency.
  A cloud streaming ASR service (like Deepgram, which this project used
  before) is often producing a transcript incrementally, as the caller
  talks — by the time they finish a sentence, most of the transcription
  work is already done. Our local setup instead has to wait for the
  voice-activity detector's silence hangover (default 700ms, tunable via
  `VAD_SILENCE_HANGOVER_MS`) and *then* run the whole utterance through
  Whisper in one go. That's real, additional, sequential latency that a
  streaming cloud STT doesn't have. It also means the simple energy-based
  VAD needs `VAD_ENERGY_THRESHOLD` tuned to your actual phone line/mic
  noise floor — too low and background noise triggers false utterances,
  too high and quiet speech gets missed.

If responsiveness isn't good enough, the biggest lever for both is a GPU:
set `MELO_DEVICE=cuda` and `WHISPER_DEVICE=cuda` in `tts-service` and both
render/transcribe times drop sharply with no quality loss.

## Setup

You're running three things locally: the Node voice-agent server, the
Python speech microservice, and (for local dev) a tunnel like ngrok so
Twilio can reach your machine.

1. `npm install`
2. Set up `tts-service/` per its own [README](tts-service/README.md) —
   Python venv, Piper + MeloTTS + faster-whisper install, downloading the
   Hindi voice model — then leave it running:
   `uvicorn server:app --host 127.0.0.1 --port 8001`
3. Copy `.env.example` to `.env` and fill in:
   - A **Twilio** account SID/auth token and a phone number capable of voice.
   - An **Anthropic** API key.
   - `LOCAL_SPEECH_SERVICE_URL` — where `tts-service` is running (default
     is fine if you followed step 2 as-is).
   - `PUBLIC_HOST` — the hostname (no protocol) Twilio can reach this server
     on. For local dev, run `ngrok http 3000` and use the ngrok hostname.
4. `npm run dev` to start the server.
5. In the Twilio console, set your phone number's "A call comes in" webhook
   to `https://<PUBLIC_HOST>/voice/incoming-call` (HTTP POST).
6. Call the number. The agent should greet you and take it from there —
   try speaking in Hindi partway through the call and it should switch.

To have the agent place an outbound call instead, once the server is
running: `curl -X POST https://<PUBLIC_HOST>/voice/call -H 'content-type: application/json' -d '{"to":"+1..."}'`.

## Notes / next steps

- This is a from-scratch MVP: no persistence, no call recording, no
  multi-call load testing. Conversation history lives in memory per call
  and is discarded when the call ends.
- Twilio (telephony) and Anthropic (the LLM) are the only paid cloud APIs
  left. Speech-to-text and text-to-speech are both fully self-hosted.
- To change the agent's personality/tone, edit the system prompt in
  `src/services/anthropic.ts`. To change voices, swap the Piper Hindi model
  or the MeloTTS speaker in `tts-service/server.py` (MeloTTS also has
  `EN-US`/`EN-BR`/`EN-AU`/`EN-Default` if you want a non-Indian accent for
  English instead).
- `tts-service` has its own licensing note (Piper's current release line is
  GPL-3.0) — see its README.
- For production use, add call-status webhook handling, structured
  logging, and rate limiting around `/voice/call`.
