import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";
import { hashPassword, sha256 } from "./auth";
import { mutate, read, type Client } from "./db";

const COOKIE = "mc_client";
const DAYS = 60;

/** Conversations of signed-in clients are stored under this visitor key. */
export const clientVisitorKey = (clientId: string) => `cl-${clientId}`;

async function secure() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return ((await headers()).get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";
}

export async function getClient(): Promise<Client | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const h = sha256(token);
  const d = await read();
  const s = d.clientSessions.find((x) => x.tokenHash === h);
  if (!s || new Date(s.expiresAt).getTime() < Date.now()) return null;
  return d.clients.find((c) => c.id === s.clientId) ?? null;
}

/**
 * Starts a client session. Conversations the person had as an anonymous visitor
 * move to their account so their history and free-message count follow them.
 */
export async function startClientSession(clientId: string, anonVisitorId?: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DAYS * 86400_000);
  await mutate((d) => {
    const now = Date.now();
    d.clientSessions = d.clientSessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    d.clientSessions.push({ tokenHash: sha256(token), clientId, expiresAt: expires.toISOString() });
    const c = d.clients.find((x) => x.id === clientId);
    if (c) c.lastLoginAt = new Date().toISOString();
    if (anonVisitorId && /^[a-z0-9]{8,64}$/.test(anonVisitorId)) {
      for (const convo of d.conversations) if (convo.visitorId === anonVisitorId && !convo.preview) convo.visitorId = clientVisitorKey(clientId);
    }
  });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: await secure(), path: "/", expires });
}

export async function endClientSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const h = sha256(token);
    await mutate((d) => {
      d.clientSessions = d.clientSessions.filter((s) => s.tokenHash !== h);
    });
  }
  jar.delete(COOKIE);
}

export async function createClient(name: string, email: string, password: string) {
  const passwordHash = await hashPassword(password);
  return mutate((d) => {
    if (d.clients.some((c) => c.email === email)) return null;
    const client: Client = { id: nanoid(), name, email, passwordHash, createdAt: new Date().toISOString() };
    d.clients.push(client);
    return client;
  });
}
