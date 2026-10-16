#!/usr/bin/env python3
"""Static site generator for the MDJ Mortgages concept site.

Run `python3 build.py` to regenerate every page in ./site from the shared
layout and the page content below. No dependencies beyond Python 3.8+.
"""
from pathlib import Path

OUT = Path(__file__).parent / "site"

# --------------------------------------------------------------------------
# Business facts (single source of truth)
# --------------------------------------------------------------------------
BIZ = {
    "name": "MDJ Mortgages",
    "legal": "MDJ Mortgages Ltd",
    "phone": "01256 518318",
    "phone_href": "tel:+441256518318",
    "mobile": "07798 819741",
    "whatsapp": "https://wa.me/447798819741",
    "email": "mark@mdjmortgages.com",
    "calendly": "https://calendly.com/mdjmortgages/free-30-minute-discovery-meeting-clone",
    "office": "Grove House, Lutyens Close, Chineham Court, Basingstoke, RG24 8AG",
    "registered": "28 The Topiary, Lychpit, Basingstoke, Hampshire, RG24 8YX",
    "reviews": "186",
    "domain": "https://www.mdjmortgages.com",
}

AREAS = [
    ("Basingstoke & Deane", ["Basingstoke", "Oakley", "Overton", "Tadley"]),
    ("Hart", ["Hook", "Odiham", "Hartley Wintney", "Fleet"]),
    ("Rushmoor & Surrey Heath", ["Farnborough", "Aldershot", "Camberley"]),
    ("Further afield", ["Reading", "Newbury", "Andover", "Winchester", "Alton"]),
]

REVIEWS = [
    ("George Robinson", "First-time buyer",
     "Mark and Jodie were exceptional. They gave us quality, trusted advice at every step of the process. Clearly outlined what we needed to do. Answered all of our questions very quickly. They found us the best mortgage rates available on the market, as well as assisting with home insurance, life insurance and general tips for purchasing a house. As a first time buyer with no experience purchasing a house, it can be a daunting task. Mark and Jodie made it as simple and easy for us as possible."),
    ("Anna Foster-Ford", "Complex case",
     "Our case definitely wasn't the easiest — if mortgages handed out awards for “most complicated paperwork adventure,” we would have been strong contenders! But Mark and the entire team at MDJ Mortgages handled everything smoothly, quickly, and with incredible professionalism. What seemed impossible to us was just another day at the office for them."),
    ("Justyn Moore", "Remortgage",
     "We have just finished our remortgage with MDJ and it was simple and clear from the outset. Mark’s communication was excellent and in no way excessive which meant that we got the best rate available with zero stress. I would not hesitate to recommend Mark, and Jodie also."),
    ("Ellie Caldwell", "First-time solo buyer",
     "I’ve just completed on my first ever property which was definitely made possible thanks to the help of Mark and Jodie at MDJ Mortgages. I came to them looking for advice really early on when I was just thinking about maybe buying after being sick of renting, and they’ve helped make it a reality. Super helpful team who helped explain everything. Highly recommend."),
    ("Alisha Shepherd", "Home purchase",
     "Mark and Jodie from MDJ Mortgages have been incredible throughout. So professional, diligent and knowledgeable. Our case had a few delays through no fault of MDJ Mortgages but they remained supportive and informative throughout, working incredibly quickly to assist in finding solutions and making everything work."),
    ("Jon Dawson", "Google review",
     "Great service! Mark, Matt and Jodie are very friendly, knowledgeable and professional. They explained the best lenders and options for my circumstances, secured a strong rate and kept me informed throughout."),
    ("Tristan Ware", "Google review",
     "Mark and Jodie made what was a very stressful period, significantly easier."),
    ("Pauly Blunden", "Google review", "Thank you Mark and Jodie, top job."),
]

# --------------------------------------------------------------------------
# Icons (24px stroke icons)
# --------------------------------------------------------------------------
P = {
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "phone": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "home": '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    "key": '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    "truck": '<path d="M10 17h4V5H2v12h3M20 17h2v-3.3a1 1 0 0 0-.2-.6L18.3 9a1 1 0 0 0-.8-.4H14"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    "briefcase": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    "infinity": '<path d="M12 12c-2-2.7-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.3 6-4Zm0 0c2 2.7 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.3-6 4Z"/>',
    "piggy": '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><circle cx="16" cy="11" r=".6" fill="currentColor"/>',
    "building": '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    "heart": '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    "pulse": '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    "umbrella": '<path d="M22 12a10 10 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0M12 2v1"/>',
    "wallet": '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    "calc": '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M16 14v4M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>',
    "check": '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
    "tick": '<path d="M20 6 9 17l-5-5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h10"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "star": '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    "award": '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "file": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
    "alert": '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    "chat": '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5h.5a8.5 8.5 0 0 1 8 8z"/>',
    "video": '<path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    "gift": '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    "sparkle": '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/><path d="M19 17v4M17 19h4"/>',
    "percent": '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    "scale": '<path d="m16 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1ZM2 16l3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1ZM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    "layers": '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    "google": '<path d="M21.8 10.2H12v3.9h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.7 0-.7 0-1.3-.2-1.9Z" fill="#4285F4" stroke="none"/><path d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22Z" fill="#34A853" stroke="none"/><path d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9.2z" fill="#FBBC05" stroke="none"/><path d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.7 9.3 5.9 12 5.9Z" fill="#EA4335" stroke="none"/>',
}
SOLID = {
    "whatsapp": '<path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 12 2.2a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.7A11.8 11.8 0 0 0 24 12c0-3.2-1.2-6.1-3.5-8.4z"/>',
    "facebook": '<path d="M14 8V6c0-.9.6-1 1-1h3V1h-4c-3.5 0-4.5 2.6-4.5 4.6V8H7v4h2.5v11H14V12h3.3l.5-4z"/>',
    "instagram": '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM23.9 7c-.1-1.9-.5-3.6-1.9-5S18.9.2 17 .1C15.1 0 8.9 0 7 .1 5.1.2 3.4.6 2 2S.2 5.1.1 7C0 8.9 0 15.1.1 17c.1 1.9.5 3.6 1.9 5s3.1 1.8 5 1.9c1.9.1 8.1.1 10 0 1.9-.1 3.6-.5 5-1.9s1.8-3.1 1.9-5c.1-1.9.1-8.1 0-10zm-2.6 12.2a4.1 4.1 0 0 1-2.3 2.3c-1.6.6-5.4.5-7 .5s-5.4.1-7-.5a4.1 4.1 0 0 1-2.3-2.3c-.6-1.6-.5-5.4-.5-7.2s-.1-5.4.5-7a4.1 4.1 0 0 1 2.3-2.3c1.6-.6 5.4-.5 7-.5s5.4-.1 7 .5a4.1 4.1 0 0 1 2.3 2.3c.6 1.6.5 5.4.5 7s.1 5.6-.5 7.2z"/>',
    "linkedin": '<path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zm1.8 13.1H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/>',
    "youtube": '<path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/>',
    "tiktok": '<path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.7V9.5a6.3 6.3 0 1 0 5.4 6.2V8.8a8.2 8.2 0 0 0 4.8 1.5V6.9l-1-.2z"/>',
}


def ic(name, cls=""):
    c = f' class="{cls}"' if cls else ""
    if name in SOLID:
        return f'<svg{c} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{SOLID[name]}</svg>'
    return (f'<svg{c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{P[name]}</svg>')


ARROW = ic("arrow")
STARS = '<span class="stars" aria-label="5 out of 5 stars">★★★★★</span>'

# --------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------
NAV = [
    ("about.html", "About"),
    ("mortgages.html", "Mortgages"),
    ("equity-release.html", "Equity Release"),
    ("protection.html", "Protection"),
    ("calculators.html", "Calculators"),
    ("fees.html", "Fees"),
    ("reviews.html", "Reviews"),
]

MEGA = [
    ("mortgages.html#first-time-buyers", "key", "First-time buyers", "From deposit to keys, step by step"),
    ("mortgages.html#moving-home", "truck", "Moving home", "Port, borrow more or start fresh"),
    ("mortgages.html#remortgage", "refresh", "Remortgaging", "Don’t drift onto your lender’s SVR"),
    ("specialist.html#self-employed", "briefcase", "Self-employed", "Contractors, directors & sole traders"),
    ("specialist.html#later-life", "sun", "Later life & retirement", "Borrowing into retirement"),
    ("specialist.html", "layers", "All specialist lending", "Commercial, foreign national & more"),
]


def header(active):
    links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if active == href or (href == "mortgages.html" and active == "specialist.html") else ""
        if href == "mortgages.html":
            items = "".join(
                f'<a class="mega-link" href="{h}"><span class="mega-icon">{ic(i)}</span><span><strong>{t}</strong><span>{d}</span></span></a>'
                for h, i, t, d in MEGA)
            links.append(f'''<div class="nav-item"><a class="nav-link" href="{href}"{cur}>{label} {ic("chev")}</a>
<div class="mega">{items}<div class="mega-feature"><div><span class="eyebrow">Free first meeting</span><h4>Not sure where to start?</h4><p>Book a 30-minute discovery call and we’ll map out your options, with no obligation.</p></div><a class="btn btn-gold btn-sm" href="{BIZ["calendly"]}" target="_blank" rel="noopener">Book a call {ARROW}</a></div></div></div>''')
        else:
            links.append(f'<div class="nav-item"><a class="nav-link" href="{href}"{cur}>{label}</a></div>')

    drawer_links = []
    for href, label in [("index.html", "Home")] + NAV + [("areas.html", "Areas we cover"), ("contact.html", "Contact")]:
        drawer_links.append(f'<a href="{href}">{label} {ARROW}</a>')
        if href == "mortgages.html":
            drawer_links += [f'<a class="sub" href="{h}">{t}</a>' for h, _, t, _ in MEGA]

    return f'''<a class="skip-link" href="#main">Skip to content</a>
<div class="topbar"><div class="container">
  <div class="topbar-left">
    <a class="topbar-item" href="{BIZ["phone_href"]}">{ic("phone")} {BIZ["phone"]}</a>
    <a class="topbar-item hide-sm" href="mailto:{BIZ["email"]}">{ic("mail")} {BIZ["email"]}</a>
    <span class="topbar-item hide-sm">{ic("clock")} Mon–Fri, 9:00–18:00</span>
  </div>
  <div class="topbar-right"><a class="topbar-item" href="reviews.html">{STARS} 5.0 from {BIZ["reviews"]} Google reviews</a></div>
</div></div>
<header class="header"><div class="container">
  <a class="logo" href="index.html" aria-label="MDJ Mortgages home"><span class="logo-mark">MDJ</span><span class="logo-text"><strong>MDJ Mortgages</strong><span>Basingstoke</span></span></a>
  <nav class="nav" aria-label="Main">{"".join(links)}</nav>
  <div class="header-cta">
    <a class="header-phone" href="{BIZ["phone_href"]}">{ic("phone")} {BIZ["phone"]}</a>
    <a class="btn btn-gold btn-sm" href="contact.html">Free consultation {ARROW}</a>
    <button class="burger" aria-label="Open menu" aria-controls="drawer">{ic("menu")}</button>
  </div>
</div></header>
<div class="drawer" id="drawer" aria-label="Menu">
  <div class="drawer-backdrop"></div>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Site menu">
    <div class="drawer-head"><a class="logo" href="index.html"><span class="logo-mark">MDJ</span><span class="logo-text"><strong>MDJ Mortgages</strong><span>Basingstoke</span></span></a><button class="burger drawer-close" style="display:grid" aria-label="Close menu">{ic("x")}</button></div>
    <nav class="drawer-nav">{"".join(drawer_links)}</nav>
    <div class="drawer-foot">
      <a class="btn btn-gold btn-block" href="{BIZ["calendly"]}" target="_blank" rel="noopener">Book a free call {ARROW}</a>
      <a class="btn btn-ghost btn-block" style="color:var(--paper);border-color:rgba(255,255,255,.2)" href="{BIZ["phone_href"]}">{ic("phone")} {BIZ["phone"]}</a>
    </div>
  </div>
</div>'''


