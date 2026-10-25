import "server-only";
import { mutate, type UsageRow } from "./db";

/** USD per million tokens. Cache writes bill at 1.25x input (5-minute TTL). */
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export function estimateCost(rows: Pick<UsageRow, "model" | "input" | "output" | "cacheRead" | "cacheWrite">[]) {
  return rows.reduce((sum, r) => {
    const p = PRICES[r.model] ?? PRICES["claude-opus-5-5"];
    return sum + (r.input * p.input + r.output * p.output + r.cacheRead * p.cacheRead + r.cacheWrite * p.input * 1.25) / 1e6;
  }, 0);
}

export const today = () => new Date().toISOString().slice(0, 10);

export async function recordUsage(
  botId: string,
  coachId: string,
  model: string,
  u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null },
) {
  await mutate((d) => {
    const day = today();
    let row = d.usage.find((r) => r.day === day && r.botId === botId && r.model === model);
    if (!row) {
      row = { day, botId, coachId, model, messages: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      d.usage.push(row);
    }
    row.messages += 1;
    row.input += u.input_tokens;
    row.output += u.output_tokens;
    row.cacheRead += u.cache_read_input_tokens ?? 0;
    row.cacheWrite += u.cache_creation_input_tokens ?? 0;
  });
}

export function lastDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(d.getTime() - i * 86400_000).toISOString().slice(0, 10));
  return out;
}
