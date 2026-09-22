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

PIPER_MODEL_PATH = os.environ.get("PIPER_HI_MODEL_PATH", "models/hi_IN-pratham-medium.onnx")
MELO_DEVICE = os.environ.get("MELO_DEVICE", "cpu")
MELO_SPEAKER = os.environ.get("MELO_SPEAKER", "EN_INDIA")

WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "small")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_SAMPLE_RATE = 16000
SUPPORTED_LANGUAGES = {"en", "hi"}

app = FastAPI()

_piper_voice = None
_melo_model = None
_melo_speaker_id = None
_whisper_model = None


def get_piper_voice():
    global _piper_voice
    if _piper_voice is None:
        from piper import PiperVoice

        _piper_voice = PiperVoice.load(PIPER_MODEL_PATH)
    return _piper_voice


def get_melo():
    global _melo_model, _melo_speaker_id
    if _melo_model is None:
        from melo.api import TTS

        _melo_model = TTS(language="EN", device=MELO_DEVICE)
        _melo_speaker_id = _melo_model.hps.data.spk2id[MELO_SPEAKER]
    return _melo_model, _melo_speaker_id


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
    # Load every model eagerly so the first real call isn't the slow one.
    get_piper_voice()
    get_melo()
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
        voice = get_piper_voice()
        with wave.open(buffer, "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)
    else:
        model, speaker_id = get_melo()
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