def footer():
    town_links = "".join(f'<li><a href="areas.html">Mortgage broker {t}</a></li>' for t in ["Basingstoke", "Fleet", "Farnborough", "Reading", "Winchester"])
    return f'''<footer class="footer"><div class="container">
  <div class="footer-top">
    <div class="footer-brand">
      <a class="logo" href="index.html"><span class="logo-mark">MDJ</span><span class="logo-text"><strong style="color:var(--paper)">MDJ Mortgages</strong><span>Basingstoke</span></span></a>
      <p>Award-winning, whole-of-market mortgage and protection advice for families across Hampshire, Berkshire and Surrey.</p>
      <div class="socials">
        <a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noopener">{ic("facebook")}</a>
        <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noopener">{ic("instagram")}</a>
        <a href="https://www.linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noopener">{ic("linkedin")}</a>
        <a href="https://www.youtube.com/" aria-label="YouTube" target="_blank" rel="noopener">{ic("youtube")}</a>
        <a href="https://www.tiktok.com/" aria-label="TikTok" target="_blank" rel="noopener">{ic("tiktok")}</a>
        <a href="{BIZ["whatsapp"]}" aria-label="WhatsApp" target="_blank" rel="noopener">{ic("whatsapp")}</a>
      </div>
    </div>
    <div><h4>Advice</h4><ul>
      <li><a href="mortgages.html#first-time-buyers">First-time buyers</a></li>
      <li><a href="mortgages.html#moving-home">Moving home</a></li>
      <li><a href="mortgages.html#remortgage">Remortgaging</a></li>
      <li><a href="specialist.html">Specialist mortgages</a></li>
      <li><a href="equity-release.html">Equity release</a></li>
      <li><a href="protection.html">Protection & insurance</a></li>
    </ul></div>
    <div><h4>Company</h4><ul>
      <li><a href="about.html">About us</a></li>
      <li><a href="reviews.html">Reviews</a></li>
      <li><a href="fees.html">Our fees</a></li>
      <li><a href="calculators.html">Calculators</a></li>
      <li><a href="reviews.html#refer">Refer a friend</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul></div>
    <div><h4>Visit us</h4><ul>
      <li>Grove House, Lutyens Close,<br>Chineham Court, Basingstoke<br>RG24 8AG</li>
      <li><a href="{BIZ["phone_href"]}">{BIZ["phone"]}</a></li>
      <li><a href="mailto:{BIZ["email"]}">{BIZ["email"]}</a></li>
      <li>Mon–Fri, 9:00–18:00</li>
    </ul></div>
  </div>
  <div class="footer-legal">
    <div class="fraud">{ic("alert")}<div><strong>Fraud alert:</strong> We will never ask for your bank details in relation to the payment of your deposit. Your solicitor may request payments directly, but always confirm independently (preferably by phone) before transferring funds.</div></div>
    <p style="margin:0"><strong>Your home may be repossessed if you do not keep up repayments on your mortgage.</strong> There may be a fee for arranging your mortgage. The precise amount will depend on your circumstances; we typically charge £295, but it will not exceed £1,000. You may have to pay an early repayment charge to your existing lender if you remortgage. Not all buy-to-let mortgages are regulated by the Financial Conduct Authority. A lifetime mortgage is a loan secured against your home; interest could accumulate over time and reduce the value of your estate.</p>
    <p style="margin:0">MDJ Mortgages Limited is an appointed representative of Stonebridge, a trading style of Stonebridge Mortgage Solutions Limited, which is authorised and regulated by the Financial Conduct Authority. Financial Services Register no. 949077. Registered office: Stonebridge Mortgage Solutions Limited, Regency House, Miles Gray Road, Basildon, Essex, SS14 3FR. MDJ Mortgages Ltd is registered in England and Wales, company no. 12499356. Registered address: {BIZ["registered"]}. Complaints: Stonebridge Mortgage Solutions Ltd, 0345 646 5505, complaints@stonebridgegroup.co.uk. If you are not satisfied, you may be entitled to refer your complaint to the Financial Ombudsman Service.</p>
  </div>
  <div class="footer-bottom"><span>© <span data-year>2026</span> MDJ Mortgages Ltd. All rights reserved.</span><span><a href="areas.html">Areas we cover</a> · <a href="contact.html">Privacy</a> · <a href="contact.html">Cookies</a></span></div>
</div></footer>
<div class="fab">
  <a class="top" href="#main" aria-label="Back to top">{ic("arrow-up")}</a>
  <a class="wa" href="{BIZ["whatsapp"]}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{ic("whatsapp")}</a>
</div>'''


def page(filename, title, description, body):
    canonical = f'{BIZ["domain"]}/{"" if filename == "index.html" else filename}'
    schema = ('{"@context":"https://schema.org","@type":"FinancialService","name":"MDJ Mortgages Ltd",'
              f'"telephone":"+44 1256 518318","email":"{BIZ["email"]}","url":"{BIZ["domain"]}",'
              '"address":{"@type":"PostalAddress","streetAddress":"Grove House, Lutyens Close, Chineham Court",'
              '"addressLocality":"Basingstoke","postalCode":"RG24 8AG","addressCountry":"GB"},'
              '"openingHours":"Mo-Fr 09:00-18:00","areaServed":["Basingstoke","Hampshire","Berkshire","Surrey"],'
              f'"aggregateRating":{{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":"{BIZ["reviews"]}"}}}}')
    html = f'''<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:type" content="website">
<meta property="og:image" content="assets/img/mark.webp">
<meta name="theme-color" content="#0f0d0b">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23c9a25a'/%3E%3Ctext x='32' y='41' font-family='Georgia' font-size='22' text-anchor='middle' fill='%230f0d0b'%3EMDJ%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,0..100;1,9..144,300..600,0..100&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
<script type="application/ld+json">{schema}</script>
</head>
<body>
{header(filename)}
<main id="main">
{body}
</main>
{footer()}
<script src="assets/js/main.js" defer></script>
</body>
</html>
'''
    (OUT / filename).write_text(html, encoding="utf-8")


# --------------------------------------------------------------------------
# Shared blocks
# --------------------------------------------------------------------------
def page_hero(crumb, eyebrow, title, lead, chips=None):
    chips = chips or [
        ("calendar", "Free first appointment", "Face-to-face, video or phone"),
        ("star", f"5.0 from {BIZ['reviews']} reviews", "Rated on Google"),
        ("award", "Award-winning", "2024, 2025 & 2026"),
    ]
    chip_html = "".join(f'<div class="hero-chip reveal reveal-d{k+1}">{ic(i)}<div><strong>{a}</strong><span>{b}</span></div></div>' for k, (i, a, b) in enumerate(chips))
    return f'''<section class="page-hero dark grain"><div class="container">
  <div>
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><span>{crumb}</span></nav>
    <span class="eyebrow">{eyebrow}</span>
    <h1 class="reveal">{title}</h1>
    <p class="lead reveal reveal-d1">{lead}</p>
  </div>
  <div class="page-hero-aside">{chip_html}</div>
</div></section>'''


def cta_band(title="Let’s find the right mortgage for <em class='gold'>you.</em>",
             text="Your first appointment is free and there’s no obligation. Meet us at Chineham Court, on video or over the phone, whichever suits you."):
    return f'''<section class="section-sm"><div class="container">
  <div class="cta-band reveal">
    <div><span class="eyebrow">Free, no-obligation advice</span><h2>{title}</h2><p>{text}</p></div>
    <div class="cta-actions">
      <a class="btn btn-gold" href="{BIZ["calendly"]}" target="_blank" rel="noopener">{ic("calendar")} Book a free 30-min call</a>
      <a class="btn btn-ghost" style="color:var(--paper);border-color:rgba(255,255,255,.22)" href="{BIZ["phone_href"]}">{ic("phone")} Call {BIZ["phone"]}</a>
      <a class="btn btn-ghost" style="color:var(--paper);border-color:rgba(255,255,255,.22)" href="{BIZ["whatsapp"]}" target="_blank" rel="noopener">{ic("whatsapp")} WhatsApp us</a>
    </div>
  </div>
</div></section>'''


def review_card(name, kind, text, short=False):
    if short and len(text) > 260:
        text = text[:text.rfind(" ", 0, 250)] + "…"
    initials = "".join(w[0] for w in name.split()[:2]).upper()
    return f'''<article class="review"><div class="stars" aria-label="5 stars">★★★★★</div><blockquote>“{text}”</blockquote>
<div class="review-author"><span class="initial">{initials}</span><div><strong>{name}</strong><span>{ic("google")} {kind}</span></div></div></article>'''


def reviews_slider(title="Families across Hampshire, <em class='gold'>in their words.</em>"):
    cards = "".join(review_card(*r, short=True) for r in REVIEWS)
    return f'''<section class="section ivory"><div class="container">
  <div class="section-head">
    <div><span class="eyebrow">{BIZ["reviews"]} five-star Google reviews</span><h2 class="reveal">{title}</h2></div>
    <div class="slider-nav"><button class="slider-btn" data-dir="-1" aria-label="Previous reviews">{ic("arrow-left")}</button><button class="slider-btn" data-dir="1" aria-label="Next reviews">{ic("arrow")}</button></div>
  </div>
  <div class="review-slider reveal"><div class="review-track">{cards}</div></div>
  <p style="margin-top:32px"><a class="link-arrow" href="reviews.html">Read more reviews {ARROW}</a></p>
</div></section>'''


