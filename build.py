#!/usr/bin/env python3
"""Static site generator for IB Refrigeration & Engineering.

Header, footer, SEO tags and business details live here once; each page's
body is defined below. Run `python3 build.py` to regenerate the *.html files.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://www.ibrefrigeration.in"

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
    "facebook": "https://www.facebook.com/p/IB-Refrigeration-100064116003102/",
    "youtube": "https://www.youtube.com/channel/UCSVmhit9ZlcpdIbkuGgCBIw",
    "justdial": "https://www.justdial.com/Nagpur/I-B-Refrigeration-Engineering-Near-Railway-Bridge-Gaddi-Godam/0712PX712-X712-170708125045-S6M7_BZDET",
    "indiamart": "https://www.indiamart.com/ibrefrigeration/",
    "gmaps": "https://www.google.com/maps/search/?api=1&query=I+B+Refrigeration+%26+Engineering+Gaddigodam+Kamptee+Road+Nagpur",
    "gmaps_reviews": "https://www.google.com/search?q=I+B+Refrigeration+%26+Engineering+Gaddigodam+Nagpur+reviews",
    "gmaps_office": "https://www.google.com/maps/search/?api=1&query=Nalsahab+Chowk+Hansapuri+Nagpur",
    "embed_workshop": "https://maps.google.com/maps?q=I%20B%20Refrigeration%20%26%20Engineering%2C%20Gaddigodam%2C%20Kamptee%20Road%2C%20Nagpur&z=16&output=embed",
    "embed_office": "https://maps.google.com/maps?q=Nalsahab%20Chowk%2C%20Hansapuri%2C%20Nagpur&z=16&output=embed",
    "rating": "4.9",
    "rating_count": "58",
    "since": 2007,
}
WA = f"https://wa.me/{BIZ['whatsapp']}?text=" + "Hi%20IB%20Refrigeration%2C%20I%20would%20like%20a%20quote."

NAV = [
    ("index.html", "Home"),
    ("about.html", "About"),
    ("products.html", "Products"),
    ("services.html", "Services"),
    ("gallery.html", "Gallery"),
    ("reviews.html", "Reviews"),
    ("contact.html", "Contact"),
]

# ---------------------------------------------------------------- icons
I = {
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.1 8.1 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.8L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6Z"/></svg>',
    "fb": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.5c-4 0-4.9 3-4.9 4.9v2.1H6.8v4.1h2.3V22.5H14V12.6h3.3l.4-4.1H14Z"/></svg>',
    "yt": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/></svg>',
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
    "star": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
}

LOGO = """<svg class="brand-mark" viewBox="0 0 120 76" aria-hidden="true">
  <defs>
    <linearGradient id="lg-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3e8f0"/><stop offset="1" stop-color="#b9c3d3"/></linearGradient>
    <linearGradient id="lg-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8aa0"/><stop offset=".5" stop-color="#e9edf3"/><stop offset="1" stop-color="#6b788d"/></linearGradient>
  </defs>
  <ellipse cx="60" cy="38" rx="57" ry="35" fill="url(#lg-ring)"/>
  <ellipse cx="60" cy="38" rx="52" ry="30.5" fill="url(#lg-steel)"/>
  <path d="M18 22c18-16 64-20 86-4" fill="none" stroke="#d6262f" stroke-width="5" stroke-linecap="round"/>
  <text x="60" y="54" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="42" fill="#0a1733" letter-spacing="-2">IB</text>
</svg>"""


def brand():
    return f"""<a class="brand" href="index.html" aria-label="IB Refrigeration &amp; Engineering — Home">{LOGO}
      <span class="brand-text"><span class="brand-name">IB Refrigeration</span><span class="brand-sub">&amp; Engineering · Nagpur</span></span></a>"""


def head(page):
    title, desc, path = page["title"], page["desc"], page["file"]
    url = f"{SITE}/" + ("" if path == "index.html" else path)
    ld = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": SITE + "/#business",
        "name": BIZ["name"],
        "description": "Manufacturer of display counters, food carts, commercial refrigeration, kitchen equipment and all types of SS works in Nagpur.",
        "url": SITE,
        "logo": SITE + "/assets/img/favicon.svg",
        "image": SITE + "/assets/img/og-image.jpg",
        "email": BIZ["email"],
        "telephone": ["+91-" + BIZ["iqbal"][1], "+91-" + BIZ["iqbal"][2], "+91-" + BIZ["amaan"][1], "+91-712-2533915"],
        "foundingDate": str(BIZ["since"]),
        "taxID": BIZ["gst"],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ward No. 63, House No. 659, Near Railway Bridge, Kamptee Road, Gaddigodam",
            "addressLocality": "Nagpur", "addressRegion": "Maharashtra", "postalCode": "440001", "addressCountry": "IN",
        },
        "areaServed": ["Nagpur", "Vidarbha", "Maharashtra", "Madhya Pradesh", "Chhattisgarh", "Telangana"],
        "aggregateRating": {"@type": "AggregateRating", "ratingValue": BIZ["rating"], "reviewCount": BIZ["rating_count"], "bestRating": "5"},
        "sameAs": [BIZ["facebook"], BIZ["youtube"], BIZ["justdial"], BIZ["indiamart"]],
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
<meta name="theme-color" content="#0a1733">
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
"""


