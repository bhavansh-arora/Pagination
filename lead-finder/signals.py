"""Extra signals about a business that sit unused in Google listings and public records.

- placeholder websites: the "website" on the listing is really a Facebook page, a link-in-bio
  page, or a free subdomain (including Google's own business.site pages, which Google shut down)
- review insights: a warm quote to open with, and complaints about the website, booking or phones
- domain records: when the domain was registered and when it expires (public RDAP data)
"""

import datetime
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import requests

USER_AGENT = "LeadFinder/1.0 (small-business website research)"

# Hosts that mean "this business doesn't really have its own website".
PLACEHOLDER_HOSTS = {
    "facebook.com": "a Facebook page", "m.facebook.com": "a Facebook page", "fb.com": "a Facebook page",
    "instagram.com": "an Instagram profile", "linktr.ee": "a Linktree page", "linkin.bio": "a link-in-bio page",
    "beacons.ai": "a link-in-bio page", "bio.link": "a link-in-bio page", "taplink.cc": "a link-in-bio page",
    "carrd.co": "a one-page Carrd site", "msha.ke": "a link-in-bio page", "yelp.com": "their Yelp page",
    "booksy.com": "their Booksy booking page", "vagaro.com": "their Vagaro booking page",
    "square.site": "a free Square page", "squareup.com": "a Square page", "linkedin.com": "a LinkedIn page",
}
# Free subdomains: "joesplumbing.wixsite.com" and the like.
PLACEHOLDER_SUFFIXES = {
    ".business.site": "a Google Business Profile website, which Google shut down in 2024",
    ".wixsite.com": "a free Wix subdomain", ".godaddysites.com": "a free GoDaddy subdomain",
    ".square.site": "a free Square subdomain", ".weebly.com": "a free Weebly subdomain",
    ".wordpress.com": "a free WordPress.com subdomain", ".blogspot.com": "a Blogspot blog",
    ".mystrikingly.com": "a free Strikingly subdomain", ".webnode.page": "a free Webnode subdomain",
    ".jimdosite.com": "a free Jimdo subdomain", ".site123.me": "a free Site123 subdomain",
    ".carrd.co": "a one-page Carrd site", ".sites.google.com": "a free Google Sites page",
}


def placeholder_kind(url):
    """Describe the placeholder if this 'website' isn't a real business website, else ''."""
    if not url:
        return ""
    p = urlparse(url if "://" in url else "http://" + url)
    host = p.netloc.lower().removeprefix("www.")
    if host == "sites.google.com":
        return "a free Google Sites page"
    if host in PLACEHOLDER_HOSTS:
        return PLACEHOLDER_HOSTS[host]
    for suffix, kind in PLACEHOLDER_SUFFIXES.items():
        if host.endswith(suffix):
            return kind
    return ""


# ---------------------------------------------------------------- reviews

COMPLAINT_PATTERNS = [
    ("website", r"\b(web ?site|web page|online)\b[^.!?]{0,80}\b(confus|broken|down|outdated|hard|difficult|doesn'?t work|didn'?t work|wrong|not work|couldn'?t|could not|useless|old)"),
    ("booking", r"\b(couldn'?t|could not|no way to|unable to|can'?t|hard to)\b[^.!?]{0,40}\b(book|schedule|make an appointment|reserve)"),
    ("phone", r"\b(no one|nobody|never)\b[^.!?]{0,30}\b(answer|picks? up|call(ed)? back|returned my call)"),
    ("hours", r"\b(hours|times)\b[^.!?]{0,40}\b(wrong|incorrect|outdated|not accurate|weren'?t accurate)"),
]


def _first_sentences(text, max_len=160):
    text = re.sub(r"\s+", " ", text or "").strip()
    out = ""
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if len(out) + len(sentence) > max_len:
            break
        out = (out + " " + sentence).strip()
    return out or (text[:max_len].rsplit(" ", 1)[0] + "..." if len(text) > max_len else text)


def review_insights(reviews):
    """reviews: list of {"rating", "text", "when"}. Returns a quote to open with and any complaints."""
    quote, complaints = "", []
    good = [r for r in reviews if (r.get("rating") or 0) >= 5 and 40 <= len(r.get("text") or "") <= 600]
    if good:
        quote = _first_sentences(good[0]["text"])
    for r in reviews:
        text = r.get("text") or ""
        for kind, pattern in COMPLAINT_PATTERNS:
            m = re.search(pattern, text, re.I)
            if m:
                start = max(0, text.rfind(".", 0, m.start()) + 1)
                end = text.find(".", m.end())
                complaints.append({"kind": kind, "text": text[start:end if end > 0 else None].strip()[:200],
                                   "when": r.get("when", "")})
                break
    return {"quote": quote, "complaints": complaints}


# ---------------------------------------------------------------- domain records

_BOOTSTRAP = {}


def _rdap_server(tld):
    if not _BOOTSTRAP:
        try:
            data = requests.get("https://data.iana.org/rdap/dns.json", timeout=20).json()
            for tlds, urls in data.get("services", []):
                for t in tlds:
                    _BOOTSTRAP[t.lower()] = urls[0].rstrip("/") + "/"
        except (requests.RequestException, ValueError):
            _BOOTSTRAP["_failed"] = ""
    return _BOOTSTRAP.get(tld.lower(), "")


def _registered_domain(url):
    host = urlparse(url if "://" in url else "http://" + url).netloc.lower().removeprefix("www.").split(":")[0]
    parts = host.split(".")
    if len(parts) >= 3 and parts[-2] in ("co", "com", "net", "org", "gov", "ac", "edu") and len(parts[-1]) == 2:
        return ".".join(parts[-3:])  # e.g. example.co.uk, example.com.au
    return ".".join(parts[-2:])


def domain_info(url):
    """{"domain", "created", "expires", "age_years", "expires_in_days"} from public RDAP records, or {}."""
    domain = _registered_domain(url)
    if "." not in domain or re.fullmatch(r"[\d.]+", domain):
        return {}
    server = _rdap_server(domain.rsplit(".", 1)[1])
    if not server:
        return {}
    try:
        resp = requests.get(server + "domain/" + domain, timeout=20,
                            headers={"Accept": "application/rdap+json", "User-Agent": USER_AGENT})
        if resp.status_code != 200:
            return {}
        data = resp.json()
    except (requests.RequestException, ValueError):
        return {}
    dates = {}
    for ev in data.get("events", []):
        action, when = ev.get("eventAction", ""), ev.get("eventDate", "")
        try:
            d = datetime.datetime.fromisoformat(when.replace("Z", "+00:00")).date()
        except ValueError:
            continue
        if action == "registration":
            dates["created"] = d
        elif action == "expiration":
            dates["expires"] = d
    today = datetime.date.today()
    info = {"domain": domain}
    if "created" in dates:
        info["created"] = dates["created"].isoformat()
        info["age_years"] = round((today - dates["created"]).days / 365.25, 1)
    if "expires" in dates:
        info["expires"] = dates["expires"].isoformat()
        info["expires_in_days"] = (dates["expires"] - today).days
    return info


def domain_info_many(urls, workers=6):
    with ThreadPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(domain_info, urls))
