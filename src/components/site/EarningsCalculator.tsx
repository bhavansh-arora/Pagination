"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney, toMinor } from "@/lib/money";

interface CalcPlan {
  id: string;
  name: string;
  priceMonthly: number;
  commissionPct: number;
  highlight: boolean;
}

export function EarningsCalculator({ plans, currency }: { plans: CalcPlan[]; currency: string }) {
  const fmt = (minor: number) => formatMoney(minor, currency, { compact: true });
  const [members, setMembers] = useState(50);
  const [price, setPrice] = useState(29);
  const gross = members * toMinor(price, currency);
  const rows = plans.map((p) => ({ ...p, net: Math.max(0, Math.round(gross * (1 - p.commissionPct / 100)) - p.priceMonthly) }));
  const best = rows.reduce((a, b) => (b.net > a.net ? b : a), rows[0]);

  return (
    <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8 p-7 sm:p-10">
        <Slider label="Paying members" value={members} min={5} max={500} step={5} onChange={setMembers} display={members.toLocaleString()} />
        <Slider label="Monthly membership price" value={price} min={5} max={199} step={1} onChange={setPrice} display={fmt(toMinor(price, currency))} />
        <div className="rounded-2xl bg-white/[0.06] p-5">
          <div className="text-sm text-white/60">Your clients pay</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {fmt(gross)}
            <span className="text-base font-normal text-white/50"> / month</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-white/[0.03] p-7 sm:p-10 lg:border-t-0 lg:border-l">
        <div className="text-sm font-medium text-white/60">You keep each month</div>
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className={cn("flex items-center gap-4 rounded-2xl border px-5 py-4 transition", r.id === best.id ? "border-violet-400/60 bg-violet-500/15" : "border-white/10")}
            >
              <div className="flex-1">
                <div className="font-semibold text-white">{r.name}</div>
                <div className="text-xs text-white/50">
                  {r.priceMonthly ? `${fmt(r.priceMonthly)}/mo` : "Free"} · {r.commissionPct}% fee
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold tracking-tight text-white tabular-nums">{fmt(r.net)}</div>
                {r.id === best.id && <div className="text-[11px] font-semibold text-violet-300">Best for you</div>}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-white/40">
          Illustration only, before card processing fees and taxes. You set your own prices and currency.
        </p>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-white/70">{label}</span>
        <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-violet-400"
      />
    </label>
  );
}
