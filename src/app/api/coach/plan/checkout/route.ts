import { z } from "zod";
import { getCoach } from "@/lib/auth";
import { mutate, read } from "@/lib/db";
import { appUrl, billingEnabled, stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

const Body = z.object({ planId: z.string().max(40) });

export async function POST(req: Request) {
  const coach = await getCoach();
  if (!coach) return fail("Please sign in", 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Choose a plan");
  const d = await read();
  const plan = d.settings.plans.find((p) => p.id === parsed.data.planId);
  if (!plan) return fail("That plan doesn't exist");

  // Free plan: no payment needed. A paid subscription ends at the close of its period.
  if (plan.priceMonthly === 0) {
    if (coach.planSubscriptionId && billingEnabled()) {
      try {
        await stripe().subscriptions.update(coach.planSubscriptionId, { cancel_at_period_end: true });
      } catch (err) {
        return fail(stripeError(err), 502);
      }
      return json({ ok: true, message: "Your paid plan will end at the close of the current billing period." });
    }
    await mutate((data) => {
      const c = data.coaches.find((x) => x.id === coach.id);
      if (c) c.planId = plan.id;
    });
    return json({ ok: true });
  }

  if (!billingEnabled()) return fail("Payments aren't set up on this platform yet. Ask the administrator.", 503);
  const s = stripe();
  try {
    let customer = coach.stripeCustomerId;
    if (!customer) {
      customer = (await s.customers.create({ email: coach.email, name: coach.name, metadata: { coachId: coach.id } })).id;
      await mutate((data) => {
        const c = data.coaches.find((x) => x.id === coach.id);
        if (c) c.stripeCustomerId = customer;
      });
    }
    const base = await appUrl();
    const metadata = { kind: "coach_plan", coachId: coach.id, planId: plan.id, planName: plan.name };
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: d.settings.platformCurrency,
            unit_amount: plan.priceMonthly,
            recurring: { interval: "month" },
            product_data: { name: `Mindclone ${plan.name} plan` },
          },
        },
      ],
      subscription_data: { metadata },
      metadata,
      success_url: `${base}/dashboard/plan?upgraded=${plan.id}`,
      cancel_url: `${base}/dashboard/plan`,
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("[plan checkout]", err);
    return fail(stripeError(err), 502);
  }
}
