#!/usr/bin/env python3
"""Static site generator for IB Refrigeration & Engineering.

Header, footer, SEO tags, business details and reviews live here once; each
page's body is defined below. Run `python3 build.py` to regenerate *.html.
"""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://www.ibrefrigeration.in"

GMAPS_PLACE = ("https://www.google.com/maps/place/IB+Refrigeration+%26+Engineering/@21.1635551,79.085886,17z/"
               "data=!4m8!3m7!1s0x3bd4c19e251633f7:0x363e56705cc956a1!8m2!3d21.1635551!4d79.085886!9m1!1b1!16s%2Fg%2F11gltmc0tl")

BIZ = {
    "name": "IB Refrigeration & Engineering",
    "email": "info@ibrefrigeration.in",
    "iqbal": ("SK Iqbal", "9021426223", "7972536346"),
    "amaan": ("SK Amaan", "8888840964"),
    "workshop_phone": "0712-2533915",
    "whatsapp": "919021426223",
    "workshop": "Near Railway Bridge, Opp. Ashok Car Glass, Gaddigodam, Kamptee Road, Nagpur – 440001",
    "office": "Beside Jamia Arabia Madrasa, Nalsahab Chowk, Hansapuri, Nagpur – 440018",
    "gst": "27CJOPS6911D1ZW",
    "lat": 21.1635551, "lng": 79.085886,
    "facebook": "https://www.facebook.com/p/IB-Refrigeration-100064116003102/",
    "youtube": "https://www.youtube.com/channel/UCSVmhit9ZlcpdIbkuGgCBIw",
    "justdial": "https://www.justdial.com/Nagpur/I-B-Refrigeration-Engineering-Near-Railway-Bridge-Gaddi-Godam/0712PX712-X712-170708125045-S6M7_BZDET",
    "indiamart": "https://www.indiamart.com/ibrefrigeration/",
    "google_reviews": GMAPS_PLACE,
    "gmaps": "https://maps.google.com/?cid=3908656567197193889",
    "gmaps_office": "https://www.google.com/maps/search/?api=1&query=Nalsahab+Chowk+Hansapuri+Nagpur",
    "embed_workshop": "https://maps.google.com/maps?q=IB%20Refrigeration%20%26%20Engineering%2C%20Kamptee%20Road%2C%20Nagpur&ll=21.1635551,79.085886&z=17&output=embed",
    "embed_office": "https://maps.google.com/maps?q=Nalsahab%20Chowk%2C%20Hansapuri%2C%20Nagpur&z=16&output=embed",
    "g_rating": "4.9", "g_count": 49,
    "g_dist": {5: 48, 4: 0, 3: 0, 2: 0, 1: 1},
    "jd_rating": "4.9", "jd_count": 58,
    "since": 2007,
}
WA = f"https://wa.me/{BIZ['whatsapp']}?text=" + "Hi%20IB%20Refrigeration%2C%20I%20would%20like%20a%20quote."
YEARS = 2026 - BIZ["since"]

# Every publicly visible review, copied word for word from the source.
# (name, profile line, when, stars or None, text, source)
REVIEWS = [
    ("Vijay Bhambhwani", "Local Guide · 237 reviews", "3 years ago", 5,
     "I got 2 table n one rack made, Very good quality make with reasonable price. Highly recommended.", "google"),
    ("Atul Huddar", "3 reviews", "3 years ago", 5,
     "Very exclent work as wel as very good rates as compair with other manufacturers. Give delivery of product with mention time period.", "google"),
    ("Rohit", "1 review", "3 years ago", 5,
     "It's good place to have all your Solutions for refrigeratio and counter top and etc... And work quality is also good", "google"),
    ("Shakir Aslam", "1 review", "3 years ago", 5, "Best refrigerator manufacturing shop in nagpur", "google"),
    ("Kaushlesh Dutta", "Local Guide · 41 reviews", "8 years ago", 5, "Best refrigeration service provider in Nagpur", "google"),
    ("Rameez", "Justdial user", "13 Mar 2020", None, "Very nice service", "justdial"),
    ("Ghanshyam Pal", "Justdial user", "23 Dec 2022", None, "", "justdial"),
    ("Santosh Khanderiya", "Justdial user", "28 Feb 2020", None, "", "justdial"),
]

NAV = [("index.html", "Home"), ("about.html", "About"), ("products.html", "Products"), ("services.html", "Services"),
       ("gallery.html", "Gallery"), ("reviews.html", "Reviews"), ("contact.html", "Contact")]

# ---------------------------------------------------------------- icons
I = {
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.1 8.1 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.8L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6Z"/></svg>',
    "arrow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    "up": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    "x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    "left": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    "right": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    "search": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    "play": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    "snow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9M9 3l3 3 3-3M9 21l3-3 3 3M3 9l3 3-3 3M21 9l-3 3 3 3"/></svg>',
    "flame": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.4.3 1.6 1.3 2.9 2.5 2.9Z"/></svg>',
    "ruler": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3 8.7 2.7a1 1 0 0 0-1.4 0L2.7 7.3a1 1 0 0 0 0 1.4l12.6 12.6a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4ZM7.5 10.5l2-2M10.5 13.5l2-2M13.5 16.5l2-2"/></svg>',
    "shield": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    "wrench": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/></svg>',
    "truck": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    "rupee": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10"/></svg>',
    "brush": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9.1 11.1 8.5-8.5a2.1 2.1 0 1 1 3 3l-8.5 8.5M7 14a3 3 0 0 0-3 3c0 1.3-1 2-2 2 1 1.5 3 2 4 2a4 4 0 0 0 4-4 3 3 0 0 0-3-3Z"/></svg>',
    "kitchen": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M8 6h.01M12 6h.01M8 14h8v4H8z"/></svg>',
    "cart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13v8H3zM16 10h3l2 3v2h-5M3 7l2-4h9l2 4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    "factory": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20V9l6 4V9l6 4V4h4l2 16Z"/><path d="M2 20h20"/></svg>',
    "file": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg>',
}

# Brand marks (official colours) for review platforms and socials.
B = {
    "google": '<svg class="ico-brand" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44Z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9Z"/></svg>',
    "facebook": '<svg class="ico-brand" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M16.67 15.47 17.2 12h-3.33V9.75c0-.95.47-1.87 1.96-1.87h1.51V4.93s-1.37-.23-2.69-.23c-2.74 0-4.53 1.66-4.53 4.66V12H7.08v3.47h3.04V23.9a12.1 12.1 0 0 0 3.75 0v-8.43h2.8Z"/></svg>',
    "youtube": '<svg class="ico-brand" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"/><path fill="#fff" d="M9.6 15.6V8.4l6.2 3.6z"/></svg>',
    "whatsapp": '<svg class="ico-brand" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M16.9 14.3c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.6.1a6.8 6.8 0 0 1-3.4-3c-.3-.4.3-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 3 4.7 4.2 1.7.7 2.4.8 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3Z"/><path fill="none" stroke="#fff" stroke-width="1.4" d="M12 5.2a6.8 6.8 0 0 0-5.9 10.2l-.9 3.4 3.5-.9A6.8 6.8 0 1 0 12 5.2Z"/></svg>',
    "justdial": '<svg class="ico-brand jd" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#fff"/><g transform="translate(24 24) scale(1.28) translate(-26 -24)"><path fill="#0076D7" d="M20.6 10h5.6v18.4c0 6.4-3.4 9.6-9.3 9.6-1.7 0-3.4-.3-4.9-.9l.9-4.6c1 .4 2.1.6 3.3.6 2.8 0 4.4-1.3 4.4-5.1Z"/><path fill="#FF7A00" d="M40 10v27.4h-5l-.3-2.2a7.4 7.4 0 0 1-6 2.6c-4.6 0-8-3.8-8-9.3 0-5.8 3.6-9.6 8.3-9.6 2.4 0 4.3.9 5.4 2.2V10Zm-10.2 13.2c-2.4 0-4 2-4 5.1 0 3 1.6 5 4 5 2.4 0 4.1-2 4.1-5.1 0-3-1.7-5-4.1-5Z"/></g></svg>',
    "indiamart": '<svg class="ico-brand" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#2E3192"/><path fill="#fff" d="M12 13h4.6v22H12zM20.5 35V13h4.6l5 9.8 5-9.8H40v22h-4.6V21.8l-5.3 10.1-5-10.1V35Z"/><circle cx="14.3" cy="9.4" r="2.4" fill="#E9212E"/></svg>',
}

