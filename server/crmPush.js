// Businesses found here are US-only (that's what this tool searches), but
// Google Places' phone field isn't always in full international format --
// some come back as a bare 10-digit national number. The CRM's own tel:
// link logic defaults ambiguous 10-digit numbers to India's +91 (it's built
// for an India-based sales team), which would be wrong here. So this
// normalizes to +1 explicitly before handing numbers off, rather than
// relying on the CRM's default.
function toUsE164(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  return `+1${digits}`;
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
    const phone = toUsE164(b.phone);
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

module.exports = { toUsE164, pushToCrm, fetchCrmSources };
