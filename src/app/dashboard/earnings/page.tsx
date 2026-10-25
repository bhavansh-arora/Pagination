import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BarChart } from "@/components/admin/BarChart";
import { Empty, Panel, Pill, StatTile, td, th } from "@/components/admin/parts";
import { PayoutsCard } from "@/components/CoachBilling";
import { StudioHeader } from "@/components/StudioHeader";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { isActiveMembership } from "@/lib/entitlements";
import { formatMoney } from "@/lib/money";
import { planFor } from "@/lib/plans";
import { mainCurrency, net, perDay, recurring, sumBy } from "@/lib/revenue";
import { billingEnabled } from "@/lib/stripe";
import { lastDays } from "@/lib/usage";

export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  const d = await read();
  const plan = planFor(d.settings, coach);
  const myBots = d.bots.filter((b) => b.coachId === coach.id);
  const botName = new Map(myBots.map((b) => [b.id, b.name]));
  const payments = d.payments.filter((p) => p.coachId === coach.id && p.kind !== "coach_plan").sort((a, b) => b.at.localeCompare(a.at));
  const members = d.memberships.filter((m) => m.coachId === coach.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const currency = mainCurrency(payments, myBots.find((b) => b.pricing.mode === "paid")?.pricing.currency ?? "usd");
  const since30 = lastDays(30)[0];
  const active = members.filter(isActiveMembership);
  const otherCurrencies = [...new Set(payments.map((p) => p.currency))].filter((c) => c !== currency);
  const clientName = (id?: string) => d.clients.find((c) => c.id === id);

  return (
    <div className="mesh min-h-dvh">
      <StudioHeader coach={coach} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Earnings</h1>
          <p className="mt-1.5 text-muted">
            What your minds earn. You&apos;re on the <b className="text-ink">{plan.name}</b> plan with a {plan.commissionPct}% platform fee.
          </p>
        </div>

        <Suspense>
          <PayoutsCard enabled={billingEnabled()} connected={!!coach.stripeAccountId} ready={!!coach.payoutsReady} />
        </Suspense>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Earned · 30 days" value={formatMoney(sumBy(payments, currency, net, since30), currency)} sub="after platform fee" />
          <StatTile label="Monthly recurring" value={formatMoney(recurring(members, currency), currency)} sub="before fees, from active members" />
          <StatTile label="Active members" value={active.length} sub={`${members.length - active.length} past members`} />
          <StatTile label="Earned · all time" value={formatMoney(sumBy(payments, currency, net), currency)} sub={otherCurrencies.length ? `plus sales in ${otherCurrencies.join(", ").toUpperCase()}` : `${payments.length} payments`} />
        </div>

        <Panel title={`Daily earnings · last 30 days (${currency.toUpperCase()})`}>
          <BarChart data={perDay(payments, currency, 30, net)} unit="earned" currency={currency} />
        </Panel>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Members">
            {members.length === 0 ? (
              <Empty>No members yet. Set a mind to Paid under Monetization to start selling.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-line bg-zinc-50/60">
                    <tr>
                      <th className={th}>Client</th>
                      <th className={th}>Mind</th>
                      <th className={`${th} text-right`}>Price</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {members.slice(0, 50).map((m) => {
                      const c = clientName(m.clientId);
                      const on = isActiveMembership(m);
                      return (
                        <tr key={m.id}>
                          <td className={td}>
                            <div className="font-medium">{c?.name ?? "—"}</div>
                            <div className="text-xs text-muted">{c?.email}</div>
                          </td>
                          <td className={`${td} text-muted`}>{botName.get(m.botId) ?? "—"}</td>
                          <td className={`${td} text-right tabular-nums`}>
                            {formatMoney(m.amount, m.currency)}/{m.interval === "year" ? "yr" : "mo"}
                          </td>
                          <td className={td}>
                            {on ? m.cancelAtPeriodEnd ? <Pill tone="amber">Canceling</Pill> : m.status === "past_due" ? <Pill tone="amber">Past due</Pill> : <Pill tone="green">Active</Pill> : <Pill tone="zinc">Ended</Pill>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Recent payments">
            {payments.length === 0 ? (
              <Empty>No payments yet.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {payments.slice(0, 25).map((p) => (
                  <li key={p.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {clientName(p.clientId)?.name ?? "Client"} · {botName.get(p.botId ?? "") ?? "Mind"}
                      </div>
                      <div className="text-xs text-muted">
                        {p.description} · {new Date(p.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">{formatMoney(net(p), p.currency)}</div>
                      <div className="text-[11px] text-muted tabular-nums">of {formatMoney(p.amount, p.currency)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </main>
    </div>
  );
}