LOGO = """<svg class="brand-mark" viewBox="0 0 120 76" aria-hidden="true">
  <defs>
    <linearGradient id="lg-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3e8f0"/><stop offset="1" stop-color="#b9c3d3"/></linearGradient>
    <linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8aa0"/><stop offset=".5" stop-color="#e9edf3"/><stop offset="1" stop-color="#6b788d"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="38" rx="57" ry="35" fill="url(#lg-ring)"/>
  <ellipse cx="60" cy="38" rx="52" ry="30.5" fill="url(#lg-steel)"/>
  <path d="M18 22c18-16 64-20 86-4" fill="none" stroke="#e0313a" stroke-width="5" stroke-linecap="round"/>
  <text x="60" y="54" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="42" fill="#0b1324" letter-spacing="-2">IB</text>
</svg>"""


def brand():
    return f"""<a class="brand" href="index.html" aria-label="IB Refrigeration &amp; Engineering — Home">{LOGO}
      <span class="brand-text"><span class="brand-name">IB Refrigeration</span><span class="brand-sub">&amp; Engineering · Nagpur</span></span></a>"""


def head(page):
    title, desc, path = page["title"], page["desc"], page["file"]
    url = f"{SITE}/" + ("" if path == "index.html" else path)
    ld = {
        "@context": "https://schema.org", "@type": "LocalBusiness", "@id": SITE + "/#business",
        "name": BIZ["name"],
        "description": "Manufacturer of display counters, food carts, commercial refrigeration, kitchen equipment and all types of SS works in Nagpur.",
        "url": SITE, "logo": SITE + "/assets/img/favicon.svg", "image": SITE + "/assets/img/og-image.jpg",
        "email": BIZ["email"],
        "telephone": ["+91-" + BIZ["iqbal"][1], "+91-" + BIZ["iqbal"][2], "+91-" + BIZ["amaan"][1], "+91-712-2533915"],
        "foundingDate": str(BIZ["since"]), "taxID": BIZ["gst"],
        "address": {"@type": "PostalAddress", "streetAddress": "Ward No. 63, House No. 659, Near Railway Bridge, Kamptee Road, Gaddigodam",
                    "addressLocality": "Nagpur", "addressRegion": "Maharashtra", "postalCode": "440001", "addressCountry": "IN"},
        "geo": {"@type": "GeoCoordinates", "latitude": BIZ["lat"], "longitude": BIZ["lng"]},
        "hasMap": BIZ["gmaps"],
        "areaServed": ["Nagpur", "Vidarbha", "Maharashtra", "Madhya Pradesh", "Chhattisgarh", "Telangana"],
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": BIZ["g_rating"], "reviewCount": str(BIZ["g_count"]), "bestRating": "5"},
        "sameAs": [BIZ["facebook"], BIZ["youtube"], BIZ["justdial"], BIZ["indiamart"], BIZ["gmaps"]],
        "priceRange": "₹₹",
    }
    return f"""<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0b1324">
<meta property="og:type" content="website">
<meta property="og:site_name" content="IB Refrigeration &amp; Engineering">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
"""


CURRENT = ' aria-current="page"'


def header(active):
    links = "\n".join(f'        <a href="{f}"{CURRENT if f == active else ""}>{n}</a>' for f, n in NAV)
    iq = BIZ["iqbal"]
    return f"""<div class="topbar">
  <div class="container">
    <div class="topbar-left">
      <a href="tel:+91{iq[1]}">{I['phone']}+91 {iq[1][:5]} {iq[1][5:]}</a>
      <a href="mailto:{BIZ['email']}" class="hide-sm">{I['mail']}{BIZ['email']}</a>
    </div>
    <div class="topbar-right">
      <a class="rating-pill" href="reviews.html">{B['google']}<b>{BIZ['g_rating']} ★</b> {BIZ['g_count']} Google reviews</a>
      <a href="{BIZ['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{B['facebook']}</a>
      <a href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{B['youtube']}</a>
    </div>
  </div>
</div>
<header class="site-header">
  <div class="container">
    {brand()}
    <nav class="nav" id="site-nav" aria-label="Main">
{links}
    </nav>
    <div class="header-cta">
      <a class="btn btn-ghost btn-sm btn-call" href="tel:+91{iq[1]}" aria-label="Call us">{I['phone']}<span>Call</span></a>
      <a class="btn btn-red btn-sm btn-quote" href="contact.html#quote">Get a Quote</a>
      <button class="menu-toggle" type="button" aria-label="Menu" aria-controls="site-nav" aria-expanded="false"><span></span></button>
    </div>
  </div>
</header>
<main id="main">
"""


def cta_band():
    return f"""<section class="section" style="padding-top:0">
  <div class="container">
    <div class="cta-band reveal">
      <div>
        <h2>Planning a new outlet <span class="serif">or kitchen?</span></h2>
        <p>Share your space and menu. We'll design, fabricate and install it, made to measure in our Nagpur workshop.</p>
      </div>
      <div class="actions">
        <a class="btn btn-white" href="{WA}" target="_blank" rel="noopener">{B['whatsapp']}WhatsApp Us</a>
        <a class="btn btn-light" href="tel:+91{BIZ['iqbal'][1]}">{I['phone']}Call Now</a>
      </div>
    </div>
  </div>
</section>
"""


