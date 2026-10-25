"use client";
import { useState } from "react";
import { Check, Loader2, Lock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { BotAvatar } from "../brand";
import { ClientAuthForm } from "./ClientAuth";
import type { ChatBot } from "./ChatView";

export interface Offer {
  currency: string;
  freeMessages: number;
  monthly: number | null;
  yearly: number | null;
  packs: { id: string; messages: number; price: number }[];
}

export interface AccessStatus {
  mode: "free" | "paid";
  signedIn: boolean;
  membership: { interval: "month" | "year"; currentPeriodEnd?: string; cancelAtPeriodEnd: boolean; status: string } | null;
  credits: number;
  trialUsed: number;
  trialLeft: number;
  canChat: boolean;
  owner?: boolean;
}

export function Paywall({
  bot,
  offer,
  status,
  visitorId,
  accessCode,
  reason,
  onClose,
  onSignedIn,
}: {
  bot: ChatBot;
  offer: Offer;
  status: AccessStatus;
  visitorId: string | null;
  accessCode: string;
  reason?: string;
  onClose?: () => void;
  onSignedIn: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const first = bot.coachName.split(" ")[0] || bot.coachName;
  const yearlySaving = offer.monthly && offer.yearly ? Math.round((1 - offer.yearly / (offer.monthly * 12)) * 100) : 0;

  async function buy(option: "monthly" | "yearly" | "pack", packId?: string) {
    setLoading(packId ?? option);
    setError("");
    const res = await fetch(`/api/chat/${bot.slug}/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ option, packId, accessCode: accessCode || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error ?? "Couldn't start checkout");
    setLoading(null);
  }

  const perks = ["Unlimited conversations", `${first}'s frameworks & methods, on demand`, "Private — your chats stay yours", "Cancel anytime"];

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 backdrop-blur-sm sm:place-items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-thin relative max-h-[92dvh] w-full animate-fade-up overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:max-w-[460px] sm:rounded-3xl"
      >
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-1.5 text-muted hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </button>
        )}
        <div className="relative overflow-hidden px-7 pt-8 pb-6 text-center" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${bot.brandColor} 16%, white), white 70%)` }}>
          <BotAvatar emoji={bot.avatarEmoji} image={bot.avatarImage} color={bot.brandColor} size={64} className="mx-auto ring-4 ring-white" />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{status.signedIn ? `Keep going with ${first}` : `Continue with ${first}`}</h2>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
            {reason ??
              (status.signedIn
                ? `Get ongoing access to ${bot.name} whenever you need it.`
                : `Create a free account to save your conversations and unlock ${bot.name}.`)}
          </p>
        </div>

        <div className="px-7 pb-7">
          {!status.signedIn ? (
            <ClientAuthForm visitorId={visitorId} onDone={onSignedIn} />
          ) : (
            <div className="space-y-3">
              {!!(offer.monthly || offer.yearly) && (
                <>
                  <ul className="mb-4 space-y-1.5">
                    {perks.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-zinc-700">
                        <Check className="size-4 text-accent" strokeWidth={2.5} /> {p}
                      </li>
                    ))}
                  </ul>
                  {offer.yearly && (
                    <PlanButton
                      highlight
                      title="Yearly"
                      badge={yearlySaving > 0 ? `Save ${yearlySaving}%` : undefined}
                      price={formatMoney(offer.yearly, offer.currency)}
                      sub={`per year · ${formatMoney(Math.round(offer.yearly / 12), offer.currency)}/mo`}
                      loading={loading === "yearly"}
                      onClick={() => buy("yearly")}
                    />
                  )}
                  {offer.monthly && (
                    <PlanButton
                      highlight={!offer.yearly}
                      title="Monthly"
                      price={formatMoney(offer.monthly, offer.currency)}
                      sub="per month · cancel anytime"
                      loading={loading === "monthly"}
                      onClick={() => buy("monthly")}
                    />
                  )}
                </>
              )}
              {offer.packs.length > 0 && (
                <div className={cn(!!(offer.monthly || offer.yearly) && "pt-3")}>
                  {!!(offer.monthly || offer.yearly) && <div className="mb-2 text-center text-xs font-medium text-muted">or pay as you go</div>}
                  <div className="grid gap-2">
                    {offer.packs.map((p) => (
                      <PlanButton
                        key={p.id}
                        title={`${p.messages.toLocaleString()} messages`}
                        price={formatMoney(p.price, offer.currency)}
                        sub="one-time · never expires"
                        loading={loading === p.id}
                        onClick={() => buy("pack", p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-muted">
                <Lock className="size-3" /> Secure checkout by Stripe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanButton({
  title,
  price,
  sub,
  badge,
  highlight,
  loading,
  onClick,
}: {
  title: string;
  price: string;
  sub: string;
  badge?: string;
  highlight?: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-px disabled:opacity-60",
        highlight ? "border-accent bg-accent-soft ring-4 ring-accent" : "border-line hover:border-zinc-300",
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              <Sparkles className="size-3" /> {badge}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">{sub}</div>
      </div>
      <div className="text-right">
        {loading ? <Loader2 className="size-5 animate-spin text-muted" /> : <div className="text-lg font-semibold tracking-tight">{price}</div>}
      </div>
    </button>
  );
}
