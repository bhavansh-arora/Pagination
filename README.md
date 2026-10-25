# Mindclone

A studio for coaches to build an AI "mind" of themselves. Coaches train it on their own material (files, web links and written notes), describe their philosophy and voice, then share a link. Clients get a ChatGPT-style chat that answers in the coach's voice, grounded in the coach's content. Platform admins manage coaches, minds, invites, limits and AI spend.

## Features

**Admin panel (`/admin`)**
- **Overview**: coaches, minds, AI replies and estimated Claude cost (30 days), a replies-per-day chart, the most active minds and the newest coaches
- **Coaches**: search and filter; add an account directly (password generated for you); per-coach page with usage, minds, active sessions; suspend / reactivate, make or remove admin, reset password, edit name and email, delete the account with everything it owns
- **Minds**: every mind on the platform; open any mind in the studio (shown in "admin mode", and every change is logged), view its chat, publish / unpublish, delete
- **Invites**: single-use invite links, optionally locked to one email, with an expiry
- **Settings**: sign-up mode (open / invite only / closed), max minds per coach, client message rate limit; server status (API key, data size, uptime)
- **Activity log**: every admin action

When a coach is suspended, they're signed out everywhere, can't sign in, and their minds go offline.

**Coach studio (`/dashboard`)**
- Multiple minds per coach; account page to change name, email and password
- **Identity**, **Mind & voice**, **Knowledge** (PDF, DOCX, TXT, MD, CSV, HTML, subtitles, web links, notes), **Client experience**, **AI engine** (Claude Opus 5.5 / Sonnet 5.5 / Haiku 5.5), **Publish & share** (public link or access code, custom link, embed snippet), **Conversations**
- Live test chat beside every screen; changes save automatically

**Client chat (`/c/<link>`)**
- ChatGPT-style chat with streaming replies, conversation history, stop / copy / regenerate; works on mobile

## How the "mind" works

- The persona prompt is built from the coach's identity, philosophy, voice, instructions and boundaries. Safety guardrails are always on: it is honest about being an AI if sincerely asked, refers people to professionals for medical, legal and financial questions, and responds to crisis situations.
- **Full memory**: libraries under about 600k characters (roughly 100k words) go into the system prompt behind a prompt-cache breakpoint, so the mind reads everything on every message while cached tokens stay cheap.
- **Smart recall**: larger libraries are chunked and ranked with BM25; the best passages are attached to the client's message.
- Server-side refusal fallback (`fallbacks: "default"`) is enabled for Opus and Sonnet. Token usage is recorded per mind per day for the admin cost estimates.

---

## Deploying on a VPS

You need a Linux VPS (1 vCPU / 1 GB RAM is enough to start), a domain, and an [Anthropic API key](https://console.anthropic.com).

1. **Point your domain at the server.** Create a DNS `A` record (e.g. `mindclone.yourdomain.com`) with the VPS IP address.
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
sudo git clone <your-repo-url> /opt/mindclone && cd /opt/mindclone

# 3. Configure: set ANTHROPIC_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DOMAIN
sudo cp .env.example .env && sudo nano .env

# 4. Start
sudo docker compose up -d --build
```

Open `https://<your DOMAIN>`, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, and you'll land in `/admin`. Change the admin password under **My studio → Account**. Restarting won't reset it: the env password is only used when the account is first created.

| Task | Command (run in `/opt/mindclone`) |
|---|---|
| Update to the latest code | `sudo git pull && sudo docker compose up -d --build` |
| Logs | `sudo docker compose logs -f app` |
| Restart | `sudo docker compose restart app` |
| Back up now | `sudo ./deploy/backup.sh` (writes to `./backups`, keeps 14) |
| Nightly backups (3am) | add `0 3 * * * cd /opt/mindclone && ./deploy/backup.sh` to `sudo crontab -e` |
| Locked out of admin | `sudo docker compose exec app node scripts/admin.mjs reset-password you@example.com 'new-password'` |
| List accounts | `sudo docker compose exec app node scripts/admin.mjs list` |

Data lives in the Docker volume `<folder>_mindclone-data` (see `docker volume ls`). To restore a backup:

```bash
sudo docker compose stop app
sudo docker run --rm -v mindclone_mindclone-data:/app/data -v "$PWD/backups":/b alpine \
  sh -c 'rm -rf /app/data/* && tar xzf /b/mindclone-YYYYMMDD-HHMMSS.tar.gz -C /app'
sudo docker compose start app
```

### Option B: Node.js + nginx + systemd (no Docker)

```bash
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs nginx certbot python3-certbot-nginx

# App user and code
sudo useradd --system --create-home --shell /usr/sbin/nologin mindclone
sudo git clone <your-repo-url> /opt/mindclone && cd /opt/mindclone
sudo cp .env.example .env && sudo nano .env        # set the required values (DOMAIN is unused here)
sudo chown -R mindclone:mindclone /opt/mindclone
sudo -u mindclone npm ci && sudo -u mindclone npm run build

# Service
sudo cp deploy/mindclone.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now mindclone

# nginx + HTTPS (edit server_name in the file first)
sudo cp deploy/nginx.conf /etc/nginx/sites-available/mindclone
sudo ln -s /etc/nginx/sites-available/mindclone /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mindclone.yourdomain.com
```

Update: `cd /opt/mindclone && sudo -u mindclone git pull && sudo -u mindclone npm ci && sudo -u mindclone npm run build && sudo systemctl restart mindclone`.
Logs: `journalctl -u mindclone -f`. Recovery: `sudo -u mindclone node scripts/admin.mjs reset-password you@example.com 'new-password'`. Backups: same `deploy/backup.sh` (it archives `./data`).

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

## Security notes

- Passwords are hashed with scrypt. Sessions are random tokens, stored hashed, in an httpOnly cookie. The cookie is marked `Secure` automatically behind HTTPS.
- Changing or resetting a password, and suspending an account, sign that account out everywhere.
- Admin APIs check the admin role on every request. Admin edits to other coaches' minds go to the activity log.
- Link imports go through `src/lib/safe-fetch.ts`, which blocks private, loopback and link-local addresses: it checks every DNS answer at connect time and re-checks every redirect.
- Login, sign-up and chat are rate limited per IP. The provided proxy configs overwrite `X-Forwarded-For`, so clients can't spoof their IP.
