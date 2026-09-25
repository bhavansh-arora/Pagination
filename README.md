# Local Leads Finder

Find local businesses by category + location (e.g. "salon" in "Bhopal") using the
**Google Places API**, and flag the ones that don't have a website or have a weak one —
so you can pitch them web design / dev services. Only businesses with a phone number
are ever shown — no way to call or message means no usable lead here.

Two layers of "needs a website" review:

1. **Auto-suggested** — the server checks each business's website field and, if present,
   fetches the site (timeout, HTTPS check, placeholder/thin-page check, social-media-only
   check) and tags it automatically.
2. **Manual review** — click "Open site →" to actually look at it yourself, then click
   **Needs site** or **Looks fine** to record your own call. Manual marks always win over
   the auto-suggestion and persist across future searches (stored in a local SQLite file).

Data source is Google's official Places API — not scraping Google Maps directly, which
violates Google's Terms of Service and gets IPs blocked quickly. The Places API is the
legitimate, reliable way to get this data and includes a monthly free usage credit.

## Setup

1. Get a Google Places API key:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/), create/select a project.
   - Enable **"Places API (New)"**.
   - Create an API key (Credentials → Create Credentials → API key). For safety, restrict it
     to the Places API.
2. Copy the env file and add your key:
   ```bash
   cp .env.example .env
   # edit .env and set GOOGLE_PLACES_API_KEY=...
   ```
3. Install dependencies and start the server:
   ```bash
   npm install
   npm start
   ```
4. Open http://localhost:3000

## Using it

- Enter a category (e.g. `salon`, `dentist`, `gym`) and a location (e.g. `Bhopal`,
  `Indore MP`), then **Search**. Results come back with name, phone, address, rating,
  website (if any), and an auto-suggestion badge.
- Click **Load more results** to page through further results (Google returns up to
  ~60 per search, in pages of 20).
- Toggle **🚀 Boost Mode** to narrow the table down to only businesses with no
  website or a weak one — hides anything that already looks fine.
- Click **Open site →** to visit a business's website yourself, then mark it **Needs
  site** or **Looks fine** — this overrides the auto-suggestion and is saved.
- Click **Export CSV** to download the currently visible rows (business name, phone,
  address, website, auto suggestion, manual status).
- Tick the checkbox on each row you want to send (or the header checkbox to select
  everything currently visible), pick a **lead source** from the dropdown — it's
  populated live from the CRM's actual Lead Sources, or choose **+ Add new source…**
  and type one to create it on the fly — then click **Push selected to CRM**. Only
  the rows you checked are sent, tagged with the source you picked, phone numbers
  normalized to full E.164 (`+<country code><number>`) -- trusting Google's own
  international format when it has one (any country), falling back to a bare
  10-digit number being assumed US (`+1XXXXXXXXXX`) only when it doesn't. Pushing
  is safe to repeat — leads already in the CRM (matched by phone, regardless of
  which format either side used) are skipped, not duplicated, and pushed rows
  show a **✓ In CRM** marker.

## Deploying on the VPS (alongside the CRM)

This app is a single lightweight Node/Express process with a local SQLite file —
no separate database service needed. It's designed to run as a second, independent
Docker Compose project on the same VPS as the CRM, sharing the CRM's Caddy
instance for HTTPS (only one process can bind ports 80/443 on the host, so we
reuse the CRM's Caddy rather than running a second one).

1. On the VPS, clone this repo next to the CRM (e.g. `/opt/leads-finder`):
   ```bash
   cd /opt
   git clone -b claude/nifty-wozniak-sx5pry https://github.com/bhavansh-arora/pagination.git leads-finder
   cd leads-finder
   cp .env.example .env
   nano .env   # set GOOGLE_PLACES_API_KEY, and CRM_LEADS_SECRET to match the
               # CRM's EXTERNAL_LEADS_SECRET if you want "Push to CRM" to work
   ```
2. Confirm the CRM's Docker network name (docker-compose.yml here assumes the
   default `crm_default`, i.e. the CRM lives in `/opt/crm`):
   ```bash
   docker network ls | grep default
   ```
   If it's named differently, edit the `networks.crm_default` line in this
   repo's `docker-compose.yml` to match before continuing.
3. Build and start:
   ```bash
   docker compose up -d --build
   ```
4. Point a subdomain at this app by adding a block to the CRM's `/opt/crm/Caddyfile`
   (adjust the subdomain to whatever DNS record you create, e.g. `leads.codebunny.net`):
   ```
   leads.codebunny.net {
       reverse_proxy leads-finder-leads-app-1:3000
   }
   ```
   Then reload Caddy from the CRM directory: `cd /opt/crm && docker compose restart caddy`.
   (Get the exact container name first with `docker ps --filter name=leads-finder` -- it's
   `leads-app`, not `app`, specifically so it can't collide with the CRM's own "app"
   service name once both share the same Docker network.)
5. Add the DNS A record for that subdomain pointing at the VPS's IP, then visit it —
   Caddy will provision a Let's Encrypt certificate automatically.

To redeploy after a `git pull`, just run `docker compose up -d --build` again from
`/opt/leads-finder` — the SQLite data lives in the `leads-data` Docker volume and
persists across rebuilds.

## Notes / limits

- The "bad website" auto-check is a heuristic (no website / only a Facebook-Instagram
  page / unreachable / broken / no HTTPS / near-empty placeholder page). It's a starting
  point, not a guarantee — always eyeball the site before pitching.
- Google Places API pricing: Text Search has a monthly free credit; beyond that it's
  billed per request. Keep an eye on usage in the Cloud Console if you run large searches.
- Data persists locally in `data/leads.sqlite` (gitignored) — manual marks stick even if
  you re-run the same search later.
