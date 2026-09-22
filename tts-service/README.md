# Local TTS Service

A small FastAPI service that does all speech synthesis **locally, on your
own machine** - no ElevenLabs, no cloud TTS API of any kind. The Node voice
agent calls it over plain HTTP on localhost (or wherever you run it on your
own network).

- **Hindi** text is spoken by [Piper](https://github.com/OHF-Voice/piper1-gpl)
  using a native Hindi voice.
- **English** text is spoken by [MeloTTS](https://github.com/myshell-ai/MeloTTS)'s
  `EN_INDIA` speaker - English synthesized with an Indian accent.

`src/services/localTts.ts` on the Node side decides which language a given
sentence is in (checking for Devanagari script) and calls this service with
`{"text": "...", "language": "en" | "hi"}`, getting back a WAV file.

## Setup

```bash
cd tts-service
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# MeloTTS isn't on a requirements-friendly index; install from source and
# run its one-time data download.
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download
```

### Download the Hindi voice model

Piper voice models aren't bundled here (they're binary assets). Pick a
Hindi voice from the [Piper voices repo](https://huggingface.co/rhasspy/piper-voices/tree/main/hi/hi_IN)
- `pratham` (male) or `priyamvada` (female), both medium quality - and
download both files into `models/`:

```bash
mkdir -p models
curl -L -o models/hi_IN-pratham-medium.onnx \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx
curl -L -o models/hi_IN-pratham-medium.onnx.json \
  https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/pratham/medium/hi_IN-pratham-medium.onnx.json
```

To use `priyamvada` instead, swap the filenames above and set
`PIPER_HI_MODEL_PATH=models/hi_IN-priyamvada-medium.onnx` in your `.env`.

MeloTTS downloads its own `EN_INDIA` checkpoint automatically (via Hugging
Face) the first time the service starts.

## Running

```bash
uvicorn server:app --host 127.0.0.1 --port 8001
```

Leave this running alongside `npm run dev` in the main project - the Node
server expects it at `LOCAL_TTS_URL` (default `http://127.0.0.1:8001`).

First startup will be slow (loading both models); after that, requests are
fast since everything stays warm in memory.

## Compute

Both models run fine on CPU in real time for short phone-call sentences.
A GPU isn't required, but if you have one, set `MELO_DEVICE=cuda`.

## Licensing note

Piper's actively-developed fork is GPL-3.0. That only matters if you ever
*redistribute* this service (or a product built on it) to others - running
it privately as your own backend, as this project does, isn't a
distribution event under GPL, so there's nothing to do here. If you do plan
to ship this service itself to customers, get your own legal read on that
first. MeloTTS is MIT-licensed.
