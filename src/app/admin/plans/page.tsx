import { CheckCircle2, XCircle } from "lucide-react";
import { CopyBox } from "@/components/admin/AdminClient";
import { PlansEditor } from "@/components/admin/PlansEditor";
import { PageHeader, Panel } from "@/components/admin/parts";
import { read } from "@/lib/db";
import { planFor } from "@/lib/plans";
import { appUrl, billingEnabled, webhookConfigured } from "@/lib/stripe";

export const metadata = { title: "Plans & fees" };

const EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "account.updated",
];

function Status({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-2.5 px-5 py-3">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />}
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{ok ? "Configured" : hint}</div>
      </div>
    </div>
  );
}

export default async function PlansPage() {
  const d = await read();
  const counts: Record<string, number> = {};
  for (const c of d.coaches.filter((x) => x.role === "coach")) {
    const id = planFor(d.settings, c).id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  const base = await appUrl();

  return (
    <>
      <PageHeader title="Plans & fees" subtitle="What coaches pay you, and the commission you take on what their clients pay them." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <PlansEditor initial={d.settings.plans} defaultPlanId={d.settings.defaultPlanId} currency={d.settings.platformCurrency} coachCounts={counts} />
        <div className="space-y-6">
          <Panel title="Stripe connection">
            <div className="divide-y divide-line">
              <Status ok={billingEnabled()} label="Secret key" hint="Set STRIPE_SECRET_KEY in .env and restart" />
              <Status ok={webhookConfigured()} label="Webhook signing secret" hint="Set STRIPE_WEBHOOK_SECRET in .env and restart" />
            </div>
          </Panel>
          <Panel title="Webhook setup">
            <div className="space-y-3 px-5 py-4 text-sm">
              <p className="text-muted">
                In Stripe → Developers → Webhooks, add an endpoint listening to <b>your account and connected accounts</b>:
              </p>
              <CopyBox value={`${base}/api/stripe/webhook`} />
              <p className="text-muted">Events:</p>
              <ul className="space-y-1 font-mono text-[12px] text-zinc-700">
                {EVENTS.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="text-xs text-muted">Also enable Connect (Express accounts) and the customer portal in your Stripe dashboard.</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
