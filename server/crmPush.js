// placesClient.js requests internationalPhoneNumber preferentially, which
// Google returns pre-formatted with a real country code whenever it has
// one (e.g. "+91 98765 43210" for India, "+1 555-123-4567" for the US) --
// trust that as-is rather than guessing. It only falls back to
// nationalPhoneNumber (no country code, format unknown) when international
// isn't available; that case can't be confidently assigned a country from
// the digits alone, so it keeps this tool's original US-only assumption
// (a bare 10-digit number) rather than guessing wrong for other countries.
function toE164(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) {
    // E.164 numbers are 8-15 digits total (country code + subscriber number).
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  let nationalDigits = digits;
  if (nationalDigits.length === 11 && nationalDigits.startsWith("1")) {
    nationalDigits = nationalDigits.slice(1);
  }
  if (nationalDigits.length !== 10) return null;
  return `+1${nationalDigits}`;
}

async function pushToCrm({ apiUrl, secret, source, businesses }) {
  if (!apiUrl || !secret) {
    const err = new Error(
      "CRM_API_URL and CRM_LEADS_SECRET must both be set in .env to push leads to the CRM."
    );
    err.status = 500;
    throw err;
  }

  const leads = [];
  const skippedNoPhone = [];
  for (const b of businesses) {
    const phone = toE164(b.phone);
    if (!phone) {
      skippedNoPhone.push(b.place_id);
      continue;
    }
    leads.push({ name: b.name, phone, website: b.website || undefined });
  }

  if (leads.length === 0) {
    return { created: 0, duplicate: 0, results: [], skippedNoPhone };
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/external/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ source, leads }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `CRM rejected the push (HTTP ${res.status})`);
    err.status = 502;
    throw err;
  }

  return { ...data, skippedNoPhone };
}

async function fetchCrmSources({ apiUrl, secret }) {
  if (!apiUrl || !secret) {
    const err = new Error(
      "CRM_API_URL and CRM_LEADS_SECRET must both be set in .env to load CRM lead sources."
    );
    err.status = 500;
    throw err;
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/external/sources`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || `CRM rejected the request (HTTP ${res.status})`);
    err.status = 502;
    throw err;
  }
  return data.sources || [];
}

module.exports = { toE164, pushToCrm, fetchCrmSources };