CURRENT = ' aria-current="page"'


def header(active):
    links = "\n".join(
        f'        <a href="{f}"{CURRENT if f == active else ""}>{n}</a>' for f, n in NAV
    )
    iq = BIZ["iqbal"]
    return f"""<div class="topbar">
  <div class="container">
    <div class="topbar-left">
      <a href="tel:+91{iq[1]}">{I['phone']}+91 {iq[1][:5]} {iq[1][5:]}</a>
      <a href="mailto:{BIZ['email']}" class="hide-sm">{I['mail']}{BIZ['email']}</a>
    </div>
    <div class="topbar-right">
      <span>{I['pin']}Gaddigodam, Kamptee Road, Nagpur</span>
      <a href="{BIZ['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{I['fb']}</a>
      <a href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{I['yt']}</a>
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
      <a class="btn btn-primary btn-sm btn-quote" href="contact.html#quote">Get a Quote</a>
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
        <h2>Planning a new outlet, kitchen or counter?</h2>
        <p>Share your space and menu — we'll design, fabricate and install it, made to measure in Nagpur.</p>
      </div>
      <div class="actions">
        <a class="btn btn-whatsapp" href="{WA}" target="_blank" rel="noopener">{I['wa']}WhatsApp Us</a>
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
        <p>Manufacturer of bakery, hotel &amp; kitchen equipment, refrigeration, food counters and all types of stainless steel works — crafted in Nagpur since {BIZ['since']}.</p>
        <div class="socials">
          <a href="{BIZ['facebook']}" target="_blank" rel="noopener" aria-label="Facebook">{I['fb']}</a>
          <a href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="YouTube">{I['yt']}</a>
          <a href="{WA}" target="_blank" rel="noopener" aria-label="WhatsApp">{I['wa']}</a>
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
          <li>{I['pin']}<span><b style="color:#fff">Workshop:</b> {BIZ['workshop']}</span></li>
          <li>{I['pin']}<span><b style="color:#fff">Office:</b> {BIZ['office']}</span></li>
          <li>{I['phone']}<span><a href="tel:+91{iq[1]}">{iq[1]}</a> · <a href="tel:+91{iq[2]}">{iq[2]}</a><br><a href="tel:+91{am[1]}">{am[1][:5]}-{am[1][5:]}</a> · <a href="tel:+917122533915">{BIZ['workshop_phone']}</a></span></li>
          <li>{I['mail']}<a href="mailto:{BIZ['email']}">{BIZ['email']}</a></li>
        </ul>
      </div>
    </div>
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


def page_hero(title, sub, crumb):
    return f"""<section class="page-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
    <h1>{title}</h1>
    <p>{sub}</p>
  </div>
