"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Gift, Package, Plus, Repeat, Trash2 } from "lucide-react";
import type { Bot, Pricing } from "@/lib/db";
import { cn } from "@/lib/cn";
import { CURRENCIES, formatMoney, fromMinor, toMinor } from "@/lib/money";
import { Field, Input, Section, Segmented } from "../ui";
import { PageTitle } from "./sections";
import type { Update } from "./Editor";

export interface BillingInfo {
  enabled: boolean;
  connected: boolean;
  payoutsReady: boolean;
  canCharge: boolean;
  commissionPct: number;
  planName: string;
}

function PriceInput({ value, currency, onChange, placeholder }: { value: number | null; currency: string; onChange: (v: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(value == null ? "" : String(fromMinor(value, currency)));
  useEffect(() => setText(value == null ? "" : String(fromMinor(value, currency))), [value, currency]);
  return (
    <div className="relative">
      <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold text-muted uppercase">{currency}</span>
      <Input
        inputMode="decimal"
        className="pl-12"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => {
          const n = parseFloat(text);
          onChange(Number.isFinite(n) && n > 0 ? toMinor(n, currency) : null);
        }}
      />
    </div>
  );
}

export function MonetizationSection({ bot, update, billing }: { bot: Bot; update: Update; billing: BillingInfo }) {
  const p = bot.pricing;
  const set = (patch: Partial<Pricing>) => update({ pricing: { ...p, ...patch } });
  const keep = (amount: number) => amount - Math.round((amount * billing.commissionPct) / 100);
  const blocked = !billing.enabled ? "admin" : !billing.canCharge ? "plan" : !billing.payoutsReady ? "payouts" : null;

  return (
    <>
      <PageTitle title="Monetization" subtitle="Keep your mind free, or charge clients with a free trial, memberships and message packs." />
      <div className="space-y-5">
        <Section title="Access">
          <Segmented
            value={p.mode}
            options={[
              { id: "free", label: "Free", blurb: "Anyone can chat — great for lead generation" },
              { id: "paid", label: "Paid", blurb: "Free trial, then membership or packs" },
            ]}
            onChange={(mode) => set({ mode })}
          />
          {p.mode === "paid" && blocked && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1">
                {blocked === "admin" && "Payments aren't enabled on this platform yet. Clients will hit the paywall but can't pay until the administrator connects Stripe."}
                {blocked === "plan" && `Your ${billing.planName} plan doesn't include charging clients.`}
                {blocked === "payouts" &&
                  (billing.connected ? "Finish your payout setup so clients can pay you." : "Connect payouts so clients can pay you — it takes about 5 minutes.")}
                {blocked !== "admin" && (
                  <Link href={blocked === "plan" ? "/dashboard/plan" : "/dashboard/earnings"} className="mt-1.5 flex items-center gap-1 font-semibold underline-offset-2 hover:underline">
                    {blocked === "plan" ? "Upgrade plan" : "Set up payouts"} <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </Section>

        {p.mode === "paid" && (
          <>
            <Section title="Currency & free trial" description="New clients can try your mind before paying. Trial messages are counted per person.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Currency">
                  <select
                    value={p.currency}
                    onChange={(e) => set({ currency: e.target.value })}
                    className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm uppercase focus:border-violet-400 focus:ring-4 focus:ring-violet-100 focus:outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Free messages" hint="0 = pay before the first message.">
                  <div className="relative">
                    <Gift className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      className="pl-10"
                      value={p.freeMessages}
                      onChange={(e) => set({ freeMessages: Math.max(0, Math.min(1000, Number(e.target.value) || 0)) })}
                    />
                  </div>
                </Field>
              </div>
            </Section>

            <Section title="Membership" description="Unlimited conversations for a recurring price. Leave a field empty to hide that option.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Monthly price" hint={p.monthly ? `You keep ${formatMoney(keep(p.monthly), p.currency)} / month*` : undefined}>
                  <PriceInput value={p.monthly} currency={p.currency} placeholder="19" onChange={(monthly) => set({ monthly })} />
                </Field>
                <Field
                  label="Yearly price"
                  hint={
                    p.yearly
                      ? `You keep ${formatMoney(keep(p.yearly), p.currency)} / year*${p.monthly ? ` · ${Math.max(0, Math.round((1 - p.yearly / (p.monthly * 12)) * 100))}% off monthly` : ""}`
                      : undefined
                  }
                >
                  <PriceInput value={p.yearly} currency={p.currency} placeholder="190" onChange={(yearly) => set({ yearly })} />
                </Field>
              </div>
            </Section>

            <Section
              title="Message packs"
              description="One-time purchases for people who don't want a subscription. Credits never expire."
              action={
                p.packs.length < 4 && (
                  <button
                    onClick={() =>
                      set({ packs: [...p.packs, { id: Math.random().toString(36).slice(2, 10), messages: p.packs.length ? p.packs[p.packs.length - 1].messages * 2 : 50, price: p.packs.length ? p.packs[p.packs.length - 1].price * 2 : 900 }] })
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-violet-100 hover:text-violet-800"
                  >
                    <Plus className="size-3.5" /> Add pack
                  </button>
                )
              }
            >
              {p.packs.length === 0 ? (
                <p className="text-sm text-muted">No packs. Add one to offer pay-as-you-go access.</p>
              ) : (
                <div className="space-y-2.5">
                  {p.packs.map((pack, i) => (
                    <div key={pack.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                      <Field label={i === 0 ? "Messages" : ""}>
                        <Input
                          type="number"
                          min={1}
                          value={pack.messages}
                          onChange={(e) => set({ packs: p.packs.map((x) => (x.id === pack.id ? { ...x, messages: Math.max(1, Number(e.target.value) || 1) } : x)) })}
                        />
                      </Field>
                      <Field label={i === 0 ? "Price" : ""}>
                        <PriceInput
                          value={pack.price}
                          currency={p.currency}
                          onChange={(price) => set({ packs: p.packs.map((x) => (x.id === pack.id ? { ...x, price: price ?? 100 } : x)) })}
                        />
                      </Field>
                      <button
                        onClick={() => set({ packs: p.packs.filter((x) => x.id !== pack.id) })}
                        className="mb-1 rounded-lg p-2 text-muted hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove pack"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
              <div className="text-[13px] font-semibold">What clients will see</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.freeMessages > 0 && <Chip icon={Gift}>{p.freeMessages} free messages</Chip>}
                {p.monthly && <Chip icon={Repeat}>{formatMoney(p.monthly, p.currency)} / month</Chip>}
                {p.yearly && <Chip icon={Repeat}>{formatMoney(p.yearly, p.currency)} / year</Chip>}
                {p.packs.map((x) => (
                  <Chip key={x.id} icon={Package}>
                    {x.messages} messages · {formatMoney(x.price, p.currency)}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                *After the {billing.commissionPct}% platform fee on your {billing.planName} plan. Stripe&apos;s card processing fees also apply. Money goes straight to
                your connected payout account.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Chip({ icon: Icon, children }: { icon: typeof Gift; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700")}>
      <Icon className="size-3.5 text-violet-500" /> {children}
    </span>
  );
}
