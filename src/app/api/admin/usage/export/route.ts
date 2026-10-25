import { read } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { estimateCost, lastDays } from "@/lib/usage";

const cell = (v: string | number) => {
  const s = String(v);
  // Quote, and neutralise leading characters spreadsheets treat as formulas.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) || safe !== s ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof Response) return admin;
  const days = Math.min(366, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const since = lastDays(days)[0];
  const d = await read();
  const bot = new Map(d.bots.map((b) => [b.id, b]));
  const coach = new Map(d.coaches.map((c) => [c.id, c]));
  const header = ["date", "coach", "coach_email", "mind", "model", "source", "replies", "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "cost_usd"];
  const lines = d.usage
    .filter((r) => r.day >= since)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((r) =>
      [
        r.day,
        coach.get(r.coachId)?.name ?? "(deleted)",
        coach.get(r.coachId)?.email ?? "",
        bot.get(r.botId)?.name ?? "(deleted)",
        r.model,
        r.preview ? "testing" : "clients",
        r.messages,
        r.input,
        r.output,
        r.cacheRead,
        r.cacheWrite,
        estimateCost([r]).toFixed(6),
      ]
        .map(cell)
        .join(","),
    );
  return new Response([header.join(","), ...lines].join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ai-usage-${since}-to-${lastDays(1)[0]}.csv"`,
      "cache-control": "no-store",
    },
  });
}
