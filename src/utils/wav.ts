export interface DecodedWav {
  sampleRate: number;
  /** Always mono - stereo input is downmixed. */
  samples: Int16Array;
}

/** Parses a canonical PCM16 WAV buffer (as written by Python's `wave` module). */
export function parseWav(buffer: Buffer): DecodedWav {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Not a valid WAV file");
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 1;
  let bitsPerSample = 16;
  let dataStart = -1;
  let dataLength = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;

    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(bodyStart + 2);
      sampleRate = buffer.readUInt32LE(bodyStart + 4);
      bitsPerSample = buffer.readUInt16LE(bodyStart + 14);
    } else if (chunkId === "data") {
      dataStart = bodyStart;
      dataLength = chunkSize;
    }

    // Chunks are word-aligned - an odd-sized chunk has a padding byte after it.
    offset = bodyStart + chunkSize + (chunkSize % 2);
  }

  if (dataStart === -1 || sampleRate === 0) {
    throw new Error("Malformed WAV: missing fmt or data chunk");
  }
  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV bit depth: ${bitsPerSample} (expected 16)`);
  }

  const totalSamples = Math.floor(dataLength / 2);
  const raw = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    raw[i] = buffer.readInt16LE(dataStart + i * 2);
  }

  if (channels === 1) {
    return { sampleRate, samples: raw };
  }

  const frames = Math.floor(totalSamples / channels);
  const mono = new Int16Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += raw[f * channels + c];
    mono[f] = Math.round(sum / channels);
  }
  return { sampleRate, samples: mono };
}