def faq(items):
    out = "".join(f'<details class="reveal"><summary>{q}<span class="plus">{ic("plus")}</span></summary><div class="answer"><p>{a}</p></div></details>' for q, a in items)
    return f'<div class="faq">{out}</div>'


def awards_strip(dark=True):
    cls = "dark" if dark else "ivory"
    return f'''<section class="section-sm {cls}"><div class="container center">
  <span class="eyebrow">Recognised for quality</span>
  <div class="awards reveal" style="margin-top:12px">
    <img src="assets/img/award-2026.webp" alt="Quality Business Awards 2026 — The Best Mortgage Broker, Basingstoke and Deane" loading="lazy" width="132" height="112">
    <img src="assets/img/award-2025.webp" alt="Quality Business Awards 2025 winner badge" loading="lazy" width="129" height="112">
    <img src="assets/img/award-2024.webp" alt="Quality Business Awards 2024 winner badge" loading="lazy" width="127" height="112">
    <img class="wide" src="assets/img/three-best-rated.webp" alt="Three Best Rated accreditation" loading="lazy" width="165" height="56" style="background:#fff;border-radius:10px;padding:6px">
  </div>
</div></section>'''


def marquee():
    words = ["First-time buyers", "Remortgages", "Self-employed", "Moving home", "Equity release", "Life insurance", "Foreign nationals", "Retirement lending", "Shared ownership", "Commercial"]
    items = "".join(f'<span class="marquee-item">{w}</span>' for w in words * 2)
    return f'<div class="marquee" aria-hidden="true"><div class="marquee-track">{items}</div></div>'


def checklist(items):
    return '<ul class="checklist">' + "".join(f"<li>{ic('check')}<span>{i}</span></li>" for i in items) + "</ul>"


def detail(id_, icon, kicker, title, lead, body, info=None, notice=None, extra=""):
    info_html = ""
    if info:
        info_html = '<div class="info-grid">' + "".join(f'<div class="info">{ic(i)}<strong>{t}</strong><p>{d}</p></div>' for i, t, d in info) + "</div>"
    notice_html = f'<div class="notice">{ic("info")}<span>{notice}</span></div>' if notice else ""
    return f'''<article class="detail" id="{id_}">
  <div class="detail-side reveal"><div class="card-icon">{ic(icon)}</div><span class="kicker">{kicker}</span><h2>{title}</h2>
    <a class="btn btn-sm" href="contact.html">Talk to an adviser {ARROW}</a></div>
  <div class="detail-body reveal reveal-d1"><p class="lead">{lead}</p>{body}{info_html}{extra}{notice_html}</div>
</article>'''


# --------------------------------------------------------------------------
# Pages
# --------------------------------------------------------------------------
def home():
    services = [
        ("key", "First-time buyers", "We turn a daunting first purchase into a clear plan, from how much you can borrow to collecting the keys.", "mortgages.html#first-time-buyers"),
        ("truck", "Moving home", "Port your deal, borrow more or start fresh. We line up the finance so your chain keeps moving.", "mortgages.html#moving-home"),
        ("refresh", "Remortgaging", "Fixed rate ending? We compare the market up to six months early so you never drift onto a costly SVR.", "mortgages.html#remortgage"),
        ("briefcase", "Self-employed", "Sole traders, directors and contractors. We know which lenders understand your income.", "specialist.html#self-employed"),
        ("sun", "Equity release & later life", "Unlock tax-free cash from your home, or keep borrowing into retirement, with specialist advice.", "equity-release.html"),
        ("shield", "Protection", "Life cover, critical illness and income protection to keep your home and family safe.", "protection.html"),
    ]
    cards = "".join(f'''<a class="service-card reveal reveal-d{(k % 3) + 1}" href="{h}"><span class="card-num">0{k+1}</span><div class="card-icon">{ic(i)}</div><h3>{t}</h3><p>{d}</p><span class="link-arrow">Explore {ARROW}</span></a>'''
                    for k, (i, t, d, h) in enumerate(services))
    steps = [
        ("Free discovery call", "A relaxed 30-minute chat, face-to-face, on video or by phone, to understand your plans and what matters to you."),
        ("We search the market", "We compare thousands of deals and match you with the lenders most likely to say yes to your circumstances."),
        ("We handle the paperwork", "Decision in principle, application, valuation and underwriting. We chase so you don’t have to."),
        ("Keys & beyond", "We stay in touch after completion and review your deal before it ends, so you never overpay."),
    ]
    step_html = "".join(f'<div class="step"><div class="step-num">0{k+1}</div><h3>{t}</h3><p>{d}</p></div>' for k, (t, d) in enumerate(steps))
    hq = '<a class="area hq" href="areas.html">' + ic("pin") + "Basingstoke · HQ</a>"
    towns = hq + "".join(f'<a class="area" href="areas.html">{ic("pin")}{t}</a>' for _, ts in AREAS for t in ts if t != "Basingstoke")
    body = f'''
<section class="hero dark grain">
  <div class="hero-lines"></div>
  <div class="container">
    <div>
      <span class="eyebrow">Basingstoke’s best mortgage broker · 2026</span>
      <h1 class="reveal">The right mortgage, <em class="gold">without the stress.</em></h1>
      <p class="lead reveal reveal-d1">Award-winning, whole-of-market mortgage and protection advice from a friendly local team. First-time buyers, movers, remortgages and self-employed clients across Hampshire and beyond.</p>
      <div class="hero-actions reveal reveal-d2">
        <a class="btn btn-gold" href="{BIZ["calendly"]}" target="_blank" rel="noopener">Book your free consultation {ARROW}</a>
        <a class="btn btn-ghost" href="calculators.html">{ic("calc")} How much can I borrow?</a>
      </div>
      <div class="hero-proof reveal reveal-d3">
        <div class="avatars" aria-hidden="true"><span>GR</span><span>EC</span><span>JM</span><span>AF</span></div>
        <div><strong>{STARS} 5.0 on Google</strong><small>from {BIZ["reviews"]} five-star reviews</small></div>
      </div>
    </div>
    <div class="hero-visual reveal reveal-d2">
      <div class="hero-ring"></div>
      <div class="hero-frame"><img src="assets/img/mark.webp" alt="Mark Jones, Managing Director of MDJ Mortgages" width="900" height="720" fetchpriority="high"></div>
      <img class="fc-badge" src="assets/img/award-2026.webp" alt="Quality Business Awards 2026 badge" width="128" height="108">
      <div class="float-card fc-1"><span class="fc-icon">{ic("calendar")}</span><div><strong>Free first meeting</strong><small>No obligation, no pressure</small></div></div>
      <div class="float-card fc-2"><span class="fc-icon">{ic("search")}</span><div><strong>Whole of market</strong><small>Thousands of deals compared</small></div></div>
    </div>
  </div>
</section>

<section class="trust"><div class="container">
  <div class="trust-item">{ic("star")}<div><strong><span data-count="5.0">5.0</span> ★</strong><span>Google rating</span></div></div>
  <div class="trust-item">{ic("users")}<div><strong><span data-count="{BIZ["reviews"]}">{BIZ["reviews"]}</span>+</strong><span>Five-star reviews</span></div></div>
  <div class="trust-item">{ic("award")}<div><strong>3× winner</strong><span>Quality Business Awards</span></div></div>
  <div class="trust-item">{ic("shield")}<div><strong>FCA regulated</strong><span>via Stonebridge</span></div></div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head">
    <div><span class="eyebrow">How we can help</span><h2 class="reveal">Advice for every chapter of <em class="gold">home ownership.</em></h2></div>
    <p class="lead" style="max-width:420px;margin:0">Whatever stage you’re at, one friendly team handles the mortgage and the protection that goes with it.</p>
  </div>
  <div class="grid grid-3">{cards}</div>
</div></section>

{marquee()}

<section class="section"><div class="container split">
  <div class="media-wrap reveal">
    <div class="media"><img src="assets/img/moving-home.webp" alt="A happy couple carrying boxes into their new home" loading="lazy" width="1200" height="960"></div>
    <div class="media-tag"><span class="num">£295</span><span>Typical broker fee, agreed upfront and never more than £1,000</span></div>
  </div>
  <div class="reveal reveal-d1">
    <span class="eyebrow">Why MDJ</span>
    <h2>A local broker who actually <em class="gold">picks up the phone.</em></h2>
    <p class="lead">Mortgages are full of jargon and moving parts. Our job is to make it simple: explain your options clearly, keep you updated, and do the chasing so you can get on with life.</p>
    {checklist([
        "<strong>Whole-of-market search</strong>: we compare lenders and products you won’t find on comparison sites.",
        "<strong>Clear, fair fees</strong>: you’ll know exactly what you’ll pay before we start.",
        "<strong>Face-to-face, video or phone</strong>: meet at Chineham Court or from your sofa.",
        "<strong>Mortgage + protection in one place</strong>: home, life and income cover sorted together.",
    ])}
    <a class="btn" href="about.html">Meet the team {ARROW}</a>
  </div>
</div></section>

<section class="section dark grain"><div class="container">
  <div class="section-head"><div><span class="eyebrow">How it works</span><h2 class="reveal">Four steps from <em class="gold">first chat</em> to front door.</h2></div>
  <a class="btn btn-ghost" href="{BIZ["calendly"]}" target="_blank" rel="noopener">Start with step one {ARROW}</a></div>
  <div class="process">{step_html}</div>
</div></section>

<section class="section"><div class="container">
  <div class="calc" style="grid-template-columns:1fr 1fr">
    <form class="calc-form" id="afford-form" onsubmit="return false">
      <span class="eyebrow" style="margin:0">Quick estimate</span>
      <h3>How much could you borrow?</h3>
      <div class="field-row">
        <div class="field"><label for="h-inc1">Your annual income</label><div class="input-prefix"><span>£</span><input class="input" id="h-inc1" name="income1" inputmode="numeric" value="45,000"></div></div>
        <div class="field"><label for="h-inc2">Partner’s income (optional)</label><div class="input-prefix"><span>£</span><input class="input" id="h-inc2" name="income2" inputmode="numeric" value="30,000"></div></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="h-com">Monthly debt repayments</label><div class="input-prefix"><span>£</span><input class="input" id="h-com" name="commitments" inputmode="numeric" value="0"></div></div>
        <div class="field"><label for="h-dep">Deposit saved</label><div class="input-prefix"><span>£</span><input class="input" id="h-dep" name="deposit" inputmode="numeric" value="35,000"></div></div>
      </div>
    </form>
    <div class="calc-result">
      <span class="result-label">You could borrow up to</span>
      <div class="result-big" id="afford-high">£0</div>
      <p class="result-sub">Typical lender range: <span id="afford-range">—</span></p>
      <div class="result-rows">
        <div><span>Potential purchase price</span><strong id="afford-price">£0</strong></div>
        <div><span>Some lenders may stretch to</span><strong id="afford-stretch">£0</strong></div>
      </div>
      <a class="btn btn-gold" href="calculators.html">More calculators {ARROW}</a>
      <p class="disclaimer">Illustrative only, based on 4–4.5× income. Lenders assess affordability individually.</p>
    </div>
  </div>
</div></section>

<section class="section ivory"><div class="container split reverse">
  <div class="reveal">
    <div class="grid grid-2">
      <div class="team-card"><div class="photo"><img src="assets/img/mark.webp" alt="Mark Jones" loading="lazy" width="900" height="720"></div><div class="team-body"><span class="role">Managing Director</span><h3>Mark Jones</h3><p class="team-quote">“It is what it is.”</p></div></div>
      <div class="team-card" style="margin-top:48px"><div class="photo"><img src="assets/img/jodie.webp" alt="Jodie Layzell" loading="lazy" width="900" height="720"></div><div class="team-body"><span class="role">Business Development</span><h3>Jodie Layzell</h3><p class="team-quote">“No worries.”</p></div></div>
    </div>
  </div>
  <div class="reveal reveal-d1">
    <span class="eyebrow">The people behind the name</span>
    <h2>Small team. <em class="gold">Big on care.</em></h2>
    <p class="lead">When you call MDJ you speak to Mark or Jodie, not a call centre. It’s the reason so many reviews mention them by name.</p>
    <p>Mark leads the advice side, from first-time buyers to specialist equity release cases. Jodie joined in 2022 after more than 20 years in customer-facing retail, and keeps every case moving from application to completion.</p>
    <a class="link-arrow" href="about.html">Our story {ARROW}</a>
  </div>
</div></section>

{reviews_slider()}

{awards_strip()}

<section class="section"><div class="container split" style="align-items:start">
  <div class="reveal">
    <span class="eyebrow">Areas we cover</span>
    <h2>Rooted in Basingstoke. <em class="gold">Helping all over the South.</em></h2>
    <p class="lead">Our office is at Chineham Court, and video appointments mean distance is never a barrier.</p>
    <a class="btn btn-ghost" href="areas.html">See all areas {ARROW}</a>
  </div>
  <div class="areas reveal reveal-d1">{towns}</div>
</div></section>

<section class="section ivory"><div class="container split" style="align-items:start">
  <div class="reveal"><span class="eyebrow">Questions</span><h2>Good questions, <em class="gold">straight answers.</em></h2><p class="lead">Can’t see yours? Call {BIZ["phone"]} or send us a WhatsApp. We’re happy to help.</p></div>
  <div>{faq([
      ("Do I need to pay for the first appointment?", "No. Your initial consultation is completely free and there’s no obligation to proceed. We’ll explain any fee clearly before we start working on your case."),
      ("How much do you charge?", "For most cases our fee is £295, agreed at your first appointment and never more than £1,000. Specialist cases such as adverse credit, shared ownership or equity release carry a different fee. See our <a class='link-arrow' href='fees.html'>fees page</a>."),
      ("What is a Decision in Principle?", "A Decision in Principle (DIP or AIP) is a lender’s indication of how much it may be willing to lend you, based on a soft or hard credit check. Estate agents often ask for one before accepting an offer, and we can usually arrange it quickly."),
      ("How much can I borrow?", "Most lenders lend around 4 to 4.5 times your annual income, and some go higher for certain professions or incomes. The real answer depends on your outgoings, credit and deposit. Try our <a class='link-arrow' href='calculators.html'>calculators</a> for a quick estimate."),
      ("Can you get me the best rate?", "We search the whole market to find the most suitable deal for you. That’s not always the lowest headline rate, because fees, flexibility and lender criteria all matter. We explain the trade-offs so you can decide."),
      ("Who regulates you?", "MDJ Mortgages Ltd is an appointed representative of Stonebridge Mortgage Solutions Ltd, which is authorised and regulated by the Financial Conduct Authority."),
  ])}</div>
</div></section>

{cta_band()}
'''
    page("index.html", "MDJ Mortgages | Award-Winning Mortgage Broker in Basingstoke",
         "Award-winning, whole-of-market mortgage and protection advice in Basingstoke. 5.0 from 186 Google reviews. Free first consultation.", body)


