import express from "express";
import http from "http";
import path from "path";
import { config } from "./config";
import { startAudioSocketServer } from "./services/audioSocketServer";
import { attachDashboardServer } from "./services/dashboardServer";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, "..", "public")));

const httpServer = http.createServer(app);
attachDashboardServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Dashboard: http://localhost:${config.port}/dashboard.html`);
  console.log(`Health check listening on port ${config.port}`);
});

startAudioSocketServer(config.audioSocketPort);
console.log(
  `Point Asterisk's AudioSocket() dialplan application at this host, port ${config.audioSocketPort}`
);
