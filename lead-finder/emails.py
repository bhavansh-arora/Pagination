"""Find the public contact emails a business lists on its own website.

Visits the homepage plus up to a few contact/about pages, and reads emails from
mailto links, page text, hidden Cloudflare-protected addresses, and common
disguises like "info [at] example [dot] com". Also picks up phone numbers,
social profiles and whether the site has a contact form.
"""

import html
import re
from concurrent.futures import ThreadPoolExecutor
from urllib import robotparser
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (compatible; LeadFinder/1.0; small-business website research)"
TIMEOUT = 15
MAX_EXTRA_PAGES = 5

CONTACT_WORDS = re.compile(
    r"contact|about|team|staff|people|our-?story|impressum|kontakt|get-?in-?touch|reach|location|appointment|book",
    re.I,
)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}")
OBFUSCATED_RE = re.compile(
    r"([A-Za-z0-9._%+\-]+)\s*(?:\[\s*at\s*\]|\(\s*at\s*\)|\{\s*at\s*\}|\s+at\s+)\s*"
    r"([A-Za-z0-9\-]+(?:\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+|\.)\s*[A-Za-z0-9\-]+)+)",
    re.I,
)
DOT_RE = re.compile(r"\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\{\s*dot\s*\}|\s+dot\s+)\s*", re.I)

JUNK_ENDINGS = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js", ".ico", ".avif", ".woff", ".woff2")
JUNK_DOMAINS = (
    "example.com", "example.org", "domain.com", "yourdomain.com", "email.com", "sentry.io", "sentry-next.wixpress.com",
    "wixpress.com", "sentry.wixpress.com", "godaddy.com", "squarespace.com", "wordpress.com", "w3.org",
    "schema.org", "yoursite.com", "website.com", "company.com", "mysite.com", "test.com",
)
JUNK_LOCAL = re.compile(r"^(?:[0-9a-f]{16,}|noreply|no-reply|donotreply|user|username|name|email|your-?email)$", re.I)
ROLE_LOCAL = re.compile(
    r"^(?:info|contact|hello|hi|office|admin|mail|enquiries|inquiries|enquiry|inquiry|support|sales|bookings?|"
    r"reception|team|appointments?|help|care|front-?desk)$",
    re.I,
)

SOCIAL_HOSTS = {
    "facebook.com": "facebook", "instagram.com": "instagram", "linkedin.com": "linkedin",
    "twitter.com": "x", "x.com": "x", "tiktok.com": "tiktok", "youtube.com": "youtube",
}


def _session():
    s = requests.Session()
    s.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en"})
    return s


def _decode_cfemail(encoded):
    try:
        key = int(encoded[:2], 16)
        return "".join(chr(int(encoded[i:i + 2], 16) ^ key) for i in range(2, len(encoded), 2))
    except ValueError:
        return ""


def _clean(email):
    email = html.unescape(email).strip().strip(".,;:'\"()<>[]").lower()
    email = email.split("?")[0]
    if email.startswith("mailto:"):
        email = email[7:]
    if not EMAIL_RE.fullmatch(email):
        return ""
    local, _, domain = email.partition("@")
    if email.endswith(JUNK_ENDINGS) or any(domain == d or domain.endswith("." + d) for d in JUNK_DOMAINS):
        return ""
    if JUNK_LOCAL.match(local) or "%" in local:
        return ""
    return email


def _emails_from_html(page_html):
    found = set()
    soup = BeautifulSoup(page_html, "html.parser")

    for a in soup.select('a[href^="mailto:" i]'):
        for part in a["href"][7:].split(","):
            e = _clean(part)
            if e:
                found.add(e)

    for el in soup.select("[data-cfemail]"):
        e = _clean(_decode_cfemail(el["data-cfemail"]))
        if e:
            found.add(e)
    for a in soup.select('a[href*="/cdn-cgi/l/email-protection#"]'):
        e = _clean(_decode_cfemail(a["href"].split("#", 1)[1]))
        if e:
            found.add(e)

    for script in soup(["script", "style", "noscript"]):
        script.decompose()
    text = soup.get_text(" ")
    for m in EMAIL_RE.findall(text):
        e = _clean(m)
        if e:
            found.add(e)
    for local, domain in OBFUSCATED_RE.findall(text):
        e = _clean(f"{local}@{DOT_RE.sub('.', domain)}")
        if e and "." in e.split("@")[1]:
            found.add(e)

    # Emails in raw HTML attributes (e.g. JSON-LD "email": "...").
    for m in EMAIL_RE.findall(page_html):
        e = _clean(m)
        if e:
            found.add(e)
    return found, soup