def about():
    values = [
        ("users", "People, not cases", "Every client gets a named adviser who knows their story, from the first call to the day they get the keys."),
        ("scale", "Honest advice", "If waiting six months will get you a better deal, we’ll tell you, even if it means we wait too."),
        ("chat", "Plain English", "No jargon and no small print surprises. We explain what each choice means for you and your family."),
        ("clock", "Always moving", "We chase lenders, solicitors and agents, and we keep you updated so you’re never left wondering."),
    ]
    vhtml = "".join(f'<div class="pillar reveal reveal-d{k+1}"><div class="card-icon">{ic(i)}</div><h3>{t}</h3><p>{d}</p></div>' for k, (i, t, d) in enumerate(values))
    body = f'''
{page_hero("About", "About MDJ Mortgages", "Local experts. <em class='gold'>Genuinely on your side.</em>", "MDJ Mortgages is an award-winning broker based at Chineham Court in Basingstoke. We help first-time buyers, movers, landlords and later-life borrowers find the right mortgage and protect what matters.")}

<section class="section"><div class="container split">
  <div class="media-wrap reveal"><div class="media"><img src="assets/img/meeting.webp" alt="Mark Jones in a client meeting" loading="lazy" width="1200" height="960"></div>
  <div class="media-tag"><span class="num">5.0</span><span>Average Google rating across {BIZ["reviews"]} reviews</span></div></div>
  <div class="reveal reveal-d1">
    <span class="eyebrow">Our story</span>
    <h2>From childhood memories to <em class="gold">changing lives.</em></h2>
    <p class="lead">Mark Jones started MDJ with a simple idea: mortgage advice should feel personal, because a home is personal.</p>
    <p>Some of Mark’s earliest memories are of visits to his grandmother’s home in Farnham, a place full of family, warmth and security. That feeling of what a home means to a family is what drives the business today, whether he’s helping a first-time buyer leave renting behind or advising a retired couple on releasing equity to help their grandchildren.</p>
    <p>MDJ has grown to a small, close-knit team with an outsized reputation, recognised in the Quality Business Awards three years running and trusted by hundreds of families across Hampshire, Berkshire and Surrey.</p>
  </div>
</div></section>

<section class="section-sm"><div class="container"><div class="stats">
  <div class="stat reveal"><div class="num"><span data-count="{BIZ["reviews"]}">{BIZ["reviews"]}</span><small>+</small></div><p>Five-star Google reviews</p></div>
  <div class="stat reveal reveal-d1"><div class="num"><span data-count="5.0">5.0</span><small>★</small></div><p>Average customer rating</p></div>
  <div class="stat reveal reveal-d2"><div class="num"><span data-count="3">3</span><small>×</small></div><p>Quality Business Award winner</p></div>
  <div class="stat reveal reveal-d3"><div class="num"><span data-count="16">16</span></div><p>Towns we regularly help in</p></div>
</div></div></section>

<section class="section dark grain"><div class="container">
  <div class="section-head"><div><span class="eyebrow">Meet the team</span><h2 class="reveal">The faces you’ll <em class="gold">actually deal with.</em></h2></div></div>
  <div class="grid grid-2">
    <div class="team-card reveal" style="background:var(--ink-2);border:1px solid var(--line-dark)"><div class="photo"><img src="assets/img/mark.webp" alt="Mark Jones, Managing Director" loading="lazy" width="900" height="720"></div>
      <div class="team-body"><span class="role">Managing Director · Mortgage & Equity Release Adviser</span><h3>Mark Jones</h3>
      <p>Mark advises on everything from first homes to complex self-employed, commercial and later-life cases. He’s known for clear communication, quick replies and finding a way when a case looks tricky.</p>
      <p class="team-quote">“It is what it is.”</p>
      <div class="tags"><span class="tag">Family</span><span class="tag">Karate</span><span class="tag">Muay Thai</span><span class="tag">The gym</span><span class="tag">Frank Skinner’s podcast</span></div></div></div>
    <div class="team-card reveal reveal-d1" style="background:var(--ink-2);border:1px solid var(--line-dark)"><div class="photo"><img src="assets/img/jodie.webp" alt="Jodie Layzell, Business Development Manager" loading="lazy" width="900" height="720"></div>
      <div class="team-body"><span class="role">Business Development Manager</span><h3>Jodie Layzell</h3>
      <p>Jodie joined MDJ in November 2022 after more than 20 years in retail. She keeps every application on track, and her favourite part of the job is seeing clients complete and move into their new home.</p>
      <p class="team-quote">“No worries.”</p>
      <div class="tags"><span class="tag">Family</span><span class="tag">Music & live gigs</span><span class="tag">Dogs</span><span class="tag">Glastonbury</span><span class="tag">Reading</span></div></div></div>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><div><span class="eyebrow">What we stand for</span><h2 class="reveal">Reliable. Forward-thinking. <em class="gold">Trustworthy.</em></h2></div></div>
  <div class="grid grid-4">{vhtml}</div>
</div></section>

{awards_strip()}
{reviews_slider("Don’t just take <em class='gold'>our word for it.</em>")}
{cta_band()}
'''
    page("about.html", "About Us | MDJ Mortgages, Basingstoke",
         "Meet Mark Jones and Jodie Layzell, the award-winning team behind MDJ Mortgages in Basingstoke.", body)


def subnav(items):
    return '<nav class="subnav" aria-label="On this page"><div class="container">' + "".join(f'<a href="#{i}">{t}</a>' for i, t in items) + "</div></nav>"


