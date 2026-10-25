# Sagely

A platform where coaches build an AI "mind" of themselves, trained on their own material, and sell access to it. It has a marketing website and three panels:

| Panel | URL | Who |
|---|---|---|
| **Website** | `/`, `/apply` | Visitors. Landing page with a live demo, earnings calculator, plans and FAQ. The coach application form is used when sign-ups are invite-only. |
| **Admin** | `/admin` | You. Analytics, revenue, coach onboarding, plans and fees, platform settings. |
| **Coach studio** | `/dashboard` | Coaches. Build minds, set pricing, connect payouts, see earnings, upgrade their plan. |
| **Client app** | `/c/<link>`, `/me` | Clients. ChatGPT-style chat with free trial and paywall, plus their own account with memberships, credits, billing and history. |

## Brand

The product is called **Sagely** ("ai minds"). The logo is a gold speech bubble with a spark on a near-black tile: `LogoMark` / `Logo` in `src/components/brand.tsx`, favicon `src/app/icon.svg`, iOS icon `src/app/apple-icon.png`. The website uses Inter Tight with Instrument Serif italics, near-black `#0d0b09`, cream `#f3ecdf` and gold `#d6b57f` (tokens in `src/app/globals.css`). Fonts are self-hosted through `@fontsource`, so builds need no font downloads.

## Features

**Admin panel (`/admin`)**
- **Overview**: coaches, minds, AI replies and estimated Claude cost, client sales, platform revenue, MRR, clients, plus an alert when applications are waiting
- **Revenue**: client sales (GMV), commission, coach-plan revenue, MRR, platform revenue per day, top coaches, coaches per plan, and a full payment ledger
- **AI usage & cost**: Claude spend for 7, 30 or 90 days, split between clients and coach testing.
  - **Monthly budget**: a progress bar and month-end projection, with warnings at 80% and when you go over (also shown on the Overview).
  - **Breakdowns**: cost per day against the budget, by model, and the most expensive minds.
  - **Cost vs. revenue per coach**: flags coaches who cost more in AI than they bring in.
  - **CSV export** of daily usage.
  - Cost is calculated per reply from Anthropic's token counts at list prices, including prompt caching, Haiku's long-prompt rate and fallback models. Check it against your Anthropic invoice.
- **Coach onboarding**: application queue (approving one creates a personal sign-up link), an onboarding funnel from "applied" to "first sale", and each coach's progress with their next step
- **Coaches**: add accounts, suspend or reactivate, make admin, reset passwords, edit, delete
- **Minds**: every mind on the platform; open any of them in the studio (changes are logged), publish or unpublish, delete
- **Invites** (emailed automatically when an address is given), **Plans & fees** (price, commission %, mind limit, **monthly AI reply limit**, features, default plan, Stripe connection and webhook setup), **Settings** (sign-up mode, business name and support email, demo mind, rate limit, email status), **Activity log**

**Coach studio (`/dashboard`)**
- A getting-started checklist: create a mind → add knowledge → publish → connect payouts → set pricing → first client conversation
- **Interview me**: the coach answers 8 questions (as on a podcast), and Claude drafts their tagline, bio, philosophy, coaching rules, boundaries, welcome message, starters and tone, plus a knowledge note on their method. The coach reviews and ticks what to apply. New minds open on this tab.
- Mind editor: Identity, Mind & voice, Knowledge (files, links, notes), Client experience (including the **Memory** switch), AI engine, **Monetization**, Publish & share, Conversations, with a live test chat beside every screen
- **Conversations & feedback**: client 👍/👎 ratings, a "Needs work" filter, what the mind remembers about each client, recent opening questions. **Improve this answer** stores the coach's version and adds it to a "Corrections" knowledge source, so the mind answers that way from then on.
- **Usage meter**: AI replies used this month against the plan's limit. The coach gets an email at 80% and 100%; at 100% their minds tell clients they'll be "back soon" until the month resets.
- **Website widget**: one `<script>` tag adds a floating chat bubble to any site (an inline iframe embed is also offered)
- **Monetization** per mind: keep it free, or paid with N free messages, then monthly and/or yearly membership and/or one-time message packs, in the coach's chosen currency. The editor shows what the coach keeps after the platform fee.
- **Earnings**: Stripe payouts onboarding and dashboard link, earnings, MRR, members, recent payments
- **Plan**: choose or upgrade the coach plan (Stripe Checkout); downgrades take effect at the end of the billing period
- **Account**: name, email, password