</section>
"""


def feature(icon, title, text, d=""):
    return f"""<div class="feature reveal {d}"><div class="feature-ico">{I[icon]}</div><h3>{title}</h3><p>{text}</p></div>"""


YEARS = 2026 - BIZ["since"]

# ---------------------------------------------------------------- pages
def home():
    cats = [
        ("display", "Display Counters", "Sweet, bakery & snacks counters with glass & LED.", "m-bend-display-counter", 6),
        ("carts", "Food Carts & Stalls", "Pani puri, chaat, momos & food service carts.", "food-service-cart", 7),
        ("shawarma", "Shawarma Machines", "Gas, automatic & table-top shawarma units.", "automatic-shawarma-machine", 5),
        ("refrigeration", "Commercial Refrigeration", "SS refrigerators, chest units & freezers.", "four-door-refrigerator", 5),
        ("cooking", "Cooking Ranges & Bhatti", "Chinese ranges, burners & gas bhattis.", "triple-burner-chinese-range", 6),
        ("coolers", "Water Coolers", "40 L to 150 L stainless steel coolers.", "commercial-water-cooler", 5),
        ("steel", "SS Tables & Kitchen", "Prep tables, bain-marie & SS fabrication.", "ss-preparation-table", 5),
    ]
    cat_html = "\n".join(
        f"""<a class="cat-card reveal {'reveal-d' + str(i % 4) if i % 4 else ''}" href="products.html?cat={c}">
        <span class="cat-count">{n} models</span>
        <div class="cat-media"><img src="assets/img/products/{img}.jpg" alt="{t}" loading="lazy"></div>
        <div class="cat-body"><h3>{t}</h3><p>{d}</p></div><span class="cat-arrow">{I['arrow']}</span></a>"""
        for i, (c, t, d, img, n) in enumerate(cats)
    )
    cat_html += f"""
      <a class="cat-card reveal reveal-d3" href="services.html" style="background:linear-gradient(160deg,var(--navy-800),var(--navy-950));border:none;color:#fff;justify-content:center;padding:32px">
        <div class="feature-ico" style="background:rgba(255,255,255,.1);color:#fff">{I['kitchen']}</div>
        <h3 style="color:#fff;font-size:22px">Complete Restaurant Kitchens</h3>
        <p style="color:#b7c5de;font-size:15px;margin:0">Turnkey design, fabrication &amp; installation for hotels, restaurants and canteens.</p>
        <span class="cat-arrow" style="background:var(--red-600);color:#fff">{I['arrow']}</span></a>"""

    marquee_items = ["Display Counters", "Pani Puri Stalls", "Shawarma Machines", "Commercial Refrigerators", "Water Coolers",
                     "Chinese Cooking Ranges", "Momo Counters", "Bain Marie", "SS Kitchen Equipment", "Food Carts", "Deep Freezers", "Gas Bhatti"]
    mq = "".join(f"<span>{m}</span>" for m in marquee_items)

    return page_hero_none() + f"""<section class="hero">
  <div class="container">
    <div>
      <span class="hero-badge reveal"><b>Since {BIZ['since']}</b> Nagpur's trusted SS fabrication workshop</span>
      <h1 class="reveal reveal-d1">Display counters &amp; kitchens <span class="shine">built to sell.</span></h1>
      <p class="lead reveal reveal-d2">IB Refrigeration &amp; Engineering designs and manufactures display counters, food carts, shawarma machines, commercial refrigeration and complete restaurant kitchens — in heavy-duty stainless steel, made to your exact size and brand.</p>
      <div class="hero-actions reveal reveal-d3">
        <a class="btn btn-red" href="contact.html#quote">Get a Free Quote {I['arrow']}</a>
        <a class="btn btn-light" href="products.html">Explore Products</a>
      </div>
      <div class="hero-trust reveal reveal-d3">
        <div><span class="stars">★★★★★</span><strong>{BIZ['rating']}/5</strong>{BIZ['rating_count']} ratings on Justdial</div>
        <div><strong>{YEARS}+ yrs</strong>of fabrication experience</div>
        <div><strong>40+</strong>product designs</div>
      </div>
    </div>
    <div class="hero-visual reveal reveal-d2" aria-hidden="true">
      <div class="hero-orbit"></div><div class="hero-orbit two"></div>
      <div class="hero-card c4"><img src="assets/img/products/four-door-refrigerator.jpg" alt=""></div>
      <div class="hero-card c1"><img src="assets/img/products/tandoori-snacks-counter.jpg" alt=""></div>
      <div class="hero-card c2"><img src="assets/img/products/sweet-display-counter.jpg" alt=""></div>
      <div class="hero-card c3"><img src="assets/img/products/automatic-shawarma-machine.jpg" alt=""></div>
      <div class="hero-chip k1"><span class="ico">{I['ruler']}</span><div><b>Made to measure</b><span>Any size, any brand</span></div></div>
      <div class="hero-chip k2"><span class="ico red">{I['shield']}</span><div><b>SS 304 build</b><span>Rust-free &amp; hygienic</span></div></div>
    </div>
  </div>
</section>
<div class="marquee" aria-hidden="true"><div class="marquee-track">{mq}{mq}</div></div>

<section class="section section-tint" style="padding-top:0">
  <div class="container">
    <div class="stats stats-floating" style="margin-top:56px">
      <div class="stat reveal"><div class="stat-num"><span data-count="{YEARS}">{YEARS}</span><sup>+</sup></div><div class="stat-label">Years of manufacturing</div></div>
      <div class="stat reveal reveal-d1"><div class="stat-num"><span data-count="40">40</span><sup>+</sup></div><div class="stat-label">Product designs</div></div>
      <div class="stat reveal reveal-d2"><div class="stat-num"><span data-count="{BIZ['rating']}">{BIZ['rating']}</span><sup>★</sup></div><div class="stat-label">Average customer rating</div></div>
      <div class="stat reveal reveal-d3"><div class="stat-num">2</div><div class="stat-label">Workshop &amp; office in Nagpur</div></div>
    </div>
  </div>
</section>

