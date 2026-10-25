import "server-only";
import { NextResponse } from "next/server";
import { getCoach } from "./auth";
import { read, type Bot, type Coach } from "./db";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireCoach(): Promise<Coach | NextResponse> {
  return (await getCoach()) ?? fail("Please sign in", 401);
}

export async function ownedBot(id: string): Promise<{ coach: Coach; bot: Bot } | NextResponse> {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  const bot = (await read()).bots.find((b) => b.id === id && (b.coachId === coach.id || coach.role === "admin"));
  return bot ? { coach, bot } : fail("Not found", 404);
}

// Fixed-window limiter, in-process; enough to stop a single visitor from draining credits.
const g = globalThis as unknown as { __rl?: Map<string, { n: number; reset: number }> };
export function rateLimit(key: string, max: number, windowMs: number) {
  const map = (g.__rl ??= new Map());
  const now = Date.now();
  const hit = map.get(key);
  if (!hit || hit.reset < now) {
    map.set(key, { n: 1, reset: now + windowMs });
    if (map.size > 10_000) for (const [k, v] of map) if (v.reset < now) map.delete(k);
    return true;
  }
  hit.n++;
  return hit.n <= max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