def footer():
    iq, am = BIZ["iqbal"], BIZ["amaan"]
    return f"""</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        {brand()}
        <p>Manufacturer of bakery, hotel &amp; kitchen equipment, refrigeration, food counters and all types of stainless steel works, crafted in Nagpur since {BIZ['since']}.</p>
        <div class="socials">
          <a href="{BIZ['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{B['facebook']}</a>
          <a href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{B['youtube']}</a>
          <a href="{WA}" target="_blank" rel="noopener" aria-label="WhatsApp">{B['whatsapp']}</a>
          <a href="{BIZ['gmaps']}" target="_blank" rel="noopener" aria-label="Google Maps">{B['google']}</a>
        </div>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About Us</a></li>
          <li><a href="services.html">Services</a></li>
          <li><a href="gallery.html">Gallery</a></li>
          <li><a href="reviews.html">Reviews</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Products</h4>
        <ul>
          <li><a href="products.html?cat=display">Display Counters</a></li>
          <li><a href="products.html?cat=carts">Food Carts &amp; Stalls</a></li>
          <li><a href="products.html?cat=shawarma">Shawarma Machines</a></li>
          <li><a href="products.html?cat=refrigeration">Refrigeration</a></li>
          <li><a href="products.html?cat=cooking">Cooking Ranges</a></li>
          <li><a href="products.html?cat=coolers">Water Coolers</a></li>
        </ul>
      </div>
      <div>
        <h4>Get in touch</h4>
        <ul class="footer-contact">
          <li>{I['pin']}<span><b>Workshop:</b> {BIZ['workshop']}</span></li>
          <li>{I['pin']}<span><b>Office:</b> {BIZ['office']}</span></li>
          <li>{I['phone']}<span><a href="tel:+91{iq[1]}">{iq[1]}</a> · <a href="tel:+91{iq[2]}">{iq[2]}</a><br><a href="tel:+91{am[1]}">{am[1][:5]}-{am[1][5:]}</a> · <a href="tel:+917122533915">{BIZ['workshop_phone']}</a></span></li>
          <li>{I['mail']}<a href="mailto:{BIZ['email']}">{BIZ['email']}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-big" aria-hidden="true">IB Refrigeration</div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> IB Refrigeration &amp; Engineering, Nagpur. All rights reserved.</span>
      <span>GSTIN {BIZ['gst']}</span>
    </div>
  </div>
</footer>
<div class="fab">
  <a class="fab-call" href="tel:+91{iq[1]}" aria-label="Call IB Refrigeration">{I['phone']}</a>
  <a class="fab-wa" href="{WA}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{I['wa']}</a>
</div>
<button class="to-top" type="button" aria-label="Back to top">{I['up']}</button>
<div class="modal" id="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-dialog">
    <button class="modal-close" type="button" data-close aria-label="Close">{I['x']}</button>
    <div class="modal-media"></div>
    <div class="modal-body"></div>
  </div>
</div>
<script src="assets/js/products.js"></script>
<script src="assets/js/main.js"></script>
</body>
</html>
"""


def page_hero(title, sub, crumb, img=None):
    pic = f'<img src="{img}" alt="" aria-hidden="true">' if img else ""
    return f"""<section class="page-hero{' has-img' if img else ''}">
  {pic}
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
    <h1>{title}</h1>
    <p>{sub}</p>
  </div>
</section>
"""


def feature(icon, title, text, d=""):
    return f"""<div class="feature reveal {d}"><div class="feature-ico">{I[icon]}</div><h3>{title}</h3><p>{text}</p></div>"""


AV_COLORS = ["#1d5fd6", "#e0313a", "#0f8a6a", "#b26b00", "#7c3aed", "#0b1324", "#db2777", "#0e7490"]


def review_card(r, i, cls=""):
    name, meta, when, st, text, src = r
    initials = "".join(w[0] for w in name.split()[:2]).upper()
    star_html = f'<span class="stars" aria-label="{st} out of 5 stars">{"★" * st}</span>' if st else '<span></span>'
    via = (f'<span class="via">{B["google"]}Google</span>' if src == "google" else f'<span class="via">{B["justdial"]}Justdial</span>')
    body = f"<q>{escape(text)}</q>" if text else '<p class="no-text">Left a rating on Justdial without a written review.</p>'
    return f"""<article class="review reveal {cls}" data-src="{src}">
        <div class="review-top">{star_html}{via}</div>
        {body}
        <div class="review-author"><div class="avatar" style="background:{AV_COLORS[i % len(AV_COLORS)]}">{initials}</div><div><b>{escape(name)}</b><small>{escape(meta)} · {escape(when)}</small></div></div>
      </article>"""