def mortgages():
    body = f'''
{page_hero("Mortgages", "Residential mortgages", "Mortgages, made <em class='gold'>refreshingly simple.</em>", "Buying your first home, moving up the ladder or coming to the end of a fixed rate? We search the whole market and handle every step, so you get the right deal with less stress.")}
{subnav([("first-time-buyers", "First-time buyers"), ("moving-home", "Moving home"), ("remortgage", "Remortgaging"), ("buy-to-let", "Buy-to-let"), ("faqs", "FAQs")])}
<section><div class="container">
{detail("first-time-buyers", "key", "01 · First-time buyers", "Your first home, <em class='gold'>sorted.</em>",
    "Buying your first home is exciting, but it can feel like a maze. We’ll show you what you can afford, which schemes might help, and walk you through every step until you collect the keys.",
    "<p>Many of our first-time buyers come to us months before they’re ready, just to understand the numbers. That’s exactly when we can help most, by improving your credit profile, planning your deposit and getting a Decision in Principle so you can make offers with confidence.</p>" +
    checklist(["How much you can realistically borrow, and what it will cost each month", "Low-deposit options from 5%, plus guarantor and family-assisted routes", "Shared Ownership and other schemes where available", "Stamp duty relief: first-time buyers pay no SDLT up to £300,000 in England", "Protection advice so your new home is properly covered"]),
    [("file", "Decision in Principle", "Show agents you’re a serious buyer before you make an offer."),
     ("users", "Joining our WhatsApp community", "Tips and updates for first-time buyers, straight to your phone.")],
    "The Lifetime ISA, Shared Ownership and guarantor mortgages each have their own rules. We’ll explain whether they suit you.")}
{detail("moving-home", "truck", "02 · Moving home", "Moving up, <em class='gold'>moving on.</em>",
    "Whether you need more space, a better school catchment or a fresh start, we’ll arrange the finance so your move goes smoothly and your chain keeps moving.",
    "<p>When you move you can often <strong>port</strong> your existing mortgage, borrow extra from your current lender, or take a brand-new deal. The right choice depends on early repayment charges, the rates available and how much more you need. We compare all three for you.</p>" +
    checklist(["Porting vs. switching: we calculate the true cost of each", "Bridging and chain-break options if timing is tight", "Agreements in principle so you can act fast on the right property", "We liaise with your agent and solicitor to keep things on track"]),
    [("percent", "Early repayment charges", "We check for ERCs so a move doesn’t cost more than it should."),
     ("clock", "Timed to your chain", "Offers lined up to match your completion date.")])}
{detail("remortgage", "refresh", "03 · Remortgaging", "Don’t drift onto <em class='gold'>the SVR.</em>",
    "When a fixed or tracker rate ends, most lenders move you onto their Standard Variable Rate, which is often much more expensive. We start reviewing your options up to six months early so you’re ready to switch.",
    "<p>Remortgaging can lower your monthly payments, release equity for home improvements, consolidate debt or simply give you certainty with a new fix. We compare a <em>product transfer</em> with your current lender against the whole market, so you know you’re getting the best option, not just the easiest one.</p>" +
    checklist(["Reviews up to six months before your deal ends", "Product transfers vs. the whole of market, compared side by side", "Capital raising for extensions, renovations or a family gift", "A protection check-up: life cover when remortgaging could cost less than you think"]),
    [("refresh", "Book a review", "Fixed rate ending in the next 6–12 months? Book a free review any time."),
     ("shield", "Review your cover", "A remortgage is a good moment to make sure your life cover still fits.")],
    "You may have to pay an early repayment charge to your existing lender if you remortgage. Debt consolidation can increase the total amount repaid over the term.")}
{detail("buy-to-let", "building", "04 · Buy-to-let", "Building your <em class='gold'>portfolio.</em>",
    "From your first rental to a growing portfolio, including limited company purchases and let-to-buy, we’ll find lenders whose rental calculations work for you.",
    checklist(["First-time landlords and portfolio landlords", "Limited company (SPV) buy-to-let", "Let-to-buy when you keep your current home as a rental", "Foreign national buy-to-let"]),
    None, "Not all buy-to-let mortgages are regulated by the Financial Conduct Authority.")}
<div class="detail" id="faqs" style="border-top:1px solid var(--line)">
  <div class="detail-side"><span class="kicker">Questions</span><h2>Mortgage <em class="gold">FAQs</em></h2></div>
  <div>{faq([
      ("How big a deposit do I need?", "Most lenders need at least 5% of the purchase price. A 10% or 15% deposit opens up more lenders and lower rates. Some specialist products, such as guarantor or family-assisted mortgages, may need less of your own money."),
      ("How long does a mortgage application take?", "From application to offer usually takes two to four weeks, depending on the lender and how quickly the valuation happens. Having your documents ready speeds things up, and we’ll give you a checklist."),
      ("Will checking my options affect my credit score?", "Our initial research doesn’t affect your score. Many lenders now use soft searches for a Decision in Principle, and we’ll always tell you before any hard search."),
      ("Fixed or tracker: which is better?", "A fixed rate gives you certainty, while a tracker follows the Bank of England base rate. The right choice depends on your budget, plans and attitude to risk. We’ll go through the options with you."),
  ])}</div>
</div>
</div></section>
{reviews_slider()}
{cta_band()}
'''
    page("mortgages.html", "Mortgages | First-Time Buyers, Moving Home & Remortgage | MDJ Mortgages",
         "Whole-of-market mortgage advice in Basingstoke for first-time buyers, home movers, remortgages and buy-to-let.", body)


def specialist():
    cards = [
        ("self-employed", "briefcase", "Self-employed", "Sole traders, limited company directors and contractors. Some lenders accept one year’s accounts, use salary plus dividends or retained profits, or work from day-rate contracts."),
        ("later-life", "sun", "Retirement mortgages", "Retirement interest-only (RIO) and mortgages that run into retirement, assessed on pension income."),
        ("lifetime", "infinity", "Lifetime mortgages", "Release tax-free equity with no monthly repayments required, repaid when you die or move into long-term care."),
        ("no-deposit", "piggy", "No-deposit mortgages", "100% LTV, guarantor and family-springboard products when saving a deposit isn’t realistic."),
        ("commercial", "building", "Commercial & specialist", "Commercial premises, semi-commercial, development and bridging finance, and the specialist lenders that handle them."),
        ("foreign-national", "globe", "Foreign nationals", "Mortgages for visa holders and recent arrivals, including foreign national buy-to-let."),
        ("adverse", "file", "Adverse credit", "Missed payments, defaults or CCJs don’t have to mean no. We work with specialist lenders who look at the full picture."),
        ("shared-ownership", "layers", "Shared ownership", "Buy a share of a home and pay rent on the rest. We handle housing association checks and affordability."),
    ]
    grid = "".join(f'<a class="service-card reveal reveal-d{(k % 4) + 1}" href="#{id_}" style="min-height:260px"><div class="card-icon">{ic(i)}</div><h3>{t}</h3><p>{d[:110].rsplit(" ", 1)[0]}…</p><span class="link-arrow">Read more {ARROW}</span></a>'
                   for k, (id_, i, t, d) in enumerate(cards))
    body = f'''
{page_hero("Specialist mortgages", "Specialist lending", "When it’s not straightforward, <em class='gold'>we shine.</em>", "Self-employed income, later life, complicated credit or an unusual property: high-street lenders often say no where specialist lenders say yes. Knowing which one to approach is our job.",
           [("briefcase", "Complex income", "Contractors, directors, sole traders"), ("globe", "Foreign nationals", "From £295 total fee"), ("check", "“Just another day at the office”", "Anna Foster-Ford, Google review")])}
<section class="section"><div class="container"><div class="grid grid-4">{grid}</div></div></section>
<section class="ivory"><div class="container">
{detail("self-employed", "briefcase", "Self-employed", "Your income, <em class='gold'>properly understood.</em>",
    "Being your own boss shouldn’t make buying a home harder. Lenders assess self-employed income very differently, and that difference can change how much you can borrow by tens of thousands of pounds.",
    checklist(["Sole traders and partners: SA302s and tax year overviews", "Limited company directors: salary + dividends, or salary + share of net profit", "Contractors: day-rate assessments without full accounts", "Newly self-employed, sometimes with just one year’s figures"]),
    [("file", "Document checklist", "We’ll tell you exactly what each lender needs, and nothing more."),
     ("users", "Accountant liaison", "Happy to speak to your accountant directly to save you time.")])}
{detail("later-life", "sun", "Retirement mortgages", "Borrowing <em class='gold'>into retirement.</em>",
    "Age is no longer a barrier to borrowing. Many lenders now offer mortgages that run well into retirement, assessed on pension and investment income.",
    checklist(["Retirement interest-only (RIO) mortgages", "Standard mortgages with terms extending past retirement age", "Helping family onto the ladder with a later-life loan", "Joint-borrower, sole-proprietor arrangements"]))}
{detail("lifetime", "infinity", "Lifetime mortgages", "Unlock your home’s <em class='gold'>value.</em>",
    "A lifetime mortgage lets homeowners aged 55+ release tax-free cash while staying in their home. See our <a class='link-arrow' href='equity-release.html'>equity release guide</a> for full details.",
    "", None, "A lifetime mortgage is a loan secured against your home. It could accumulate interest and reduce the value of your estate and your entitlement to means-tested benefits.")}
{detail("no-deposit", "piggy", "No-deposit mortgages", "No deposit? <em class='gold'>Still possible.</em>",
    "Saving a deposit while paying rent is hard. A small number of lenders offer 100% mortgages, and family-assisted products can let parents help without handing over cash.",
    checklist(["100% LTV products for proven renters", "Guarantor and joint-borrower options", "Family springboard and deposit-gift structures"]))}
{detail("commercial", "building", "Commercial & specialist lending", "Finance for <em class='gold'>unique goals.</em>",
    "Commercial mortgages are underwritten differently from residential ones, and many applications fail because they reach the wrong lender with the wrong information. We prepare your case properly from the start.",
    checklist(["Owner-occupied and investment commercial property", "Semi-commercial (shop with flat above)", "Bridging finance and auction purchases", "Development and refurbishment finance"]),
    None, "Commercial lending is not regulated by the Financial Conduct Authority.")}
{detail("foreign-national", "globe", "Foreign nationals", "New to the UK? <em class='gold'>Welcome home.</em>",
    "Whether you’re on a Skilled Worker visa, a spousal visa or have just arrived, we can help you find lenders that accept your residency status, including for buy-to-let.",
    checklist(["Skilled Worker, family, Global Talent and other visa routes", "Limited UK credit history", "Foreign national buy-to-let", "Clear fee: £295 total (£95 upfront for your DIP, £200 on completion)"]))}
{detail("adverse", "file", "Adverse credit & debt consolidation", "A past blip <em class='gold'>isn’t the end.</em>",
    "Missed payments, defaults, CCJs or a debt management plan can make the high street say no. Specialist lenders look at what happened, when, and how you’ve managed since.",
    checklist(["Defaults, CCJs and missed payments", "Debt management plans and IVAs (completed or ongoing)", "Debt consolidation remortgages, with honest advice on the long-term cost"]),
    None, "Consolidating debts into your mortgage may increase the total amount you repay over the term.")}
{detail("shared-ownership", "layers", "Shared ownership", "Buy a share, <em class='gold'>own your future.</em>",
    "Shared ownership lets you buy a share of a home, typically between 10% and 75%, and pay rent on the rest. You can buy more over time, which is known as staircasing.",
    checklist(["Housing association eligibility and affordability checks", "Lenders that accept shared ownership", "Staircasing mortgages when you’re ready to buy more"]))}
</div></section>
{cta_band("Tricky case? <em class='gold'>Let’s talk it through.</em>")}
'''
    page("specialist.html", "Specialist Mortgages | Self-Employed, Later Life & More | MDJ Mortgages",
         "Specialist mortgage advice for self-employed, later life, adverse credit, foreign national, shared ownership and commercial borrowers in Basingstoke.", body)


