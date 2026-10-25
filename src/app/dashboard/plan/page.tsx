import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PlanPicker } from "@/components/CoachBilling";
import { StudioHeader } from "@/components/StudioHeader";
import { getCoach } from "@/lib/auth";
import { read } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { planFor } from "@/lib/plans";

export const metadata = { title: "Plan" };

export default async function PlanPage() {
  const coach = await getCoach();
  if (!coach) redirect("/login");
  const d = await read();
  const current = planFor(d.settings, coach);
  const used = d.bots.filter((b) => b.coachId === coach.id).length;
  const plans = d.settings.plans.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    price: p.priceMonthly === 0 ? "Free" : formatMoney(p.priceMonthly, d.settings.platformCurrency),
    priceMonthly: p.priceMonthly,
    commissionPct: p.commissionPct,
    maxMinds: p.maxMinds,
    features: p.features,
    highlight: p.highlight,
  }));

  return (
    <div className="mesh min-h-dvh">
      <StudioHeader coach={coach} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Your plan</h1>
        <p className="mt-1.5 mb-8 text-muted">
          You&apos;re on <b className="text-ink">{current.name}</b> · {used} of {current.maxMinds || "unlimited"} minds used · {current.commissionPct}% fee on client
          payments
          {coach.planRenewsAt && !coach.planCancelAtPeriodEnd ? ` · renews ${new Date(coach.planRenewsAt).toLocaleDateString(undefined, { dateStyle: "medium" })}` : ""}
        </p>
        <Suspense>
          <PlanPicker plans={plans} currentId={current.id} hasCustomer={!!coach.stripeCustomerId} renewsAt={coach.planRenewsAt} pendingCancel={!!coach.planCancelAtPeriodEnd} />
        </Suspense>
      </main>
    </div>
  );
}
