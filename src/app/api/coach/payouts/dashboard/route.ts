import { getCoach } from "@/lib/auth";
import { stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

/** One-time link into the coach's Stripe Express dashboard (balance, payouts, bank details). */
export async function POST() {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  if (!coach.stripeAccountId) return fail("Connect payouts first");
  try {
    const link = await stripe().accounts.createLoginLink(coach.stripeAccountId);
    return json({ url: link.url });
  } catch (err) {
    return fail(stripeError(err), 502);
  }
}