def equity_release():
    body = f'''
{page_hero("Equity release", "Specialist later-life advice", "Release the value <em class='gold'>you’ve built.</em>", "If you’re 55 or over, equity release can unlock tax-free cash from your home without having to move. It’s a big decision, so we give specialist advice that puts you and your family first.",
           [("sun", "Aged 55+", "Homeowners in England & Wales"), ("users", "Family welcome", "We encourage loved ones to join"), ("shield", "Specialist advice", "Typical fee £995")])}

<section class="section"><div class="container split">
  <div class="reveal">
    <span class="eyebrow">How it works</span>
    <h2>Your home, <em class="gold">your choice.</em></h2>
    <p class="lead">The most common form of equity release is a <strong>lifetime mortgage</strong>: a loan secured on your home that’s usually repaid when the last borrower dies or moves into long-term care.</p>
    {checklist(["Stay in your home for life and keep 100% ownership", "Tax-free lump sum, drawdown facility, or both", "Optional monthly interest payments to limit roll-up", "No-negative-equity guarantee on plans meeting Equity Release Council standards", "Protect part of your property’s value as an inheritance"])}
    <p>People use it to help children onto the ladder, clear an interest-only mortgage, adapt their home, or simply enjoy retirement more.</p>
  </div>
  <div class="reveal reveal-d1">
    <div class="calc" style="grid-template-columns:1fr">
      <form class="calc-form" id="er-form" onsubmit="return false">
        <h3>Equity release estimate</h3>
        <div class="field"><label for="er-age">Youngest homeowner’s age <output id="out-age">68</output></label><input type="range" id="er-age" name="age" min="55" max="90" value="68"></div>
        <div class="field"><label for="er-val">Property value</label><div class="input-prefix"><span>£</span><input class="input" id="er-val" name="value" inputmode="numeric" value="450,000"></div></div>
        <div class="field"><label for="er-mort">Outstanding mortgage</label><div class="input-prefix"><span>£</span><input class="input" id="er-mort" name="mortgage" inputmode="numeric" value="40,000"></div></div>
      </form>
      <div class="calc-result">
        <span class="result-label">Estimated tax-free cash available</span>
        <div class="result-big" id="er-gross">£0</div>
        <div class="result-rows">
          <div><span>Indicative max loan-to-value</span><strong id="er-ltv">0%</strong></div>
          <div><span>After clearing your mortgage</span><strong id="er-net">£0</strong></div>
        </div>
        <a class="btn btn-gold" href="contact.html">Get a personalised quote {ARROW}</a>
        <p class="disclaimer">Illustrative only. Actual amounts depend on lender, health, property and age.</p>
      </div>
    </div>
  </div>
</div></section>

<section class="section dark grain"><div class="container">
  <div class="section-head"><div><span class="eyebrow">Things to consider</span><h2>Good advice means <em class="gold">the full picture.</em></h2></div></div>
  <div class="grid grid-3">
    <div class="pillar reveal"><div class="card-icon">{ic("percent")}</div><h3>Compound interest</h3><p>If you don’t make payments, interest rolls up and the amount owed grows over time.</p></div>
    <div class="pillar reveal reveal-d1"><div class="card-icon">{ic("users")}</div><h3>Inheritance</h3><p>Equity release reduces the value of your estate. We encourage you to involve your family in the conversation.</p></div>
    <div class="pillar reveal reveal-d2"><div class="card-icon">{ic("scale")}</div><h3>Benefits</h3><p>Receiving a lump sum could affect your entitlement to means-tested state benefits.</p></div>
    <div class="pillar reveal"><div class="card-icon">{ic("refresh")}</div><h3>Alternatives</h3><p>Downsizing, a retirement interest-only mortgage or family help may suit you better. We’ll look at all of them.</p></div>
    <div class="pillar reveal reveal-d1"><div class="card-icon">{ic("alert")}</div><h3>Early repayment</h3><p>Repaying early can carry significant charges, although many plans now include downsizing protection.</p></div>
    <div class="pillar reveal reveal-d2"><div class="card-icon">{ic("file")}</div><h3>Legal advice</h3><p>You’ll need an independent solicitor, and that safeguard is built into the process.</p></div>
  </div>
  <div class="notice" style="margin-top:40px">{ic("info")}<span>A lifetime mortgage is a loan secured against your home. It could accumulate interest and reduce the value of your estate. Check that this mortgage will meet your needs if you want to move or sell your home, or you want your family to inherit it. If you are in any doubt, seek independent advice.</span></div>
</div></section>

<section class="section"><div class="container split" style="align-items:start">
  <div><span class="eyebrow">Questions</span><h2>Equity release <em class="gold">FAQs</em></h2></div>
  <div>{faq([
      ("Will I still own my home?", "Yes. With a lifetime mortgage you keep full ownership of your home and can live there for the rest of your life."),
      ("Can I leave an inheritance?", "Many plans let you ring-fence a percentage of your property’s value as a guaranteed inheritance."),
      ("Can I move house later?", "Most modern plans are portable to a new property, as long as it meets the lender’s criteria."),
      ("What does your advice cost?", "Our specialist equity release advice fee is typically £995, and we’ll confirm it at your first appointment, which is free."),
  ])}</div>
</div></section>
{cta_band("Talk it through, <em class='gold'>no pressure.</em>", "Equity release is a big decision. We’ll take the time to understand your goals and explain every option, including the alternatives.")}
'''
    page("equity-release.html", "Equity Release Advice Basingstoke | MDJ Mortgages",
         "Specialist equity release and lifetime mortgage advice for homeowners aged 55+ in Basingstoke and Hampshire.", body)


def protection():
    products = [
        ("heart", "Life insurance", "Pays a lump sum if you die during the policy term, so your mortgage can be cleared and your family can stay in the home."),
        ("pulse", "Critical illness cover", "A tax-free lump sum if you’re diagnosed with a specified serious illness, such as cancer, heart attack or stroke."),
        ("wallet", "Income protection", "Replaces part of your income if illness or injury stops you working, paid monthly until you recover or retire."),
        ("users", "Family income benefit", "A monthly income for your family instead of a single lump sum, often a very affordable way to protect children."),
        ("home", "Home insurance", "Buildings and contents cover, which most lenders require from exchange of contracts."),
        ("shield", "Mortgage payment protection", "Short-term cover for your mortgage payments if you’re off work through accident, sickness or redundancy."),
    ]
    cards = "".join(f'<div class="service-card reveal reveal-d{(k % 3) + 1}" style="min-height:250px"><div class="card-icon">{ic(i)}</div><h3>{t}</h3><p>{d}</p></div>' for k, (i, t, d) in enumerate(products))
    body = f'''
{page_hero("Protection", "Protection & insurance", "Protect your home. <em class='gold'>Protect your people.</em>", "Your mortgage is probably your biggest commitment. The right protection makes sure it’s still paid, and your family is still secure, if life takes an unexpected turn.",
           [("heart", "Life & critical illness", "Clear, jargon-free comparisons"), ("wallet", "Income protection", "For employed and self-employed"), ("refresh", "Already covered?", "Free policy review when you remortgage")])}
<section class="section"><div class="container">
  <div class="section-head"><div><span class="eyebrow">Cover we arrange</span><h2 class="reveal">Protection built <em class="gold">around your life.</em></h2></div>
  <p class="lead" style="max-width:420px;margin:0">We compare leading UK insurers and explain exactly what is and isn’t covered.</p></div>
  <div class="grid grid-3">{cards}</div>
</div></section>
<section class="section ivory"><div class="container split">
  <div class="media-wrap reveal"><div class="media"><img src="assets/img/moving-home.webp" alt="Couple moving into a new home" loading="lazy" width="1200" height="960"></div></div>
  <div class="reveal reveal-d1">
    <span class="eyebrow">Remortgaging?</span>
    <h2>Reviewing your cover <em class="gold">could save you money.</em></h2>
    <p class="lead">When your mortgage changes, your protection should too. A policy set up years ago may no longer match your balance, term or family.</p>
    {checklist(["Make sure your cover matches your new mortgage balance and term", "Check whether premiums are better value today", "Add critical illness or income protection if your family has grown", "Write policies in trust so payouts reach the right people quickly"])}
    <a class="btn" href="contact.html">Book a protection review {ARROW}</a>
  </div>
</div></section>
<section class="section dark grain"><div class="container center">
  <span class="eyebrow">The honest truth</span>
  <h2 class="reveal" style="max-width:20ch;margin-inline:auto">Most families are <em class="gold">one payslip</em> away from trouble.</h2>
  <p class="lead reveal reveal-d1">Statutory Sick Pay is a small fraction of most salaries. Protection doesn’t have to be expensive, and we’ll help you prioritise the cover that matters most within your budget.</p>
  <a class="btn btn-gold reveal reveal-d2" href="{BIZ["calendly"]}" target="_blank" rel="noopener" style="margin-top:12px">Get a free protection review {ARROW}</a>
</div></section>
{cta_band()}
'''
    page("protection.html", "Life Insurance & Mortgage Protection | MDJ Mortgages Basingstoke",
         "Life insurance, critical illness cover, income protection and home insurance advice from MDJ Mortgages in Basingstoke.", body)