# ---------------------------------------------------------------- pages
def home():
    seal_text = "MADE IN NAGPUR • SINCE 2007 • MADE IN NAGPUR • SINCE 2007 • "
    top_review = REVIEWS[0]
    rail = "\n      ".join(review_card(r, i) for i, r in enumerate(REVIEWS) if r[4])
    return f"""<section class="hero">
  <div class="container">
    <div>
      <a class="hero-badge reveal" href="reviews.html"><span class="g-chip">{B['google']}{BIZ['g_rating']} <span class="s">★★★★★</span></span>Rated by {BIZ['g_count']} customers on Google</a>
      <h1 class="reveal reveal-d1"><span class="ln">Counters that <span class="serif">sell.</span></span><span class="ln">Kitchens that <span class="serif">last.</span></span></h1>
      <p class="lead reveal reveal-d2">We design and manufacture display counters, food carts, shawarma machines, commercial refrigeration and complete restaurant kitchens in heavy-duty stainless steel, made to your exact size and brand.</p>
      <div class="hero-actions reveal reveal-d3">
        <a class="btn btn-red" href="contact.html#quote">Get a Free Quote <span class="arrow">{I['arrow']}</span></a>
        <a class="btn btn-light" href="products.html">Explore Products</a>
      </div>
      <div class="hero-proof reveal reveal-d3">
        <div><b>{YEARS}+</b><span>Years of craft</span></div>
        <div><b>40+</b><span>Product designs</span></div>
        <div><b>{BIZ['g_rating']}★</b><span>Google &amp; Justdial</span></div>
      </div>
    </div>
    <div class="hero-visual reveal reveal-d2">
      <div class="hv-main"><img src="assets/img/site/pani-puri-stall-night.jpg" alt="Illuminated pani puri stall built by IB Refrigeration" fetchpriority="high"><span class="hv-caption">Shrikant Panipuri Centre · built by IB</span></div>
      <div class="hv-side"><img src="assets/img/site/zero-mile-counter.jpg" alt="Zero Mile Restaurant counter built by IB Refrigeration"></div>
      <div class="hv-review">
        <div class="top">{B['google']}<span class="stars">★★★★★</span></div>
        <q>{escape(top_review[4])}</q>
        <small>{top_review[0]} · Local Guide</small>
      </div>
      <div class="hv-seal" aria-hidden="true">
        <svg class="ring" viewBox="0 0 120 120"><defs><path id="seal-c" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text font-size="9.6" font-weight="700" letter-spacing="2.2" fill="#fff" font-family="Inter, sans-serif"><textPath href="#seal-c">{seal_text}</textPath></text></svg>
        <b>IB</b>
      </div>
    </div>
  </div>
</section>

<section class="trust">
  <div class="container">
    <a class="trust-item" href="reviews.html"><span class="ti-ico">{B['google']}</span><div><b>{BIZ['g_rating']} ★ Google</b><span>{BIZ['g_count']} reviews</span></div></a>
    <a class="trust-item" href="reviews.html"><span class="ti-ico">{B['justdial']}</span><div><b>{BIZ['jd_rating']} ★ Justdial</b><span>{BIZ['jd_count']} ratings</span></div></a>
    <div class="trust-item"><span class="ti-ico">{I['factory']}</span><div><b>Own workshop</b><span>Kamptee Road, Nagpur</span></div></div>
    <div class="trust-item"><span class="ti-ico">{I['file']}</span><div><b>GST registered</b><span>Proper invoice, every order</span></div></div>
  </div>
</section>

<section class="section section-cream">
  <div class="container">
    <div class="section-head head-row reveal">
      <div><span class="eyebrow">What we build</span><h2>Everything a food business <span class="serif">needs,</span> under one roof</h2></div>
      <a class="link-arrow" href="products.html">Browse all 39 products {I['arrow']}</a>
    </div>
    <div class="bento">
      <a class="tile t-a reveal" href="products.html?cat=carts"><img src="assets/img/site/pani-puri-stall-night.jpg" alt="" loading="lazy"><span class="tile-count">7 designs</span><span class="tile-go">{I['arrow']}</span><h3>Food Carts &amp; Chaat Stalls</h3><p>Branded pani puri, chaat, momo and food carts with lighting that pulls customers in.</p></a>
      <a class="tile t-b reveal reveal-d1" href="products.html?cat=display"><img src="assets/img/site/zero-mile-counter.jpg" alt="" loading="lazy"><span class="tile-count">6 designs</span><span class="tile-go">{I['arrow']}</span><h3>Display &amp; Restaurant Counters</h3><p>Sweet, bakery, snacks and tandoori counters with glass, LED and your branding.</p></a>
      <a class="tile t-c reveal reveal-d2" href="products.html?cat=shawarma"><img src="assets/img/site/shawarma-workshop.jpg" alt="" loading="lazy" style="object-position:center 30%"><span class="tile-count">5 designs</span><span class="tile-go">{I['arrow']}</span><h3>Shawarma Machines</h3></a>
      <a class="tile t-d light reveal reveal-d3" href="products.html?cat=refrigeration"><img src="assets/img/products/four-door-refrigerator.jpg" alt="" loading="lazy"><span class="tile-count">5 designs</span><span class="tile-go">{I['arrow']}</span><h3>Refrigeration</h3></a>
      <a class="tile t-e light reveal" href="products.html?cat=cooking"><img src="assets/img/products/triple-burner-chinese-range.jpg" alt="" loading="lazy"><span class="tile-count">6 designs</span><span class="tile-go">{I['arrow']}</span><h3>Cooking Ranges &amp; Bhatti</h3><p>Chinese ranges, burners &amp; gas bhattis.</p></a>
      <a class="tile t-f light reveal reveal-d1" href="products.html?cat=coolers"><img src="assets/img/products/commercial-water-cooler.jpg" alt="" loading="lazy"><span class="tile-count">5 designs</span><span class="tile-go">{I['arrow']}</span><h3>Water Coolers</h3><p>40 L to 150 L stainless steel coolers.</p></a>
      <a class="tile t-g ink reveal reveal-d2" href="services.html"><span class="big-ico">{I['kitchen']}</span><span class="tile-go">{I['arrow']}</span><div><h3>Complete Restaurant Kitchens</h3><p>Turnkey design, fabrication &amp; installation.</p></div></a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="photo-stack reveal">
      <div class="ps-main"><img src="assets/img/site/workshop-sign.jpg" alt="IB Refrigeration &amp; Engineering workshop on Kamptee Road, Nagpur" loading="lazy"></div>
      <div class="ps-float"><img src="assets/img/site/showroom-1.jpg" alt="IB Refrigeration showroom" loading="lazy"></div>
      <div class="ps-badge"><b>Since {BIZ['since']}</b><span>Family-run in Nagpur</span></div>
    </div>
    <div class="reveal reveal-d1">
      <span class="eyebrow">Why IB Refrigeration</span>
      <h2>Manufacturer prices. <span class="serif">Showroom finish.</span></h2>
      <p class="lead">You deal directly with the people who cut, weld and polish your equipment. No middlemen, no compromise on steel, just honest workmanship that lasts for years.</p>
      <ul class="checklist">
        <li><span class="n">01</span><div><b>Direct from the manufacturer</b><span>Factory pricing from our own workshop on Kamptee Road.</span></div></li>
        <li><span class="n">02</span><div><b>Made around your shop</b><span>Size, layout, finish, lighting and branding built for you.</span></div></li>
        <li><span class="n">03</span><div><b>Cooling + fabrication in-house</b><span>Refrigeration, heating and steel work handled by one team.</span></div></li>
        <li><span class="n">04</span><div><b>Service after sale</b><span>Maintenance &amp; repair for what we build, and other brands too.</span></div></li>
      </ul>
      <a class="btn btn-ink" href="about.html">Our Story <span class="arrow">{I['arrow']}</span></a>
    </div>
  </div>
</section>

<section class="section section-dark">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">How we work</span>
      <h2>From idea to installed <span class="serif">in four steps</span></h2>
      <p>A simple, transparent process. You see the design before we cut a single sheet of steel.</p>
    </div>
    <div class="process">
      <div class="step reveal"><div class="step-num">01</div><h3>Consult</h3><p>Call or WhatsApp us with your space, menu and budget. We visit the site when needed.</p></div>
      <div class="step reveal reveal-d1"><div class="step-num">02</div><h3>Design</h3><p>We propose the size, layout, materials and branding with a clear quotation.</p></div>
      <div class="step reveal reveal-d2"><div class="step-num">03</div><h3>Fabricate</h3><p>Your unit is built in our workshop with food-grade stainless steel.</p></div>
      <div class="step reveal reveal-d3"><div class="step-num">04</div><h3>Deliver &amp; install</h3><p>We deliver, install and test, and stay on call for service.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head head-row reveal">
      <div><span class="eyebrow">Best sellers</span><h2>Popular with Nagpur's <span class="serif">food businesses</span></h2></div>
      <a class="btn btn-ghost" href="products.html">View all products <span class="arrow" style="background:var(--cream)">{I['arrow']}</span></a>
    </div>
    <div class="product-grid" id="featured-products" data-ids="tandoori-snacks-counter,pani-puri-thela,automatic-shawarma-machine,m-bend-display-counter,momos-counter,four-door-refrigerator,chinese-cooking-range,commercial-water-cooler"></div>
  </div>
</section>

<section class="section section-cream">
  <div class="container">
    <div class="section-head head-row reveal">
      <div><span class="eyebrow">Customer reviews</span><h2>Rated <span class="serif">{BIZ['g_rating']} out of 5</span> on Google</h2><p style="margin:12px 0 0">{BIZ['g_dist'][5]} of our {BIZ['g_count']} Google reviews are five stars.</p></div>
      <div class="rail-nav"><button type="button" data-rail="-1" aria-label="Previous reviews">{I['left']}</button><button type="button" data-rail="1" aria-label="Next reviews">{I['right']}</button></div>
    </div>
    <div class="review-rail" id="review-rail">
      {rail}
    </div>
    <div class="reveal" style="margin-top:36px;display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn btn-ink" href="reviews.html">See all reviews <span class="arrow">{I['arrow']}</span></a>
      <a class="btn btn-ghost" href="{BIZ['google_reviews']}" target="_blank" rel="noopener">{B['google']}Read on Google</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="showroom reveal">
      <img src="assets/img/site/showroom-2.jpg" alt="Inside the IB Refrigeration showroom" loading="lazy">
      <div class="showroom-body">
        <span class="eyebrow" style="color:var(--amber)">Visit us</span>
        <h2>See the steel <span class="serif">before you buy</span></h2>
        <p>Walk through display counters, refrigerators and kitchen equipment at our showroom and workshop on Kamptee Road.</p>
        <div class="addr">{I['pin']}<span>{BIZ['workshop']}</span></div>
        <div class="btns">
          <a class="btn btn-white" href="{BIZ['gmaps']}" target="_blank" rel="noopener">{B['google']}Get Directions</a>
          <a class="btn btn-light" href="tel:+91{BIZ['iqbal'][1]}">{I['phone']}Call before visiting</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section-cream">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Who we serve</span><h2>Trusted across <span class="serif">industries</span></h2></div>
    <div class="industries reveal">
      <span class="industry"><span>🍰</span>Bakeries &amp; Sweet Shops</span>
      <span class="industry"><span>🏨</span>Hotels &amp; Restaurants</span>
      <span class="industry"><span>🥟</span>Street Food Vendors</span>
      <span class="industry"><span>☕</span>Cafés &amp; QSRs</span>
      <span class="industry"><span>🍽️</span>Caterers &amp; Banquets</span>
      <span class="industry"><span>🏫</span>Schools &amp; Colleges</span>
      <span class="industry"><span>🏭</span>Factories &amp; Canteens</span>
      <span class="industry"><span>🏥</span>Hospitals &amp; Labs</span>
      <span class="industry"><span>🛒</span>Supermarkets</span>
      <span class="industry"><span>🥛</span>Dairies</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="video-card reveal">
      <div class="vc-body">
        <span class="eyebrow" style="color:var(--amber)">Watch us work</span>
        <h2>Our counters &amp; machines <span class="serif">in action</span></h2>
        <p>Product walkthroughs, workshop builds and installation videos on our YouTube channel and Facebook page.</p>
        <div class="btns">
          <a class="btn btn-white" href="{BIZ['youtube']}" target="_blank" rel="noopener">{B['youtube']}YouTube Channel</a>
          <a class="btn btn-light" href="{BIZ['facebook']}" target="_blank" rel="noopener">{B['facebook']}Facebook</a>
        </div>
      </div>
      <a class="video-thumb" href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="Open YouTube channel">
        <img src="assets/img/site/shawarma-workshop.jpg" alt="" loading="lazy">
        <span class="play">{I['play']}</span>
      </a>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container faq-wrap">
    <div class="reveal">
      <span class="eyebrow">FAQ</span>
      <h2 style="font-size:clamp(34px,4.6vw,56px)">Questions we <span class="serif" style="color:var(--red)">hear often</span></h2>
      <p class="lead">Can't find your answer? Message us on WhatsApp and we usually reply within a few hours.</p>
      <a class="btn btn-whatsapp" href="{WA}" target="_blank" rel="noopener">{I['wa']}Ask on WhatsApp</a>
    </div>
    <div class="faq reveal reveal-d1">
      <details open><summary>Do you make equipment to custom sizes?</summary><p>Yes. Almost everything we build is made to order. Length, height, shelves, burners or compartments, lighting and branding can all be tailored to your space and menu.</p></details>
      <details><summary>What material do you use?</summary><p>We work in food-grade stainless steel (SS 304 / SS 202 as per budget), toughened glass and branded compressors for refrigeration. Your quotation spells out the options clearly.</p></details>
      <details><summary>Do you deliver outside Nagpur?</summary><p>Yes. We regularly supply across Vidarbha and Maharashtra and can arrange transport to neighbouring states. Ask us for delivery charges to your city.</p></details>
      <details><summary>How long does manufacturing take?</summary><p>Standard counters and carts are typically ready in 7–15 days depending on size and workload. Full kitchens are scheduled once the design is final.</p></details>
      <details><summary>Do you offer maintenance and repair?</summary><p>Yes. Maintenance and repair of refrigeration and kitchen equipment is a core service, for our products and other brands.</p></details>
    </div>
  </div>
</section>
""" + cta_band()


