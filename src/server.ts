import express from "express";
import http from "http";
import path from "path";
import { config } from "./config";
import { startAudioSocketServer } from "./services/audioSocketServer";
import { attachDashboardServer } from "./services/dashboardServer";
import { requireAdmin } from "./services/adminAuth";
import { apiRouter } from "./routes/api";

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(express.json());
app.use("/api", requireAdmin, apiRouter);
app.use(express.static(path.join(__dirname, "..", "public")));

const httpServer = http.createServer(app);
attachDashboardServer(httpServer);

httpServer.listen(config.port, config.host, () => {
  console.log(`Admin UI: http://${config.host}:${config.port}/`);
  console.log(`Health check listening on ${config.host}:${config.port}`);
});

startAudioSocketServer(config.audioSocketPort, config.audioSocketHost);
console.log(
  `Point Asterisk's AudioSocket() dialplan application at ${config.audioSocketHost}:${config.audioSocketPort}`
);
