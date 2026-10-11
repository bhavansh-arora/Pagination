import { randomUUID } from "crypto";
import { db } from "./index";

export interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
  language?: "en" | "hi";
  at: string;
}

export interface CallRecord {
  id: string;
  agentId: string;
  source: string;
  startedAt: string;
  endedAt: string | null;
  transcript: TranscriptTurn[];
  collectedData: Record<string, string>;
  recordingPath: string | null;
}

interface CallRow {
  id: string;
  agent_id: string;
  source: string;
  started_at: string;
  ended_at: string | null;
  transcript: string;
  collected_data: string;
  recording_path: string | null;
}

function rowToCall(row: CallRow): CallRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    source: row.source,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    transcript: JSON.parse(row.transcript),
    collectedData: JSON.parse(row.collected_data),
    recordingPath: row.recording_path,
  };
}

/** Source tags for where a call came from - extend as new transports/vendors are added. */
export type CallSource = "dashboard" | "audiosocket";

export function startCall(agentId: string, source: CallSource): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO calls (id, agent_id, source, started_at, transcript, collected_data) VALUES (?, ?, ?, ?, '[]', '{}')"
  ).run(id, agentId, source, new Date().toISOString());
  return id;
}

export function appendTranscriptTurn(callId: string, turn: Omit<TranscriptTurn, "at">): void {
  const row = db.prepare("SELECT transcript FROM calls WHERE id = ?").get(callId) as
    | { transcript: string }
    | undefined;
  if (!row) return;
  const transcript: TranscriptTurn[] = JSON.parse(row.transcript);
  transcript.push({ ...turn, at: new Date().toISOString() });
  db.prepare("UPDATE calls SET transcript = ? WHERE id = ?").run(JSON.stringify(transcript), callId);
}

export function mergeCollectedData(callId: string, data: Record<string, string>): void {
  const row = db.prepare("SELECT collected_data FROM calls WHERE id = ?").get(callId) as
    | { collected_data: string }
    | undefined;
  if (!row) return;
  const merged = { ...JSON.parse(row.collected_data), ...data };
  db.prepare("UPDATE calls SET collected_data = ? WHERE id = ?").run(JSON.stringify(merged), callId);
}

export function endCall(callId: string, recordingPath: string | null): void {
  db.prepare("UPDATE calls SET ended_at = ?, recording_path = ? WHERE id = ?").run(
    new Date().toISOString(),
    recordingPath,
    callId
  );
}

export function getCall(id: string): CallRecord | null {
  const row = db.prepare("SELECT * FROM calls WHERE id = ?").get(id) as CallRow | undefined;
  return row ? rowToCall(row) : null;
}

export function listCalls(agentId?: string): CallRecord[] {
  const rows = agentId
    ? (db
        .prepare("SELECT * FROM calls WHERE agent_id = ? ORDER BY started_at DESC")
        .all(agentId) as CallRow[])
    : (db.prepare("SELECT * FROM calls ORDER BY started_at DESC").all() as CallRow[]);
  return rows.map(rowToCall);
}
