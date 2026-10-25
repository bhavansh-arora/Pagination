import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { BotAvatar } from "@/components/brand";
import { BarChart } from "@/components/admin/BarChart";
import { Empty, Initials, PageHeader, Panel, Pill, StatTile, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { ago, EMPTY, money, usageBy, words } from "@/lib/stats";
import { estimateCost, lastDays } from "@/lib/usage";
import { formatMoney } from "@/lib/money";
import { planFor } from "@/lib/plans";
import { fee, gross, mainCurrency, recurring, sumBy } from "@/lib/revenue";
import { isActiveMembership } from "@/lib/entitlements";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const d = await read();
  const days14 = lastDays(14);
  const since30 = lastDays(30)[0];
  const usage30 = d.usage.filter((r) => r.day >= since30);
  const perDay = days14.map((day) => ({ day, value: d.usage.filter((r) => r.day === day).reduce((n, r) => n + r.messages, 0) }));
  const messages30 = usage30.reduce((n, r) => n + r.messages, 0);
  const cost30 = estimateCost(usage30);
  const convos = d.conversations.filter((c) => !c.preview);
  const convos30 = convos.filter((c) => c.createdAt.slice(0, 10) >= since30).length;
  const visitors = new Set(convos.map((c) => c.visitorId)).size;
  const activeCoaches = d.coaches.filter((c) => c.status === "active").length;
  const live = d.bots.filter((b) => b.published).length;
  const knowledge = words(d.sources.reduce((n, s) => n + s.chars, 0));
  const byBot = usageBy(d, "botId");
  const topMinds = d.bots
    .map((b) => ({ bot: b, u: byBot.get(b.id) ?? EMPTY, owner: d.coaches.find((c) => c.id === b.coachId) }))
    .sort((a, b) => b.u.messages - a.u.messages)
    .slice(0, 6);
  const newest = [...d.coaches].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const apiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  const clientPayments = d.payments.filter((p) => p.kind !== "coach_plan");
  const cur = mainCurrency(clientPayments, d.settings.platformCurrency);
  const pcur = d.settings.platformCurrency;
  const gmv30 = sumBy(clientPayments, cur, gross, since30);
  const platform30 = sumBy(clientPayments, cur, fee, since30) + (cur === pcur ? sumBy(d.payments.filter((p) => p.kind === "coach_plan"), pcur, gross, since30) : 0);
  const planMrr = d.coaches.filter((c) => c.planSubscriptionId && !c.planCancelAtPeriodEnd).reduce((n, c) => n + planFor(d.settings, c).priceMonthly, 0);
  const newApps = d.applications.filter((a) => a.status === "new").length;

  return (
    <>
      <PageHeader title="Overview" subtitle="How the platform is doing." />

      {newApps > 0 && (
        <Link href="/admin/onboarding" className="mb-6 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 hover:bg-violet-100/70">
          <span className="grid size-7 place-items-center rounded-full bg-violet-600 text-xs font-bold text-white">{newApps}</span>
          <span className="flex-1">
            <b>New coach application{newApps === 1 ? "" : "s"}</b> waiting for review.
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      {!apiKey && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <b>No Anthropic API key configured.</b> Minds can&apos;t answer until you set <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> in the
            server&apos;s <code className="rounded bg-amber-100 px-1">.env</code> file and restart.
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Coaches" value={activeCoaches} sub={`${d.coaches.length - activeCoaches} suspended · signup ${d.settings.signupMode}`} />
        <StatTile label="Minds" value={d.bots.length} sub={`${live} live · ${d.bots.length - live} draft`} />
        <StatTile label="AI replies · 30 days" value={messages30.toLocaleString()} sub={`${convos30} new conversations · ${visitors} visitors all-time`} />
        <StatTile label="Est. AI cost · 30 days" value={money(cost30)} sub={`${knowledge.toLocaleString()} words of knowledge`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Client sales · 30 days" value={formatMoney(gmv30, cur)} sub={`${d.memberships.filter(isActiveMembership).length} active memberships`} />
        <StatTile label="Platform revenue · 30 days" value={formatMoney(platform30, cur)} sub="commission + coach plans" />
        <StatTile label="Client MRR" value={formatMoney(recurring(d.memberships, cur), cur)} sub={`coach plans ${formatMoney(planMrr, pcur)}/mo`} />
        <StatTile label="Clients" value={d.clients.length} sub={`${d.clients.filter((c) => c.stripeCustomerId).length} have paid`} />
      </div>

      <Panel title="AI replies per day · last 14 days (clients + coach testing)" className="mt-6">
        <BarChart data={perDay} unit="replies" />
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Most active minds · 30 days"
          action={
            <Link href="/admin/minds" className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
              All minds <ArrowRight className="size-3" />
            </Link>
          }
        >
          {topMinds.length === 0 ? (
            <Empty>No minds yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Mind</th>
                  <th className={`${th} text-right`}>Replies</th>
                  <th className={`${th} text-right`}>Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {topMinds.map(({ bot, u, owner }) => (
                  <tr key={bot.id} className="hover:bg-zinc-50/60">
                    <td className={td}>
                      <Link href={`/dashboard/bots/${bot.id}`} className="flex items-center gap-3">
                        <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={32} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium">
                            {bot.name} {bot.published ? <Pill tone="green">Live</Pill> : <Pill tone="amber">Draft</Pill>}
                          </span>
                          <span className="block truncate text-xs text-muted">{owner?.name ?? "—"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{u.messages.toLocaleString()}</td>
                    <td className={`${td} text-right tabular-nums`}>{money(u.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel
          title="Newest coaches"
          action={
            <Link href="/admin/coaches" className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline">
              All coaches <ArrowRight className="size-3" />
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {newest.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/coaches/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/60">
                  <Initials name={c.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted">{c.email}</span>
                  </span>
                  <span className="text-xs text-muted">{ago(c.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