def calculators():
    body = f'''
{page_hero("Calculators", "Mortgage tools", "Run the numbers <em class='gold'>in seconds.</em>", "Get a feel for repayments, borrowing power and stamp duty before you speak to us. Then let us turn the estimate into a real plan.",
           [("calc", "Repayments", "Monthly cost & total interest"), ("wallet", "Affordability", "How much could you borrow?"), ("percent", "Stamp duty", "England & NI, 2026 rates")])}
<section class="section"><div class="container">
  <div class="center"><div class="calc-tabs" role="tablist">
    <button class="calc-tab" role="tab" data-tab="repayments" aria-selected="true">Repayments</button>
    <button class="calc-tab" role="tab" data-tab="affordability" aria-selected="false">Affordability</button>
    <button class="calc-tab" role="tab" data-tab="stamp-duty" aria-selected="false">Stamp duty</button>
  </div></div>

  <div class="calc" id="repayments">
    <form class="calc-form" id="repay-form" onsubmit="return false">
      <h3>Monthly repayment calculator</h3>
      <div class="field"><label for="r-amt">Mortgage amount</label><div class="input-prefix"><span>£</span><input class="input" id="r-amt" name="amount" inputmode="numeric" value="250,000"></div></div>
      <div class="field"><label for="r-term">Mortgage term <output id="out-term">25 yrs</output></label><input type="range" id="r-term" name="term" min="5" max="40" value="25"></div>
      <div class="field"><label for="r-rate">Interest rate <output id="out-rate">4.50%</output></label><input type="range" id="r-rate" name="rate" min="0.5" max="10" step="0.05" value="4.5"></div>
      <div class="field"><span class="label">Repayment type</span><div class="choice-group">
        <label class="choice"><input type="radio" name="type" value="repayment" checked><span>Capital & interest</span></label>
        <label class="choice"><input type="radio" name="type" value="interest"><span>Interest only</span></label>
      </div></div>
    </form>
    <div class="calc-result">
      <span class="result-label">Monthly repayment</span>
      <div class="result-big" id="repay-monthly">£0</div>
      <p class="result-sub">Estimated payment at a fixed rate for the full term</p>
      <div class="result-rows">
        <div><span>Amount borrowed</span><strong id="repay-loan">£0</strong></div>
        <div><span>Total interest</span><strong id="repay-interest">£0</strong></div>
        <div><span>Total repaid</span><strong id="repay-total">£0</strong></div>
      </div>
      <div class="result-bar"><i id="repay-bar-p" style="width:60%"></i><i id="repay-bar-i" style="width:40%"></i></div>
      <div class="legend"><span>Capital</span><span>Interest</span></div>
      <a class="btn btn-gold" style="margin-top:28px" href="contact.html">Find me a better rate {ARROW}</a>
    </div>
  </div>

  <div class="calc" id="affordability" hidden>
    <form class="calc-form" id="afford-form" onsubmit="return false">
      <h3>How much could I borrow?</h3>
      <div class="field-row">
        <div class="field"><label for="a-inc1">Your annual income</label><div class="input-prefix"><span>£</span><input class="input" id="a-inc1" name="income1" inputmode="numeric" value="45,000"></div></div>
        <div class="field"><label for="a-inc2">Second applicant</label><div class="input-prefix"><span>£</span><input class="input" id="a-inc2" name="income2" inputmode="numeric" value="0"></div></div>
      </div>
      <div class="field"><label for="a-com">Monthly credit commitments</label><div class="input-prefix"><span>£</span><input class="input" id="a-com" name="commitments" inputmode="numeric" value="0"></div></div>
      <div class="field"><label for="a-dep">Deposit</label><div class="input-prefix"><span>£</span><input class="input" id="a-dep" name="deposit" inputmode="numeric" value="25,000"></div></div>
    </form>
    <div class="calc-result">
      <span class="result-label">Estimated borrowing</span>
      <div class="result-big" id="afford-high">£0</div>
      <p class="result-sub">Typical range: <span id="afford-range">—</span></p>
      <div class="result-rows">
        <div><span>Potential purchase price</span><strong id="afford-price">£0</strong></div>
        <div><span>Higher-multiple lenders (up to 5.5×)</span><strong id="afford-stretch">£0</strong></div>
      </div>
      <a class="btn btn-gold" href="contact.html">Get a Decision in Principle {ARROW}</a>
      <p class="disclaimer">Based on 4–4.5× income after commitments. Higher multiples are subject to strict lender criteria.</p>
    </div>
  </div>

  <div class="calc" id="stamp-duty" hidden>
    <form class="calc-form" id="sdlt-form" onsubmit="return false">
      <h3>Stamp duty calculator</h3>
      <div class="field"><label for="s-price">Property price</label><div class="input-prefix"><span>£</span><input class="input" id="s-price" name="price" inputmode="numeric" value="350,000"></div></div>
      <div class="field"><span class="label">I am…</span><div class="choice-group">
        <label class="choice"><input type="radio" name="buyer" value="ftb" checked><span>A first-time buyer</span></label>
        <label class="choice"><input type="radio" name="buyer" value="standard"><span>Moving home</span></label>
        <label class="choice"><input type="radio" name="buyer" value="additional"><span>Buying an additional property</span></label>
      </div></div>
      <div class="notice" style="margin-top:0">{ic("info")}<span>Rates for England & Northern Ireland from 1 April 2025. Scotland (LBTT) and Wales (LTT) have different rules.</span></div>
    </form>
    <div class="calc-result">
      <span class="result-label">Stamp duty payable</span>
      <div class="result-big" id="sdlt-tax">£0</div>
      <p class="result-sub" id="sdlt-note"></p>
      <div class="result-rows">
        <div><span>Property price</span><strong id="sdlt-price">£0</strong></div>
        <div><span>Effective rate</span><strong id="sdlt-eff">0%</strong></div>
        <div><span>First-time buyer saving</span><strong id="sdlt-saving">—</strong></div>
      </div>
      <a class="btn btn-gold" href="contact.html">Plan my purchase {ARROW}</a>
    </div>
  </div>
  <p class="center" style="margin-top:28px;color:var(--muted);font-size:.9rem">These calculators give illustrations only and are not a mortgage offer or personal recommendation.</p>
</div></section>
{cta_band("Numbers look good? <em class='gold'>Let’s make it real.</em>")}
'''
    page("calculators.html", "Mortgage Calculators | Repayments, Affordability & Stamp Duty | MDJ Mortgages",
         "Free mortgage calculators: monthly repayments, how much can I borrow, and 2026 stamp duty for England.", body)


def fees():
    rows = [
        ("Standard mortgage advice", "First-time buyers, home movers, remortgages and buy-to-let. The exact fee is confirmed at your free first appointment.", "£295", "typical fee", True),
        ("Larger transactions", "As a thank-you for choosing us, our services are free on transactions where the mortgage requirement exceeds £150,000.", "£0", "over £150k borrowing", False),
        ("Debt consolidation & adverse credit", "Cases involving debt consolidation or adverse credit need extra research and lender negotiation.", "£495", "fixed fee", False),
        ("Shared ownership", "Includes additional checks, housing association requirements and more complex affordability assessments.", "£495", "fixed fee", False),
        ("Foreign national mortgages", "£95 payable upfront to secure your Decision in Principle, and the remaining £200 only on completion.", "£295", "total fee", False),
        ("Specialist equity release advice", "Specialist later-life advice. The precise amount depends on your circumstances.", "£995", "typical fee", False),
    ]
    rhtml = "".join(f'<div class="fee-row{" highlight" if h else ""} reveal"><div><h4>{t}</h4><p>{d}</p></div><div class="fee-price">{p}<small>{s}</small></div></div>' for t, d, p, s, h in rows)
    body = f'''
{page_hero("Fees", "Transparent pricing", "Clear fees. <em class='gold'>No surprises.</em>", "We believe you should know exactly what you’ll pay before we start. Your first appointment is always free, and our fee never exceeds £1,000.",
           [("calendar", "First appointment", "Always free"), ("percent", "Maximum fee", "Never more than £1,000"), ("check", "Agreed upfront", "Confirmed before we start")])}
<section class="section"><div class="container">
  <div class="section-head"><div><span class="eyebrow">Our fees</span><h2 class="reveal">What you’ll <em class="gold">actually pay.</em></h2></div></div>
  <div class="fee-table">{rhtml}</div>
  <div class="notice">{ic("info")}<span>There may be a fee for arranging your mortgage. The precise amount depends on your circumstances. We typically charge £295, but this will not exceed £1,000. Lenders may also charge product, valuation or legal fees, and we’ll explain every one.</span></div>
</div></section>
<section class="section ivory"><div class="container">
  <div class="section-head"><div><span class="eyebrow">What’s included</span><h2>Everything, <em class="gold">start to finish.</em></h2></div></div>
  <div class="grid grid-3">
    <div class="pillar reveal">{ic("search", "")}<h3 style="margin-top:16px">Whole-of-market research</h3><p>We compare lenders and products to find what suits you, not just what’s easiest.</p></div>
    <div class="pillar reveal reveal-d1">{ic("file")}<h3 style="margin-top:16px">Application management</h3><p>DIP, full application, valuation and underwriting. We handle it and keep you updated.</p></div>
    <div class="pillar reveal reveal-d2">{ic("refresh")}<h3 style="margin-top:16px">Ongoing reviews</h3><p>We’ll be in touch before your deal ends so you’re never stuck on a high variable rate.</p></div>
  </div>
</div></section>
{cta_band()}
'''
    body = body.replace('<div class="pillar reveal">' + ic("search", ""), '<div class="pillar reveal"><div class="card-icon">' + ic("search") + "</div>")
    body = body.replace('<div class="pillar reveal reveal-d1">' + ic("file"), '<div class="pillar reveal reveal-d1"><div class="card-icon">' + ic("file") + "</div>")
    body = body.replace('<div class="pillar reveal reveal-d2">' + ic("refresh"), '<div class="pillar reveal reveal-d2"><div class="card-icon">' + ic("refresh") + "</div>")
    body = body.replace('<h3 style="margin-top:16px">', "<h3>")
    page("fees.html", "Our Fees | Transparent Mortgage Broker Fees | MDJ Mortgages",
         "Clear mortgage broker fees: typically £295, never more than £1,000. Free first appointment.", body)