<section class="section section-tint" style="padding-top:40px">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">What we build</span>
      <h2>A unique range of display counters &amp; restaurant kitchens</h2>
      <p>From a single pani puri thela to a full hotel kitchen — every unit is fabricated in our own Nagpur workshop.</p>
    </div>
    <div class="cat-grid">
      {cat_html}
    </div>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="split-media reveal">
      <div class="media-stack">
        <div class="tile"><img src="assets/img/products/display-counter.jpg" alt="Illuminated display counter" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/momos-counter.jpg" alt="Momo's counter" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/commercial-refrigerator.jpg" alt="Commercial refrigerator" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/three-burner-cooking-range.jpg" alt="Three burner cooking range" loading="lazy"></div>
      </div>
      <div class="exp-badge"><div><b>{YEARS}+</b><span>Years of<br>craft</span></div></div>
    </div>
    <div class="reveal reveal-d1">
      <span class="eyebrow">Why IB Refrigeration</span>
      <h2 style="font-size:clamp(30px,4vw,46px)">Manufacturer prices. <span class="text-gradient">Showroom finish.</span></h2>
      <p class="lead">You deal directly with the people who cut, weld and polish your equipment. No middlemen, no compromises on steel — just honest workmanship that lasts.</p>
      <ul class="checklist">
        <li><div><b>Direct from the manufacturer</b><span>Factory pricing from our own workshop on Kamptee Road.</span></div></li>
        <li><div><b>Fully customised</b><span>Size, layout, finish, lighting and branding built around your shop.</span></div></li>
        <li><div><b>Refrigeration + fabrication under one roof</b><span>Cooling, heating and stainless steel work handled by one team.</span></div></li>
        <li><div><b>Maintenance &amp; repair support</b><span>We service what we sell — and repair other brands too.</span></div></li>
      </ul>
      <a class="btn btn-primary" href="about.html">Our Story {I['arrow']}</a>
    </div>
  </div>
</section>

<section class="section section-dark">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">How we work</span>
      <h2>From idea to installed in four steps</h2>
      <p>A simple, transparent process — you see drawings before we cut a single sheet of steel.</p>
    </div>
    <div class="process">
      <div class="step reveal"><div class="step-num"></div><h3>Consult</h3><p>Call or WhatsApp us with your space, menu and budget. We visit site when needed.</p></div>
      <div class="step reveal reveal-d1"><div class="step-num"></div><h3>Design</h3><p>We propose size, layout, materials and branding with a clear quotation.</p></div>
      <div class="step reveal reveal-d2"><div class="step-num"></div><h3>Fabricate</h3><p>Your unit is built in our workshop with food-grade stainless steel.</p></div>
      <div class="step reveal reveal-d3"><div class="step-num"></div><h3>Deliver &amp; Install</h3><p>We deliver, install and test — and stay on call for service.</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal" style="display:flex;justify-content:space-between;align-items:end;gap:24px;max-width:none;flex-wrap:wrap">
      <div style="max-width:640px"><span class="eyebrow">Best sellers</span><h2>Popular with Nagpur's food businesses</h2></div>
      <a class="btn btn-ghost" href="products.html">View all products {I['arrow']}</a>
    </div>
    <div class="product-grid" id="featured-products" data-ids="tandoori-snacks-counter,pani-puri-thela,automatic-shawarma-machine,m-bend-display-counter,momos-counter,four-door-refrigerator,chinese-cooking-range,commercial-water-cooler"></div>
  </div>
</section>

<section class="section section-tint">
  <div class="container">
    <div class="section-head center reveal">
      <span class="eyebrow">Who we serve</span>
      <h2>Trusted across industries</h2>
    </div>
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
    <div class="rating-hero reveal">
      <div class="rating-big"><b>{BIZ['rating']}</b><div class="stars">★★★★★</div><small>{BIZ['rating_count']} ratings on Justdial</small></div>
      <div>
        <span class="eyebrow">Customer love</span>
        <h2 style="font-size:clamp(24px,3vw,34px)">Rated {BIZ['rating']} out of 5 by our customers</h2>
        <p class="lead" style="font-size:17px">Read what business owners say about our products and service on Google and Justdial.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a class="btn btn-primary" href="reviews.html">Read Reviews {I['arrow']}</a>
          <a class="btn btn-ghost" href="{BIZ['gmaps_reviews']}" target="_blank" rel="noopener">See us on Google</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="container">
    <div class="video-card reveal">
      <div>
        <span class="eyebrow" style="color:#ff8d93">Watch us work</span>
        <h2>See our counters &amp; machines in action</h2>
        <p>Product walkthroughs, workshop builds and installation videos on our YouTube channel.</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
          <a class="btn btn-red" href="{BIZ['youtube']}" target="_blank" rel="noopener">{I['yt']}Visit YouTube Channel</a>
          <a class="btn btn-light" href="{BIZ['facebook']}" target="_blank" rel="noopener">{I['fb']}Follow on Facebook</a>
        </div>
      </div>
      <a class="video-thumb" href="{BIZ['youtube']}" target="_blank" rel="noopener" aria-label="Open YouTube channel">
        <img src="assets/img/products/food-service-cart.jpg" alt="" loading="lazy">
        <span class="play">{I['play']}</span>
      </a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">FAQ</span><h2>Questions we hear often</h2></div>
    <div class="faq reveal">
      <details><summary>Do you make equipment to custom sizes?</summary><p>Yes. Almost everything we build is made to order — length, height, number of shelves, burners or compartments, lighting and branding can all be tailored to your space and menu.</p></details>
      <details><summary>What material do you use?</summary><p>We work primarily in food-grade stainless steel (SS 304 / SS 202 as per budget), toughened glass and branded compressors for refrigeration units. We'll explain options clearly in your quotation.</p></details>
      <details><summary>Do you deliver outside Nagpur?</summary><p>Yes. We regularly supply across Vidarbha and Maharashtra and can arrange transport to neighbouring states. Ask us for delivery charges to your city.</p></details>
      <details><summary>How long does manufacturing take?</summary><p>Standard counters and carts are typically ready in 7–15 days depending on size and workload. Full kitchens are scheduled after the design is finalised.</p></details>
      <details><summary>Do you offer maintenance and repair?</summary><p>Yes — maintenance and repair of refrigeration and kitchen equipment is one of our core services, for our own products and other brands.</p></details>
    </div>
  </div>