def about():
    iq, am = BIZ["iqbal"], BIZ["amaan"]
    return page_hero("Crafting stainless steel for Nagpur <span class=\"serif\">since 2007</span>",
                     "A family-run manufacturer of display counters, refrigeration and kitchen equipment, built on honest workmanship.",
                     "About", "assets/img/site/showroom-2.jpg") + f"""
<section class="section">
  <div class="container split">
    <div class="reveal">
      <span class="eyebrow">Our story</span>
      <h2>From a small workshop to a name <span class="serif">trusted across Vidarbha</span></h2>
      <p class="lead">IB Refrigeration &amp; Engineering started in {BIZ['since']} in Nagpur as a sole-proprietorship workshop with one goal: build commercial kitchen and refrigeration equipment that works hard and looks great.</p>
      <p style="color:var(--muted)">Today our team of fabricators, welders and refrigeration technicians manufactures a full range: display counters, commercial refrigerators, gas bhattis, SS tandoors, sinks, racks, food carts, shawarma machines, water coolers and complete restaurant kitchens.</p>
      <p style="color:var(--muted)">Every product is made from quality raw material and finished in our own workshop at Gaddigodam, Kamptee Road. That's why bakeries, hotels, caterers and street-food entrepreneurs keep coming back and sending their friends.</p>
      <div class="stat-row" style="margin-top:28px">
        <div><b>{YEARS}+</b><span>Years</span></div>
        <div><b>11–25</b><span>Craftsmen</span></div>
        <div><b>{BIZ['g_rating']}★</b><span>{BIZ['g_count']} Google reviews</span></div>
      </div>
    </div>
    <div class="photo-stack reveal reveal-d1">
      <div class="ps-main"><img src="assets/img/site/workshop-sign.jpg" alt="IB Refrigeration workshop signboard" loading="lazy"></div>
      <div class="ps-float"><img src="assets/img/site/display-counters-pair.jpg" alt="Display counters by IB Refrigeration" loading="lazy"></div>
      <div class="ps-badge"><b>{BIZ['since']}</b><span>Established</span></div>
    </div>
  </div>
</section>

<section class="section section-cream">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">What drives us</span><h2>Our promise on <span class="serif">every job</span></h2></div>
    <div class="feature-grid">
      {feature('shield', 'Quality steel, always', 'Food-grade stainless steel, proper gauges and clean welds. No shortcuts hidden behind panels.')}
      {feature('ruler', 'Made for your space', 'We measure, design and build around your shop, kitchen and workflow.', 'reveal-d1')}
      {feature('rupee', 'Fair, transparent pricing', 'Manufacturer-direct quotes with clear specifications. No surprises on delivery.', 'reveal-d2')}
      {feature('clock', 'On-time delivery', 'We plan production so your outlet opens on the day you promised your customers.')}
      {feature('wrench', 'Service after sale', 'Maintenance and repair from the same team that built your equipment.', 'reveal-d1')}
      {feature('users', 'Skilled in-house team', 'Fabricators, welders and refrigeration technicians under one roof.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Journey</span><h2>How we <span class="serif">grew</span></h2></div>
    <div class="timeline">
      <div class="t-item reveal"><small>{BIZ['since']}</small><h3>Workshop founded</h3><p>Started fabricating stainless steel counters and repairing refrigeration for local businesses.</p></div>
      <div class="t-item reveal reveal-d1"><small>Growth</small><h3>Refrigeration &amp; display</h3><p>Expanded into cold display counters, commercial refrigerators, freezers and water coolers.</p></div>
      <div class="t-item reveal reveal-d2"><small>Street food</small><h3>Branded carts &amp; stalls</h3><p>Became a go-to maker of pani puri thelas, chaat stalls, momo counters and shawarma machines.</p></div>
      <div class="t-item reveal reveal-d3"><small>Today</small><h3>Turnkey kitchens</h3><p>Complete kitchens for hotels and restaurants, plus a showroom, office and service team.</p></div>
    </div>
  </div>
</section>

<section class="section section-cream">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">The people behind IB</span><h2>Talk to us <span class="serif">directly</span></h2></div>
    <div class="people">
      <div class="person reveal"><div class="avatar">SI</div><div><h3>{iq[0]}</h3><p>Proprietor · Sales, design &amp; quotations</p><a href="tel:+91{iq[1]}">+91 {iq[1]}</a><br><a href="tel:+91{iq[2]}">+91 {iq[2]}</a></div></div>
      <div class="person reveal reveal-d1"><div class="avatar" style="background:var(--red)">SA</div><div><h3>{am[0]}</h3><p>Projects, installation &amp; service</p><a href="tel:+91{am[1]}">+91 {am[1][:5]} {am[1][5:]}</a></div></div>
    </div>
    <div class="facts reveal">
      <div><small>Nature of business</small><b>Manufacturer</b></div>
      <div><small>Established</small><b>{BIZ['since']}</b></div>
      <div><small>Legal status</small><b>Proprietorship</b></div>
      <div><small>Team size</small><b>11 – 25 people</b></div>
      <div><small>GSTIN</small><b>{BIZ['gst']}</b></div>
    </div>
  </div>
</section>
""" + cta_band()


