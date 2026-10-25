import "server-only";
import type { Data, UsageRow } from "./db";
import { cacheSavings, estimateCost, lastDays } from "./usage";

export interface Agg {
  replies: number;
  clientReplies: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  clientCost: number;
}

const blank = (): Agg => ({ replies: 0, clientReplies: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, clientCost: 0 });

function add(a: Agg, r: UsageRow) {
  const c = estimateCost([r]);
  a.replies += r.messages;
  a.input += r.input;
  a.output += r.output;
  a.cacheRead += r.cacheRead;
  a.cacheWrite += r.cacheWrite;
  a.cost += c;
  if (!r.preview) {
    a.clientReplies += r.messages;
    a.clientCost += c;
  }
}

export function aggregate(rows: UsageRow[]) {
  const a = blank();
  for (const r of rows) add(a, r);
  return a;
}

export function groupBy(rows: UsageRow[], key: (r: UsageRow) => string) {
  const out = new Map<string, Agg>();
  for (const r of rows) {
    const k = key(r);
    const a = out.get(k) ?? blank();
    add(a, r);
    out.set(k, a);
  }
  return out;
}

export function rowsSince(d: Data, day: string) {
  return d.usage.filter((r) => r.day >= day);
}

/** Daily cost in micro-USD, oldest first. */
export function dailyCost(d: Data, days: number) {
  return lastDays(days).map((day) => ({ day, value: Math.round(estimateCost(d.usage.filter((r) => r.day === day)) * 1e6) }));
}

export function monthToDate(d: Data) {
  const now = new Date();
  const start = `${now.toISOString().slice(0, 7)}-01`;
  const spent = estimateCost(rowsSince(d, start));
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const elapsed = now.getUTCDate() - 1 + (now.getUTCHours() * 60 + now.getUTCMinutes()) / 1440;
  // Project from the last 7 days' pace once there's enough history; otherwise from month-to-date pace.
  const week = estimateCost(rowsSince(d, lastDays(7)[0]));
  const pace = elapsed >= 7 ? week / 7 : elapsed > 0.25 ? spent / elapsed : week / 7;
  const projected = spent + pace * (daysInMonth - elapsed);
  return { spent, projected, daysInMonth, label: now.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" }) };
}

export { cacheSavings };

/** Format a USD amount with enough precision for tiny AI costs. */
export function usd(n: number) {
  if (n === 0) return "$0.00";
  if (Math.abs(n) < 0.01) return `$${n.toFixed(4)}`;
  if (Math.abs(n) < 1) return `$${n.toFixed(3)}`;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function tokens(n: number) {
  return n.toLocaleString(undefined, { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 });
}
