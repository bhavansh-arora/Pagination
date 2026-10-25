import Link from "next/link";
import { BarChart } from "@/components/admin/BarChart";
import { Empty, PageHeader, Panel, Pill, StatTile, td, th } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { isActiveMembership } from "@/lib/entitlements";
import { formatMoney } from "@/lib/money";
import { planFor } from "@/lib/plans";
import { fee, gross, mainCurrency, perDay, recurring, sumBy } from "@/lib/revenue";
import { lastDays } from "@/lib/usage";

export const metadata = { title: "Revenue" };

const KIND = { client_subscription: "Membership", client_pack: "Message pack", coach_plan: "Coach plan" } as const;

export default async function RevenuePage() {
  const d = await read();
  const since30 = lastDays(30)[0];
  const clientPayments = d.payments.filter((p) => p.kind !== "coach_plan");
  const planPayments = d.payments.filter((p) => p.kind === "coach_plan");
  const cur = mainCurrency(clientPayments, d.settings.platformCurrency);
  const pcur = d.settings.platformCurrency;
  const sameCur = cur === pcur;

  const gmv30 = sumBy(clientPayments, cur, gross, since30);
  const fees30 = sumBy(clientPayments, cur, fee, since30);
  const plans30 = sumBy(planPayments, pcur, gross, since30);
  const clientMrr = recurring(d.memberships, cur);
  const planMrr = d.coaches.filter((c) => c.planSubscriptionId && !c.planCancelAtPeriodEnd).reduce((n, c) => n + planFor(d.settings, c).priceMonthly, 0);
  const activeMembers = d.memberships.filter(isActiveMembership).length;
  const payingCoaches = d.coaches.filter((c) => c.planSubscriptionId).length;

  const platformDaily = perDay(
    d.payments.filter((p) => (p.kind === "coach_plan" ? p.currency === pcur : p.currency === cur)),
    sameCur ? cur : pcur,
    30,
    (p) => (p.kind === "coach_plan" ? p.amount : p.platformFee),
  );

  const byCoach = d.coaches
    .map((c) => {
      const mine = clientPayments.filter((p) => p.coachId === c.id && p.currency === cur);
      return {
        coach: c,
        gmv: mine.reduce((n, p) => n + p.amount, 0),
        fees: mine.reduce((n, p) => n + p.platformFee, 0),
        members: d.memberships.filter((m) => m.coachId === c.id && isActiveMembership(m)).length,
        plan: planFor(d.settings, c),
      };
    })
    .filter((x) => x.gmv > 0 || x.members > 0 || x.coach.planSubscriptionId)
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 10);

  const planMix = d.settings.plans.map((p) => ({ plan: p, count: d.coaches.filter((c) => c.role === "coach" && planFor(d.settings, c).id === p.id).length }));
  const ledger = [...d.payments].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
  const who = (id?: string) => d.coaches.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader title="Revenue" subtitle="Client sales flowing through the platform and what the platform earns." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Client sales · 30d (GMV)" value={formatMoney(gmv30, cur)} sub={`${activeMembers} active membership${activeMembers === 1 ? "" : "s"}`} />
        <StatTile label="Commission · 30d" value={formatMoney(fees30, cur)} sub="platform fees on client sales" />
        <StatTile label="Coach plans · 30d" value={formatMoney(plans30, pcur)} sub={`${payingCoaches} paying coach${payingCoaches === 1 ? "" : "es"}`} />
        <StatTile
          label="Monthly recurring"
          value={sameCur ? formatMoney(clientMrr + planMrr, cur) : formatMoney(planMrr, pcur)}
          sub={sameCur ? `${formatMoney(clientMrr, cur)} client memberships + ${formatMoney(planMrr, pcur)} coach plans` : `coach plans · ${formatMoney(clientMrr, cur)} client MRR`}
        />
      </div>

      <Panel title={`Platform revenue per day · last 30 days (${(sameCur ? cur : pcur).toUpperCase()})`} className="mt-6">
        <BarChart data={platformDaily} unit="platform revenue" currency={sameCur ? cur : pcur} />
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Top coaches by sales">
          {byCoach.length === 0 ? (
            <Empty>No sales yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Coach</th>
                  <th className={th}>Plan</th>
                  <th className={`${th} text-right`}>Members</th>
                  <th className={`${th} text-right`}>Sales</th>
                  <th className={`${th} text-right`}>Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {byCoach.map((x) => (
                  <tr key={x.coach.id} className="hover:bg-zinc-50/60">
                    <td className={td}>
                      <Link href={`/admin/coaches/${x.coach.id}`} className="font-medium hover:underline">
                        {x.coach.name}
                      </Link>
                    </td>
                    <td className={td}>
                      <Pill tone={x.plan.priceMonthly ? "violet" : "zinc"}>{x.plan.name}</Pill>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{x.members}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(x.gmv, cur)}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatMoney(x.fees, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
        <Panel title="Coaches by plan">
          <ul className="divide-y divide-line">
            {planMix.map(({ plan, count }) => (
              <li key={plan.id} className="flex items-center gap-3 px-5 py-3.5 text-sm">
                <span className="flex-1 font-medium">{plan.name}</span>
                <span className="text-xs text-muted">{plan.priceMonthly ? `${formatMoney(plan.priceMonthly, pcur)}/mo · ${plan.commissionPct}%` : `free · ${plan.commissionPct}%`}</span>
                <span className="w-8 text-right font-semibold tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="All payments" className="mt-6">
        {ledger.length === 0 ? (
          <Empty>Payments appear here once Stripe is connected and clients start paying.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-zinc-50/60">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Type</th>
                  <th className={th}>Coach</th>
                  <th className={th}>Details</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={`${th} text-right`}>Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledger.map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} whitespace-nowrap text-muted`}>{new Date(p.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                    <td className={td}>
                      <Pill tone={p.kind === "coach_plan" ? "violet" : p.kind === "client_pack" ? "amber" : "green"}>{KIND[p.kind]}</Pill>
                    </td>
                    <td className={td}>{who(p.coachId)}</td>
                    <td className={`${td} text-muted`}>
                      {p.description}
                      {p.clientId && ` · ${d.clients.find((c) => c.id === p.clientId)?.email ?? ""}`}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {formatMoney(p.amount, p.currency)}
                      {!!p.refunded && <div className="text-[11px] text-rose-600">−{formatMoney(p.refunded, p.currency)} refunded</div>}
                      {p.disputed && <div className="text-[11px] font-semibold text-rose-600">Disputed</div>}
                    </td>
                    <td className={`${td} text-right font-medium tabular-nums`}>{formatMoney(fee(p), p.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
