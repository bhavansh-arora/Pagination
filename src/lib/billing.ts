import "server-only";
import type Stripe from "stripe";
import { nanoid } from "nanoid";
import { mutate, type Data, type Membership } from "./db";
import { stripe } from "./stripe";

type Meta = Record<string, string | undefined>;

const iso = (unix?: number | null) => (unix ? new Date(unix * 1000).toISOString() : undefined);

function periodEnd(sub: Stripe.Subscription) {
  return iso(Math.max(0, ...sub.items.data.map((i) => i.current_period_end ?? 0)) || null);
}

function recordPayment(d: Data, p: Omit<Data["payments"][number], "id" | "at">) {
  if (d.payments.some((x) => x.stripeRef === p.stripeRef)) return;
  d.payments.push({ id: nanoid(12), at: new Date().toISOString(), ...p });
}

function applySubscription(d: Data, sub: Stripe.Subscription, deleted: boolean) {
  const meta = sub.metadata as Meta;
  const status = deleted ? "canceled" : sub.status;

  if (meta.kind === "coach_plan" && meta.coachId) {
    const coach = d.coaches.find((c) => c.id === meta.coachId);
    if (!coach) return null;
    const live = ["active", "trialing", "past_due"].includes(status);
    if (live) {
      const previous = coach.planSubscriptionId && coach.planSubscriptionId !== sub.id ? coach.planSubscriptionId : null;
      Object.assign(coach, {
        planId: meta.planId,
        planSubscriptionId: sub.id,
        planStatus: status,
        planRenewsAt: periodEnd(sub),
        planCancelAtPeriodEnd: sub.cancel_at_period_end || !!sub.cancel_at,
      });
      return previous;
    }
    if (coach.planSubscriptionId === sub.id) {
      Object.assign(coach, { planId: d.settings.defaultPlanId, planSubscriptionId: undefined, planStatus: status, planRenewsAt: undefined, planCancelAtPeriodEnd: false });
    }
    return null;
  }

  if (meta.kind === "client_subscription" && meta.clientId && meta.botId) {
    const item = sub.items.data[0];
    let m = d.memberships.find((x) => x.stripeSubscriptionId === sub.id);
    if (!m) {
      m = {
        id: nanoid(12),
        clientId: meta.clientId,
        botId: meta.botId,
        coachId: meta.coachId ?? "",
        stripeSubscriptionId: sub.id,
        status,
        interval: item?.price.recurring?.interval === "year" ? "year" : "month",
        amount: item?.price.unit_amount ?? 0,
        currency: sub.currency,
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
      } satisfies Membership;
      d.memberships.push(m);
    }
    Object.assign(m, { status, cancelAtPeriodEnd: sub.cancel_at_period_end || !!sub.cancel_at, currentPeriodEnd: periodEnd(sub) });
  }
  return null;
}

/** Applies a verified Stripe event. Safe to call more than once for the same event. */
export async function handleStripeEvent(event: Stripe.Event) {
  let cancelOld: string | null = null;

  const done = await mutate((d) => {
    if (d.processedEvents.includes(event.id)) return true;

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object;
        const meta = s.metadata as Meta;
        if (meta.kind === "client_pack" && s.payment_status === "paid" && meta.clientId && meta.botId) {
          if (d.payments.some((p) => p.stripeRef === s.id)) break;
          const messages = Number(meta.messages) || 0;
          let bal = d.credits.find((c) => c.clientId === meta.clientId && c.botId === meta.botId);
          if (!bal) d.credits.push((bal = { clientId: meta.clientId, botId: meta.botId, remaining: 0 }));
          bal.remaining += messages;
          recordPayment(d, {
            kind: "client_pack",
            coachId: meta.coachId ?? "",
            botId: meta.botId,
            clientId: meta.clientId,
            amount: s.amount_total ?? 0,
            currency: s.currency ?? "usd",
            platformFee: Number(meta.platformFee) || 0,
            stripeRef: s.id,
            description: `${messages} message pack`,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        cancelOld = applySubscription(d, event.data.object, false);
        break;
      case "customer.subscription.deleted":
        applySubscription(d, event.data.object, true);
        break;
      case "invoice.paid": {
        const inv = event.data.object;
        const details = inv.parent?.subscription_details;
        const meta = (details?.metadata ?? {}) as Meta;
        if (!inv.amount_paid || !meta.kind) break;
        if (meta.kind === "coach_plan") {
          recordPayment(d, {
            kind: "coach_plan",
            coachId: meta.coachId ?? "",
            amount: inv.amount_paid,
            currency: inv.currency,
            platformFee: inv.amount_paid,
            stripeRef: inv.id ?? event.id,
            description: `${meta.planName ?? meta.planId} plan`,
          });
        } else if (meta.kind === "client_subscription") {
          recordPayment(d, {
            kind: "client_subscription",
            coachId: meta.coachId ?? "",
            botId: meta.botId,
            clientId: meta.clientId,
            amount: inv.amount_paid,
            currency: inv.currency,
            platformFee: Math.round((inv.amount_paid * (Number(meta.feePct) || 0)) / 100),
            stripeRef: inv.id ?? event.id,
            description: `${meta.interval === "year" ? "Yearly" : "Monthly"} membership`,
          });
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object;
        const coach = d.coaches.find((c) => c.stripeAccountId === acct.id);
        if (coach) Object.assign(coach, { payoutsReady: !!acct.charges_enabled, payoutsDetailsSubmitted: !!acct.details_submitted });
        break;
      }
    }

    d.processedEvents.push(event.id);
    if (d.processedEvents.length > 5000) d.processedEvents = d.processedEvents.slice(-5000);
    return false;
  });

  // A coach who switched paid plans keeps only the newest subscription.
  if (!done && cancelOld) await stripe().subscriptions.cancel(cancelOld).catch((e) => console.error("[billing] cancel old plan", e));
}

/** Pulls a coach's connected-account status straight from Stripe. */
export async function syncPayoutStatus(coachId: string, accountId: string) {
  const acct = await stripe().accounts.retrieve(accountId);
  await mutate((d) => {
    const coach = d.coaches.find((c) => c.id === coachId);
    if (coach) Object.assign(coach, { payoutsReady: !!acct.charges_enabled, payoutsDetailsSubmitted: !!acct.details_submitted });
  });
  return { ready: !!acct.charges_enabled, detailsSubmitted: !!acct.details_submitted };
}
