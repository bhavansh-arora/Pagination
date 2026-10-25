import { getCoach } from "@/lib/auth";
import { appUrl, stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

export async function POST() {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  if (!coach.stripeCustomerId) return fail("No billing history yet");
  try {
    const session = await stripe().billingPortal.sessions.create({ customer: coach.stripeCustomerId, return_url: `${await appUrl()}/dashboard/plan` });
    return json({ url: session.url });
  } catch (err) {
    return fail(stripeError(err), 502);
  }
}
