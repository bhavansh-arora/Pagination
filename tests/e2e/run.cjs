#!/usr/bin/env node
// End-to-end test of the whole platform against fake Anthropic, Stripe and SMTP servers.
// Usage: npm run build && npm run test:e2e   (needs Playwright + Chromium installed)
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const anthropic = require("../mocks/anthropic.cjs");
const stripe = require("../mocks/stripe.cjs");
const smtp = require("../mocks/smtp.cjs");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright isn't installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "../..");
const PORT = 3100;
const B = `http://localhost:${PORT}`;
const SHOTS = process.env.SHOTS_DIR;
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lastMail = (to, subject) => [...smtp.mails].reverse().find((m) => m.to.includes(to) && (!subject || m.subject.includes(subject)));
const linkIn = (mail, re) => (mail?.data.match(re) || [])[0];

async function main() {
  if (!fs.existsSync(path.join(ROOT, ".next/BUILD_ID"))) throw new Error("Build the app first: npm run build");
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mindclone-e2e-"));
  if (await fetch(`${B}/api/health`).then(() => true, () => false)) throw new Error(`Port ${PORT} is already in use — stop the other server first`);
  await Promise.all([anthropic.start(4010), stripe.start({ port: 4020, app: `http://127.0.0.1:${PORT}` }), smtp.start(2525)]);
  const app = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      APP_URL: B,
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "adminpass123",
      ANTHROPIC_API_KEY: "test",
      ANTHROPIC_BASE_URL: "http://127.0.0.1:4010",
      STRIPE_SECRET_KEY: "sk_test_mock",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      STRIPE_API_BASE: "http://127.0.0.1:4020",
      SMTP_URL: "smtp://127.0.0.1:2525",
      MAIL_FROM: "Mindclone <hello@example.com>",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  const stopApp = () => {
    try {
      process.kill(-app.pid, "SIGTERM");
    } catch {}
  };
  process.on("exit", stopApp);
  let appLog = "";
  app.stdout.on("data", (c) => (appLog += c));
  app.stderr.on("data", (c) => (appLog += c));
  for (let i = 0; i < 60; i++) {
    const ok = await fetch(`${B}/api/health`).then((r) => r.ok, () => false);
    if (ok) break;
    await wait(500);
  }

  const browser = await chromium.launch();
  const errors = [];
  const ctx = async (ip, w = 1440, h = 900) => {
    // The forwarded IP simulates visitors on different networks (null = a plain browser).
    const c = await browser.newContext({ viewport: { width: w, height: h }, ...(ip ? { extraHTTPHeaders: { "x-forwarded-for": ip } } : {}) });
    const p = await c.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    return p;
  };
  const shot = (p, name) => SHOTS && p.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

  try {
    // ---------- Website + application + emails
    const web = await ctx("10.0.0.1");
    await web.goto(B);
    check("landing page renders", await web.locator("text=available 24/7").count());
    const r1 = await web.request.get(`${B}/admin`);
    check("security: /admin not frameable", r1.headers()["x-frame-options"] === "SAMEORIGIN");
    const r2 = await web.request.get(`${B}/legal/privacy`);
    check("legal pages served", r2.ok());
    await web.goto(`${B}/apply`);
    await web.fill("input[name=name]", "Lena Park");
    await web.fill("input[name=email]", "lena@coach.com");
    await web.fill("input[name=niche]", "Burnout recovery for founders");
    await web.click('button:has-text("Apply for access")');
    await web.waitForSelector("text=Application received");
    await wait(500);
    check("admin emailed about new application", lastMail("admin@example.com", "New coach application"));
    check("applicant gets confirmation email", lastMail("lena@coach.com", "We got your application"));

    // ---------- Admin approves -> invite email
    const admin = await ctx("10.0.0.2");
    await admin.goto(`${B}/login`);
    await admin.fill("input[name=email]", "admin@example.com");
    await admin.fill("input[name=password]", "adminpass123");
    await admin.click('button:has-text("Sign in")');
    await admin.waitForURL("**/admin");
    await admin.goto(`${B}/admin/onboarding`);
    await admin.getByRole("button", { name: "Approve", exact: true }).click();
    await wait(1200);
    const inviteMail = lastMail("lena@coach.com", "You're in");
    const invite = linkIn(inviteMail, /https?:\/\/[^\s"<]+\/signup\?invite=[A-Za-z0-9_-]+/);
    check("approval emails a personal sign-up link", invite);

    // ---------- Coach signup + Interview me
    const coach = await ctx("10.0.0.3");
    await coach.goto(invite);
    await coach.fill("input[name=name]", "Lena Park");
    await coach.fill("input[name=password]", "lenapass123");
    await coach.click('button:has-text("Create my account")');
    await coach.waitForURL("**/dashboard");
    await wait(300);
    check("welcome email sent", lastMail("lena@coach.com", "Welcome"));
    await coach.click('button:has-text("Create my mind")');
    await coach.fill('input[placeholder="Maya AI"]', "Lena AI");
    await coach.click('button:has-text("Create & start training")');
    await coach.waitForURL("**/dashboard/bots/**");
    const botUrl = coach.url();
    const botId = botUrl.split("/").pop();
    check("new mind opens on 'Interview me'", await coach.locator("text=Question 1 of 8").count());
    for (const a of ["Burnt-out founders", "I burnt out at 32", "Rest is strategy"]) {
      await coach.fill("textarea", a);
      await coach.click('button:has-text("Next")');
    }
    await coach.click('button:has-text("Draft my mind")');
    await coach.waitForSelector("text=Here's your draft", { timeout: 20000 });
    await shot(coach, "interview-draft");
    await coach.click('button:has-text("Apply to my mind")');
    await coach.waitForSelector("text=Who you are");
    await wait(1500);
    const bot1 = await (await coach.request.get(`${B}/api/bots/${botId}`)).json();
    check("interview draft applied to mind", bot1.bot.bio.includes("burnt out") && bot1.bot.starters.length === 4);
    const srcs = await (await coach.request.get(`${B}/api/bots/${botId}/sources`)).json();
    check("interview created a knowledge note", srcs.sources.some((s) => s.title.includes("from interview")));
    const lastReq = anthropic.requests.findLast((r) => r.format);
    check("interview uses Opus 5.5 structured output with fallbacks", lastReq?.model === "claude-opus-5-5" && String(lastReq.beta).includes("server-side-fallback"));

    // ---------- Monetization, payouts, publish
    await coach.request.patch(`${B}/api/bots/${botId}`, {
      data: { pricing: { mode: "paid", currency: "usd", freeMessages: 2, monthly: 1900, yearly: null, packs: [{ id: "p1", messages: 50, price: 900 }] } },
    });
    await coach.goto(`${B}/dashboard/earnings`);
    await coach.click('button:has-text("Connect payouts")');
    await coach.waitForSelector("text=Payouts active", { timeout: 15000 });
    await coach.request.patch(`${B}/api/bots/${botId}`, { data: { published: true } });
    check("coach connected payouts and published", true);

    // ---------- Trial: anonymous visitor uses free messages; new browser on same network doesn't reset it
    const v1 = await ctx("10.0.0.50", 1280, 820);
    await v1.goto(`${B}/c/lena-ai`);
    for (const m of ["Hi Lena", "I'm exhausted"]) {
      await v1.fill("textarea", m);
      await v1.keyboard.press("Enter");
      await wait(900);
    }
    const v2 = await ctx("10.0.0.50", 1280, 820);
    await v2.goto(`${B}/c/lena-ai`);
    await v2.waitForSelector("text=You've used your free messages", { timeout: 8000 }).catch(() => {});
    check("free trial not reset by a new browser on same network", await v2.locator("text=You've used your free messages").count());

    // ---------- Client signs up from paywall, buys pack, rates a reply
    const u = await ctx("10.0.0.60", 1280, 820);
    await u.goto(`${B}/c/lena-ai`);
    await u.click('aside button:has-text("Sign in to save your chats")');
    await u.fill("input[name=name]", "Sam Client");
    await u.fill("input[name=email]", "sam@client.com");
    await u.fill("input[name=password]", "sampass123");
    await u.click('button:has-text("Create free account")');
    await wait(800);
    for (const m of ["Hello", "Still tired"]) {
      await u.fill("textarea", m);
      await u.keyboard.press("Enter");
      await wait(1200);
    }
    await u.fill("textarea", "What now?");
    await u.keyboard.press("Enter");
    await u.waitForSelector("text=50 messages", { timeout: 8000 });
    await u.click('button:has-text("50 messages")');
    await u.waitForSelector("text=50 messages added", { timeout: 15000 });
    check("client bought a message pack", true);
    await u.fill("textarea", "Give me one step");
    await u.keyboard.press("Enter");
    await wait(1500);
    await u.locator('button[aria-label="Not helpful"]').last().click();
    await wait(500);
    await wait(2500); // memory update runs in the background
    await u.goto(`${B}/me`);
    check("client sees what the AI remembers", await u.locator("text=What your coaches").count());
    await shot(u, "client-portal");

    // ---------- Refund removes unused credits
    const before = (await (await u.request.get(`${B}/api/client/export`)).json()).messageCredits[0]?.remaining;
    await fetch("http://127.0.0.1:4020/mock/refund");
    await wait(800);
    const after = (await (await u.request.get(`${B}/api/client/export`)).json()).messageCredits[0]?.remaining ?? 0;
    check("pack refund revokes unused credits", before > 0 && after === 0, `${before} → ${after}`);

    // ---------- Coach sees feedback, corrects an answer
    await coach.goto(botUrl);
    await coach.click('nav button:has-text("Conversations")');
    await coach.waitForSelector("text=Not helpful 👎");
    check("coach sees the thumbs-down", await coach.locator("text=clients didn't find helpful").count());
    await coach.locator("text=clients didn't find helpful").locator("..").locator("..").locator("li button").first().click();
    await coach.locator('button:has-text("Improve this answer")').last().click();
    await coach.locator("textarea").last().fill("Protect one hour tomorrow morning — put it in your calendar now.");
    await coach.click('button:has-text("Teach my mind")');
    await coach.waitForSelector("text=your mind has learned this");
    const srcs2 = await (await coach.request.get(`${B}/api/bots/${botId}/sources`)).json();
    check("correction became knowledge", srcs2.sources.some((s) => s.origin === "Coach corrections"));
    await shot(coach, "coach-conversations");

    // ---------- Forgot password (client)
    const f = await ctx("10.0.0.61");
    await f.goto(`${B}/forgot?kind=client`);
    await f.fill("input[name=email]", "sam@client.com");
    await f.click('button:has-text("Send reset link")');
    await f.waitForSelector("text=reset link is on its way");
    await wait(500);
    const reset = linkIn(lastMail("sam@client.com", "Reset"), /https?:\/\/[^\s"<]+\/reset\?token=[A-Za-z0-9_-]+/);
    check("reset email sent", reset);
    await f.goto(reset);
    await f.fill('input[type=password] >> nth=0', "newsampass1");
    await f.fill('input[type=password] >> nth=1', "newsampass1");
    await f.click('button:has-text("Set new password")');
    await f.waitForSelector("text=Your password has been changed");
    const login = await f.request.post(`${B}/api/client/login`, { data: { email: "sam@client.com", password: "newsampass1" } });
    check("client can sign in with new password", login.ok());

    // ---------- Quota: tiny limit pauses the mind and emails the coach
    const settings = await (await admin.request.patch(`${B}/api/admin/settings`, { data: { signupMode: "invite" } })).json();
    const plans = settings.settings.plans.map((p) => (p.id === "starter" ? { ...p, monthlyReplies: 3 } : p));
    await admin.request.patch(`${B}/api/admin/settings`, { data: { plans } });
    const q = await u.request.post(`${B}/api/chat/lena-ai`, { data: { visitorId: "ignoredvisitor", message: "hi" } });
    check("quota reached → clients see 'back soon'", q.status() === 429 && (await q.text()).includes("short break"));
    await coach.request.post(`${B}/api/chat/lena-ai`, { data: { visitorId: "previewvisitor", message: "hi", preview: true } });
    await wait(300);
    await coach.goto(`${B}/dashboard`);
    check("coach dashboard shows quota meter", await coach.locator("text=AI replies used this month").count());
    await admin.request.patch(`${B}/api/admin/settings`, { data: { plans: settings.settings.plans } });

    // ---------- Widget
    const w = await ctx(null, 1280, 820);
    await w.setContent(`<html><body><h1>Lena's site</h1><script src="${B}/widget.js" data-mind="lena-ai"></script></body></html>`);
    await w.waitForSelector('button[aria-label="Chat with Lena AI"]', { timeout: 8000 });
    await w.click('button[aria-label="Chat with Lena AI"]');
    const frame = await (await w.waitForSelector("iframe")).contentFrame();
    await frame.waitForSelector("textarea", { timeout: 10000 });
    check("website widget opens the chat", true);
    await shot(w, "widget");

    // ---------- Admin pages
    for (const pth of ["/admin", "/admin/revenue", "/admin/usage", "/admin/onboarding", "/admin/plans", "/admin/settings", "/admin/coaches", "/admin/minds", "/admin/activity"]) {
      const res = await admin.goto(B + pth);
      if (!res.ok()) check(`admin page ${pth}`, false, String(res.status()));
    }
    check("all admin pages load", true);
    const csv = await admin.request.get(`${B}/api/admin/usage/export?days=30`);
    check("usage CSV export", (await csv.text()).includes("claude-haiku-5-5"), "includes memory model usage");

    // ---------- Client deletes account
    // The reset signed Sam out everywhere; he signed back in on `f`.
    const del = await f.request.delete(`${B}/api/client/me`, { data: { password: "newsampass1" } });
    const gone = await f.request.post(`${B}/api/client/login`, { data: { email: "sam@client.com", password: "newsampass1" } });
    check("client can delete their account", del.ok() && gone.status() === 401);

    check("no browser errors", errors.length === 0, errors.join(" | "));
  } catch (err) {
    check(`run finished without exceptions`, false, err.message);
    console.error(appLog.slice(-3000));
  } finally {
    await browser.close();
    stopApp();
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}

main();