</section>
""" + cta_band()


def page_hero_none():
    return ""


def about():
    iq, am = BIZ["iqbal"], BIZ["amaan"]
    return page_hero("Crafting stainless steel for Nagpur's food businesses since " + str(BIZ["since"]),
                     "A family-run manufacturer of display counters, refrigeration and kitchen equipment — built on honest workmanship.", "About") + f"""
<section class="section">
  <div class="container split">
    <div class="reveal">
      <span class="eyebrow">Our story</span>
      <h2 style="font-size:clamp(30px,4vw,44px)">From a small workshop to a name trusted across Vidarbha</h2>
      <p class="lead">IB Refrigeration &amp; Engineering started in {BIZ['since']} in Nagpur as a sole-proprietorship workshop with one goal: build commercial kitchen and refrigeration equipment that works hard and looks great.</p>
      <p>Today our team of skilled fabricators, welders and refrigeration technicians manufactures a comprehensive range — display counters, commercial refrigerators, gas bhattis, stainless steel tandoors, sinks, racks, wall shelves, food carts, shawarma machines, water coolers and complete restaurant kitchens.</p>
      <p>Every product is made from quality raw material sourced from reliable vendors, and finished in our own workshop at Gaddigodam, Kamptee Road. That's why bakeries, hotels, caterers and street-food entrepreneurs keep coming back — and sending their friends.</p>
    </div>
    <div class="split-media reveal reveal-d1">
      <div class="media-stack">
        <div class="tile"><img src="assets/img/products/shawarma-machine-counter.jpg" alt="Shawarma counter" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/pani-puri-counter.jpg" alt="Pani puri counter" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/water-cooler-80l.jpg" alt="Water cooler" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/ss-preparation-table.jpg" alt="SS preparation table" loading="lazy"></div>
      </div>
      <div class="exp-badge"><div><b>{BIZ['since']}</b><span>Established</span></div></div>
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">What drives us</span><h2>Our promise on every job</h2></div>
    <div class="feature-grid">
      {feature('shield', 'Quality steel, always', 'Food-grade stainless steel, proper gauges and clean welds — no shortcuts hidden behind panels.')}
      {feature('ruler', 'Made for your space', 'We measure, design and build around your shop, kitchen and workflow.', 'reveal-d1')}
      {feature('rupee', 'Fair, transparent pricing', 'Manufacturer-direct quotes with clear specifications. No surprises on delivery.', 'reveal-d2')}
      {feature('clock', 'On-time delivery', 'We plan production carefully so your outlet opens on the day you promised your customers.')}
      {feature('wrench', 'Service after sale', 'Maintenance and repair support from the same team that built your equipment.', 'reveal-d1')}
      {feature('users', 'Skilled in-house team', 'Fabricators, welders and refrigeration technicians working together under one roof.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Journey</span><h2>Milestones</h2></div>
    <div class="timeline">
      <div class="t-item reveal"><small>{BIZ['since']}</small><h3>Workshop founded in Nagpur</h3><p>Started fabricating stainless steel counters and repairing refrigeration equipment for local businesses.</p></div>
      <div class="t-item reveal"><small>Growth</small><h3>Refrigeration &amp; display counters</h3><p>Expanded into cold display counters, commercial refrigerators, deep freezers and water coolers.</p></div>
      <div class="t-item reveal"><small>Street-food boom</small><h3>Branded carts &amp; stalls</h3><p>Became a go-to maker of pani puri thelas, chaat stalls, momo counters and shawarma machines across Vidarbha.</p></div>
      <div class="t-item reveal"><small>Today</small><h3>Complete restaurant kitchens</h3><p>Turnkey kitchens for hotels, restaurants and canteens — plus maintenance &amp; repair from our Gaddigodam workshop and Hansapuri office.</p></div>
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">The people behind IB</span><h2>Talk to us directly</h2></div>
    <div class="people">
      <div class="person reveal"><div class="avatar">SI</div><div><h3>{iq[0]}</h3><p>Proprietor · Sales, design &amp; quotations</p><a href="tel:+91{iq[1]}">+91 {iq[1]}</a><br><a href="tel:+91{iq[2]}">+91 {iq[2]}</a></div></div>
      <div class="person reveal reveal-d1"><div class="avatar" style="background:linear-gradient(135deg,var(--red-500),var(--navy-700))">SA</div><div><h3>{am[0]}</h3><p>Projects, installation &amp; service</p><a href="tel:+91{am[1]}">+91 {am[1][:5]} {am[1][5:]}</a></div></div>
    </div>
    <div class="facts reveal" style="margin-top:40px">
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
    return page_hero("Products built for busy kitchens &amp; counters",
                     "Browse our range of display counters, carts, shawarma machines, refrigeration, cooking ranges and SS furniture. Every product can be customised.", "Products") + f"""
<div class="catalog-bar">
  <div class="container">
    <div class="filters" id="filters" role="toolbar" aria-label="Filter by category"></div>
    <label class="search"><span class="sr-only">Search products</span>{I['search']}<input type="search" id="product-search" placeholder="Search products…" autocomplete="off"></label>
  </div>
</div>
<section class="section" style="padding-top:40px">
  <div class="container">
    <p id="product-count" style="color:var(--steel-500);margin-bottom:20px" aria-live="polite"></p>
    <div class="product-grid" id="product-grid"></div>
  </div>
</section>
<section class="section section-tint">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow">Also manufactured</span><h2>Don't see it? We probably make it.</h2><p>We also fabricate these on order — and anything else you can sketch in stainless steel.</p></div>
    <div class="also-make reveal">{also}</div>
  </div>
</section>
""" + cta_band()


def services():
    return page_hero("End-to-end fabrication, refrigeration &amp; service",
                     "Design, manufacturing, installation, maintenance and repair — one team for everything your kitchen or counter needs.", "Services") + f"""
<section class="section">
  <div class="container">
    <div class="feature-grid">
      {feature('kitchen', 'Restaurant Kitchen Setup', 'Turnkey commercial kitchens for hotels, restaurants, cloud kitchens and canteens — layout planning, fabrication and installation.')}
      {feature('cart', 'Food Carts &amp; Stalls', 'Branded pani puri, chaat, momo, pav bhaji and nashta stalls and food carts, ready for business.', 'reveal-d1')}
      {feature('snow', 'Commercial Refrigeration', 'Display coolers, SS refrigerators, deep freezers, chest freezers, milk chillers and water coolers.', 'reveal-d2')}
      {feature('flame', 'Cooking Equipment', 'Gas bhattis, Chinese ranges, burners, tandoors, bain-marie, chapati bhatti and shawarma machines.')}
      {feature('ruler', 'Custom SS Fabrication', 'Tables, racks, sinks, shelves, hoods, cabinets and any custom stainless steel work you need.', 'reveal-d1')}
      {feature('wrench', 'Maintenance &amp; Repair', 'Gas charging, compressor and thermostat repair, re-welding, re-polishing and upgrades for all brands.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section section-tint">
  <div class="container split">
    <div class="reveal">
      <span class="eyebrow">Turnkey kitchens</span>
      <h2 style="font-size:clamp(30px,4vw,44px)">One partner for your entire kitchen</h2>
      <p class="lead">Opening a restaurant, hotel or canteen? We plan the workflow — receiving, storage, prep, cooking, service and washing — and build every piece in stainless steel.</p>
      <ul class="checklist">
        <li><div><b>Site visit &amp; layout planning</b><span>Optimised for space, safety and speed of service.</span></div></li>
        <li><div><b>Cooking line &amp; exhaust</b><span>Ranges, bhattis, tandoors, hoods and work tables.</span></div></li>
        <li><div><b>Cold storage</b><span>Refrigerators, freezers and under-counter chillers.</span></div></li>
        <li><div><b>Front-of-house counters</b><span>Display, billing and service counters with your branding.</span></div></li>
      </ul>
      <a class="btn btn-primary" href="contact.html?need=Complete%20Restaurant%20Kitchen#quote">Plan My Kitchen {I['arrow']}</a>
    </div>
    <div class="split-media reveal reveal-d1">
      <div class="media-stack">
        <div class="tile"><img src="assets/img/products/cooking-range.jpg" alt="Cooking range" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/bain-marie.jpg" alt="Bain marie" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/vertical-door-refrigerator.jpg" alt="Refrigerator" loading="lazy"></div>
        <div class="tile"><img src="assets/img/products/restaurant-ss-table.jpg" alt="SS table" loading="lazy"></div>
      </div>
    </div>
  </div>
</section>

<section class="section section-dark">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Repair &amp; maintenance</span><h2>Keep your equipment running</h2><p>Downtime costs money. Our technicians respond quickly across Nagpur.</p></div>
    <div class="feature-grid">
      {feature('snow', 'Refrigeration repair', 'Gas refilling, compressor replacement, thermostat and cooling issues on counters, fridges and freezers.')}
      {feature('flame', 'Burner &amp; gas line service', 'Burner cleaning, valve replacement and safe gas line checks for ranges and bhattis.', 'reveal-d1')}
      {feature('brush', 'Refurbish &amp; re-brand', 'Re-polishing, re-welding, new glass, LED lights and fresh branding for old counters.', 'reveal-d2')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Process</span><h2>What working with us looks like</h2></div>
    <div class="feature-grid">
      {feature('phone', '1. Share your requirement', 'Call, WhatsApp or fill the quote form with your space, photos and budget.')}
      {feature('ruler', '2. Design &amp; quotation', 'We suggest the right design and materials with a clear, itemised quote.', 'reveal-d1')}
      {feature('truck', '3. Build, deliver &amp; install', 'Fabricated in our workshop, delivered to your site and installed by our team.', 'reveal-d2')}
    </div>
  </div>
</section>
""" + cta_band()


def gallery():
    return page_hero("Gallery", "Real products from our workshop — counters, carts, machines and refrigeration we've built for our customers.", "Gallery") + f"""
<section class="section" style="padding-top:56px">
  <div class="container">
    <div class="gallery" id="gallery"></div>
    <div class="reveal" style="text-align:center;margin-top:48px">
      <p class="lead">More photos and videos on our social channels</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-red" href="{BIZ['youtube']}" target="_blank" rel="noopener">{I['yt']}YouTube</a>
        <a class="btn btn-primary" href="{BIZ['facebook']}" target="_blank" rel="noopener">{I['fb']}Facebook</a>
        <a class="btn btn-ghost" href="{BIZ['justdial']}" target="_blank" rel="noopener">Justdial Photos</a>
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


# Paste real customer reviews here (name, text, source, when). Shown on reviews.html.
REVIEWS = [
    ("Justdial customer", "Very nice service.", "Justdial", "Verified Justdial review"),
]


def reviews():
    cards = "\n".join(
        f"""<article class="review reveal"><span class="review-source">{src}</span><div class="stars" aria-label="5 stars">★★★★★</div><q>{text}</q>
        <div class="review-author"><div class="avatar">{''.join(w[0] for w in name.split()[:2]).upper()}</div><div><b>{name}</b><small>{when}</small></div></div></article>"""
        for name, text, src, when in REVIEWS
    )
    return page_hero("What our customers say", f"Rated {BIZ['rating']}★ from {BIZ['rating_count']} ratings on Justdial — and reviewed by business owners on Google.", "Reviews") + f"""
<section class="section">
  <div class="container">
    <div class="rating-hero reveal">
      <div class="rating-big"><b>{BIZ['rating']}</b><div class="stars">★★★★★</div><small>Based on {BIZ['rating_count']} ratings</small></div>
      <div>
        <h2 style="font-size:clamp(22px,2.6vw,30px)">Find us on your favourite platform</h2>
        <p style="color:var(--steel-500)">Our reviews are public and verified. Tap a platform to read them all — or leave one of your own.</p>
        <div class="platforms">
          <a class="platform" href="{BIZ['gmaps_reviews']}" target="_blank" rel="noopener"><span class="platform-logo" style="background:conic-gradient(#ea4335 0 25%,#fbbc05 0 50%,#34a853 0 75%,#4285f4 0)">G</span><div><b>Google Reviews</b><span>Read &amp; write on Google</span></div></a>
          <a class="platform" href="{BIZ['justdial']}" target="_blank" rel="noopener"><span class="platform-logo" style="background:#ff6d00">Jd</span><div><b>Justdial · {BIZ['rating']}★</b><span>{BIZ['rating_count']} ratings</span></div></a>
          <a class="platform" href="{BIZ['indiamart']}" target="_blank" rel="noopener"><span class="platform-logo" style="background:#2e3192">IM</span><div><b>IndiaMART</b><span>Verified supplier</span></div></a>
          <a class="platform" href="{BIZ['facebook']}" target="_blank" rel="noopener"><span class="platform-logo" style="background:#1877f2">{I['fb']}</span><div><b>Facebook</b><span>Follow our work</span></div></a>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="section section-tint">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Testimonials</span><h2>Straight from our customers</h2></div>
    <div class="review-grid">
      {cards}
      <article class="review cta-card reveal">
        <h3>Bought from us?</h3>
        <p>Your feedback helps other business owners choose with confidence. It takes less than a minute.</p>
        <a class="btn btn-whatsapp" href="{BIZ['gmaps_reviews']}" target="_blank" rel="noopener">{I['star']}Write a Google Review</a>
      </article>
      <article class="review cta-card reveal" style="background:linear-gradient(160deg,var(--blue-600),var(--navy-800))">
        <h3>See all {BIZ['rating_count']} ratings</h3>
        <p>Browse every rating and review left for IB Refrigeration &amp; Engineering on Justdial.</p>
        <a class="btn btn-light" href="{BIZ['justdial']}" target="_blank" rel="noopener">Open Justdial {I['arrow']}</a>
      </article>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Visit us</span><h2>Find our workshop on Google Maps</h2></div>
    <div class="map-wrap reveal">
      <iframe src="{BIZ['embed_workshop']}" title="IB Refrigeration &amp; Engineering on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      <div class="map-label"><div><b>IB Refrigeration &amp; Engineering — Workshop</b><span>{BIZ['workshop']}</span></div><a class="btn btn-primary btn-sm" href="{BIZ['gmaps']}" target="_blank" rel="noopener">Open in Google Maps {I['arrow']}</a></div>
    </div>
  </div>
</section>
""" + cta_band()


def contact():
    iq, am = BIZ["iqbal"], BIZ["amaan"]
    return page_hero("Let's build something great together",
                     "Call, WhatsApp or send us your requirement — we usually reply within a few working hours.", "Contact") + f"""
<section class="section">
  <div class="container contact-grid">
    <div class="contact-cards">
      <div class="contact-card reveal"><div class="feature-ico">{I['phone']}</div><div><h3>{iq[0]}</h3><a href="tel:+91{iq[1]}">+91 {iq[1]}</a><a href="tel:+91{iq[2]}">+91 {iq[2]}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['phone']}</div><div><h3>{am[0]}</h3><a href="tel:+91{am[1]}">+91 {am[1][:5]} {am[1][5:]}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['wa']}</div><div><h3>WhatsApp</h3><a href="{WA}" target="_blank" rel="noopener">Chat with us instantly</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['mail']}</div><div><h3>Email &amp; Workshop line</h3><a href="mailto:{BIZ['email']}">{BIZ['email']}</a><a href="tel:+917122533915">{BIZ['workshop_phone']}</a></div></div>
      <div class="contact-card reveal"><div class="feature-ico">{I['clock']}</div><div><h3>Working hours</h3><p>Monday – Saturday · 10:00 AM – 8:00 PM</p></div></div>
    </div>
    <form class="form-card reveal reveal-d1" id="quote-form" novalidate>
      <span class="eyebrow" id="quote">Free quotation</span>
      <h2>Request a quote</h2>
      <p style="color:var(--steel-500)">Tell us what you need. Your message opens in WhatsApp, ready to send.</p>
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
      <p class="form-note">We never share your details. Prefer to talk? Call <a href="tel:+91{iq[1]}" style="color:var(--blue-600);font-weight:600">+91 {iq[1]}</a>.</p>
    </form>
  </div>
