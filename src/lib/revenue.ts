import type { Membership, Payment } from "./db";
import { monthly } from "./money";
import { lastDays } from "./usage";
import { isActiveMembership } from "./entitlements";

/** Currency most of these payments were made in (amounts in different currencies aren't summed together). */
export function mainCurrency(payments: Pick<Payment, "currency">[], fallback: string) {
  const counts = new Map<string, number>();
  for (const p of payments) counts.set(p.currency, (counts.get(p.currency) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? fallback;
}

export function sumBy(payments: Payment[], currency: string, pick: (p: Payment) => number, sinceDay?: string) {
  return payments.filter((p) => p.currency === currency && (!sinceDay || p.at.slice(0, 10) >= sinceDay)).reduce((n, p) => n + pick(p), 0);
}

export function perDay(payments: Payment[], currency: string, days: number, pick: (p: Payment) => number) {
  return lastDays(days).map((day) => ({
    day,
    value: payments.filter((p) => p.currency === currency && p.at.slice(0, 10) === day).reduce((n, p) => n + pick(p), 0),
  }));
}

export function recurring(memberships: Membership[], currency: string) {
  return memberships.filter((m) => isActiveMembership(m) && m.currency === currency && !m.cancelAtPeriodEnd).reduce((n, m) => n + monthly(m.amount, m.interval), 0);
}

export const net = (p: Payment) => p.amount - p.platformFee;
export const gross = (p: Payment) => p.amount;
export const fee = (p: Payment) => p.platformFee;
