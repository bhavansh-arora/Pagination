# Voice Agent

A phone-based conversational agent that answers real phone calls and talks
back like a person, not a script-reading bot. It's bilingual: callers can
speak English or Hindi and switch between them mid-call, and the agent
answers in kind, in an Indian-accented voice.

It's built from independent pieces wired together over a phone call, rather
than one bundled "speech-to-speech" API:

- **Speech-to-text:** [Deepgram](https://deepgram.com) streaming
  transcription (`nova-3`, multilingual code-switching mode), tuned for
  8kHz phone audio. Each final transcript comes back tagged with the
  detected language (English or Hindi).
- **Conversation:** [Claude](https://www.anthropic.com) generates replies
  with a system prompt tuned for spoken, human-sounding dialogue in either
  language — short turns, contractions, no lists or markdown, natural
  acknowledgements — and always answers in whichever language the caller
  just used.
- **Text-to-speech:** fully self-hosted, no cloud TTS API at all. A small
  local service (`tts-service/`) runs two open-source models in-process:
  [Piper](https://github.com/OHF-Voice/piper1-gpl) for Hindi (a native
  Hindi voice), and [MeloTTS](https://github.com/myshell-ai/MeloTTS)'s
  `EN_INDIA` speaker for English (English spoken with an Indian accent).
  The Node server picks which one to call per sentence just by checking
  whether that sentence contains Devanagari script.
- **Telephony:** [Twilio](https://www.twilio.com) answers/places the call
  and streams call audio to and from this server over a WebSocket
  ([Media Streams](https://www.twilio.com/docs/voice/media-streams)).

Text streams from Claude straight into TTS sentence-by-sentence (instead of
waiting for the full reply), and the agent supports **barge-in**: if the
caller starts talking while the agent is still speaking, playback stops
immediately and the agent listens, the way a real conversation works.

## How a call flows

1. Someone calls your Twilio number → Twilio POSTs to `/voice/incoming-call`.
2. That webhook responds with TwiML telling Twilio to open a bidirectional
   audio stream to `wss://<host>/media-stream`.
3. Inbound audio frames are forwarded to Deepgram as they arrive.
4. When Deepgram finalizes an utterance, the transcript — tagged with its
   detected language — is sent to Claude as the next turn in the
   conversation.
5. As Claude streams its reply, completed sentences are sent to the local
   `tts-service` (Piper for Hindi sentences, MeloTTS for English ones),
   converted to Twilio's 8kHz mu-law format via `ffmpeg`, and played out
   in real-time-paced 20ms frames.
6. If Deepgram detects the caller speaking again before the agent finishes,
   the in-flight turn is aborted mid-playback and Twilio's buffer is
   cleared — the agent yields the floor immediately.

## Setup

You're running three things locally: the Node voice-agent server, the
Python TTS microservice, and (for local dev) a tunnel like ngrok so Twilio
can reach your machine.

1. `npm install`
2. Set up `tts-service/` per its own [README](tts-service/README.md) —
   Python venv, Piper + MeloTTS install, downloading the Hindi voice model
   — then leave it running: `uvicorn server:app --host 127.0.0.1 --port 8001`
3. Make sure `ffmpeg` is installed and on your `PATH` (used to convert
   synthesized WAV audio into Twilio's mu-law format).
4. Copy `.env.example` to `.env` and fill in:
   - A **Twilio** account SID/auth token and a phone number capable of voice.
   - A **Deepgram** API key.
   - An **Anthropic** API key.
   - `LOCAL_TTS_URL` — where `tts-service` is running (default is fine if
     you followed step 2 as-is).
   - `PUBLIC_HOST` — the hostname (no protocol) Twilio can reach this server
     on. For local dev, run `ngrok http 3000` and use the ngrok hostname.
5. `npm run dev` to start the server.
6. In the Twilio console, set your phone number's "A call comes in" webhook
   to `https://<PUBLIC_HOST>/voice/incoming-call` (HTTP POST).
7. Call the number. The agent should greet you and take it from there —
   try speaking in Hindi partway through the call and it should switch.

To have the agent place an outbound call instead, once the server is
running: `curl -X POST https://<PUBLIC_HOST>/voice/call -H 'content-type: application/json' -d '{"to":"+1..."}'`.

## Notes / next steps

- This is a from-scratch MVP: no persistence, no call recording, no
  multi-call load testing. Conversation history lives in memory per call
  and is discarded when the call ends.
- Every third-party piece left here (Twilio, Deepgram, Anthropic) is still
  a paid cloud API — only text-to-speech was made fully self-hosted. If you
  want speech-to-text or the LLM off the cloud too, that's a separate,
  bigger swap (a local STT model, a self-hosted LLM), not covered here.
- To change the agent's personality/tone, edit the system prompt in
  `src/services/anthropic.ts`. To change voices, swap the Piper Hindi model
  or the MeloTTS speaker in `tts-service/server.py` (MeloTTS also has
  `EN-US`/`EN-BR`/`EN-AU`/`EN-Default` if you want a non-Indian accent for
  English instead).
- `tts-service` has its own licensing note (Piper's current release line is
  GPL-3.0) — see its README.
- For production use, add call-status webhook handling, structured
  logging, and rate limiting around `/voice/call`.