def reviews():
    cards = "".join(review_card(*r) for r in REVIEWS)
    body = f'''
{page_hero("Reviews", "Client reviews", BIZ["reviews"] + " five-star reviews. <em class='gold'>And counting.</em>", "We’re proud that so many clients take the time to share their experience. Here’s what they say about working with Mark, Jodie and the team.",
           [("star", "5.0 average", "Google Reviews"), ("award", "Quality Business Awards", "2024 · 2025 · 2026"), ("check", "Three Best Rated", "Accredited")])}
<section class="section"><div class="container">
  <div class="rating-summary reveal" style="margin-bottom:56px">
    <div><div class="rating-big">5.0</div>{STARS}<p style="margin:8px 0 0;color:var(--muted)">{BIZ["reviews"]} Google reviews</p></div>
    <div class="rating-bars">
      <div class="rating-bar"><span>5 star</span><span class="bar"><i style="width:100%"></i></span><span>100%</span></div>
      <div class="rating-bar"><span>4 star</span><span class="bar"><i style="width:0"></i></span><span>0%</span></div>
      <div class="rating-bar"><span>3 star</span><span class="bar"><i style="width:0"></i></span><span>0%</span></div>
      <div class="rating-bar"><span>2 star</span><span class="bar"><i style="width:0"></i></span><span>0%</span></div>
      <div class="rating-bar"><span>1 star</span><span class="bar"><i style="width:0"></i></span><span>0%</span></div>
    </div>
  </div>
  <div class="masonry">{cards}</div>
  <div class="center" style="margin-top:40px"><a class="btn" href="https://www.google.com/search?q=mdj+mortgages" target="_blank" rel="noopener">{ic("google")} Read all reviews on Google</a></div>
</div></section>
{awards_strip()}
<section class="section" id="refer"><div class="container">
  <div class="refer reveal">
    <div class="big">£50</div>
    <div><h3>Refer a friend, earn a £50 Amazon voucher</h3><p>Know someone who needs mortgage or protection advice? You’ll receive a £50 Amazon voucher for every referral that completes with us.</p></div>
    <a class="btn" href="contact.html?need=Referral">Refer someone {ARROW}</a>
  </div>
</div></section>
<section class="section-sm ivory"><div class="container center">
  <h2 class="reveal">Happy with our support?</h2>
  <p class="lead reveal reveal-d1">A quick review helps other local families choose us with confidence.</p>
  <a class="btn btn-gold reveal reveal-d2" href="https://www.google.com/search?q=mdj+mortgages" target="_blank" rel="noopener">{ic("star")} Leave a Google review</a>
</div></section>
{cta_band()}
'''
    page("reviews.html", f"Reviews | 5.0 from {BIZ['reviews']} Google Reviews | MDJ Mortgages",
         f"Read why MDJ Mortgages is rated 5.0 from {BIZ['reviews']} Google reviews. Refer a friend and earn a £50 Amazon voucher.", body)


def areas():
    groups = ""
    for k, (region, towns) in enumerate(AREAS):
        pills = "".join(f'<span class="area{" hq" if t == "Basingstoke" else ""}">{ic("pin")}{t}</span>' for t in towns)
        groups += f'<div class="pillar reveal reveal-d{k+1}"><span class="eyebrow" style="margin-bottom:14px">{region}</span><div class="areas">{pills}</div></div>'
    body = f'''
{page_hero("Areas we cover", "Local mortgage advice", "Your local broker, <em class='gold'>wherever you are.</em>", "From our office at Chineham Court we help families across Basingstoke, Hampshire, Berkshire and Surrey, in person or by video.",
           [("pin", "Chineham Court", "Basingstoke RG24 8AG"), ("video", "Video appointments", "Advice from your sofa"), ("phone", "Phone & WhatsApp", BIZ["mobile"])])}
<section class="section"><div class="container">
  <div class="section-head"><div><span class="eyebrow">Towns we regularly help in</span><h2 class="reveal">Local knowledge <em class="gold">matters.</em></h2></div>
  <p class="lead" style="max-width:440px;margin:0">We know the local developments, new-build schemes and estate agents, and which lenders like which properties.</p></div>
  <div class="grid grid-2">{groups}</div>
</div></section>
<section class="section-sm"><div class="container"><div class="map reveal"><iframe title="MDJ Mortgages office location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Grove+House,+Lutyens+Close,+Chineham+Court,+Basingstoke+RG24+8AG&output=embed"></iframe></div></div></section>
{reviews_slider()}
{cta_band()}
'''
    page("areas.html", "Mortgage Broker Near You | Basingstoke, Fleet, Reading & More | MDJ Mortgages",
         "MDJ Mortgages helps homebuyers in Basingstoke, Fleet, Farnborough, Reading, Winchester, Andover, Newbury and across Hampshire.", body)


def contact():
    needs = ["First home", "Moving home", "Remortgage", "Self-employed", "Buy-to-let", "Equity release", "Protection", "Something else"]
    need_html = "".join(f'<label class="choice"><input type="radio" name="need" value="{n}" required><span>{n}</span></label>' for n in needs)
    times = ["Morning", "Afternoon", "Evening", "Any time"]
    time_html = "".join(f'<label class="choice"><input type="radio" name="best_time" value="{t}"{" checked" if t == "Any time" else ""}><span>{t}</span></label>' for t in times)
    meet_html = "".join(f'<label class="choice"><input type="radio" name="meeting" value="{t}"{" checked" if k == 0 else ""}><span>{t}</span></label>' for k, t in enumerate(["Phone call", "Video call", "Face-to-face"]))
    body = f'''
{page_hero("Contact", "Get in touch", "Let’s start <em class='gold'>your journey.</em>", "Tell us a little about what you need and we’ll be in touch, usually the same working day. Or book a call straight into Mark’s diary.",
           [("calendar", "Free 30-min discovery call", "Book online in seconds"), ("clock", "Mon–Fri, 9:00–18:00", "Closed weekends"), ("whatsapp", "WhatsApp", BIZ["mobile"])])}
<section class="section"><div class="container split split-contact" style="align-items:start">
  <div class="enquiry reveal">
    <div class="enquiry-head"><span class="step-label">Step 1 of 3</span><h3 style="margin:6px 0 0">Request your free consultation</h3><div class="progress"><i></i><i></i><i></i></div></div>
    <form class="enquiry-body" id="enquiry" data-endpoint="" novalidate>
      <div class="form-step active">
        <div class="field"><span class="label">What can we help with?</span><div class="choice-group">{need_html}</div><span class="error-msg">Please choose an option.</span></div>
        <div class="field-row">
          <div class="field"><label for="c-price">Property value / price (approx.)</label><div class="input-prefix"><span>£</span><input class="input" id="c-price" name="property_value" inputmode="numeric" placeholder="350,000"></div></div>
          <div class="field"><label for="c-dep">Deposit / equity (approx.)</label><div class="input-prefix"><span>£</span><input class="input" id="c-dep" name="deposit" inputmode="numeric" placeholder="35,000"></div></div>
        </div>
      </div>
      <div class="form-step">
        <div class="field"><label for="c-name">Full name</label><input class="input" id="c-name" name="name" autocomplete="name" required><span class="error-msg">Please enter your name.</span></div>
        <div class="field-row">
          <div class="field"><label for="c-email">Email</label><input class="input" id="c-email" type="email" name="email" autocomplete="email" required><span class="error-msg">Please enter a valid email.</span></div>
          <div class="field"><label for="c-phone">Phone</label><input class="input" id="c-phone" type="tel" name="phone" autocomplete="tel" required pattern="[0-9 +()-]{{10,}}"><span class="error-msg">Please enter a valid phone number.</span></div>
        </div>
      </div>
      <div class="form-step">
        <div class="field"><span class="label">How would you like to meet?</span><div class="choice-group">{meet_html}</div></div>
        <div class="field"><span class="label">Best time to contact you</span><div class="choice-group">{time_html}</div></div>
        <div class="field"><label for="c-msg">Anything else we should know? (optional)</label><textarea class="input" id="c-msg" name="message" placeholder="e.g. I’m self-employed and my fixed rate ends in March"></textarea></div>
        <label class="field" style="display:flex;gap:12px;align-items:flex-start;font-size:.85rem;color:var(--muted)"><input type="checkbox" name="consent" value="yes" required style="margin-top:4px;accent-color:var(--gold-3)"> <span>I agree to MDJ Mortgages contacting me about my enquiry. We never share your details. <span class="error-msg">Please tick to continue.</span></span></label>
      </div>
      <div class="form-nav">
        <button type="button" class="btn btn-ghost" data-prev>{ic("arrow-left")} Back</button>
        <button type="button" class="btn" data-next>Continue {ARROW}</button>
        <button type="submit" class="btn btn-gold" hidden>Send my enquiry {ARROW}</button>
      </div>
    </form>
    <div class="success-wrap" hidden><div class="success enquiry-body">
      <div class="tick">{ic("tick")}</div>
      <h3>Thanks, <span id="success-name">there</span>. We’ve got it.</h3>
      <p style="color:var(--muted)">Mark or Jodie will be in touch shortly, usually the same working day. Want to lock in a time now?</p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-gold" href="{BIZ["calendly"]}" target="_blank" rel="noopener">{ic("calendar")} Book a call</a><a class="btn btn-ghost" id="mailto-fallback" href="mailto:{BIZ["email"]}">{ic("mail")} Email a copy</a></div>
    </div></div>
  </div>
  <aside class="dark reveal reveal-d1" style="border-radius:var(--radius-lg);padding:clamp(24px,4vw,40px)">
    <h3>Talk to us directly</h3>
    <div class="contact-cards" style="margin:24px 0 32px">
      <a class="contact-card" href="{BIZ["calendly"]}" target="_blank" rel="noopener"><span class="ic">{ic("calendar")}</span><div><strong>Book a discovery call</strong><span>Free 30-minute meeting</span></div></a>
      <a class="contact-card" href="{BIZ["phone_href"]}"><span class="ic">{ic("phone")}</span><div><strong>{BIZ["phone"]}</strong><span>Office line</span></div></a>
      <a class="contact-card" href="{BIZ["whatsapp"]}" target="_blank" rel="noopener"><span class="ic">{ic("whatsapp")}</span><div><strong>{BIZ["mobile"]}</strong><span>Mobile & WhatsApp</span></div></a>
      <a class="contact-card" href="mailto:{BIZ["email"]}"><span class="ic">{ic("mail")}</span><div><strong>{BIZ["email"]}</strong><span>We reply within one working day</span></div></a>
      <div class="contact-card"><span class="ic">{ic("pin")}</span><div><strong>Grove House, Lutyens Close</strong><span>Chineham Court, Basingstoke RG24 8AG</span></div></div>
    </div>
    <h4 style="font-family:var(--sans);font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)">Opening hours</h4>
    <div class="hours"><div><span>Monday – Friday</span><span>9:00 – 18:00</span></div><div><span>Saturday</span><span>Closed</span></div><div><span>Sunday</span><span>Closed</span></div></div>
  </aside>
</div></section>
<section class="section-sm" style="padding-top:0"><div class="container"><div class="map reveal"><iframe title="Map showing MDJ Mortgages at Chineham Court, Basingstoke" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Grove+House,+Lutyens+Close,+Chineham+Court,+Basingstoke+RG24+8AG&output=embed"></iframe></div></div></section>
'''
    page("contact.html", "Contact MDJ Mortgages | Book a Free Mortgage Consultation in Basingstoke",
         "Book a free mortgage consultation with MDJ Mortgages. Call 01256 518318, WhatsApp 07798 819741 or send an enquiry online.", body)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for build in (home, about, mortgages, specialist, equity_release, protection, calculators, fees, reviews, areas, contact):
        build()
    print("Built", len(list(OUT.glob("*.html"))), "pages into", OUT)