def products():
    also = "".join(f"<span>{x}</span>" for x in [
        "Milk Chiller (BMC) 500 L", "Biryani Counter", "Reception &amp; Cash Counters", "Pav Bhaji Stall", "Nashta Stall",
        "Namkeen Display Counter", "Chapati Bhatti", "SS Tandoor", "SS Sinks", "SS Racks &amp; Wall Shelves", "Exhaust Hoods",
        "Deep Freezers", "Mortuary Cabinet", "Complete Restaurant Kitchens"])
    return page_hero("Products built for <span class=\"serif\">busy counters</span>",
                     "Display counters, carts, shawarma machines, refrigeration, cooking ranges and SS furniture. Every product can be customised.",
                     "Products", "assets/img/site/display-counters-pair.jpg") + f"""
<div class="catalog-bar">
  <div class="container">
    <div class="filters" id="filters" role="toolbar" aria-label="Filter by category"></div>
    <label class="search"><span class="sr-only">Search products</span>{I['search']}<input type="search" id="product-search" placeholder="Search products…" autocomplete="off"></label>
  </div>
</div>
<section class="section" style="padding-top:44px">
  <div class="container">
    <p id="product-count" style="color:var(--muted);margin-bottom:22px" aria-live="polite"></p>
    <div class="product-grid" id="product-grid"></div>
  </div>
</section>
<section class="section section-cream">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow">Also manufactured</span><h2>Don't see it? <span class="serif">We probably make it.</span></h2><p>We also fabricate these on order, and anything else you can sketch in stainless steel.</p></div>
    <div class="also-make reveal">{also}</div>
  </div>
</section>
""" + cta_band()


def services():
    return page_hero("Fabrication, refrigeration <span class=\"serif\">&amp; service</span>",
                     "Design, manufacturing, installation, maintenance and repair. One team for everything your kitchen or counter needs.",
                     "Services", "assets/img/site/showroom-1.jpg") + f"""
<section class="section">
  <div class="container">
    <div class="feature-grid">
      {feature('kitchen', 'Restaurant Kitchen Setup', 'Turnkey commercial kitchens for hotels, restaurants, cloud kitchens and canteens: layout planning, fabrication and installation.')}
      {feature('cart', 'Food Carts &amp; Stalls', 'Branded pani puri, chaat, momo, pav bhaji and nashta stalls and food carts, ready for business.', 'reveal-d1')}
      {feature('snow', 'Commercial Refrigeration', 'Display coolers, SS refrigerators, deep freezers, chest freezers, milk chillers and water coolers.', 'reveal-d2')}
      {feature('flame', 'Cooking Equipment', 'Gas bhattis, Chinese ranges, burners, tandoors, bain-marie, chapati bhatti and shawarma machines.')}
      {feature('ruler', 'Custom SS Fabrication', 'Tables, racks, sinks, shelves, hoods, cabinets and any custom stainless steel work you need.', 'reveal-d1')}
      {feature('wrench', 'Maintenance &amp; Repair', 'Gas charging, compressor and thermostat repair, re-welding, re-polishing and upgrades for all brands.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section section-cream">
  <div class="container split">
    <div class="reveal">
      <span class="eyebrow">Turnkey kitchens</span>
      <h2>One partner for your <span class="serif">entire kitchen</span></h2>
      <p class="lead">Opening a restaurant, hotel or canteen? We plan the workflow (receiving, storage, prep, cooking, service and washing) and build every piece in stainless steel.</p>
      <ul class="checklist">
        <li><span class="n">01</span><div><b>Site visit &amp; layout planning</b><span>Optimised for space, safety and speed of service.</span></div></li>
        <li><span class="n">02</span><div><b>Cooking line &amp; exhaust</b><span>Ranges, bhattis, tandoors, hoods and work tables.</span></div></li>
        <li><span class="n">03</span><div><b>Cold storage</b><span>Refrigerators, freezers and under-counter chillers.</span></div></li>
        <li><span class="n">04</span><div><b>Front-of-house counters</b><span>Display, billing and service counters with your branding.</span></div></li>
      </ul>
      <a class="btn btn-ink" href="contact.html?need=Complete%20Restaurant%20Kitchen#quote">Plan My Kitchen <span class="arrow">{I['arrow']}</span></a>
    </div>
    <div class="photo-stack reveal reveal-d1">
      <div class="ps-main"><img src="assets/img/site/zero-mile-counter.jpg" alt="Restaurant counter by IB Refrigeration" loading="lazy"></div>
      <div class="ps-float"><img src="assets/img/site/showroom-1.jpg" alt="Commercial refrigeration in the IB showroom" loading="lazy"></div>
    </div>
  </div>
</section>

<section class="section section-dark">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Repair &amp; maintenance</span><h2>Keep your equipment <span class="serif">running</span></h2><p>Downtime costs money. Our technicians respond quickly across Nagpur.</p></div>
    <div class="feature-grid">
      {feature('snow', 'Refrigeration repair', 'Gas refilling, compressor replacement, thermostat and cooling issues on counters, fridges and freezers.')}
      {feature('flame', 'Burner &amp; gas line service', 'Burner cleaning, valve replacement and safe gas-line checks for ranges and bhattis.', 'reveal-d1')}
      {feature('brush', 'Refurbish &amp; re-brand', 'Re-polishing, re-welding, new glass, LED lights and fresh branding for old counters.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Process</span><h2>What working with us <span class="serif">looks like</span></h2></div>
    <div class="feature-grid">
      {feature('phone', '1 · Share your requirement', 'Call, WhatsApp or fill the quote form with your space, photos and budget.')}
      {feature('ruler', '2 · Design &amp; quotation', 'We suggest the right design and materials with a clear, itemised quote.', 'reveal-d1')}
      {feature('truck', '3 · Build, deliver &amp; install', 'Fabricated in our workshop, delivered to your site and installed by our team.', 'reveal-d2')}
    </div>
  </div>
</section>
""" + cta_band()


