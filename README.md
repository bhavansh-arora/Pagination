# Mindclone

A studio for coaches to build an AI "mind" of themselves. Coaches train it on their own material (files, web links and written notes), describe their philosophy and voice, then share a link. Clients get a ChatGPT-style chat that answers in the coach's voice, grounded in the coach's content.

## Features

**Coach studio (`/dashboard`)**
- Accounts with email + password
- Multiple minds per coach, with a dashboard showing sources, words learned and conversations
- **Identity**: name, photo or emoji avatar, accent color, tagline
- **Mind & voice**: bio, coaching philosophy, tone, reply length, coaching instructions (with one-click suggestions), boundaries
- **Knowledge**: upload PDF / DOCX / TXT / MD / CSV / HTML / subtitle files (drag and drop, several at once), import web links, write notes; preview the extracted text and remove sources
- **Client experience**: welcome message, conversation starters, and a call-to-action button (e.g. "Book a session")
- **AI engine**: Claude Opus 5.5 (default), Sonnet 5.5 or Haiku 5.5, and how much it thinks before replying
- **Publish & share**: draft or live, public link or access code, custom link name, embed snippet
- **Conversations**: read what clients asked
- **Live playground** beside every screen, to test the mind as you build it. Changes save automatically.

**Client chat (`/c/<link>`)**
- ChatGPT-style interface: streaming replies with markdown, conversation history in a sidebar, stop, copy and regenerate buttons, works on mobile
- Access-code gate for private minds

## How the "mind" works

- The persona prompt is built from the coach's identity, philosophy, voice, instructions and boundaries. Safety guardrails are always on: it is honest about being an AI if sincerely asked, refers people to professionals for medical, legal and financial questions, and responds to crisis situations.
- **Full memory**: when a mind's library is under about 600k characters (roughly 100k words), the whole library goes into the system prompt behind a prompt-cache breakpoint, so the mind "reads everything" on every message while cached tokens stay cheap.
- **Smart recall**: larger libraries are split into chunks and ranked with BM25 against the latest messages. The best passages are attached to the client's message.
- Server-side refusal fallback (`fallbacks: "default"`) is enabled for Opus and Sonnet.

## Running it

```bash
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

Production: `npm run build && npm start`.

## Storage

Everything is stored on local disk under `DATA_DIR` (default `./data`): one JSON database file, plus one text file per knowledge source. This works on a single server with a persistent disk (a VPS, Fly.io or Railway with a volume, or Render with a disk). It does **not** work on serverless hosts with ephemeral filesystems such as Vercel. All data access goes through `src/lib/db.ts`, so moving to Postgres later only touches that one file.

## Security notes

- Passwords are hashed with scrypt. Sessions are random tokens, stored hashed, in an httpOnly cookie.
- Link imports go through `src/lib/safe-fetch.ts`. It blocks private, loopback and link-local addresses: it checks every DNS answer at connect time and re-checks every redirect.
- The chat endpoint has a per-IP rate limit. The limiter lives in memory, so put a shared limiter in front if you run several instances.
