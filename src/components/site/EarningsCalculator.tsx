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
    <div className="grid overflow-hidden rounded-[22px] border border-cream/10 bg-night-2 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8 p-6 sm:p-10">
        <Slider label="Paying members" value={members} min={5} max={500} step={5} onChange={setMembers} display={members.toLocaleString()} />
        <Slider label="Monthly membership price" value={price} min={5} max={199} step={1} onChange={setPrice} display={fmt(toMinor(price, currency))} />
        <div className="rounded-2xl border border-cream/10 bg-night p-5">
          <div className="eyebrow">Your clients pay</div>
          <div className="mt-2 text-[44px] leading-none font-medium tracking-[-0.05em] text-cream">
            {fmt(gross)}
            <span className="font-serif text-[22px] tracking-normal text-gold italic"> / month</span>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 p-6 sm:p-10 lg:border-t-0 lg:border-l">
        <div className="eyebrow">You keep each month</div>
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className={cn("flex items-center gap-4 rounded-2xl border px-5 py-4 transition", r.id === best.id ? "border-gold bg-gold text-night" : "border-cream/10")}
            >
              <div className="flex-1">
                <div className="font-medium">{r.name}</div>
                <div className={cn("text-xs", r.id === best.id ? "text-night/60" : "text-cream/50")}>
                  {r.priceMonthly ? `${fmt(r.priceMonthly)}/mo` : "Free"} · {r.commissionPct}% fee
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-medium tracking-[-0.04em] tabular-nums">{fmt(r.net)}</div>
                {r.id === best.id && <div className="font-serif text-[14px] italic">best for you</div>}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs leading-relaxed text-cream/40">
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
        <span className="eyebrow">{label}</span>
        <span className="text-[32px] leading-none font-medium tracking-[-0.05em] text-cream tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-cream/15 accent-[#d6b57f]"
      />
    </label>
  );
}
