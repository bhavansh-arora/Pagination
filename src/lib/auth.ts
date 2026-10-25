import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";
import { mutate, read, type Coach, type Role } from "./db";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;
const COOKIE = "mc_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return expected.length === key.length && crypto.timingSafeEqual(key, expected);
}

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export function randomPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.randomBytes(14), (b) => alphabet[b % alphabet.length]).join("");
}

/** Secure cookies when the request arrived over HTTPS (directly or via the reverse proxy). */
async function isHttps() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const h = await headers();
  return (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";
}

export async function startSession(coachId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await mutate((d) => {
    const now = Date.now();
    d.sessions = d.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
    d.sessions.push({ tokenHash: sha256(token), coachId, expiresAt: expires.toISOString() });
    const coach = d.coaches.find((c) => c.id === coachId);
    if (coach) coach.lastLoginAt = new Date().toISOString();
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    expires,
  });
}

export async function currentSessionHash() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? sha256(token) : null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const h = sha256(token);
    await mutate((d) => {
      d.sessions = d.sessions.filter((s) => s.tokenHash !== h);
    });
  }
  jar.delete(COOKIE);
}

export async function getCoach(): Promise<Coach | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const h = sha256(token);
  const d = await read();
  const session = d.sessions.find((s) => s.tokenHash === h);
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
  const coach = d.coaches.find((c) => c.id === session.coachId);
  return coach && coach.status === "active" ? coach : null;
}

export async function getAdmin(): Promise<Coach | null> {
  const coach = await getCoach();
  return coach?.role === "admin" ? coach : null;
}

export async function createCoach(name: string, email: string, password: string, role: Role = "coach") {
  const passwordHash = await hashPassword(password);
  return mutate((d) => {
    if (d.coaches.some((c) => c.email === email)) return null;
    const coach: Coach = {
      id: nanoid(),
      name,
      email,
      passwordHash,
      role,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    d.coaches.push(coach);
    return coach;
  });
}
