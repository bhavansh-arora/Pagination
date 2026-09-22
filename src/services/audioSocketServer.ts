import net from "net";
import { CallSession, type CallTransport } from "./callSession";

/**
 * Implements Asterisk's AudioSocket protocol: a plain TCP connection where
 * Asterisk is the client (it connects out to us, from its `AudioSocket()`
 * dialplan application) and every message is a 3-byte header (1-byte type +
 * 2-byte big-endian payload length) followed by that many payload bytes.
 *
 * This is the entire "telephony" surface of this app now - whatever SIP
 * trunk/provider actually terminates the call is Asterisk's problem, not
 * ours, so the provider can be swapped freely without touching this code.
 */

const TYPE_HANGUP = 0x00;
const TYPE_UUID = 0x01;
const TYPE_AUDIO_8K = 0x10; // signed linear 16-bit, 8kHz, mono, little-endian
const HEADER_BYTES = 3;

export function startAudioSocketServer(port: number): net.Server {
  const server = net.createServer((socket) => {
    let session: CallSession | null = null;
    let callId: string | null = null;
    let buffer = Buffer.alloc(0);
    let closed = false;

    const transport: CallTransport = {
      sendAudio: (frame) => {
        if (!closed) socket.write(encodeFrame(TYPE_AUDIO_8K, frame));
      },
      hangup: () => {
        if (!closed) socket.end(encodeFrame(TYPE_HANGUP, Buffer.alloc(0)));
      },
    };

    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= HEADER_BYTES) {
        const type = buffer[0];
        const length = buffer.readUInt16BE(1);
        if (buffer.length < HEADER_BYTES + length) break; // wait for the rest of this message

        const payload = buffer.subarray(HEADER_BYTES, HEADER_BYTES + length);
        buffer = buffer.subarray(HEADER_BYTES + length);

        switch (type) {
          case TYPE_UUID:
            callId = payload.toString("hex");
            session = new CallSession(transport);
            break;
          case TYPE_AUDIO_8K:
            session?.onAudioFrame(payload);
            break;
          case TYPE_HANGUP:
            session?.cleanup();
            socket.end();
            break;
          default:
            // DTMF and error frames aren't used by this MVP.
            break;
        }
      }
    });

    socket.on("close", () => {
      closed = true;
      session?.cleanup();
    });

    socket.on("error", (err) => {
      console.error(`AudioSocket connection error (call ${callId ?? "unknown"}):`, err);
      closed = true;
      session?.cleanup();
    });
  });

  server.listen(port, () => {
    console.log(`AudioSocket server listening on port ${port}`);
  });

  return server;
}

function encodeFrame(type: number, payload: Buffer): Buffer {
  const header = Buffer.alloc(HEADER_BYTES);
  header[0] = type;
  header.writeUInt16BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}
