"""Extra places to find leads, beyond OpenStreetMap.

google_places  Google's own business listings through the official Places API.
               The most complete list of local businesses, with star rating,
               review count, phone, and whether they have a website at all.
               Needs GOOGLE_PLACES_API_KEY.

web_footprints Searches the web (Brave Search API) for business websites that
               give themselves away as outdated: an old copyright year,
               "under construction", "best viewed in", old site builders.
               These are sites most lead lists never surface.
               Needs BRAVE_API_KEY.
"""

import datetime
import os
import re
import time
from urllib.parse import urlparse

import requests

from find import USER_AGENT, NOMINATIM_URL

THIS_YEAR = datetime.date.today().year

# Sites that list businesses but aren't the business's own website.
DIRECTORY_DOMAINS = (
    "yelp.", "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "youtube.com", "tiktok.com",
    "pinterest.", "yellowpages.", "yp.com", "bbb.org", "angi.com", "angieslist.com", "homeadvisor.com",
    "thumbtack.com", "houzz.com", "porch.com", "nextdoor.com", "tripadvisor.", "opentable.com", "zocdoc.com",
    "healthgrades.com", "vitals.com", "webmd.com", "ratemds.com", "avvo.com", "justia.com", "findlaw.com",
    "lawyers.com", "martindale.com", "superpages.com", "manta.com", "mapquest.com", "foursquare.com",
    "chamberofcommerce.com", "indeed.com", "glassdoor.", "ziprecruiter.com", "wikipedia.org", "reddit.com",
    "quora.com", "google.", "apple.com", "bing.com", "amazon.", "craigslist.org", "groupon.com", "expertise.com",
    "birdeye.com", "zillow.com", "realtor.com", "redfin.com", "trulia.com", "loopnet.com", "angi.", "local.com",
    "citysearch.com", "merchantcircle.com", "dexknows.com", "hotfrog.", "cylex.", "brownbook.net", "bizapedia.com",
    "opencorporates.com", "dnb.com", "zoominfo.com", "apollo.io", "crunchbase.com", "bloomberg.com", "doordash.com",
    "ubereats.com", "grubhub.com", "seamless.com", "booksy.com", "vagaro.com", "styleseat.com", "fresha.com",
    "justdial.com", "sulekha.com", "indiamart.com", "practo.com", "zomato.com", "swiggy.com", "magicpin.in",
)


def is_directory(url):
    host = urlparse(url).netloc.lower().removeprefix("www.")
    return any(host == d.rstrip(".") or host.startswith(d) or ("." + d) in ("." + host) for d in DIRECTORY_DOMAINS)


def site_key(url):
    """Normalised domain, used to spot the same business found by two sources."""
    host = urlparse(url if "://" in url else "http://" + url).netloc.lower()
    return host.removeprefix("www.")


def root_url(url):
    p = urlparse(url)
    return f"{p.scheme or 'http'}://{p.netloc}/"


# ---------------------------------------------------------------- Google Places

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
PLACES_FIELDS = ",".join([
    "places.displayName", "places.websiteUri", "places.nationalPhoneNumber", "places.internationalPhoneNumber",
    "places.formattedAddress", "places.rating", "places.userRatingCount", "places.businessStatus",
    "places.googleMapsUri", "places.id", "places.primaryTypeDisplayName", "places.regularOpeningHours",
    "places.photos", "places.editorialSummary", "nextPageToken",
])
REVIEW_FIELD = "places.reviews"


