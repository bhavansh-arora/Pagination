"""
Local, fully self-hosted speech microservice for the voice agent.

Everything here runs on this machine - no request ever leaves for a cloud
speech API. Three engines are loaded once at startup and reused per request:

  - Hindi text  -> Piper, using a Hindi voice model (native Hindi speaker).
  - English text -> MeloTTS's EN_INDIA speaker (English spoken with an
    Indian accent).
  - Caller audio -> a self-hosted Whisper model (via faster-whisper), which
    transcribes English/Hindi speech and reports which one it heard.

The Node server decides which TTS engine to call per sentence by checking
for Devanagari script (src/services/localTts.ts), and buffers/segments
caller audio itself with a local voice-activity detector (src/utils/vad.ts)
before sending a finished utterance here to transcribe
(src/services/localStt.ts).
"""
import io
import os
import wave

import numpy as np
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel

PIPER_MODELS_DIR = os.environ.get("PIPER_MODELS_DIR", "models")
DEFAULT_PIPER_VOICE = os.environ.get("PIPER_DEFAULT_VOICE", "hi_IN-pratham-medium")
MELO_DEVICE = os.environ.get("MELO_DEVICE", "cpu")
DEFAULT_MELO_SPEAKER = os.environ.get("MELO_SPEAKER", "EN_INDIA")

WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_SAMPLE_RATE = 16000
SUPPORTED_LANGUAGES = {"en", "hi"}

app = FastAPI()

_piper_voices = {}  # voice id -> loaded PiperVoice, loaded lazily and cached
_melo_model = None
_whisper_model = None


def get_piper_voice(voice_id: str):
    if voice_id not in _piper_voices:
        from piper import PiperVoice

        model_path = os.path.join(PIPER_MODELS_DIR, f"{voice_id}.onnx")
        if not os.path.exists(model_path):
            raise HTTPException(400, f"Piper voice '{voice_id}' isn't downloaded (expected {model_path})")
        _piper_voices[voice_id] = PiperVoice.load(model_path)
    return _piper_voices[voice_id]


def get_melo_model():
    global _melo_model
    if _melo_model is None:
        from melo.api import TTS

        _melo_model = TTS(language="EN", device=MELO_DEVICE)
    return _melo_model


def get_melo_speaker_id(speaker: str) -> int:
    model = get_melo_model()
    spk2id = model.hps.data.spk2id
    if speaker not in spk2id:
        raise HTTPException(400, f"Unknown MeloTTS speaker '{speaker}'. Options: {list(spk2id.keys())}")
    return spk2id[speaker]


def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel

        _whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE
        )
    return _whisper_model


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en"  # "en" or "hi"
    voice: str | None = None  # Piper voice id for hi, MeloTTS speaker id for en - defaults if omitted


def decode_wav_pcm16_mono(wav_bytes: bytes):
    with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
        sample_rate = wav_file.getframerate()
        channels = wav_file.getnchannels()
        raw = wav_file.readframes(wav_file.getnframes())
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return sample_rate, samples


def resample_linear(samples: np.ndarray, from_rate: int, to_rate: int) -> np.ndarray:
    if from_rate == to_rate or len(samples) == 0:
        return samples
    duration = len(samples) / from_rate
    out_len = max(1, int(duration * to_rate))
    x_old = np.linspace(0, duration, num=len(samples), endpoint=False)
    x_new = np.linspace(0, duration, num=out_len, endpoint=False)
    return np.interp(x_new, x_old, samples)


@app.on_event("startup")
def warm_up():
    # Load the default voices eagerly so the first real call isn't the slow
    # one. Other Piper voices (if downloaded) load lazily on first use.
    if os.path.exists(os.path.join(PIPER_MODELS_DIR, f"{DEFAULT_PIPER_VOICE}.onnx")):
        get_piper_voice(DEFAULT_PIPER_VOICE)
    get_melo_model()
    get_whisper()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(400, "text is required")

    buffer = io.BytesIO()

    if req.language == "hi":
        voice = get_piper_voice(req.voice or DEFAULT_PIPER_VOICE)
        with wave.open(buffer, "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
    else:
        model = get_melo_model()
        speaker_id = get_melo_speaker_id(req.voice or DEFAULT_MELO_SPEAKER)
        audio = model.tts_to_file(text, speaker_id, output_path=None, quiet=True)
        sample_rate = model.hps.data.sampling_rate
        pcm16 = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm16.tobytes())

    return Response(content=buffer.getvalue(), media_type="audio/wav")


@app.post("/transcribe")
async def transcribe(request: Request):
    wav_bytes = await request.body()
    if not wav_bytes:
        raise HTTPException(400, "request body must be WAV audio bytes")

    sample_rate, samples = decode_wav_pcm16_mono(wav_bytes)
    if len(samples) == 0:
        return {"text": "", "language": "en"}

    audio = resample_linear(samples, sample_rate, WHISPER_SAMPLE_RATE) / 32768.0
    audio = audio.astype(np.float32)

    model = get_whisper()
    segments, info = model.transcribe(
        audio,
        # We already ran VAD on the Node side to segment this utterance,
        # so Whisper's own VAD filter would just be redundant work.
        vad_filter=False,
        beam_size=1,
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    language = info.language if info.language in SUPPORTED_LANGUAGES else "en"

    return {"text": text, "language": language}
