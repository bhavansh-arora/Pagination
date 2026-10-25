import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type Tone =
  | "warm"
  | "direct"
  | "playful"
  | "calm"
  | "motivational"
  | "analytical"
  | "spiritual"
  | "no-nonsense";

export type ResponseLength = "concise" | "balanced" | "detailed";
export type Depth = "fast" | "balanced" | "deep";
export type Visibility = "public" | "code";

export interface Coach {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  tokenHash: string;
  coachId: string;
  expiresAt: string;
}

export interface Bot {
  id: string;
  coachId: string;
  slug: string;
  name: string;
  coachName: string;
  tagline: string;
  avatarEmoji: string;
  avatarImage: string | null;
  brandColor: string;
  bio: string;
  philosophy: string;
  instructions: string;
  tones: Tone[];
  responseLength: ResponseLength;
  boundaries: string;
  welcomeMessage: string;
  starters: string[];
  ctaLabel: string;
  ctaUrl: string;
  model: string;
  depth: Depth;
  visibility: Visibility;
  accessCode: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SourceKind = "file" | "url" | "text";

export interface Source {
  id: string;
  botId: string;
  kind: SourceKind;
  title: string;
  origin: string;
  chars: number;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface Conversation {
  id: string;
  botId: string;
  visitorId: string;
  title: string;
  preview: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface Data {
  coaches: Coach[];
  sessions: Session[];
  bots: Bot[];
  sources: Source[];
  conversations: Conversation[];
}

const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "./data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SOURCES_DIR = path.join(DATA_DIR, "sources");

const empty = (): Data => ({ coaches: [], sessions: [], bots: [], sources: [], conversations: [] });

async function load(): Promise<Data> {
  try {
    return { ...empty(), ...(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Data>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw err;
  }
}

async function save(data: Data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, DB_FILE);
}

// Serialize every read-modify-write so concurrent requests can't clobber each other.
const g = globalThis as unknown as { __dbQueue?: Promise<unknown> };

export function read(): Promise<Data> {
  return load();
}

export function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = (g.__dbQueue ?? Promise.resolve()).then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  g.__dbQueue = run.catch(() => undefined);
  return run;
}

function sourcePath(id: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Invalid source id");
  return path.join(SOURCES_DIR, `${id}.txt`);
}

export async function writeSourceText(id: string, text: string) {
  await fs.mkdir(SOURCES_DIR, { recursive: true });
  await fs.writeFile(sourcePath(id), text);
}

export async function readSourceText(id: string): Promise<string> {
  try {
    return await fs.readFile(sourcePath(id), "utf8");
  } catch {
    return "";
  }
}

export async function deleteSourceText(id: string) {
  await fs.rm(sourcePath(id), { force: true });
}
