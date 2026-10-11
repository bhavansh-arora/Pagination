import type { Server as HttpServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { CallSession, type CallTransport } from "./callSession";

/**
 * The browser testing dashboard talks the simplest possible protocol over
 * one WebSocket connection: binary messages are raw 20ms PCM16 8kHz mono
 * audio frames (same format AudioSocket uses for real calls - nothing is
 * upsampled or cleaned up, so what you hear is exactly the bandwidth a real
 * caller's audio would have). Text messages are JSON telemetry events
 * relayed straight from CallSession, for the live transcript/status view.
 */
export function attachDashboardServer(httpServer: HttpServer, path = "/dashboard"): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path });

  wss.on("connection", (ws: WebSocket) => {
    const transport: CallTransport = {
      sendAudio: (frame) => {
        if (ws.readyState === ws.OPEN) ws.send(frame);
      },
      hangup: () => ws.close(),
    };

    const session = new CallSession(transport);

    const forward = (type: string) => (payload?: unknown) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, ...(payload as object) }));
    };
    session.on("transcript", forward("transcript"));
    session.on("assistant-text", forward("assistant-text"));
    session.on("assistant-text-delta", forward("assistant-text-delta"));
    session.on("speaking-started", forward("speaking-started"));
    session.on("speaking-stopped", forward("speaking-stopped"));
    session.on("barge-in", forward("barge-in"));
    session.on("error", (payload) =>
      forward("error")({ stage: (payload as { stage: string }).stage, message: String((payload as { error: unknown }).error) })
    );

    ws.on("message", (data, isBinary) => {
      if (isBinary) session.onAudioFrame(data as Buffer);
      // Ignore any non-audio text messages from the client for this MVP.
    });

    ws.on("close", () => session.cleanup());
    ws.on("error", (err) => {
      console.error("Dashboard WebSocket error:", err);
      session.cleanup();
    });
  });

  return wss;
}
