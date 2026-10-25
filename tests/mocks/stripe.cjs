// Fake Stripe API + hosted pages for e2e tests. Sends correctly signed webhooks to the app.
const http = require("http");
const crypto = require("crypto");

const state = { accounts: {}, sessions: {}, subs: {}, invoicePayments: [], log: [] };
let n = 0;
const id = (p) => `${p}_${Date.now().toString(36)}${(n++).toString(36)}`;
const now = () => Math.floor(Date.now() / 1000);

function parseForm(body) {
  const out = {};
  for (const pair of body.split("&").filter(Boolean)) {
    const [k, v = ""] = pair.split("=").map((x) => decodeURIComponent(x.replace(/\+/g, " ")));
    const keys = k.replace(/\]/g, "").split("[");
    let o = out;
    keys.forEach((key, i) => {
      if (i === keys.length - 1) o[key] = v;
      else o = o[key] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
    });
  }
  return out;
}

function start({ port = 4020, app = "http://127.0.0.1:3000", secret = "whsec_test" } = {}) {
  const SELF = `http://127.0.0.1:${port}`;

  async function webhook(type, object) {
    const event = { id: id("evt"), object: "event", type, created: now(), data: { object }, livemode: false };
    const payload = JSON.stringify(event);
    const t = now();
    const sig = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
    const res = await fetch(`${app}/api/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${sig}` }, body: payload });
    state.log.push(`${type} -> ${res.status}`);
  }

  const subObject = (s) => ({
    id: s.id, object: "subscription", status: s.status, currency: s.currency, metadata: s.metadata, customer: s.customer,
    cancel_at_period_end: !!s.cancel_at_period_end, cancel_at: null,
    items: { object: "list", data: [{ id: "si_1", current_period_end: now() + 30 * 86400, price: { unit_amount: s.amount, recurring: { interval: s.interval } } }] },
  });

  async function complete(cs) {
    const meta = cs.metadata || {};
    if (cs.mode === "payment") {
      cs.payment_intent = id("pi");
      await webhook("checkout.session.completed", { id: cs.id, object: "checkout.session", mode: "payment", payment_status: "paid", payment_intent: cs.payment_intent, amount_total: cs.amount, currency: cs.currency, metadata: meta });
      return;
    }
    const sd = cs.subscription_data || {};
    const s = { id: id("sub"), status: "active", currency: cs.currency, metadata: sd.metadata || meta, amount: cs.amount, interval: cs.interval, customer: cs.customer };
    state.subs[s.id] = s;
    const invoice = id("in");
    s.payment_intent = id("pi");
    state.invoicePayments.push({ payment_intent: s.payment_intent, invoice });
    await webhook("customer.subscription.created", subObject(s));
    await webhook("invoice.paid", { id: invoice, object: "invoice", amount_paid: cs.amount, currency: cs.currency, parent: { type: "subscription_details", subscription_details: { subscription: s.id, metadata: s.metadata } } });
    await webhook("checkout.session.completed", { id: cs.id, object: "checkout.session", mode: "subscription", payment_status: "paid", subscription: s.id, amount_total: cs.amount, currency: cs.currency, metadata: meta });
  }

  const json = (res, code, obj) => {
    res.writeHead(code, { "content-type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      const url = new URL(req.url, SELF);
      const p = url.pathname;
      const f = parseForm(body);
      try {
        if (p.startsWith("/mock/onboard/")) {
          const acct = state.accounts[p.split("/").pop()];
          Object.assign(acct, { charges_enabled: true, details_submitted: true });
          await webhook("account.updated", acct);
          res.writeHead(302, { location: acct.return_url });
          return res.end();
        }
        if (p.startsWith("/mock/checkout/")) {
          const cs = state.sessions[p.split("/").pop()];
          await complete(cs);
          res.writeHead(302, { location: cs.success_url });
          return res.end();
        }
        if (p === "/mock/refund") {
          // Full refund of the most recent pack purchase.
          const cs = Object.values(state.sessions).reverse().find((x) => x.mode === "payment" && x.payment_intent);
          await webhook("charge.refunded", { id: id("ch"), object: "charge", payment_intent: cs.payment_intent, amount: cs.amount, amount_refunded: cs.amount, refunded: true });
          return json(res, 200, { ok: true });
        }
        if (p === "/mock/refund-sub") {
          const s = Object.values(state.subs).find((x) => x.metadata?.kind === "client_subscription");
          await webhook("charge.refunded", { id: id("ch"), object: "charge", payment_intent: s.payment_intent, amount: s.amount, amount_refunded: Math.round(s.amount / 2), refunded: false });
          return json(res, 200, { ok: true });
        }
        if (p === "/mock/log") return json(res, 200, state.log);
        if (req.method === "POST" && p === "/v1/accounts") {
          const a = { id: id("acct"), object: "account", charges_enabled: false, details_submitted: false, email: f.email };
          state.accounts[a.id] = a;
          return json(res, 200, a);
        }
        if (req.method === "GET" && p.startsWith("/v1/accounts/")) return json(res, 200, state.accounts[p.split("/")[3]]);
        if (req.method === "POST" && p === "/v1/account_links") {
          state.accounts[f.account].return_url = f.return_url;
          return json(res, 200, { object: "account_link", url: `${SELF}/mock/onboard/${f.account}` });
        }
        if (req.method === "POST" && /^\/v1\/accounts\/[^/]+\/login_links$/.test(p)) return json(res, 200, { object: "login_link", url: `${SELF}/mock/express` });
        if (req.method === "POST" && p === "/v1/customers") return json(res, 200, { id: id("cus"), object: "customer", email: f.email });
        if (req.method === "POST" && p === "/v1/checkout/sessions") {
          const li = f.line_items[0].price_data;
          const cs = {
            id: id("cs"), object: "checkout.session", mode: f.mode, customer: f.customer, metadata: f.metadata, success_url: f.success_url,
            subscription_data: f.subscription_data, payment_intent_data: f.payment_intent_data,
            amount: Number(li.unit_amount), currency: li.currency, interval: li.recurring?.interval,
          };
          cs.url = `${SELF}/mock/checkout/${cs.id}`;
          state.sessions[cs.id] = cs;
          return json(res, 200, cs);
        }
        if (req.method === "GET" && p === "/v1/invoice_payments") {
          const pi = url.searchParams.get("payment[payment_intent]");
          const hit = state.invoicePayments.filter((x) => x.payment_intent === pi).map((x) => ({ object: "invoice_payment", invoice: x.invoice, payment: { type: "payment_intent", payment_intent: pi } }));
          return json(res, 200, { object: "list", data: hit, has_more: false });
        }
        if (/^\/v1\/subscriptions\/[^/]+$/.test(p)) {
          const s = state.subs[p.split("/")[3]];
          if (req.method === "DELETE") {
            s.status = "canceled";
            await webhook("customer.subscription.deleted", subObject(s));
            return json(res, 200, subObject(s));
          }
          if (f.cancel_at_period_end) s.cancel_at_period_end = f.cancel_at_period_end === "true";
          await webhook("customer.subscription.updated", subObject(s));
          return json(res, 200, subObject(s));
        }
        if (req.method === "POST" && p === "/v1/billing_portal/sessions") return json(res, 200, { object: "billing_portal.session", url: `${SELF}/mock/portal` });
        json(res, 404, { error: { type: "invalid_request_error", message: `mock: no route ${req.method} ${p}` } });
      } catch (e) {
        console.error(e);
        json(res, 500, { error: { type: "api_error", message: String(e) } });
      }
    });
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

module.exports = { start, state };
