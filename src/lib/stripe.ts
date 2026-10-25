import "server-only";
import Stripe from "stripe";
import { headers } from "next/headers";

const g = globalThis as unknown as { __stripe?: Stripe };

export const billingEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const webhookConfigured = () => !!process.env.STRIPE_WEBHOOK_SECRET;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Payments aren't set up yet (missing STRIPE_SECRET_KEY)");
  if (!g.__stripe) {
    // STRIPE_API_BASE lets you point the SDK at stripe-mock for local testing.
    const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
    g.__stripe = new Stripe(key, {
      appInfo: { name: "Sagely" },
      ...(base ? { host: base.hostname, port: Number(base.port) || undefined, protocol: base.protocol.replace(":", "") as "http" | "https" } : {}),
    });
  }
  return g.__stripe;
}

/** Public base URL used for Stripe redirect links. */
export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
  return `${proto}://${host}`;
}

export function stripeError(err: unknown) {
  if (err instanceof Stripe.errors.StripeError) return err.message;
  if (err instanceof Error) return err.message;
  return "Payment service error";
}