def gallery():
    return page_hero("Our work, <span class=\"serif\">up close</span>",
                     "Real counters, carts, machines and refrigeration from our workshop and our customers' outlets.",
                     "Gallery", "assets/img/site/pani-puri-stall-night.jpg") + f"""
<section class="section" style="padding-top:56px">
  <div class="container">
    <div class="gallery" id="gallery"></div>
    <div class="reveal" style="text-align:center;margin-top:56px">
      <p class="lead">More photos and videos on our channels</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-ghost" href="{BIZ['youtube']}" target="_blank" rel="noopener">{B['youtube']}YouTube</a>
        <a class="btn btn-ghost" href="{BIZ['facebook']}" target="_blank" rel="noopener">{B['facebook']}Facebook</a>
        <a class="btn btn-ghost" href="{BIZ['gmaps']}" target="_blank" rel="noopener">{B['google']}Google Photos</a>
        <a class="btn btn-ghost" href="{BIZ['justdial']}" target="_blank" rel="noopener">{B['justdial']}Justdial</a>
      </div>
    </div>
  </div>
</section>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
  <button class="lb-btn lb-close" type="button" aria-label="Close">{I['x']}</button>
  <button class="lb-btn lb-prev" type="button" aria-label="Previous">{I['left']}</button>
  <figure><img src="" alt=""><figcaption></figcaption></figure>
  <button class="lb-btn lb-next" type="button" aria-label="Next">{I['right']}</button>
</div>
""" + cta_band()


def reviews():
    total = BIZ["g_count"]
    bars = "\n          ".join(
        f'<div class="bar"><span>{n} star</span><i style="--w:{BIZ["g_dist"][n] / total * 100:.1f}%"></i><b>{BIZ["g_dist"][n]}</b></div>'
        for n in (5, 4, 3, 2, 1))
    g_n = sum(1 for r in REVIEWS if r[5] == "google")
    j_n = sum(1 for r in REVIEWS if r[5] == "justdial")
    cards = "\n      ".join(review_card(r, i, "feature-review" if i == 0 else "") for i, r in enumerate(REVIEWS))
    return page_hero("What our customers <span class=\"serif\">say</span>",
                     f"{BIZ['g_rating']}★ from {total} Google reviews and {BIZ['jd_rating']}★ from {BIZ['jd_count']} Justdial ratings. Every review below is copied word for word from the source.",
                     "Reviews", "assets/img/site/zero-mile-counter.jpg") + f"""
<section class="section" style="padding-bottom:40px">
  <div class="container">
    <div class="score-grid">
      <div class="score-card reveal">
        <div class="score-big">
          <span class="src">{B['google']}Google</span>
          <b>{BIZ['g_rating']}</b>
          <div class="stars">★★★★★</div>
          <small>{total} reviews</small>
        </div>
        <div>
          <div class="bars">
          {bars}
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px">
            <a class="btn btn-ink btn-sm" href="{BIZ['google_reviews']}" target="_blank" rel="noopener">Read all {total} on Google <span class="arrow">{I['arrow']}</span></a>
            <a class="btn btn-ghost btn-sm" href="{BIZ['google_reviews']}" target="_blank" rel="noopener">Write a review</a>
          </div>
        </div>
      </div>
      <div class="score-mini reveal reveal-d1">
        <span class="src">{B['justdial']}Justdial</span>
        <div><div class="row"><b>{BIZ['jd_rating']}</b><span class="stars">★★★★★</span></div><p>Average from {BIZ['jd_count']} customer ratings</p></div>
        <a class="btn btn-white btn-sm" href="{BIZ['justdial']}" target="_blank" rel="noopener" style="align-self:flex-start">See all {BIZ['jd_count']} ratings <span class="arrow" style="background:var(--cream)">{I['arrow']}</span></a>
      </div>
    </div>
  </div>
</section>

<section class="section section-cream" style="padding-top:72px">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">All reviews</span><h2>Straight from <span class="serif">our customers</span></h2></div>
    <div class="review-filters reveal" id="review-filters" role="toolbar" aria-label="Filter reviews">
      <button type="button" class="filter" data-src="all" aria-pressed="true">All<small>{len(REVIEWS)}</small></button>
      <button type="button" class="filter" data-src="google" aria-pressed="false">{B['google']}Google<small>{g_n}</small></button>
      <button type="button" class="filter" data-src="justdial" aria-pressed="false">{B['justdial']}Justdial<small>{j_n}</small></button>
    </div>
    <div class="review-grid" id="review-grid">
      {cards}
      <article class="review cta-card reveal" data-src="cta">
        <h3>Bought from us?</h3>
        <p>Your feedback helps other business owners choose with confidence. It takes less than a minute.</p>
        <a class="btn btn-ink" href="{BIZ['google_reviews']}" target="_blank" rel="noopener" style="align-self:flex-start">{B['google']}Write a Google review</a>
      </article>
    </div>
    <p class="reveal" style="text-align:center;color:var(--muted);font-size:14px;margin-top:20px">Read every one of our {total} reviews on <a href="{BIZ['google_reviews']}" target="_blank" rel="noopener" style="color:var(--ink);font-weight:600;text-decoration:underline">Google Maps</a> and <a href="{BIZ['justdial']}" target="_blank" rel="noopener" style="color:var(--ink);font-weight:600;text-decoration:underline">Justdial</a>.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Find us everywhere</span><h2>Our profiles &amp; <span class="serif">channels</span></h2></div>
    <div class="platforms">
      <a class="platform reveal" href="{BIZ['google_reviews']}" target="_blank" rel="noopener"><span class="plogo">{B['google']}</span><div><b>Google</b><span>{BIZ['g_rating']}★ · {total} reviews</span></div><span class="go">Open {I['arrow']}</span></a>
      <a class="platform reveal reveal-d1" href="{BIZ['justdial']}" target="_blank" rel="noopener"><span class="plogo">{B['justdial']}</span><div><b>Justdial</b><span>{BIZ['jd_rating']}★ · {BIZ['jd_count']} ratings</span></div><span class="go">Open {I['arrow']}</span></a>
      <a class="platform reveal reveal-d2" href="{BIZ['indiamart']}" target="_blank" rel="noopener"><span class="plogo">{B['indiamart']}</span><div><b>IndiaMART</b><span>Verified supplier</span></div><span class="go">Open {I['arrow']}</span></a>
      <a class="platform reveal reveal-d3" href="{BIZ['facebook']}" target="_blank" rel="noopener"><span class="plogo">{B['facebook']}</span><div><b>Facebook</b><span>Photos &amp; updates</span></div><span class="go">Open {I['arrow']}</span></a>
      <a class="platform reveal reveal-d3" href="{BIZ['youtube']}" target="_blank" rel="noopener"><span class="plogo">{B['youtube']}</span><div><b>YouTube</b><span>Product videos</span></div><span class="go">Open {I['arrow']}</span></a>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="map-wrap reveal">
      <iframe src="{BIZ['embed_workshop']}" title="IB Refrigeration &amp; Engineering on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      <div class="map-label"><div><b>IB Refrigeration &amp; Engineering</b><span>{BIZ['workshop']}</span></div><a class="btn btn-ink btn-sm" href="{BIZ['gmaps']}" target="_blank" rel="noopener">Open in Google Maps <span class="arrow">{I['arrow']}</span></a></div>
    </div>
  </div>
</section>
""" + cta_band()


