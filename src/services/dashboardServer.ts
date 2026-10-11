import crypto from "crypto";
import type { Server as HttpServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { CallSession, type CallTransport } from "./callSession";
import { config } from "../config";

/**
 * The browser testing dashboard talks the simplest possible protocol over
 * one WebSocket connection: binary messages are raw 20ms PCM16 8kHz mono
 * audio frames (same format AudioSocket uses for real calls - nothing is
 * upsampled or cleaned up, so what you hear is exactly the bandwidth a real
 * caller's audio would have). Text messages are JSON telemetry events
 * relayed straight from CallSession, for the live transcript/status view.
 *
 * This WebSocket can run a real, billed conversation (Anthropic + the local
 * speech services), so if `DASHBOARD_TOKEN` is set, a connection must supply
 * the matching `?token=` query param or it's rejected before CallSession is
 * ever created. Unset (the local-dev default) means no check at all - fine
 * on localhost, not fine on anything internet-reachable.
 */
export function attachDashboardServer(httpServer: HttpServer, path = "/dashboard"): WebSocketServer {
  if (!config.dashboardToken) {
    console.warn(
      "WARNING: DASHBOARD_TOKEN is not set - the /dashboard WebSocket has no auth. " +
        "Fine for localhost-only use; set DASHBOARD_TOKEN before exposing this on a VPS."
    );
  }

  const wss = new WebSocketServer({
    server: httpServer,
    path,
    verifyClient: ({ req }, done) => {
      if (!config.dashboardToken) return done(true);
      const url = new URL(req.url ?? "", "http://localhost");
      const supplied = url.searchParams.get("token") ?? "";
      done(timingSafeEqual(supplied, config.dashboardToken));
    },
  });

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

/** Constant-time string compare so a VPS deployment isn't leaking the token via response-time differences. */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a same-shape comparison so early-return timing doesn't leak length either.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
