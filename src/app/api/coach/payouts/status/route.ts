import { getCoach } from "@/lib/auth";
import { syncPayoutStatus } from "@/lib/billing";
import { stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

export async function GET() {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  if (!coach.stripeAccountId) return json({ connected: false, ready: false, detailsSubmitted: false });
  try {
    return json({ connected: true, ...(await syncPayoutStatus(coach.id, coach.stripeAccountId)) });
  } catch (err) {
    return fail(stripeError(err), 502);
  }
}
