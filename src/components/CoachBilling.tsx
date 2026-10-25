"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, CheckCircle2, CircleDashed, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./ui";

async function go(url: string, body?: unknown) {
  const res = await fetch(url, { method: "POST", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  return data as { url?: string; message?: string };
}

export function PayoutsCard({ enabled, connected, ready }: { enabled: boolean; connected: boolean; ready: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.get("connected") || params.get("retry")) {
      fetch("/api/coach/payouts/status").then(() => {
        router.replace("/dashboard/earnings");
        router.refresh();
      });
    }
  }, [params, router]);

  async function act(key: string, url: string) {
    setLoading(key);
    setError("");
    try {
      const { url: next } = await go(url);
      if (next) window.location.href = next;
    } catch (err) {
      setError((err as Error).message);
      setLoading(null);
    }
  }

  const state = !enabled ? "disabled" : ready ? "ready" : connected ? "pending" : "none";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-5 rounded-2xl border p-6",
        state === "ready" ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white" : "border-line bg-white shadow-soft",
      )}
    >
      <span className={cn("grid size-12 place-items-center rounded-2xl", state === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-violet-50 text-violet-600")}>
        {state === "ready" ? <CheckCircle2 className="size-6" /> : <Wallet className="size-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">
          {state === "ready" && "Payouts active"}
          {state === "pending" && "Finish setting up payouts"}
          {state === "none" && "Get paid by your clients"}
          {state === "disabled" && "Payments aren't enabled yet"}
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {state === "ready" && "Client payments land in your Stripe account and are paid out to your bank automatically."}
          {state === "pending" && "Stripe needs a few more details before clients can pay you."}
          {state === "none" && "Connect a Stripe account to sell memberships and message packs. Takes about 5 minutes."}
          {state === "disabled" && "The platform administrator hasn't connected Stripe yet."}
        </p>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>
      {state === "ready" && (
        <Button variant="secondary" loading={loading === "dash"} onClick={() => act("dash", "/api/coach/payouts/dashboard")}>
          Open Stripe dashboard <ArrowUpRight className="size-4" />
        </Button>
      )}
      {(state === "none" || state === "pending") && (
        <Button loading={loading === "connect"} onClick={() => act("connect", "/api/coach/payouts/connect")}>
          {state === "none" ? "Connect payouts" : "Continue setup"} <ArrowUpRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

export interface PlanView {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceMonthly: number;
  commissionPct: number;
  maxMinds: number;
  monthlyReplies: number;
  features: string[];
  highlight: boolean;
}

export function PlanPicker({ plans, currentId, hasCustomer, renewsAt, pendingCancel }: { plans: PlanView[]; currentId: string; hasCustomer: boolean; renewsAt?: string; pendingCancel: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const current = plans.find((p) => p.id === currentId);

  useEffect(() => {
    const upgraded = params.get("upgraded");
    if (!upgraded) return;
    setMessage("Thanks! Your plan is being activated…");
    let n = 0;
    const t = setInterval(() => {
      router.refresh();
      if (++n >= 6) clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [params, router]);

  useEffect(() => {
    if (params.get("upgraded") && currentId === params.get("upgraded")) {
      setMessage(`You're on ${current?.name}. 🎉`);
      router.replace("/dashboard/plan");
    }
  }, [currentId, params, current?.name, router]);

  async function choose(id: string) {
    setLoading(id);
    setError("");
    try {
      const data = await go("/api/coach/plan/checkout", { planId: id });
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage(data.message ?? "Plan updated.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(null);
  }

  return (
    <div>
      {(message || error) && (
        <div className={cn("mb-6 rounded-xl px-4 py-3 text-sm", error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800")}>{error || message}</div>
      )}
      {pendingCancel && renewsAt && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your {current?.name} plan ends on {new Date(renewsAt).toLocaleDateString(undefined, { dateStyle: "medium" })}, then you&apos;ll move to the free plan.
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === currentId;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft",
                p.highlight ? "border-violet-300 ring-4 ring-violet-100" : "border-line",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-[11px] font-bold text-white">Most popular</span>
              )}
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-muted">{p.tagline}</div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted">/ month</span>
              </div>
              <div className="mt-1 text-xs font-medium text-violet-700">{p.commissionPct}% fee on client payments</div>
              <div className="text-xs text-muted">{p.monthlyReplies ? `${p.monthlyReplies.toLocaleString()} AI replies / month` : "Unlimited AI replies"}</div>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-zinc-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-violet-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={isCurrent ? "secondary" : p.highlight ? "primary" : "dark"}
                disabled={isCurrent || !!loading}
                onClick={() => choose(p.id)}
              >
                {loading === p.id ? <Loader2 className="size-4 animate-spin" /> : isCurrent ? <CircleDashed className="size-4" /> : null}
                {isCurrent ? "Current plan" : current && p.priceMonthly < current.priceMonthly ? `Switch to ${p.name}` : `Upgrade to ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>
      {hasCustomer && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              try {
                const { url } = await go("/api/coach/plan/portal");
                if (url) window.location.href = url;
              } catch (err) {
                setError((err as Error).message);
              }
            }}
            className="text-sm font-medium text-violet-700 hover:underline"
          >
            Manage billing, cards & invoices
          </button>
        </div>
      )}
    </div>
  );
}
