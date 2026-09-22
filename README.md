# Voice Agent

A phone-based conversational agent that answers real phone calls and talks
back like a person, not a script-reading bot. It's bilingual: callers can
speak English or Hindi and switch between them mid-call, and the agent
answers in kind, in an Indian-accented voice. Speech processing (hearing
the caller, speaking back) is fully self-hosted, and telephony has no
cloud API or vendor lock-in either — you run your own PBX and can plug in
whichever SIP trunk provider you like.

It's built from independent pieces wired together over a phone call, rather
than one bundled "speech-to-speech" API:

- **Telephony:** [Asterisk](https://www.asterisk.org) (free, self-hosted,
  open-source PBX) answers the call and bridges its audio to this app over
  [AudioSocket](https://docs.asterisk.org/Configuration/Channel-Drivers/AudioSocket/) —
  a small binary protocol Asterisk speaks natively, purpose-built for
  exactly this "hand call audio to a custom app" use case. Whatever SIP
  trunk actually terminates the call (any provider — that part of getting
  an Indian number is unavoidably regulated, see below) is Asterisk's
  problem; this app never talks to a telephony vendor's API directly, so
  the provider is swappable with a one-line dialplan/trunk config change.
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

Text streams from Claude straight into TTS sentence-by-sentence (instead of
waiting for the full reply), and the agent supports **barge-in**: if the
caller starts talking while the agent is still speaking, playback stops
immediately and the agent listens, the way a real conversation works.

## How a call flows

1. A call comes in on whichever number/SIP trunk you've pointed at
   Asterisk. Asterisk's dialplan answers it and hands the call to its
   `AudioSocket()` application, which opens a plain TCP connection to this
   app (`src/services/audioSocketServer.ts`).
2. Inbound audio frames (raw 16-bit PCM, 8kHz, mono - AudioSocket's native
   format) are fed frame-by-frame into the local voice-activity detector,
   which buffers audio while the caller is talking and fires once a
   sustained pause follows it.
3. That buffered utterance is sent to the local Whisper model to transcribe.
   The resulting text, tagged with its detected language, is sent to Claude
   as the next turn in the conversation.
4. As Claude streams its reply, completed sentences are sent to the local
   `tts-service` (Piper for Hindi sentences, MeloTTS for English ones),
   resampled to 8kHz in-process (no subprocess per sentence), and played
   out in real-time-paced 20ms frames. Synthesis of the next sentence
   starts as soon as the current one finishes rendering — it doesn't wait
   for the current one to finish *playing* — so there's minimal dead air
   between sentences.
5. If the voice-activity detector notices the caller speaking again before
   the agent finishes, the in-flight turn is aborted mid-playback
   immediately — the agent yields the floor.

### On latency

Everything above is tuned to minimize latency within a CPU-only, fully
self-hosted setup, but there's a real ceiling, and it's worth being honest
about where it is:

- **Text-to-speech:** Piper (Hindi) is fast enough for real-time synthesis
  on CPU alone. MeloTTS (English) is heavier and takes noticeably longer
  per sentence on CPU than a cloud TTS API would. The pipelining in step 4
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

You're running three things: the Node voice-agent server, the Python
speech microservice, and your own Asterisk instance.

### 1. The app

1. `npm install`
2. Set up `tts-service/` per its own [README](tts-service/README.md) —
   Python venv, Piper + MeloTTS + faster-whisper install, downloading the
   Hindi voice model — then leave it running:
   `uvicorn server:app --host 127.0.0.1 --port 8001`
3. Copy `.env.example` to `.env` and fill in your **Anthropic** API key.
   The defaults for everything else are fine for local dev.
4. `npm run dev`. You'll see it listening for AudioSocket connections on
   port 8090 (configurable via `AUDIOSOCKET_PORT`).

### 2. Asterisk

Install Asterisk ([asterisk.org](https://www.asterisk.org) has packages
for most Linux distros) on the same machine or network as this app. Two
pieces of config:

**A SIP trunk** to whichever provider gives you a number — this is the one
piece that's genuinely unavoidable to outsource: only a licensed telecom
carrier can hand you a real, dial-able number and terminate calls from
India's phone network (that's regulation, not a limitation of any
provider). Get SIP trunk credentials from your provider of choice and
register them in `pjsip.conf` — the exact config is provider-specific, so
follow their SIP trunking docs. The point of routing through Asterisk is
that this is the *only* place provider-specific config lives — swapping
providers later means changing this file, not this app.

**The dialplan** (`extensions.conf`) that answers the call and hands it to
this app:

```ini
[from-trunk]
exten => YOUR_NUMBER,1,Answer()
 same => n,AudioSocket(11111111-1111-1111-1111-111111111111,127.0.0.1:8090)
 same => n,Hangup()
```

The UUID is arbitrary (any valid UUID string) - it's just an identifier
Asterisk sends us for this call, not something you need to register
anywhere. Point `127.0.0.1:8090` at wherever this app's `AUDIOSOCKET_PORT`
is actually reachable from Asterisk.

### 3. Call it

Dial the number. The agent should greet you and take it from there — try
speaking in Hindi partway through the call and it should switch.

## Notes / next steps

- This is a from-scratch MVP: no persistence, no call recording, no
  multi-call load testing. Conversation history lives in memory per call
  and is discarded when the call ends.
- Anthropic (the LLM) is the only paid cloud API left. Telephony,
  speech-to-text, and text-to-speech are all fully self-hosted, and the
  SIP trunk provider is swappable without touching any code.
- To change the agent's personality/tone, edit the system prompt in
  `src/services/anthropic.ts`. To change voices, swap the Piper Hindi model
  or the MeloTTS speaker in `tts-service/server.py` (MeloTTS also has
  `EN-US`/`EN-BR`/`EN-AU`/`EN-Default` if you want a non-Indian accent for
  English instead).
- `tts-service` has its own licensing note (Piper's current release line is
  GPL-3.0) — see its README.
- Outbound calling (agent calls someone) isn't wired up yet — it'd be a
  short addition to the dialplan/Asterisk originate side, not this app.
