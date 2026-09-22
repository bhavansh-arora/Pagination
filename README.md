# Local Leads Finder

Find local businesses by category + location (e.g. "salon" in "Bhopal") using the
**Google Places API**, and flag the ones that don't have a website or have a weak one —
so you can pitch them web design / dev services.

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
- Toggle **"Show only flagged"** to hide businesses that already look fine.
- Click **Open site →** to visit a business's website yourself, then mark it **Needs
  site** or **Looks fine** — this overrides the auto-suggestion and is saved.
- Click **Export CSV** to download the currently visible rows (business name, phone,
  address, website, auto suggestion, manual status).

## Notes / limits

- The "bad website" auto-check is a heuristic (no website / only a Facebook-Instagram
  page / unreachable / broken / no HTTPS / near-empty placeholder page). It's a starting
  point, not a guarantee — always eyeball the site before pitching.
- Google Places API pricing: Text Search has a monthly free credit; beyond that it's
  billed per request. Keep an eye on usage in the Cloud Console if you run large searches.
- Data persists locally in `data/leads.sqlite` (gitignored) — manual marks stick even if
  you re-run the same search later.
