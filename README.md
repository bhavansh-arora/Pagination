# Voice Agent

A phone-based conversational agent that answers real phone calls and talks
back like a person, not a script-reading bot.

It's built from three independent pieces wired together over a phone call,
rather than one bundled "speech-to-speech" API:

- **Speech-to-text:** [Deepgram](https://deepgram.com) streaming transcription
  (`nova-2-phonecall`, tuned for 8kHz phone audio).
- **Conversation:** [Claude](https://www.anthropic.com) generates replies
  with a system prompt tuned for spoken, human-sounding dialogue — short
  turns, contractions, no lists or markdown, natural acknowledgements.
- **Text-to-speech:** [ElevenLabs](https://elevenlabs.io) streaming TTS,
  requested directly in the 8kHz mu-law format Twilio needs, so audio is
  forwarded to the caller with no re-encoding.
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
4. When Deepgram finalizes an utterance, the transcript is sent to Claude
   as the next turn in the conversation.
5. As Claude streams its reply, completed sentences are sent to ElevenLabs,
   which streams back audio that's forwarded straight to Twilio.
6. If Deepgram detects the caller speaking again before the agent finishes,
   the in-flight Claude/ElevenLabs turn is aborted and Twilio's playback
   buffer is cleared — the agent yields the floor.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - A **Twilio** account SID/auth token and a phone number capable of voice.
   - A **Deepgram** API key.
   - An **Anthropic** API key.
   - An **ElevenLabs** API key and a voice ID (pick one from
     `elevenlabs.io/app/voice-library`).
   - `PUBLIC_HOST` — the hostname (no protocol) Twilio can reach this server
     on. For local dev, run `ngrok http 3000` and use the ngrok hostname.
3. `npm run dev` to start the server.
4. In the Twilio console, set your phone number's "A call comes in" webhook
   to `https://<PUBLIC_HOST>/voice/incoming-call` (HTTP POST).
5. Call the number. The agent should greet you and take it from there.

To have the agent place an outbound call instead, once the server is
running: `curl -X POST https://<PUBLIC_HOST>/voice/call -H 'content-type: application/json' -d '{"to":"+1..."}'`.

## Notes / next steps

- This is a from-scratch MVP: no persistence, no call recording, no
  multi-call load testing. Conversation history lives in memory per call
  and is discarded when the call ends.
- Swap the ElevenLabs voice, or Claude's system prompt in
  `src/services/anthropic.ts`, to change the agent's personality and tone.
- For production use, add call-status webhook handling, structured
  logging, and rate limiting around `/voice/call`.