def _city_box(city):
    resp = requests.get(NOMINATIM_URL, params={"q": city, "format": "json", "limit": 1},
                        headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    found = resp.json()
    if not found:
        raise ValueError(f'Could not find "{city}". Try adding the state or country, e.g. "Austin, Texas".')
    south, north, west, east = (float(x) for x in found[0]["boundingbox"])
    return south, north, west, east, found[0].get("display_name", city)


def _grid(box, n):
    south, north, west, east = box
    lat_step, lon_step = (north - south) / n, (east - west) / n
    for i in range(n):
        for j in range(n):
            yield {"rectangle": {
                "low": {"latitude": south + i * lat_step, "longitude": west + j * lon_step},
                "high": {"latitude": south + (i + 1) * lat_step, "longitude": west + (j + 1) * lon_step},
            }}


def _parse_reviews(place):
    out = []
    for r in place.get("reviews") or []:
        text = (r.get("text") or r.get("originalText") or {}).get("text", "")
        out.append({"rating": r.get("rating"), "text": text, "when": r.get("relativePublishTimeDescription", "")})
    return out


def google_places(business_type, city, api_key, limit=100, grid=2, progress=None, with_reviews=True):
    """Businesses from Google's listings. Google returns at most 60 per search, so the city is
    split into a grid of smaller areas (grid=2 means 4 areas) and each is searched."""
    south, north, west, east, area_name = _city_box(city)
    fields = PLACES_FIELDS + ("," + REVIEW_FIELD if with_reviews else "")
    headers = {"X-Goog-Api-Key": api_key, "X-Goog-FieldMask": fields, "Content-Type": "application/json"}
    results, seen = [], set()

    for cell in _grid((south, north, west, east), max(1, grid)):
        token = None
        for _ in range(3):  # up to 3 pages of 20
            body = {"textQuery": business_type, "pageSize": 20, "locationRestriction": cell}
            if token:
                body["pageToken"] = token
            resp = requests.post(PLACES_URL, json=body, headers=headers, timeout=30)
            if resp.status_code == 403:
                raise RuntimeError("Google rejected the API key. Check GOOGLE_PLACES_API_KEY and that the "
                                   "Places API (New) is enabled for it.")
            if resp.status_code != 200:
                raise RuntimeError(f"Google Places answered {resp.status_code}: {resp.text[:200]}")
            data = resp.json()
            for p in data.get("places", []):
                if p.get("id") in seen or p.get("businessStatus", "OPERATIONAL") != "OPERATIONAL":
                    continue
                seen.add(p.get("id"))
                results.append({
                    "name": (p.get("displayName") or {}).get("text", ""),
                    "website": p.get("websiteUri", ""),
                    "phone": p.get("nationalPhoneNumber") or p.get("internationalPhoneNumber", ""),
                    "email": "",
                    "address": p.get("formattedAddress", ""),
                    "rating": p.get("rating"),
                    "reviews": p.get("userRatingCount") or 0,
                    "maps_url": p.get("googleMapsUri", ""),
                    "category": (p.get("primaryTypeDisplayName") or {}).get("text", ""),
                    "hours": (p.get("regularOpeningHours") or {}).get("weekdayDescriptions", []),
                    "photo_count": len(p.get("photos") or []),
                    "summary": (p.get("editorialSummary") or {}).get("text", ""),
                    "google_reviews": _parse_reviews(p),
                    "type": business_type,
                    "area": area_name,
                    "source": "Google",
                })
                if len(results) >= limit:
                    return results
            token = data.get("nextPageToken")
            if not token:
                break
            time.sleep(1.5)  # a new page token takes a moment to become valid
        if progress:
            progress(len(results))
    return results


# ---------------------------------------------------------------- web footprints

BRAVE_URL = "https://api.search.brave.com/res/v1/web/search"


def footprint_queries(business_type, city):
    """Search phrases that find business websites which haven't been updated in years."""
    old_years = [THIS_YEAR - n for n in range(4, 12)]
    q = f'{business_type} "{city}"'
    queries = [(f'{q} "© {y}"', f"footer still says © {y}") for y in old_years[:5]]
    queries += [(f'{q} "copyright {y}"', f"footer still says copyright {y}") for y in old_years[:3]]
    queries += [
        (f'{q} "under construction"', 'says "under construction"'),
        (f'{q} "best viewed in"', 'says "best viewed in" (a sign of a very old site)'),
        (f'{q} "coming soon" website', 'says "coming soon"'),
        (f'{q} "powered by weebly"', "built on a DIY site builder (Weebly)"),
        (f'{q} "website builder" godaddy', "built on a DIY site builder (GoDaddy)"),
        (f'{q} "this site was designed with the" wix', "built on a DIY site builder (Wix)"),
        (f'{q} "site by" "all rights reserved" {THIS_YEAR - 6}', "hasn't been touched in years"),
    ]
    return queries


def web_footprints(business_type, city, api_key, limit=100, progress=None):
    headers = {"X-Subscription-Token": api_key, "Accept": "application/json"}
    results, seen = [], set()
    city_short = city.split(",")[0].strip()
    for query, why in footprint_queries(business_type, city_short):
        for page in range(3):
            resp = requests.get(BRAVE_URL, params={"q": query, "count": 20, "offset": page},
                                headers=headers, timeout=30)
            if resp.status_code in (401, 403, 422):
                raise RuntimeError("Brave Search rejected the API key. Check BRAVE_API_KEY.")
            if resp.status_code == 429:
                time.sleep(2)
                continue
            if resp.status_code != 200:
                break
            data = resp.json()
            for r in (data.get("web") or {}).get("results", []):
                url = r.get("url", "")
                if not url or is_directory(url):
                    continue
                key = site_key(url)
                if key in seen:
                    continue
                seen.add(key)
                title = re.split(r"\s[|\-–—:]\s", r.get("title", ""))[0].strip()
                results.append({
                    "name": title[:80], "website": root_url(url), "phone": "", "email": "", "address": "",
                    "type": business_type, "area": city, "source": "Web search", "found_because": why,
                })
                if len(results) >= limit:
                    return results
            if not (data.get("query") or {}).get("more_results_available"):
                break
            time.sleep(1.1)  # stay under the free plan's 1 request per second
        if progress:
            progress(len(results))
    return results


def merge(*lists):
    """Combine leads from several sources, one per website (or per name when there's no website)."""
    merged, index = [], {}
    for lead in (l for lst in lists for l in lst):
        key = site_key(lead["website"]) if lead.get("website") else "name:" + lead.get("name", "").lower()
        if key in index:
            existing = index[key]
            for k, v in lead.items():
                if v and not existing.get(k):
                    existing[k] = v
            sources = set(existing.get("source", "").split(" + ")) | {lead.get("source", "")}
            existing["source"] = " + ".join(sorted(s for s in sources if s))
        else:
            index[key] = lead
            merged.append(lead)
    return merged


def available_sources():
    return {
        "osm": True,
        "google": bool(os.environ.get("GOOGLE_PLACES_API_KEY")),
        "web": bool(os.environ.get("BRAVE_API_KEY")),
    }