**Client app**
- Chat with streaming replies, conversation history, and a free-message counter ("2 free messages left · See plans")
- Paywall: create a free account (anonymous chats move into it), then pick yearly, monthly or a message pack, and pay with Stripe Checkout
- 👍/👎 on every reply, and "Forgot password?" by email
- **Memory**: when the coach has it on, the mind keeps short notes on each client's goals, situation and commitments, and follows up in later conversations. The notes are updated in the background by Claude Haiku 5.5 and placed after the prompt-cache breakpoint.
- `/me`: their coaches, memberships (renewal and cancellation status), message credits, payment history, Stripe's billing portal, **what each mind remembers (with "Forget this")**, **download my data** (JSON) and **delete my account** (cancels memberships, erases conversations and memory)

## How payments work

- **Stripe Connect (Express accounts).** Each coach connects their own Stripe account from **Earnings**. Client payments are *destination charges*: the money goes to the coach, and Stripe takes the platform's commission automatically (`application_fee_percent` for memberships, `application_fee_amount` for packs).
- **Platform revenue** has two streams, both set in **Admin → Plans & fees**:
  - coach plans, which are monthly subscriptions to the platform;
  - commission, a % of every client payment that depends on the coach's plan. By default: Starter is free with a 15% fee, Pro is $29/mo with 8%, Studio is $99/mo with 3%.
- **Webhooks** keep everything in sync: memberships, credits, coach plans, payout status and the payment ledger. Events are handled idempotently.
- **Refunds and disputes**: refunds show in the ledger and are taken out of revenue. A refunded message pack also loses the matching unused credits. Disputes are flagged.
- **Free-trial protection**: free messages are counted per person *and* per network (a salted hash of the IP, over the last 30 days), so clearing cookies or making a new account doesn't restart the trial. People sharing an office network share the trial.
- **Access rules for a paid mind**: an active membership gives unlimited messages. Otherwise the client uses their free messages first, then pack credits (one per reply). When none are left, the chat shows the paywall. The coach and admins can always test.

### Stripe setup

1. Create a Stripe account and enable **Connect** (Express accounts) under Settings → Connect.
2. Put the secret key in `.env` as `STRIPE_SECRET_KEY`.
3. Developers → Webhooks → add the endpoint `https://<your domain>/api/stripe/webhook`, listening to **your account and connected accounts**, with these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `account.updated`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Settings → Billing → **Customer portal**: turn it on (lets clients and coaches update cards, see invoices and cancel).
5. Restart the app. **Admin → Plans & fees** shows whether both keys are detected.

Use `sk_test_...` keys and Stripe's test cards first. Without Stripe keys everything else works, and minds can still be free.

### Email setup

Set `SMTP_URL` and `MAIL_FROM` in `.env`. Any SMTP provider works (Resend, Postmark, Amazon SES, Mailgun…), e.g. `SMTP_URL=smtps://resend:re_xxx@smtp.resend.com:465`. Emails sent:
- password resets (coaches and clients);
- application received, sent to the applicant and to the admins;
- approval with the personal sign-up link, and invites;
- welcome email for new coaches;
- warnings when a coach reaches 80% and 100% of their AI replies.

Without SMTP, everything still works: reset pages ask people to contact the admin, and approval and invite links are shown in the admin panel to copy.

In Stripe, also turn on its own customer emails (receipts and failed-payment emails) under Settings → Customer emails.

### Legal

`/legal/terms`, `/legal/privacy` and `/legal/refunds` are generated from the business name and support email in **Admin → Settings**, and describe what the product actually does. They're a starting point: have them reviewed by a lawyer for your country before launch.

## How the "mind" works

- The persona prompt is built from the coach's identity, philosophy, voice, instructions and boundaries. Safety guardrails are always on: it is honest about being an AI if sincerely asked, refers people to professionals for medical, legal and financial questions, and responds to crisis situations.
- **Full memory**: libraries under about 600k characters (roughly 100k words) go into the system prompt behind a prompt-cache breakpoint, so the mind reads everything on every message while cached tokens stay cheap.
- **Smart recall**: larger libraries are chunked and ranked with BM25; the best passages are attached to the client's message.
- Server-side refusal fallback (`fallbacks: "default"`) is enabled for Opus and Sonnet. Token usage is recorded per mind per day for the admin cost estimates.
- **Client memory** is added as a separate system block *after* the cache breakpoint, so personalising a reply doesn't invalidate the cached persona and knowledge.
- **Interview me** uses Claude Opus 5.5 structured outputs (a Zod schema), so the draft always comes back as valid fields.

---

## Deploying on a VPS

