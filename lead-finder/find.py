"""Find local businesses (with websites) from OpenStreetMap.

OpenStreetMap is a free, public map database. We ask it for every business of a
given type inside a city and keep the ones that list a website.
"""

import time

import requests

USER_AGENT = "LeadFinder/1.0 (small-business website research)"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

# Plain-English business type -> OpenStreetMap tags.
BUSINESS_TYPES = {
    "dentist": [("amenity", "dentist"), ("healthcare", "dentist")],
    "doctor": [("amenity", "doctors"), ("healthcare", "doctor")],
    "clinic": [("amenity", "clinic"), ("healthcare", "clinic")],
    "physiotherapist": [("healthcare", "physiotherapist")],
    "chiropractor": [("healthcare", "chiropractor")],
    "vet": [("amenity", "veterinary")],
    "pharmacy": [("amenity", "pharmacy")],
    "lawyer": [("office", "lawyer")],
    "accountant": [("office", "accountant"), ("office", "tax_advisor")],
    "real estate": [("office", "estate_agent")],
    "insurance": [("office", "insurance")],
    "architect": [("office", "architect")],
    "restaurant": [("amenity", "restaurant")],
    "cafe": [("amenity", "cafe")],
    "bar": [("amenity", "bar"), ("amenity", "pub")],
    "bakery": [("shop", "bakery")],
    "hotel": [("tourism", "hotel"), ("tourism", "guest_house")],
    "gym": [("leisure", "fitness_centre")],
    "yoga": [("leisure", "fitness_centre"), ("sport", "yoga")],
    "hair salon": [("shop", "hairdresser")],
    "beauty salon": [("shop", "beauty")],
    "spa": [("leisure", "spa"), ("shop", "massage")],
    "tattoo": [("shop", "tattoo")],
    "florist": [("shop", "florist")],
    "jeweller": [("shop", "jewelry")],
    "clothing store": [("shop", "clothes")],
    "furniture store": [("shop", "furniture")],
    "car repair": [("shop", "car_repair")],
    "car dealer": [("shop", "car")],
    "plumber": [("craft", "plumber")],
    "electrician": [("craft", "electrician")],
    "roofer": [("craft", "roofer")],
    "hvac": [("craft", "hvac")],
    "carpenter": [("craft", "carpenter")],
    "painter": [("craft", "painter")],
    "photographer": [("craft", "photographer"), ("shop", "photo")],
    "school": [("amenity", "school"), ("amenity", "language_school"), ("amenity", "driving_school")],
    "wedding venue": [("amenity", "events_venue")],
}


def business_type_names():
    return sorted(BUSINESS_TYPES)


def _tags_for(business_type):
    key = business_type.strip().lower()
    if key in BUSINESS_TYPES:
        return BUSINESS_TYPES[key]
    # Accept a raw OSM tag like "shop=bicycle" for anything not in the list.
    if "=" in key:
        k, v = key.split("=", 1)
        return [(k.strip(), v.strip())]
    raise ValueError(
        f'Unknown business type "{business_type}". Try one of: '
        + ", ".join(business_type_names())
        + '. Or give an OpenStreetMap tag such as "shop=bicycle".'
    )


def _find_area_id(city):
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": city, "format": "json", "limit": 5},
        headers={"User-Agent": USER_AGENT},
        timeout=30,
    )
    resp.raise_for_status()
    for place in resp.json():
        if place.get("osm_type") == "relation":
            return 3600000000 + int(place["osm_id"]), place.get("display_name", city)
    raise ValueError(f'Could not find a city or area called "{city}". Try adding the country, e.g. "Austin, Texas".')


def _run_overpass(query):
    last_error = None
    for url in OVERPASS_URLS:
        try:
            resp = requests.post(url, data={"data": query}, headers={"User-Agent": USER_AGENT}, timeout=120)
            if resp.status_code == 200:
                return resp.json()
            last_error = f"{url} answered {resp.status_code}"
        except requests.RequestException as e:
            last_error = f"{url}: {e}"
        time.sleep(2)
    raise RuntimeError(f"The map server didn't answer. Try again in a minute. ({last_error})")


def _normalize_url(url):
    url = url.strip().split(";")[0].strip()
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    return url


def find_businesses(business_type, city, limit=100, include_without_website=False):
    """Return a list of dicts: name, website, phone, email, address, source."""
    tags = _tags_for(business_type)
    area_id, area_name = _find_area_id(city)

    parts = []
    for k, v in tags:
        website_filter = "" if include_without_website else '[~"^(website|contact:website|url)$"~"."]'
        parts.append(f'nwr["{k}"="{v}"]{website_filter}(area.a);')
    query = f"[out:json][timeout:90];area({area_id})->.a;({''.join(parts)});out center tags;"

    data = _run_overpass(query)
    seen = set()
    results = []
    for el in data.get("elements", []):
        t = el.get("tags", {})
        name = t.get("name")
        if not name:
            continue
        website = _normalize_url(t.get("website") or t.get("contact:website") or t.get("url") or "")
        dedupe_key = (name.lower(), website.lower())
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        address = " ".join(
            x for x in [t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:city") or t.get("addr:suburb")] if x
        )
        results.append({
            "name": name,
            "website": website,
            "phone": t.get("phone") or t.get("contact:phone") or "",
            "email": t.get("email") or t.get("contact:email") or "",
            "address": address,
            "type": business_type,
            "area": area_name,
        })
        if len(results) >= limit:
            break
    return results
