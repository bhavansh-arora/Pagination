import "server-only";
import type { Bot, Data, Membership } from "./db";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export const isActiveMembership = (m: Membership) => ACTIVE.has(m.status);

export interface AccessState {
  mode: "free" | "paid";
  signedIn: boolean;
  membership: Membership | null;
  credits: number;
  trialUsed: number;
  trialLeft: number;
  canChat: boolean;
  /** How the next message is paid for. */
  charge: "none" | "trial" | "credit";
}

const TRIAL_IP_WINDOW_DAYS = 30;

/**
 * Free messages already used. Counted per person and per network (hashed IP, last 30
 * days), so clearing cookies or making a new account doesn't restart the trial.
 */
function trialUsedFor(d: Data, botId: string, visitorKey: string, ipHash?: string) {
  const since = new Date(Date.now() - TRIAL_IP_WINDOW_DAYS * 86400_000).toISOString();
  let byKey = 0;
  let byIp = 0;
  for (const c of d.conversations) {
    if (c.botId !== botId || c.preview) continue;
    const mine = c.visitorId === visitorKey;
    const sameIp = !!ipHash && c.ipHash === ipHash && c.createdAt >= since;
    if (!mine && !sameIp) continue;
    const n = c.messages.filter((m) => m.role === "user").length;
    if (mine) byKey += n;
    if (sameIp) byIp += n;
  }
  return Math.max(byKey, byIp);
}

export function accessState(d: Data, bot: Bot, clientId: string | null, visitorKey: string, ipHash?: string): AccessState {
  const free: AccessState = { mode: "free", signedIn: !!clientId, membership: null, credits: 0, trialUsed: 0, trialLeft: 0, canChat: true, charge: "none" };
  if (bot.pricing.mode === "free") return free;

  const membership = clientId ? (d.memberships.find((m) => m.clientId === clientId && m.botId === bot.id && isActiveMembership(m)) ?? null) : null;
  const credits = clientId ? (d.credits.find((c) => c.clientId === clientId && c.botId === bot.id)?.remaining ?? 0) : 0;
  const trialUsed = trialUsedFor(d, bot.id, visitorKey, ipHash);
  const trialLeft = Math.max(0, bot.pricing.freeMessages - trialUsed);
  const charge = membership ? "none" : trialLeft > 0 ? "trial" : credits > 0 ? "credit" : "none";
  return {
    mode: "paid",
    signedIn: !!clientId,
    membership,
    credits,
    trialUsed,
    trialLeft,
    canChat: !!membership || trialLeft > 0 || credits > 0,
    charge,
  };
}

/** Offer shown on the paywall; only what the coach has enabled. */
export function offer(bot: Bot) {
  const p = bot.pricing;
  return {
    currency: p.currency,
    freeMessages: p.freeMessages,
    monthly: p.monthly,
    yearly: p.yearly,
    packs: p.packs.filter((x) => x.messages > 0 && x.price > 0),
  };
}
