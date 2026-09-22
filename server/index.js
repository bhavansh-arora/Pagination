require('dotenv').config();
const path = require('path');
const express = require('express');
const { searchPlaces } = require('./placesClient');
const { checkWebsite } = require('./websiteCheck');
const { upsertBusiness, setManualStatus, getBusiness } = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

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
    const { places, nextPageToken } = await searchPlaces({ apiKey: API_KEY, query, pageToken });

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

app.listen(PORT, () => {
  console.log(`Local Leads Finder running on http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn('WARNING: GOOGLE_PLACES_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
});
