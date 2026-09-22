"""
Local, fully self-hosted TTS microservice for the voice agent.

Everything here runs on this machine - no request ever leaves for a cloud
TTS API. Two engines are loaded once at startup and reused per request:

  - Hindi text  -> Piper, using a Hindi voice model (native Hindi speaker).
  - English text -> MeloTTS's EN_INDIA speaker (English spoken with an
    Indian accent).

The Node server (src/services/localTts.ts) decides which language a given
sentence is in (by checking for Devanagari script) and calls this service
accordingly.
"""
import io
import os
import wave

import numpy as np
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel

PIPER_MODEL_PATH = os.environ.get("PIPER_HI_MODEL_PATH", "models/hi_IN-pratham-medium.onnx")
MELO_DEVICE = os.environ.get("MELO_DEVICE", "cpu")
MELO_SPEAKER = os.environ.get("MELO_SPEAKER", "EN_INDIA")

app = FastAPI()

_piper_voice = None
_melo_model = None
_melo_speaker_id = None


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


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "en"  # "en" or "hi"


@app.on_event("startup")
def warm_up():
    # Load both models eagerly so the first real call isn't the slow one.
    get_piper_voice()
    get_melo()


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
