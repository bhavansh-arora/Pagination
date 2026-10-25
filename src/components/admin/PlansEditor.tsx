"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus, Star, Trash2 } from "lucide-react";
import type { Plan } from "@/lib/db";
import { cn } from "@/lib/cn";
import { CURRENCIES, fromMinor, toMinor } from "@/lib/money";
import { Button, Field, Input, Switch, Textarea } from "../ui";
import { api } from "./AdminClient";

export function PlansEditor({ initial, defaultPlanId, currency, coachCounts }: { initial: Plan[]; defaultPlanId: string; currency: string; coachCounts: Record<string, number> }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initial);
  const [def, setDef] = useState(defaultPlanId);
  const [cur, setCur] = useState(currency);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const dirty = JSON.stringify([plans, def, cur]) !== JSON.stringify([initial, defaultPlanId, currency]);

  const patch = (i: number, p: Partial<Plan>) => {
    setPlans((all) => all.map((x, j) => (j === i ? { ...x, ...p } : x)));
    setState("idle");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-white p-5 shadow-soft">
        <Field label="Plan currency" hint="Currency coaches pay their plan in.">
          <select
            value={cur}
            onChange={(e) => {
              setCur(e.target.value);
              setState("idle");
            }}
            className="h-10 w-40 rounded-xl border border-line bg-white px-3 text-sm uppercase focus:border-violet-400 focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </Field>
        <p className="flex-1 text-xs leading-relaxed text-muted">
          New coaches start on the <b>default</b> plan. Changing a plan&apos;s price affects new subscriptions only; existing subscribers keep their price until they switch.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {plans.map((p, i) => (
          <div key={i} className={cn("rounded-2xl border bg-white p-5 shadow-soft", p.highlight ? "border-violet-300" : "border-line")}>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[15px] font-semibold">{p.name || "New plan"}</span>
              {def === p.id && <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-white">DEFAULT</span>}
              <span className="ml-auto text-xs text-muted">{coachCounts[p.id] ?? 0} coaches</span>
              {plans.length > 1 && (
                <button
                  onClick={() => {
                    if ((coachCounts[p.id] ?? 0) > 0 && !confirm("Coaches on this plan will fall back to the default plan. Remove it?")) return;
                    setPlans((all) => all.filter((_, j) => j !== i));
                    setState("idle");
                  }}
                  className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove plan"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input value={p.name} onChange={(e) => patch(i, { name: e.target.value })} />
                </Field>
                <Field label="ID" hint="Used in links; avoid changing.">
                  <Input value={p.id} onChange={(e) => patch(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="font-mono text-[13px]" />
                </Field>
              </div>
              <Field label="Tagline">
                <Input value={p.tagline} onChange={(e) => patch(i, { tagline: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label={`Price / mo (${cur.toUpperCase()})`}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fromMinor(p.priceMonthly, cur)}
                    onChange={(e) => patch(i, { priceMonthly: toMinor(Math.max(0, Number(e.target.value) || 0), cur) })}
                  />
                </Field>
                <Field label="Commission %">
                  <Input type="number" min={0} max={90} step="0.5" value={p.commissionPct} onChange={(e) => patch(i, { commissionPct: Math.min(90, Math.max(0, Number(e.target.value) || 0)) })} />
                </Field>
                <Field label="Max minds" hint="0 = unlimited">
                  <Input type="number" min={0} value={p.maxMinds} onChange={(e) => patch(i, { maxMinds: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                </Field>
                <Field label="AI replies / mo" hint="0 = unlimited">
                  <Input type="number" min={0} step={100} value={p.monthlyReplies} onChange={(e) => patch(i, { monthlyReplies: Math.max(0, Math.round(Number(e.target.value) || 0)) })} />
                </Field>
              </div>
              <Field label="Features" hint="One per line — shown on the pricing page.">
                <Textarea rows={4} value={p.features.join("\n")} onChange={(e) => patch(i, { features: e.target.value.split("\n").slice(0, 12) })} />
              </Field>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4 text-sm">
                <label className="flex items-center gap-2">
                  <Switch checked={p.canCharge} onChange={(v) => patch(i, { canCharge: v })} label="Can charge clients" /> Can charge clients
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={p.highlight} onChange={(v) => setPlans((all) => all.map((x, j) => ({ ...x, highlight: j === i ? v : v ? false : x.highlight })))} label="Highlight" />
                  <Star className="size-3.5 text-muted" /> Most popular
                </label>
                <button
                  disabled={def === p.id}
                  onClick={() => {
                    setDef(p.id);
                    setState("idle");
                  }}
                  className="ml-auto text-xs font-semibold text-violet-700 hover:underline disabled:text-muted disabled:no-underline"
                >
                  {def === p.id ? "Default plan" : "Make default"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {plans.length < 6 && (
          <button
            onClick={() => {
              setPlans((all) => [
                ...all,
                { id: `plan-${all.length + 1}`, name: "New plan", tagline: "", priceMonthly: 4900, commissionPct: 5, maxMinds: 3, monthlyReplies: 2000, canCharge: true, highlight: false, features: [] },
              ]);
              setState("idle");
            }}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 text-sm font-semibold text-violet-700 hover:border-violet-400 hover:bg-violet-50/40"
          >
            <Plus className="size-5" /> Add plan
          </button>
        )}
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="sticky bottom-4 flex items-center gap-3">
        <Button
          disabled={!dirty}
          loading={state === "saving"}
          onClick={async () => {
            setState("saving");
            setError("");
            try {
              await api("/api/admin/settings", "PATCH", { plans: plans.map((p) => ({ ...p, features: p.features.map((f) => f.trim()).filter(Boolean) })), defaultPlanId: def, platformCurrency: cur });
              setState("saved");
              router.refresh();
            } catch (err) {
              setError((err as Error).message);
              setState("idle");
            }
          }}
        >
          Save plans
        </Button>
        {state === "saved" && !dirty && (
          <span className="flex items-center gap-1 text-sm text-emerald-700">
            <Check className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
