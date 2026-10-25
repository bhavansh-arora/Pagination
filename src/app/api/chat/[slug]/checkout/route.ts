import { z } from "zod";
import { mutate, read } from "@/lib/db";
import { chatAccess } from "@/lib/chat-access";
import { getClient } from "@/lib/client-auth";
import { isActiveMembership } from "@/lib/entitlements";
import { feeFor, planFor } from "@/lib/plans";
import { appUrl, billingEnabled, stripe, stripeError } from "@/lib/stripe";
import { fail, json } from "@/lib/api";

type Ctx = { params: Promise<{ slug: string }> };

const Body = z.object({
  option: z.enum(["monthly", "yearly", "pack"]),
  packId: z.string().max(40).optional(),
  accessCode: z.string().max(60).nullish(),
});

export async function POST(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Choose an option");
  const client = await getClient();
  if (!client) return fail("Create an account or sign in first", 401);
  if (!billingEnabled()) return fail("Payments aren't available yet", 503);

  const access = await chatAccess(slug, parsed.data.accessCode);
  if ("error" in access) return fail(access.error, access.status);
  const { bot } = access;
  const d = await read();
  const coach = d.coaches.find((c) => c.id === bot.coachId);
  const plan = coach ? planFor(d.settings, coach) : null;
  if (bot.pricing.mode !== "paid" || !coach?.stripeAccountId || !coach.payoutsReady || !plan?.canCharge) {
    return fail("This mind isn't accepting payments right now", 409);
  }
  if (d.memberships.some((m) => m.clientId === client.id && m.botId === bot.id && isActiveMembership(m)) && parsed.data.option !== "pack") {
    return fail("You already have an active membership", 409);
  }

  const p = bot.pricing;
  const base = await appUrl();
  const back = `${base}/c/${bot.slug}`;
  const s = stripe();

  try {
    let customer = client.stripeCustomerId;
    if (!customer) {
      customer = (await s.customers.create({ email: client.email, name: client.name, metadata: { clientId: client.id } })).id;
      await mutate((data) => {
        const c = data.clients.find((x) => x.id === client.id);
        if (c) c.stripeCustomerId = customer;
      });
    }
    const common = {
      kind: "",
      clientId: client.id,
      botId: bot.id,
      coachId: coach.id,
    };

    if (parsed.data.option === "pack") {
      const pack = p.packs.find((x) => x.id === parsed.data.packId);
      if (!pack) return fail("That pack isn't available");
      const platformFee = feeFor(pack.price, plan.commissionPct);
      const metadata = { ...common, kind: "client_pack", messages: String(pack.messages), platformFee: String(platformFee) };
      const session = await s.checkout.sessions.create({
        mode: "payment",
        customer,
        line_items: [
          {
            quantity: 1,
            price_data: { currency: p.currency, unit_amount: pack.price, product_data: { name: `${bot.name} — ${pack.messages} messages` } },
          },
        ],
        payment_intent_data: { application_fee_amount: platformFee, transfer_data: { destination: coach.stripeAccountId }, metadata },
        metadata,
        success_url: `${back}?paid=pack`,
        cancel_url: back,
      });
      return json({ url: session.url });
    }

    const yearly = parsed.data.option === "yearly";
    const amount = yearly ? p.yearly : p.monthly;
    if (!amount) return fail("That option isn't available");
    const metadata = { ...common, kind: "client_subscription", interval: yearly ? "year" : "month", feePct: String(plan.commissionPct) };
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: p.currency,
            unit_amount: amount,
            recurring: { interval: yearly ? "year" : "month" },
            product_data: { name: `${bot.name} membership` },
          },
        },
      ],
      subscription_data: {
        application_fee_percent: plan.commissionPct,
        transfer_data: { destination: coach.stripeAccountId },
        metadata,
      },
      metadata,
      success_url: `${back}?paid=member`,
      cancel_url: back,
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return fail(stripeError(err), 502);
  }
}
