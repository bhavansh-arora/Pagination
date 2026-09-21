import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { config } from "./config";
import { voiceRouter } from "./routes/voice";
import { CallSession } from "./services/callSession";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/voice", voiceRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/media-stream" });

wss.on("connection", (ws) => {
  const session = new CallSession(ws);

  ws.on("message", (data) => session.handleTwilioMessage(data));
  ws.on("close", () => session.cleanup());
  ws.on("error", (err) => {
    console.error("Media stream socket error:", err);
    session.cleanup();
  });
});

server.listen(config.port, () => {
  console.log(`Voice agent listening on port ${config.port}`);
  console.log(`Twilio voice webhook: https://${config.publicHost}/voice/incoming-call`);
  console.log(`Media stream endpoint: wss://${config.publicHost}/media-stream`);
});