You need a Linux VPS (1 vCPU / 1 GB RAM is enough to start), a domain, and an [Anthropic API key](https://console.anthropic.com).

1. **Point your domain at the server.** Create a DNS `A` record (e.g. `sagely.yourdomain.com`) with the VPS IP address.
2. **Open the firewall** for SSH and web traffic:
   ```bash
   sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
   ```

### Option A: Docker (recommended)

Caddy sits in front of the app and gets and renews HTTPS certificates automatically.

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sudo sh

# 2. Get the code
sudo git clone -b claude/focused-franklin-n5r5ay https://github.com/bhavansh-arora/Pagination.git /opt/sagely && cd /opt/sagely

# 3. Configure: ANTHROPIC_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DOMAIN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
sudo cp .env.example .env && sudo nano .env

# 4. Start
sudo docker compose up -d --build
```

Open `https://<your DOMAIN>`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and you'll land in `/admin`. Change the admin password under **My studio → Account**. Restarting won't reset it: the env password is only used when the account is first created.

| Task | Command (run in `/opt/sagely`) |
|---|---|
| Update to the latest code | `sudo git pull && sudo docker compose up -d --build` |
| Logs | `sudo docker compose logs -f app` |
| Restart | `sudo docker compose restart app` |
| Back up now | `sudo ./deploy/backup.sh` (writes to `./backups`, keeps 14) |
| Nightly backups (3am) | add `0 3 * * * cd /opt/sagely && ./deploy/backup.sh` to `sudo crontab -e` |
| Locked out of admin | `sudo docker compose exec app node scripts/admin.mjs reset-password you@example.com 'new-password'` |
| List accounts | `sudo docker compose exec app node scripts/admin.mjs list` |

Data lives in the Docker volume `<folder>_sagely-data` (see `docker volume ls`). To restore a backup:

```bash
sudo docker compose stop app
sudo docker run --rm -v sagely_sagely-data:/app/data -v "$PWD/backups":/b alpine \
  sh -c 'rm -rf /app/data/* && tar xzf /b/sagely-YYYYMMDD-HHMMSS.tar.gz -C /app'
sudo docker compose start app
```

### Option B: Node.js + nginx + systemd (no Docker)

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# App user and code
sudo useradd --system --create-home --shell /usr/sbin/nologin sagely
sudo git clone <your-repo-url> /opt/sagely && cd /opt/sagely
sudo cp .env.example .env && sudo nano .env        # set the required values (DOMAIN is unused here)
sudo chown -R sagely:sagely /opt/sagely
sudo -u sagely npm ci && sudo -u sagely npm run build

# Service
sudo cp deploy/sagely.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now sagely

# nginx + HTTPS (edit server_name in the file first)
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sagely
sudo ln -s /etc/nginx/sites-available/sagely /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d sagely.yourdomain.com
```

Update: `cd /opt/sagely && sudo -u sagely git pull && sudo -u sagely npm ci && sudo -u sagely npm run build && sudo systemctl restart sagely`.
Logs: `journalctl -u sagely -f`. Recovery: `sudo -u sagely node scripts/admin.mjs reset-password you@example.com 'new-password'`. Backups: same `deploy/backup.sh` (it archives `./data`).

### Notes

- **Run one app instance.** Data is stored in files (`DATA_DIR`: one JSON database plus one text file per knowledge source), and writes are serialized inside a single process. All data access goes through `src/lib/db.ts`, so moving to Postgres later means changing only that file.
- The chat stream must not be buffered by proxies. The provided Caddy and nginx configs handle this.
- Health check: `GET /api/health`.

## Local development

```bash
cp .env.example .env.local   # set ANTHROPIC_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

## Testing

```bash
npm run build
npm run test:e2e
```

`tests/e2e/run.cjs` starts the production build against fake Anthropic, Stripe and SMTP servers (in `tests/mocks/`) and drives real browsers through the whole platform: apply → approval email → coach sign-up → Interview me → payouts → publish; free trial and trial-reset protection; client sign-up, pack purchase, ratings and memory; refund revoking credits; coach corrections; password reset by email; quota pause; the website widget; every admin page; the usage CSV; and account deletion. It needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).

## Security notes

- Passwords are hashed with scrypt. Sessions are random tokens, stored hashed, in an httpOnly cookie. The cookie is marked `Secure` automatically behind HTTPS.
- Changing or resetting a password, and suspending an account, sign that account out everywhere.
- Admin APIs check the admin role on every request. Admin edits to other coaches' minds go to the activity log.
- Link imports go through `src/lib/safe-fetch.ts`, which blocks private, loopback and link-local addresses: it checks every DNS answer at connect time and re-checks every redirect.
- Login, sign-up and chat are rate limited per IP. The provided proxy configs overwrite `X-Forwarded-For`, so clients can't spoof their IP.
- Pages can't be framed by other sites (clickjacking protection), except the public chat at `/c/…`, which the widget embeds. `nosniff`, a referrer policy and a permissions policy are set on every response.
- Password reset links are single-use, expire after an hour, and are stored hashed. Requesting one never reveals whether an email has an account.
- The data store keeps the database in memory in the single app process and writes it to disk atomically, batching writes. Edits made to the file from outside (e.g. `scripts/admin.mjs`) are detected and reloaded.
