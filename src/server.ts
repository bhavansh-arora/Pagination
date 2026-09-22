import express from "express";
import { config } from "./config";
import { startAudioSocketServer } from "./services/audioSocketServer";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(config.port, () => {
  console.log(`Health check listening on port ${config.port}`);
});

startAudioSocketServer(config.audioSocketPort);
console.log(
  `Point Asterisk's AudioSocket() dialplan application at this host, port ${config.audioSocketPort}`
);
