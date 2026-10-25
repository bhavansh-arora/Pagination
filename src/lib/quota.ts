import type { Coach, Data } from "./db";
import { planFor } from "./plans";

export const monthStart = () => `${new Date().toISOString().slice(0, 7)}-01`;

export function repliesThisMonth(d: Data, coachId: string) {
  const since = monthStart();
  return d.usage.filter((r) => r.coachId === coachId && r.day >= since).reduce((n, r) => n + r.messages, 0);
}

export function quotaFor(d: Data, coach: Pick<Coach, "id" | "planId" | "role">) {
  const plan = planFor(d.settings, coach);
  const used = repliesThisMonth(d, coach.id);
  const limit = coach.role === "admin" ? 0 : plan.monthlyReplies;
  const resetsOn = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));
  return { used, limit, plan, exceeded: limit > 0 && used >= limit, ratio: limit > 0 ? used / limit : 0, resetsOn };
}