def contact():
    iq, am = BIZ["iqbal"], BIZ["amaan"]
    return page_hero("Let's build something <span class=\"serif\">great</span>",
                     "Call, WhatsApp or send us your requirement. We usually reply within a few working hours.",
                     "Contact", "assets/img/site/workshop-front.jpg") + f"""
<section class="section">
  <div class="container contact-grid">
    <div class="contact-cards">
      <div class="contact-card reveal"><div class="feature-ico">{I['phone']}</div><div><h3>{iq[0]} · Proprietor</h3><a href="tel:+91{iq[1]}">+91 {iq[1]}</a><a href="tel:+91{iq[2]}">+91 {iq[2]}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['phone']}</div><div><h3>{am[0]} · Projects</h3><a href="tel:+91{am[1]}">+91 {am[1][:5]} {am[1][5:]}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico" style="background:#e9f9ef">{B['whatsapp']}</div><div><h3>WhatsApp</h3><a href="{WA}" target="_blank" rel="noopener">Chat with us instantly</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['mail']}</div><div><h3>Email &amp; workshop line</h3><a href="mailto:{BIZ['email']}">{BIZ['email']}</a><a href="tel:+917122533915">{BIZ['workshop_phone']}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['clock']}</div><div><h3>Working hours</h3><p>Monday – Saturday · 10:00 AM – 8:00 PM</p></div></div>
    </div>
    <form class="form-card reveal reveal-d1" id="quote-form" novalidate>
      <span class="eyebrow" id="quote">Free quotation</span>
      <h2>Request a quote</h2>
      <p style="color:var(--muted)">Tell us what you need. Your message opens in WhatsApp, ready to send.</p>
      <div class="form-grid">
        <div class="field"><label for="q-name">Your name</label><input id="q-name" name="name" required autocomplete="name" placeholder="Full name"></div>
        <div class="field"><label for="q-phone">Phone / WhatsApp</label><input id="q-phone" name="phone" type="tel" required autocomplete="tel" placeholder="10-digit mobile" pattern="[0-9+\\s-]{{10,15}}"></div>
        <div class="field"><label for="q-city">City</label><input id="q-city" name="city" autocomplete="address-level2" placeholder="e.g. Nagpur"></div>
        <div class="field"><label for="q-product">Requirement</label><select id="q-product" name="product" required></select></div>
        <div class="field full"><label for="q-message">Details</label><textarea id="q-message" name="message" placeholder="Size, quantity, budget, branding, timeline…"></textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-whatsapp" type="submit">{I['wa']}Send on WhatsApp</button>
        <button class="btn btn-ghost" type="button" id="quote-email">{I['mail']}Send by Email</button>
      </div>
      <p class="form-note">We never share your details. Prefer to talk? Call <a href="tel:+91{iq[1]}" style="color:var(--ink);font-weight:600">+91 {iq[1]}</a>.</p>
    </form>
  </div>
</section>
<section class="section section-cream">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Locations</span><h2>Visit our workshop <span class="serif">&amp; office</span></h2></div>
    <div class="map-grid">
      <div class="map-wrap reveal">
        <iframe src="{BIZ['embed_workshop']}" title="Workshop location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <div class="map-label"><div><b>Workshop &amp; showroom</b><span>{BIZ['workshop']}</span></div><a class="btn btn-ink btn-sm" href="{BIZ['gmaps']}" target="_blank" rel="noopener">Directions</a></div>
      </div>
      <div class="map-wrap reveal reveal-d1">
        <iframe src="{BIZ['embed_office']}" title="Office location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <div class="map-label"><div><b>Office</b><span>{BIZ['office']}</span></div><a class="btn btn-ink btn-sm" href="{BIZ['gmaps_office']}" target="_blank" rel="noopener">Directions</a></div>
      </div>
    </div>
  </div>
</section>
"""


def notfound():
    return """<section class="section notfound"><div class="container">
  <b>404</b>
  <h1 style="font-size:34px">This page has gone <span class="serif" style="color:var(--red)">cold.</span></h1>
  <p class="lead">The page you're looking for doesn't exist, but our counters do.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-ink" href="index.html">Back to Home</a><a class="btn btn-ghost" href="products.html">View Products</a></div>
</div></section>
"""


PAGES = [
    {"file": "index.html", "fn": home,
     "title": "IB Refrigeration & Engineering | Display Counters, Food Carts & Commercial Kitchen Equipment in Nagpur",
     "desc": "Rated 4.9★ on Google. Manufacturer of display counters, pani puri & chaat stalls, shawarma machines, commercial refrigerators, water coolers and complete restaurant kitchens in Nagpur since 2007."},
    {"file": "about.html", "fn": about,
     "title": "About Us | IB Refrigeration & Engineering, Nagpur",
     "desc": "Since 2007, IB Refrigeration & Engineering has manufactured stainless steel display counters, refrigeration and kitchen equipment from its workshop in Gaddigodam, Nagpur."},
    {"file": "products.html", "fn": products,
     "title": "Products | Display Counters, Shawarma Machines, Refrigerators & More | IB Refrigeration",
     "desc": "Browse 40+ products: display counters, food carts, chaat stalls, shawarma machines, cooking ranges, commercial refrigerators, water coolers and SS tables. Custom sizes available."},
    {"file": "services.html", "fn": services,
     "title": "Services | Restaurant Kitchen Setup, SS Fabrication & Refrigeration Repair in Nagpur",
     "desc": "Turnkey restaurant kitchens, custom stainless steel fabrication, commercial refrigeration, maintenance and repair services in Nagpur by IB Refrigeration & Engineering."},
    {"file": "gallery.html", "fn": gallery,
     "title": "Gallery | IB Refrigeration & Engineering, Nagpur",
     "desc": "Photos of display counters, carts, shawarma machines, refrigerators and kitchen equipment built by IB Refrigeration & Engineering in Nagpur."},
    {"file": "reviews.html", "fn": reviews,
     "title": "Customer Reviews | IB Refrigeration & Engineering — 4.9★ on Google",
     "desc": "IB Refrigeration & Engineering is rated 4.9 out of 5 from 49 Google reviews and 58 Justdial ratings. Read what customers say and find our Nagpur workshop on Google Maps."},
    {"file": "contact.html", "fn": contact,
     "title": "Contact Us | Get a Quote | IB Refrigeration & Engineering, Nagpur",
     "desc": "Call +91 9021426223 or WhatsApp IB Refrigeration & Engineering for a free quote. Workshop at Gaddigodam, Kamptee Road; office at Nalsahab Chowk, Hansapuri, Nagpur."},
    {"file": "404.html", "fn": notfound,
     "title": "Page not found | IB Refrigeration & Engineering",
     "desc": "The page you are looking for could not be found."},
]


def build():
    for p in PAGES:
        html = head(p) + header(p["file"]) + p["fn"]() + footer()
        (ROOT / p["file"]).write_text(html, encoding="utf-8")
        print("wrote", p["file"])
    urls = "\n".join(f"  <url><loc>{SITE}/{'' if p['file'] == 'index.html' else p['file']}</loc></url>"
                     for p in PAGES if p["file"] != "404.html")
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n', encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    build()
