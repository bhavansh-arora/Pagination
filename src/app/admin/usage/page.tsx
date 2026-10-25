import Link from "next/link";
import { AlertTriangle, Download, Info } from "lucide-react";
import { BotAvatar } from "@/components/brand";
import { BarChart } from "@/components/admin/BarChart";
import { BudgetForm } from "@/components/admin/BudgetForm";
import { Empty, PageHeader, Panel, Pill, StatTile, td, th } from "@/components/admin/parts";
import { cn } from "@/lib/cn";
import { read } from "@/lib/db";
import { MODELS } from "@/lib/models";
import { planFor } from "@/lib/plans";
import { fee } from "@/lib/revenue";
import { lastDays } from "@/lib/usage";
import { aggregate, cacheSavings, dailyCost, groupBy, monthToDate, rowsSince, tokens, usd } from "@/lib/usage-report";

export const metadata = { title: "AI usage & cost" };

const RANGES = [7, 30, 90] as const;
const modelName = (id: string) => MODELS.find((m) => m.id === id)?.label.replace("Claude ", "") ?? id;

export default async function UsagePage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const raw = Number((await searchParams).days);
  const days = (RANGES as readonly number[]).includes(raw) ? raw : 30;
  const d = await read();
  const since = lastDays(days)[0];
  const rows = rowsSince(d, since);
  const total = aggregate(rows);
  const saved = cacheSavings(rows);
  const mtd = monthToDate(d);
  const budget = d.settings.aiMonthlyBudget / 100;
  const used = budget ? mtd.spent / budget : 0;
  const projectedOver = budget > 0 && mtd.projected > budget;

  const byModel = [...groupBy(rows, (r) => r.model).entries()].sort((a, b) => b[1].cost - a[1].cost);
  const byBot = [...groupBy(rows, (r) => r.botId).entries()].sort((a, b) => b[1].cost - a[1].cost).slice(0, 15);
  const byCoach = groupBy(rows, (r) => r.coachId);

  // Platform revenue per coach in USD over the same window (AI is billed in USD).
  const usdRevenue = new Map<string, number>();
  let nonUsd = false;
  for (const p of d.payments) {
    if (p.at.slice(0, 10) < since) continue;
    if (p.currency !== "usd") {
      nonUsd = true;
      continue;
    }
    usdRevenue.set(p.coachId, (usdRevenue.get(p.coachId) ?? 0) + fee(p) / 100);
  }
  const coachRows = d.coaches
    .map((c) => {
      const u = byCoach.get(c.id);
      const revenue = usdRevenue.get(c.id) ?? 0;
      return { coach: c, plan: planFor(d.settings, c), u, revenue, margin: revenue - (u?.cost ?? 0) };
    })
    .filter((x) => x.u || x.revenue)
    .sort((a, b) => a.margin - b.margin);
  const losing = coachRows.filter((x) => x.margin < 0);

  const bot = new Map(d.bots.map((b) => [b.id, b]));
  const coachName = new Map(d.coaches.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="AI usage & cost"
        subtitle="What the AI behind every mind costs, who's using it, and whether it pays for itself."
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-zinc-100/80 p-1">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/admin/usage?days=${r}`}
                  className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", r === days ? "bg-white shadow-soft" : "text-muted hover:text-ink")}
                >
                  {r} days
                </Link>
              ))}
            </div>
            <a
              href={`/api/admin/usage/export?days=${days}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-medium shadow-soft hover:bg-zinc-50"
            >
              <Download className="size-4" /> CSV
            </a>
          </div>
        }
      />

      {/* Budget */}
      <div
        className={cn(
          "mb-6 rounded-2xl border p-5 shadow-soft",
          budget && used >= 1 ? "border-rose-200 bg-rose-50/60" : projectedOver || used >= 0.8 ? "border-amber-200 bg-amber-50/60" : "border-line bg-white",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-muted">{mtd.label} spend</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{usd(mtd.spent)}</span>
              {budget > 0 && <span className="text-sm text-muted">of {usd(budget)} budget</span>}
            </div>
            <div className="mt-2 text-xs text-muted">
              Projected month-end: <b className={cn("text-ink", projectedOver && "text-amber-700")}>{usd(mtd.projected)}</b>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1.5 text-xs font-medium text-muted">Monthly budget</div>
            <BudgetForm cents={d.settings.aiMonthlyBudget} />
          </div>
        </div>
        {budget > 0 && (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={cn("h-full rounded-full", used >= 1 ? "bg-rose-500" : used >= 0.8 ? "bg-amber-500" : "bg-violet-500")}
                style={{ width: `${Math.min(100, used * 100)}%` }}
              />
            </div>
            {(used >= 0.8 || projectedOver) && (
              <p className="mt-3 flex items-center gap-2 text-sm text-amber-800">
                <AlertTriangle className="size-4 shrink-0" />
                {used >= 1
                  ? "You've gone over this month's AI budget."
                  : used >= 0.8
                    ? `You've used ${Math.round(used * 100)}% of this month's AI budget.`
                    : "At the current pace you'll go over budget this month."}
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`AI cost · ${days} days`} value={usd(total.cost)} sub={`${usd(total.clientCost)} clients · ${usd(total.cost - total.clientCost)} coach testing`} />
        <StatTile label="AI replies" value={total.replies.toLocaleString()} sub={`${total.clientReplies.toLocaleString()} to clients`} />
        <StatTile label="Avg cost per reply" value={total.replies ? usd(total.cost / total.replies) : "—"} sub={`${tokens(total.input + total.cacheRead + total.cacheWrite)} in · ${tokens(total.output)} out tokens`} />
        <StatTile
          label="Saved by prompt caching"
          value={usd(Math.max(0, saved))}
          sub={total.input + total.cacheRead ? `${Math.round((total.cacheRead / (total.input + total.cacheRead + total.cacheWrite)) * 100)}% of input served from cache` : "no traffic yet"}
        />
      </div>

      <Panel title={`AI cost per day · last ${days} days (USD)`} className="mt-6">
        <BarChart data={dailyCost(d, days)} unit="AI cost" micros budgetLine={budget ? Math.round((budget / mtd.daysInMonth) * 1e6) : undefined} />
      </Panel>

      {losing.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <b>
              {losing.length} coach{losing.length === 1 ? "" : "es"} cost more in AI than the platform earned from them
            </b>{" "}
            over the last {days} days (−{usd(-losing.reduce((n, x) => n + x.margin, 0))} in total). Consider moving them to a paid plan or a cheaper model.
          </div>
        </div>
      )}

      <Panel title={`Cost vs. revenue by coach · ${days} days`} className="mt-6">
        {coachRows.length === 0 ? (
          <Empty>No AI usage yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Coach</th>
                  <th className={th}>Plan</th>
                  <th className={`${th} text-right`}>Replies</th>
                  <th className={`${th} text-right`}>Testing</th>
                  <th className={`${th} text-right`}>AI cost</th>
                  <th className={`${th} text-right`}>Platform revenue</th>
                  <th className={`${th} text-right`}>Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coachRows.map(({ coach, plan, u, revenue, margin }) => (
                  <tr key={coach.id} className="hover:bg-zinc-50/60">
                    <td className={td}>
                      <Link href={`/admin/coaches/${coach.id}`} className="font-medium hover:underline">
                        {coach.name}
                      </Link>
                      <div className="text-xs text-muted">{coach.email}</div>
                    </td>
                    <td className={td}>
                      <Pill tone={plan.priceMonthly ? "violet" : "zinc"}>{plan.name}</Pill>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{(u?.replies ?? 0).toLocaleString()}</td>
                    <td className={`${td} text-right text-muted tabular-nums`}>{u ? `${Math.round(((u.replies - u.clientReplies) / Math.max(1, u.replies)) * 100)}%` : "—"}</td>
                    <td className={`${td} text-right tabular-nums`}>{usd(u?.cost ?? 0)}</td>
                    <td className={`${td} text-right tabular-nums`}>{usd(revenue)}</td>
                    <td className={cn(td, "text-right font-semibold tabular-nums", margin < 0 ? "text-rose-600" : "text-emerald-700")}>
                      {margin < 0 ? "−" : ""}
                      {usd(Math.abs(margin))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-xs text-muted">
          <Info className="size-3.5 shrink-0" />
          Platform revenue = commission on client payments + coach plan payments{nonUsd ? " (USD payments only; other currencies aren't converted)" : ""}.
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="By model">
          {byModel.length === 0 ? (
            <Empty>No usage yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Model</th>
                  <th className={`${th} text-right`}>Replies</th>
                  <th className={`${th} text-right`}>Cost</th>
                  <th className={`${th} text-right`}>Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byModel.map(([m, a]) => (
                  <tr key={m}>
                    <td className={td}>
                      <div className="font-medium">{modelName(m)}</div>
                      <div className="text-xs text-muted">
                        {tokens(a.input + a.cacheRead + a.cacheWrite)} in · {tokens(a.output)} out
                      </div>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{a.replies.toLocaleString()}</td>
                    <td className={`${td} text-right tabular-nums`}>{usd(a.cost)}</td>
                    <td className={`${td} text-right text-muted tabular-nums`}>{total.cost ? Math.round((a.cost / total.cost) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Most expensive minds">
          {byBot.length === 0 ? (
            <Empty>No usage yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Mind</th>
                  <th className={`${th} text-right`}>Replies</th>
                  <th className={`${th} text-right`}>Per reply</th>
                  <th className={`${th} text-right`}>Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byBot.map(([id, a]) => {
                  const b = bot.get(id);
                  return (
                    <tr key={id} className="hover:bg-zinc-50/60">
                      <td className={td}>
                        {b ? (
                          <Link href={`/dashboard/bots/${id}`} className="flex items-center gap-2.5">
                            <BotAvatar emoji={b.avatarEmoji} image={b.avatarImage} color={b.brandColor} size={28} />
                            <span>
                              <span className="block font-medium">{b.name}</span>
                              <span className="block text-xs text-muted">
                                {coachName.get(b.coachId)} · {modelName(b.model)} · {b.pricing.mode === "paid" ? "paid" : "free"}
                              </span>
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted">Deleted mind</span>
                        )}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{a.replies.toLocaleString()}</td>
                      <td className={`${td} text-right text-muted tabular-nums`}>{usd(a.cost / Math.max(1, a.replies))}</td>
                      <td className={`${td} text-right font-medium tabular-nums`}>{usd(a.cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Costs are calculated per reply from Anthropic&apos;s token counts at list prices, including prompt caching and the model that actually answered. Check
        them against your invoice in the Anthropic Console; credits or negotiated discounts aren&apos;t reflected.
      </p>
    </>
  );
}
