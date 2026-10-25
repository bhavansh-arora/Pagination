import "server-only";
import crypto from "node:crypto";
import { getCoach } from "./auth";
import { read, type Bot } from "./db";

export type Access = { bot: Bot; owner: boolean } | { error: string; status: number };

const sameText = (a: string, b: string) => {
  const x = crypto.createHash("sha256").update(a).digest();
  const y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
};

export async function chatAccess(slug: string, accessCode: string | null | undefined): Promise<Access> {
  const d = await read();
  const bot = d.bots.find((b) => b.slug === slug);
  if (!bot) return { error: "This mind doesn't exist", status: 404 };
  if (d.coaches.find((c) => c.id === bot.coachId)?.status !== "active") return { error: "This mind is currently unavailable", status: 404 };
  const coach = await getCoach();
  const owner = !!coach && (coach.id === bot.coachId || coach.role === "admin");
  if (!bot.published && !owner) return { error: "This mind isn't live yet", status: 404 };
  if (!owner && bot.visibility === "code" && !sameText((accessCode ?? "").trim(), bot.accessCode.trim())) {
    return { error: "Enter the access code from your coach", status: 403 };
  }
  return { bot, owner };
}

export const validVisitor = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v);
