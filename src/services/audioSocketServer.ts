import net from "net";
import { CallSession, type CallTransport } from "./callSession";
import { getDefaultAgent } from "../db/agents";
import { startCall, appendTranscriptTurn, mergeCollectedData, endCall } from "../db/calls";
import { CallRecorder } from "./callRecorder";

/**
 * Implements Asterisk's AudioSocket protocol: a plain TCP connection where
 * Asterisk is the client (it connects out to us, from its `AudioSocket()`
 * dialplan application) and every message is a 3-byte header (1-byte type +
 * 2-byte big-endian payload length) followed by that many payload bytes.
 *
 * This is the entire "telephony" surface of this app now - whatever SIP
 * trunk/provider actually terminates the call is Asterisk's problem, not
 * ours, so the provider can be swapped freely without touching this code.
 *
 * AudioSocket's own protocol has no authentication at all, so this binds to
 * 127.0.0.1 by default - safe when Asterisk runs on the same machine. Only
 * widen `host` (via AUDIOSOCKET_HOST) if Asterisk is on a different box, and
 * firewall that port to Asterisk's IP specifically if you do.
 *
 * Every call here uses the default agent - AudioSocket has no way (yet) to
 * say which configured agent a call is for. That's the multi-agent routing
 * hook to build out later, once calls need to name their agent (e.g. by
 * which Asterisk trunk/DID received them).
 */

const TYPE_HANGUP = 0x00;
const TYPE_UUID = 0x01;
const TYPE_AUDIO_8K = 0x10; // signed linear 16-bit, 8kHz, mono, little-endian
const HEADER_BYTES = 3;

export function startAudioSocketServer(port: number, host = "127.0.0.1"): net.Server {
  const server = net.createServer((socket) => {
    let session: CallSession | null = null;
    let callId: string | null = null;
    let recorder: CallRecorder | null = null;
    let logCallId: string | null = null;
    let buffer = Buffer.alloc(0);
    let closed = false;
    let finished = false;

    const transport: CallTransport = {
      sendAudio: (frame) => {
        recorder?.addAgentFrame(frame);
        if (!closed) socket.write(encodeFrame(TYPE_AUDIO_8K, frame));
      },
      hangup: () => {
        if (!closed) socket.end(encodeFrame(TYPE_HANGUP, Buffer.alloc(0)));
      },
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      if (session && logCallId) endCall(logCallId, recorder?.save(logCallId) ?? null);
      session?.cleanup();
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
          case TYPE_UUID: {
            callId = payload.toString("hex");
            const agent = getDefaultAgent();
            logCallId = startCall(agent.id, "audiosocket");
            recorder = new CallRecorder();
            session = new CallSession(transport, agent);
            session.on("transcript", (p: { text: string; language: "en" | "hi" }) => {
              if (logCallId) appendTranscriptTurn(logCallId, { role: "user", text: p.text, language: p.language });
            });
            session.on("assistant-text", (p: { text: string }) => {
              if (logCallId) appendTranscriptTurn(logCallId, { role: "assistant", text: p.text });
            });
            session.on("collected-data", (p: Record<string, string>) => {
              if (logCallId) mergeCollectedData(logCallId, p);
            });
            break;
          }
          case TYPE_AUDIO_8K:
            recorder?.addCallerFrame(payload);
            session?.onAudioFrame(payload);
            break;
          case TYPE_HANGUP:
            finish();
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
      finish();
    });

    socket.on("error", (err) => {
      console.error(`AudioSocket connection error (call ${callId ?? "unknown"}):`, err);
      closed = true;
      finish();
    });
  });

  server.listen(port, host, () => {
    console.log(`AudioSocket server listening on ${host}:${port}`);
  });

  return server;
}

function encodeFrame(type: number, payload: Buffer): Buffer {
  const header = Buffer.alloc(HEADER_BYTES);
  header[0] = type;
  header.writeUInt16BE(payload.length, 1);
  return Buffer.concat([header, payload]);
}