</section>
<section class="section section-tint">
  <div class="container">
    <div class="section-head center reveal"><span class="eyebrow">Locations</span><h2>Visit our workshop &amp; office</h2></div>
    <div class="map-grid">
      <div class="map-wrap reveal">
        <iframe src="{BIZ['embed_workshop']}" title="Workshop location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <div class="map-label"><div><b>Workshop</b><span>{BIZ['workshop']}</span></div><a class="btn btn-primary btn-sm" href="{BIZ['gmaps']}" target="_blank" rel="noopener">Directions</a></div>
      </div>
      <div class="map-wrap reveal reveal-d1">
        <iframe src="{BIZ['embed_office']}" title="Office location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <div class="map-label"><div><b>Office</b><span>{BIZ['office']}</span></div><a class="btn btn-primary btn-sm" href="{BIZ['gmaps_office']}" target="_blank" rel="noopener">Directions</a></div>
      </div>
    </div>
  </div>
</section>
"""


def notfound():
    return f"""<section class="section notfound"><div class="container">
  <b class="text-gradient">404</b>
  <h1 style="font-size:32px">This page has gone cold.</h1>
  <p class="lead">The page you're looking for doesn't exist — but our counters do.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="index.html">Back to Home</a><a class="btn btn-ghost" href="products.html">View Products</a></div>
</div></section>
"""


PAGES = [
    {"file": "index.html", "fn": home,
     "title": "IB Refrigeration & Engineering | Display Counters, Food Carts & Commercial Kitchen Equipment in Nagpur",
     "desc": "Manufacturer of display counters, pani puri & chaat stalls, shawarma machines, commercial refrigerators, water coolers and complete restaurant kitchens in Nagpur since 2007."},
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
     "title": "Customer Reviews | IB Refrigeration & Engineering — Rated 4.9★",
     "desc": "IB Refrigeration & Engineering is rated 4.9 out of 5 from 58 ratings. Read customer reviews on Google and Justdial and find our Nagpur workshop on Google Maps."},
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
    urls = "\n".join(
        f"  <url><loc>{SITE}/{'' if p['file'] == 'index.html' else p['file']}</loc></url>"
        for p in PAGES if p["file"] != "404.html"
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n', encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")


if __name__ == "__main__":
    build()
