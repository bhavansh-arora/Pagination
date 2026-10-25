import { getClient } from "@/lib/client-auth";
import { appUrl, stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

/** Stripe's hosted page where clients update cards, see invoices and cancel. */
export async function POST() {
  const client = await getClient();
  if (!client) return fail("Please sign in", 401);
  if (!client.stripeCustomerId) return fail("You don't have any payments yet");
  try {
    const session = await stripe().billingPortal.sessions.create({ customer: client.stripeCustomerId, return_url: `${await appUrl()}/me` });
    return json({ url: session.url });
  } catch (err) {
    return fail(stripeError(err), 502);
  }
}
