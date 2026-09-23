require('dotenv').config();
const path = require('path');
const express = require('express');
const { searchPlaces } = require('./placesClient');
const { checkWebsite } = require('./websiteCheck');
const { upsertBusiness, setManualStatus, getBusiness, markPushed } = require('./db');
const { toUsE164, pushToCrm, fetchCrmSources } = require('./crmPush');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const CRM_API_URL = process.env.CRM_API_URL;
const CRM_LEADS_SECRET = process.env.CRM_LEADS_SECRET;
const CRM_LEAD_SOURCE = process.env.CRM_LEAD_SOURCE || 'US';

app.post('/api/search', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: 'Server is missing GOOGLE_PLACES_API_KEY. Set it in .env and restart.',
    });
  }

  const { category, location, pageToken } = req.body || {};

  if (!pageToken && (!category || !location)) {
    return res.status(400).json({ error: 'category and location are required.' });
  }

  const query = pageToken ? undefined : `${category} in ${location}`;

  try {
    const { places: allPlaces, nextPageToken } = await searchPlaces({ apiKey: API_KEY, query, pageToken });

    // A lead with no phone number can't be called or WhatsApp'd from the
    // CRM, so it's not usable here -- drop it before spending a website
    // fetch on it, not just at push time.
    const places = allPlaces.filter((p) => p.phone && p.phone.trim());

    const checked = await Promise.all(
      places.map(async (p) => {
        const { flag, reason } = await checkWebsite(p.website);
        const row = {
          place_id: p.placeId,
          name: p.name,
          phone: p.phone,
          address: p.address,
          website: p.website,
          rating: p.rating,
          rating_count: p.ratingCount,
          business_status: p.businessStatus,
          auto_flag: flag,
          auto_reason: reason,
          last_query: query || null,
          last_seen_at: new Date().toISOString(),
        };
        upsertBusiness(row);
        const stored = getBusiness(p.placeId);
        return stored;
      })
    );

    res.json({ results: checked, nextPageToken });
  } catch (err) {
    console.error(err);
    res.status(err.status === 400 ? 400 : 502).json({ error: err.message });
  }
});

app.post('/api/mark', (req, res) => {
  const { placeId, status } = req.body || {};
  const allowed = ['needs_website', 'looks_fine', null];

  if (!placeId || !allowed.includes(status ?? null)) {
    return res.status(400).json({ error: 'placeId and a valid status are required.' });
  }

  setManualStatus(placeId, status ?? null);
  res.json({ ok: true, business: getBusiness(placeId) });
});

app.get('/api/crm-config', (req, res) => {
  res.json({
    configured: Boolean(CRM_API_URL && CRM_LEADS_SECRET),
    defaultSource: CRM_LEAD_SOURCE,
  });
});

app.get('/api/crm-sources', async (req, res) => {
  try {
    const sources = await fetchCrmSources({ apiUrl: CRM_API_URL, secret: CRM_LEADS_SECRET });
    res.json({ sources });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/push-to-crm', async (req, res) => {
  const { placeIds, source } = req.body || {};
  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    return res.status(400).json({ error: 'placeIds (non-empty array) is required.' });
  }
  const trimmedSource = String(source || '').trim();
  if (!trimmedSource) {
    return res.status(400).json({ error: 'source is required (pick an existing one or type a new one).' });
  }

  const businesses = placeIds.map((id) => getBusiness(id)).filter(Boolean);
  if (businesses.length === 0) {
    return res.status(404).json({ error: 'None of the given placeIds are in the local database.' });
  }

  // Map by the same normalized phone the CRM will see back in its response,
  // so we know exactly which local rows to mark as pushed.
  const phoneToPlaceId = new Map();
  for (const b of businesses) {
    const e164 = toUsE164(b.phone);
    if (e164) phoneToPlaceId.set(e164, b.place_id);
  }

  try {
    const result = await pushToCrm({
      apiUrl: CRM_API_URL,
      secret: CRM_LEADS_SECRET,
      source: trimmedSource,
      businesses,
    });

    const now = new Date().toISOString();
    for (const r of result.results || []) {
      if (r.status !== 'created') continue;
      const placeId = phoneToPlaceId.get(r.phone);
      if (placeId) markPushed(placeId, now);
    }

    const updated = businesses
      .map((b) => getBusiness(b.place_id))
      .reduce((map, b) => ({ ...map, [b.place_id]: b }), {});

    res.json({ ...result, updatedBusinesses: updated });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Local Leads Finder running on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('WARNING: GOOGLE_PLACES_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