def _same_site(url, base_host):
    host = urlparse(url).netloc.lower().removeprefix("www.")
    return host == base_host


def _robots(session, base_url):
    rp = robotparser.RobotFileParser()
    try:
        r = session.get(urljoin(base_url, "/robots.txt"), timeout=TIMEOUT)
        rp.parse(r.text.splitlines() if r.status_code == 200 else [])
    except requests.RequestException:
        rp.parse([])
    return rp


def scrape_site(url):
    """Return a dict with emails, phones, socials and notes for one website."""
    result = {"website": url, "emails": [], "best_email": "", "phones": [], "socials": {}, "contact_form": False, "contact_page": "",
              "pages_checked": 0, "error": ""}
    if not url:
        result["error"] = "no website"
        return result
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    session = _session()
    try:
        home = session.get(url, timeout=TIMEOUT, allow_redirects=True)
        home.raise_for_status()
    except requests.RequestException as e:
        result["error"] = f"couldn't open site ({e.__class__.__name__})"
        return result

    final_url = home.url
    base_host = urlparse(final_url).netloc.lower().removeprefix("www.")
    rp = _robots(session, final_url)

    emails, soup = _emails_from_html(home.text)
    phones, socials = set(), {}
    pages = [(final_url, soup)]

    candidates = []
    for a in soup.find_all("a", href=True):
        href = urljoin(final_url, a["href"]).split("#")[0]
        label = (a.get_text(" ", strip=True) or "") + " " + href
        if _same_site(href, base_host) and CONTACT_WORDS.search(label) and href != final_url:
            if href not in candidates:
                candidates.append(href)

    for link in candidates[:MAX_EXTRA_PAGES]:
        if not rp.can_fetch(USER_AGENT, link):
            continue
        try:
            r = session.get(link, timeout=TIMEOUT)
            if r.ok and "html" in r.headers.get("content-type", "html"):
                more, s = _emails_from_html(r.text)
                emails |= more
                pages.append((r.url, s))
        except requests.RequestException:
            continue

    for page_url, s in pages:
        for a in s.find_all("a", href=True):
            href = a["href"].strip()
            if href.lower().startswith("tel:"):
                phones.add(re.sub(r"[^\d+]", "", href[4:]))
            host = urlparse(href).netloc.lower().removeprefix("www.")
            for social_host, name in SOCIAL_HOSTS.items():
                if host == social_host or host.endswith("." + social_host):
                    path = urlparse(href).path.strip("/")
                    if path and not path.startswith(("sharer", "share", "intent")):
                        socials.setdefault(name, href)
        if s.find("form") and (s.find("textarea") or s.find("input", {"type": "email"})):
            result["contact_form"] = True
            # Prefer a dedicated contact page over a form tucked into the homepage footer.
            if not result["contact_page"] or page_url != final_url:
                result["contact_page"] = page_url

    def rank(e):
        local, _, domain = e.partition("@")
        same = domain.removeprefix("www.") == base_host or base_host.endswith(domain)
        return (0 if same else 1, 0 if not ROLE_LOCAL.match(local) else 1, e)

    ordered = sorted(emails, key=rank)
    result.update({
        "website": final_url,
        "emails": ordered,
        "best_email": ordered[0] if ordered else "",
        "phones": sorted(p for p in phones if len(p) >= 7),
        "socials": socials,
        "pages_checked": len(pages),
    })
    return result


def scrape_many(urls, workers=8, progress=None):
    results = [None] * len(urls)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(scrape_site, u): i for i, u in enumerate(urls)}
        for n, fut in enumerate(futures, 1):
            i = futures[fut]
            results[i] = fut.result()
            if progress:
                progress(n, len(urls), results[i])
    return results
