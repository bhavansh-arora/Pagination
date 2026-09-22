const SOCIAL_ONLY_HOSTS = [
  'facebook.com',
  'instagram.com',
  'wa.me',
  'api.whatsapp.com',
  'linktr.ee',
  'business.google.com',
  'g.page',
  'goo.gl',
];

const FETCH_TIMEOUT_MS = 6000;

function classifyNoWebsite() {
  return { flag: 'no_website', reason: 'No website listed on their Google Business profile.' };
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function checkWebsite(url) {
  if (!url) return classifyNoWebsite();

  const host = hostnameOf(url);
  if (host && SOCIAL_ONLY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    return { flag: 'social_only', reason: `Only a ${host} page, no real website.` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LocalLeadsFinder/1.0)' },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return { flag: 'broken', reason: `Website returned HTTP ${res.status}.` };
    }

    const finalHost = hostnameOf(res.url) || host;
    if (finalHost && SOCIAL_ONLY_HOSTS.some((h) => finalHost === h || finalHost.endsWith(`.${h}`))) {
      return { flag: 'social_only', reason: `Redirects to ${finalHost}, no real website.` };
    }

    const usedHttps = res.url ? res.url.startsWith('https://') : url.startsWith('https://');

    const contentType = res.headers.get('content-type') || '';
    let bodySample = '';
    if (contentType.includes('text/html')) {
      const text = await res.text();
      bodySample = text.slice(0, 20000);
    }

    if (!usedHttps) {
      return { flag: 'no_ssl', reason: 'Site does not use HTTPS.' };
    }

    if (bodySample) {
      const titleMatch = bodySample.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const visibleLength = bodySample.replace(/<[^>]+>/g, '').trim().length;

      if (!title || visibleLength < 200) {
        return { flag: 'minimal', reason: 'Page looks like a placeholder / almost no content.' };
      }
    }

    return { flag: 'ok', reason: 'Website loaded fine (auto-check only, review manually).' };
  } catch (err) {
    const reason =
      err.name === 'AbortError'
        ? 'Website timed out / did not respond.'
        : `Website unreachable (${err.code || err.message}).`;
    return { flag: 'unreachable', reason };
  }
}

module.exports = { checkWebsite };
