import { getCoach } from "@/lib/auth";
import { mutate } from "@/lib/db";
import { appUrl, billingEnabled, stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

/** Creates the coach's Stripe Express account (first time) and returns a hosted onboarding link. */
export async function POST() {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  if (!billingEnabled()) return fail("Payments aren't set up on this platform yet. Ask the administrator.", 503);
  const s = stripe();
  try {
    let accountId = coach.stripeAccountId;
    if (!accountId) {
      const acct = await s.accounts.create({
        type: "express",
        email: coach.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_profile: { product_description: "AI coaching memberships" },
        metadata: { coachId: coach.id },
      });
      accountId = acct.id;
      await mutate((d) => {
        const c = d.coaches.find((x) => x.id === coach.id);
        if (c) c.stripeAccountId = acct.id;
      });
    }
    const base = await appUrl();
    const link = await s.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: `${base}/dashboard/earnings?connected=1`,
      refresh_url: `${base}/dashboard/earnings?retry=1`,
    });
    return json({ url: link.url });
  } catch (err) {
    console.error("[payouts]", err);
    return fail(stripeError(err), 502);
  }
}
