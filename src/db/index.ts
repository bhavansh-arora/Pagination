import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config";

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.recordingsDir, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    source TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    transcript TEXT NOT NULL DEFAULT '[]',
    collected_data TEXT NOT NULL DEFAULT '{}',
    recording_path TEXT,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
  CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(started_at);
`);
