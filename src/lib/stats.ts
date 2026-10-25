import "server-only";
import type { read } from "./db";
import { estimateCost, lastDays } from "./usage";

type Data = Awaited<ReturnType<typeof read>>;

export interface Totals {
  messages: number;
  cost: number;
  tokens: number;
}

/** Usage over the last `days` days, grouped by a key (e.g. botId or coachId). */
export function usageBy(d: Data, key: "botId" | "coachId", days = 30) {
  const since = lastDays(days)[0];
  const out = new Map<string, Totals>();
  for (const r of d.usage) {
    if (r.day < since) continue;
    const t = out.get(r[key]) ?? { messages: 0, cost: 0, tokens: 0 };
    t.messages += r.messages;
    t.tokens += r.input + r.output + r.cacheRead + r.cacheWrite;
    t.cost += estimateCost([r]);
    out.set(r[key], t);
  }
  return out;
}

export const EMPTY: Totals = { messages: 0, cost: 0, tokens: 0 };

export function money(n: number) {
  if (n === 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n < 100 ? 2 : 0 });
}

export function ago(iso?: string) {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const words = (chars: number) => Math.round(chars / 5.5);
