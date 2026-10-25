export const CURRENCIES = ["usd", "eur", "gbp", "inr", "aud", "cad", "sgd", "aed"] as const;

const ZERO_DECIMAL = new Set(["jpy", "krw", "vnd", "clp", "isk", "ugx"]);

export function toMinor(amount: number, currency: string) {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100);
}

export function fromMinor(minor: number, currency: string) {
  return ZERO_DECIMAL.has(currency) ? minor : minor / 100;
}

export function formatMoney(minor: number, currency: string, opts: { compact?: boolean } = {}) {
  const value = fromMinor(minor, currency);
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: opts.compact || Number.isInteger(value) ? 0 : 2,
    minimumFractionDigits: opts.compact || Number.isInteger(value) ? 0 : 2,
  });
}

/** Monthly-equivalent value of a recurring amount. */
export const monthly = (amount: number, interval: "month" | "year") => (interval === "year" ? Math.round(amount / 12) : amount);
