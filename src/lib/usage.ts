import "server-only";
import { mutate, type UsageRow } from "./db";

interface Price {
  input: number;
  output: number;
  cacheRead: number;
  /** Prompts above this many input tokens bill at the `long` rates. */
  longAbove?: number;
  long?: { input: number; output: number; cacheRead: number };
}

/** USD per million tokens (Anthropic list prices). Cache writes bill at 1.25x input (5-minute TTL). */
export const PRICES: Record<string, Price> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, longAbove: 100_000, long: { input: 0.5, output: 2.5, cacheRead: 0.05 } },
  // Possible server-side fallback models.
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
};

type Tokens = Pick<UsageRow, "model" | "input" | "output" | "cacheRead" | "cacheWrite">;

function priceTokens(t: Tokens, longPrompt = false) {
  const base = PRICES[t.model] ?? PRICES["claude-opus-5-5"];
  const p = longPrompt && base.long ? base.long : base;
  return (t.input * p.input + t.output * p.output + t.cacheRead * p.cacheRead + t.cacheWrite * p.input * 1.25) / 1e6;
}

/** USD cost of usage rows. Uses the cost captured per request when available. */
export function estimateCost(rows: (Tokens & { costMicros?: number })[]) {
  return rows.reduce((sum, r) => sum + (r.costMicros !== undefined ? r.costMicros / 1e6 : priceTokens(r)), 0);
}

export const today = () => new Date().toISOString().slice(0, 10);

export async function recordUsage(
  botId: string,
  coachId: string,
  model: string,
  u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null },
  preview = false,
) {
  const t = { model, input: u.input_tokens, output: u.output_tokens, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0 };
  const promptTokens = t.input + t.cacheRead + t.cacheWrite;
  const cost = priceTokens(t, promptTokens > (PRICES[model]?.longAbove ?? Infinity));
  await mutate((d) => {
    const day = today();
    let row = d.usage.find((r) => r.day === day && r.botId === botId && r.model === model && !!r.preview === preview);
    if (!row) {
      row = { day, botId, coachId, model, preview, messages: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, costMicros: 0 };
      d.usage.push(row);
    }
    // Rows written before per-request costing get their cost-so-far from list prices.
    row.costMicros ??= Math.round(priceTokens(row) * 1e6);
    row.messages += 1;
    row.input += t.input;
    row.output += t.output;
    row.cacheRead += t.cacheRead;
    row.cacheWrite += t.cacheWrite;
    row.costMicros += Math.round(cost * 1e6);
  });
}

/** What the cached tokens would have cost at the full input price, minus what they did cost. */
export function cacheSavings(rows: Tokens[]) {
  return rows.reduce((sum, r) => {
    const p = PRICES[r.model] ?? PRICES["claude-opus-5-5"];
    return sum + (r.cacheRead * (p.input - p.cacheRead) - r.cacheWrite * p.input * 0.25) / 1e6;
  }, 0);
}

export function lastDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(d.getTime() - i * 86400_000).toISOString().slice(0, 10));
  return out;
}
