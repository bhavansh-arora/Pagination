"""Shared layout + components for the Carole St-Pierre site build."""
import html
import json
import os

from image_sizes import SIZES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://www.carolest-pierre.com"
BOOK = "https://carolestpierre.zenoti.com/webstoreNew/services"
GIFT = "https://carolestpierre.zenoti.com/webstoreNew/giftcards/9e1aaf54-17e8-4258-9fae-9b75d45ae056"
PHONE = "450 455-7999"
TEL = "tel:+14504557999"
EMAIL = "info@carolest-pierre.com"
ADDRESS = "3210, boul. de la Gare, suite 170"
CITY = "Vaudreuil-Dorion, QC"
MAPS = "https://www.google.com/maps/search/?api=1&query=Carole+St-Pierre+salon+%26+spa+3210+boulevard+de+la+Gare+Vaudreuil-Dorion"
INSTAGRAM = "https://www.instagram.com/carolestpierre.salonspa/"
FACEBOOK = "https://www.facebook.com/profile.php?id=61553709430803"
APPLE = "https://apps.apple.com/us/app/carole-st-pierre-salon-and-spa/id6759603286"
GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=com.zenoti.carolestpierre"
REVIEW_GOOGLE = "https://www.google.com/search?q=Carole+St-Pierre+salon+%26+spa+Vaudreuil-Dorion+reviews"

HOURS = [  # (label, day index 0=Sun, text)
    ("Monday", 1, "10 AM – 5 PM"), ("Tuesday", 2, "9 AM – 7 PM"), ("Wednesday", 3, "9 AM – 8 PM"),
    ("Thursday", 4, "9 AM – 8 PM"), ("Friday", 5, "9 AM – 8 PM"), ("Saturday", 6, "9 AM – 5 PM"),
    ("Sunday", 0, "10 AM – 4 PM"),
]

E = html.escape


def ic(name, cls=""):
    """Inline SVG icon."""
    paths = {
        "arrow": '<path d="M3 8h10M9 4l4 4-4 4"/>',
        "arrow-up": '<path d="M4 12 12 4M5 4h7v7"/>',
        "left": '<path d="M13 8H3M7 4 3 8l4 4"/>',
        "plus": '<path d="M8 3v10M3 8h10"/>',
        "check": '<path d="m3 8.5 3 3 7-7"/>',
        "x": '<path d="m4 4 8 8M12 4l-8 8"/>',
        "down": '<path d="m3 6 5 5 5-5"/>',
        "phone": '<path d="M5.5 2.5 3 3c-.5 4.5 4.5 10.5 10 10l.5-2.5-3-1.5-1.5 1.5C7 9.5 6.5 9 5.5 7l1.5-1.5z"/>',
        "pin": '<path d="M8 14.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5z"/><circle cx="8" cy="6" r="1.8"/>',
        "mail": '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/>',
        "calendar": '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
        "search": '<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/>',
        "info": '<circle cx="8" cy="8" r="6"/><path d="M8 7.2v4M8 4.8v.2"/>',
        "leaf": '<path d="M3 13c0-6 3.5-9.5 10-10 0 6.5-3.5 10-9 10"/><path d="M3 13c2-3 4-5 7-6.5"/>',
        "drop": '<path d="M8 2s4.5 4.8 4.5 8a4.5 4.5 0 0 1-9 0C3.5 6.8 8 2 8 2z"/>',
        "heart": '<path d="M8 13.5S2.5 10 2.5 6.2A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.2C13.5 10 8 13.5 8 13.5z"/>',
        "tree": '<path d="M8 14.5V9M8 1.5l-4 5h2l-3 4h10l-3-4h2z"/>',
        "spark": '<path d="M8 1.5v4M8 10.5v4M1.5 8h4M10.5 8h4M3.4 3.4l2.2 2.2M10.4 10.4l2.2 2.2M3.4 12.6l2.2-2.2M10.4 5.6l2.2-2.2"/>',
        "gift": '<rect x="2" y="6" width="12" height="8" rx="1"/><path d="M1.5 4h13v2h-13zM8 4v10M8 4C6 1 3.5 2 5 4M8 4c2-3 4.5-2 3 0"/>',
        "clock": '<circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/>',
        "user": '<circle cx="8" cy="5.5" r="2.8"/><path d="M2.5 14c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/>',
        "car": '<path d="M2 11V8l1.5-4h9L14 8v3M2 11h12M2 11v2h2v-2M12 11v2h2v-2"/><circle cx="4.8" cy="9" r=".6"/><circle cx="11.2" cy="9" r=".6"/>',
        "shield": '<path d="M8 1.8 13 4v4c0 3.2-2.2 5.4-5 6.4-2.8-1-5-3.2-5-6.4V4z"/><path d="m5.6 8 1.7 1.7L10.6 6.4"/>',
        "rabbit": '<path d="M5 14.5c-1.8 0-2.5-1.5-2.5-3 0-2 1.6-3.5 3.5-3.6L5 3c-.2-1.3 1.5-1.6 1.9-.3L8 6.5l1.1-3.8c.4-1.3 2.1-1 1.9.3l-1 4.9c1.9.1 3.5 1.6 3.5 3.6 0 1.5-.7 3-2.5 3z"/>',
        "instagram": '<rect x="2" y="2" width="12" height="12" rx="3.5"/><circle cx="8" cy="8" r="2.8"/><circle cx="11.6" cy="4.4" r=".6" fill="currentColor"/>',
        "facebook": '<path d="M9.2 14V8.6h1.8l.3-2.1H9.2V5.2c0-.6.2-1 1-1h1.1V2.3c-.2 0-.9-.1-1.6-.1-1.6 0-2.7 1-2.7 2.8v1.5H5.2v2.1H7V14"/>',
        "apple": '<path d="M11 8.4c0-1.6 1.3-2.3 1.3-2.4-.7-1-1.8-1.2-2.2-1.2-.9-.1-1.8.6-2.3.6s-1.2-.5-2-.5C4.6 4.9 3.2 6 3.2 8.3c0 1.4.5 2.9 1.2 3.9.5.8 1 1.6 1.8 1.5.7 0 1-.5 1.9-.5s1.1.5 1.9.5 1.3-.8 1.8-1.5c.5-.8.8-1.6.8-1.7 0 0-1.6-.6-1.6-2.1zM9.6 3.6c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.8.9-.4.4-.7 1.1-.6 1.8.7.1 1.4-.3 1.8-.8z" fill="currentColor" stroke="none"/>',
        "play": '<path d="M3.5 2.2v11.6c0 .4.4.6.7.4l9.7-5.8c.3-.2.3-.6 0-.8L4.2 1.8c-.3-.2-.7 0-.7.4z"/>',
        "star": '<path d="m8 1.8 1.9 3.9 4.2.6-3 3 .7 4.2L8 11.5l-3.8 2 .7-4.2-3-3 4.2-.6z" fill="currentColor" stroke="none"/>',
        "scissors": '<circle cx="4.5" cy="11.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/><path d="M6 10 12.5 2.5M10 10 3.5 2.5"/>',
        "ring": '<circle cx="8" cy="10" r="4.5"/><path d="m6 3.5 2-2 2 2-2 2z"/>',
        "users": '<circle cx="5.8" cy="5.5" r="2.3"/><path d="M1.5 13.5c.6-2.6 2.3-3.8 4.3-3.8s3.7 1.2 4.3 3.8"/><path d="M10.5 3.4a2.3 2.3 0 0 1 0 4.3M12 9.9c1.3.4 2.2 1.5 2.5 3.6"/>',
        "sun": '<circle cx="8" cy="8" r="3"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3"/>',
        "crown": '<path d="M2 12.5h12M2.5 11 1.8 4.5l3.7 3L8 3l2.5 4.5 3.7-3-.7 6.5z"/>',
        "flower": '<circle cx="8" cy="8" r="1.8"/><path d="M8 6.2C6.5 3 8 1.5 8 1.5s1.5 1.5 0 4.7M9.8 8c3.2-1.5 4.7 0 4.7 0s-1.5 1.5-4.7 0M8 9.8c1.5 3.2 0 4.7 0 4.7s-1.5-1.5 0-4.7M6.2 8C3 9.5 1.5 8 1.5 8S3 6.5 6.2 8"/>',
    }
    return (f'<svg class="{cls}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[name]}</svg>')


SPARK = ('<i aria-hidden="true"><svg viewBox="0 0 40 40" fill="currentColor"><path d="M20 0c1.6 10.4 9.6 18.4 20 20-10.4 1.6-18.4 9.6-20 20'
         '-1.6-10.4-9.6-18.4-20-20C10.4 18.4 18.4 10.4 20 0z"/></svg></i>')


def img(name, alt="", sizes="100vw", cls="", eager=False, parallax=None, style=""):
    w, h = SIZES[name]
    src = f"assets/img/{name}.webp"
    srcset = ""
    if os.path.exists(os.path.join(ROOT, "assets", "img", name + "-800.webp")):
        srcset = f' srcset="assets/img/{name}-800.webp 800w, {src} {w}w" sizes="{sizes}"'
    load = ' fetchpriority="high"' if eager else ' loading="lazy" decoding="async"'
    par = f' data-parallax="{parallax}"' if parallax else ""
    c = f' class="{cls}"' if cls else ""
    st = f' style="{style}"' if style else ""
    return f'<img src="{src}"{srcset} width="{w}" height="{h}" alt="{E(alt)}"{load}{par}{c}{st}>'


def btn(label, href, variant="", ext=False, icon="arrow", small=False, attrs=""):
    cls = "btn" + (f" btn--{variant}" if variant else "") + (" btn--sm" if small else "")
    target = ' target="_blank" rel="noopener"' if ext else ""
    return f'<a class="{cls}" href="{href}"{target}{attrs}>{label} <span class="ic">{ic(icon)}</span></a>'


def book_btn(label="Book an appointment", variant="lime", small=False):
    return btn(label, BOOK, variant, ext=True, small=small)


def sec_head(num, left, right, title, lead="", title_cls="h2", extra=""):
    lead_html = f'<p class="lead" data-reveal>{lead}</p>' if lead else ""
    return f'''<div class="sec-head">
  <div class="sec-rule" data-reveal="fade"><span class="eyebrow"><span class="num">({num})</span> — {left}</span><span class="eyebrow hide-sm">{right}</span></div>
  <div class="sec-title"><h2 class="{title_cls}" data-split>{title}</h2>{lead_html}{extra}</div>
</div>'''


def lines(*ls):
    return "".join(f'<span class="ln">{l}</span>' for l in ls)


def price_row(name, price, desc="", meta=None, tag="", sub="", heading="h3", attrs=""):
    meta_html = ""
    if meta:
        meta_html = '<div class="meta">' + "".join(f"<span>{E(m)}</span>" for m in meta) + "</div>"
    tag_html = f' <span class="tag">{tag}</span>' if tag else ""
    sub_html = f"<small>{sub}</small>" if sub else ""
    desc_html = f"<p>{desc}</p>" if desc else ""
    return (f'<div class="price-row"{attrs}><{heading}>{name}{tag_html}</{heading}>'
            f'<div class="price">{price}{sub_html}</div>{desc_html}{meta_html}</div>')


NAV = [
    ("weddings.html", "Weddings"),
    ("rituals.html", "Spa rituals"),
    ("team.html", "Team"),
    ("about.html", "About"),
    ("visit.html", "Visit"),
]
SERVICES = [
    ("hair.html", "Hair & Makeup", "Aveda cuts, colour, treatments", "aveda-bob"),
    ("skin.html", "Skin & Esthetics", "Facials, nails, lashes, waxing", "facial-white"),
    ("massage.html", "Massage & Body", "15+ techniques, wraps, balneo", "massage-hands"),
    ("medispa.html", "Medispa & Laser", "Laser, mesotherapy, peels", "laser"),
    ("weddings.html", "Bridal", "Trials, parties, on-location", "bridal-updo"),
    ("rituals.html", "Spa Rituals", "Half-day & full-day packages", "hot-stones"),
]


def header(current, tone):
    svc_slugs = {s[0] for s in SERVICES[:4]}
    drop_items = "".join(
        f'<li><a href="{h}"{" aria-current=page" if current == h else ""}>{img(im, "", "64px")}<div><strong>{E(t)}</strong><span>{E(d)}</span></div></a></li>'
        for h, t, d, im in SERVICES)
    links = "".join(
        f'<li><a href="{h}"{" aria-current=page" if current == h else ""}>{t}</a></li>' for h, t in NAV)
    svc_cur = " is-current" if current in svc_slugs else ""
    return f'''<header class="site-header" data-tone="{tone}">
  <nav class="nav-bar" aria-label="Main">
    <a class="brand" href="index.html" aria-label="Carole St-Pierre salon &amp; spa, home">
      <img src="assets/img/logo-mark.png" width="38" height="38" alt="">
      <span class="brand-text"><span class="brand-name">Carole St-Pierre</span><span class="brand-sub">salon &amp; spa</span></span>
    </a>
    <ul class="nav-links" role="list">
      <li class="has-drop{svc_cur}"><button type="button" aria-expanded="false" aria-haspopup="true">Services {ic("down")}</button>
        <ul class="drop" role="list">{drop_items}
          <li class="drop-foot"><span class="muted">100+ treatments, open 7 days</span><a href="{BOOK}" target="_blank" rel="noopener">Book online →</a></li>
        </ul>
      </li>
      {links}
    </ul>
    <div class="nav-actions">
      <a class="nav-phone" href="{TEL}">{PHONE}</a>
      <span class="nav-book">{btn("Book now", BOOK, "lime", ext=True, small=True)}</span>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu">Menu <span class="bars"><i></i><i></i></span></button>
    </div>
  </nav>
</header>
<div class="menu" id="menu" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="menu-top">
    <a class="brand" href="index.html"><img src="assets/img/logo-mark.png" width="38" height="38" alt=""><span class="brand-text"><span class="brand-name">Carole St-Pierre</span><span class="brand-sub">salon &amp; spa</span></span></a>
    <button class="menu-close" type="button">Close <span class="x">{ic("x")}</span></button>
  </div>
  <div class="menu-body">
    <nav class="menu-list" aria-label="Menu">
      <a href="index.html"><span class="n">01</span>Home</a>
      <a href="hair.html"><span class="n">02</span>Services</a>
      <div class="menu-sub">{"".join(f'<a href="{h}">{E(t)}</a>' for h, t, _, _ in SERVICES[:4])}</div>
      <a href="weddings.html"><span class="n">03</span><span>Weddings <em>&amp; bridal</em></span></a>
      <a href="rituals.html"><span class="n">04</span>Spa rituals</a>
      <a href="team.html"><span class="n">05</span>The team</a>
      <a href="about.html"><span class="n">06</span>About Carole</a>
      <a href="visit.html"><span class="n">07</span>Visit &amp; FAQ</a>
    </nav>
    <div class="menu-foot">
      <span class="status" data-open-status></span>
      <a href="{TEL}">{PHONE}</a>
      <a href="mailto:{EMAIL}">{EMAIL}</a>
      <span>{ADDRESS}<br>{CITY}</span>
      <div class="btn-row">{book_btn("Book now")}{btn("Gift cards", GIFT, "ghost", ext=True)}</div>
    </div>
  </div>
</div>'''


def footer():
    hours = "".join(f'<li data-day="{d}"><span>{n[:3]}</span><span>{t}</span></li>' for n, d, t in HOURS)
    svc = "".join(f'<li><a href="{h}">{E(t)}</a></li>' for h, t, _, _ in SERVICES)
    return f'''<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-news">
        <span class="eyebrow"><span class="dot"></span> The inner circle</span>
        <h2>Promotions, new treatments <em>&amp; a birthday surprise.</em></h2>
        <form class="news-form" data-form data-subject="Newsletter sign-up" novalidate>
          <div class="row">
            <label class="visually-hidden" for="nl-email">Email</label>
            <input id="nl-email" name="email" type="email" required placeholder="Your email" autocomplete="email">
            <label class="visually-hidden" for="nl-bday">Birthday (MM/DD)</label>
            <input id="nl-bday" class="bday" name="birthday" type="text" inputmode="numeric" placeholder="Birthday MM/DD" pattern="[0-1][0-9]/[0-3][0-9]">
            <button class="btn btn--lime" type="submit">Join <span class="ic">{ic("arrow")}</span></button>
          </div>
          <p class="consent">One or two emails a month. Unsubscribe anytime. We never share your details.</p>
          <p class="form-status" role="status"></p>
        </form>
      </div>
      <div class="footer-cols">
        <div><h3>Visit</h3><p>{ADDRESS}<br>{CITY} J7V 8W5</p><ul class="mt-s"><li><a href="{MAPS}" target="_blank" rel="noopener">Get directions ↗</a></li><li><a href="{TEL}">{PHONE}</a></li><li><a href="mailto:{EMAIL}">{EMAIL}</a></li></ul></div>
        <div><h3>Hours</h3><ul class="hours-mini" data-hours>{hours}</ul></div>
        <div><h3>Services</h3><ul>{svc}</ul></div>
        <div><h3>Salon</h3><ul><li><a href="team.html">Our team</a></li><li><a href="about.html">About Carole</a></li><li><a href="about.html#careers">Careers &amp; internships</a></li><li><a href="visit.html#faq">FAQ</a></li><li><a href="{GIFT}" target="_blank" rel="noopener">Gift cards ↗</a></li><li><a href="{BOOK}" target="_blank" rel="noopener">Book online ↗</a></li></ul></div>
      </div>
    </div>
    <p class="footer-word" aria-hidden="true">Naturally <em>yours.</em></p>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> Carole St-Pierre salon &amp; spa · Aveda Concept salon, Vaudreuil-Dorion</span>
      <nav aria-label="Legal"><a href="privacy.html">Privacy</a><a href="visit.html#policies">Cancellation policy</a><a href="https://www.carolest-pierre.com/" hreflang="fr">Français</a></nav>
      <div class="socials"><a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram">{ic("instagram")}</a><a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook">{ic("facebook")}</a></div>
    </div>
  </div>
</footer>
<nav class="mbar" aria-label="Quick actions">
  <a href="{TEL}">{ic("phone")} Call</a>
  <a class="is-primary" href="{BOOK}" target="_blank" rel="noopener">{ic("calendar")} Book now</a>
  <a href="{MAPS}" target="_blank" rel="noopener">{ic("pin")} Directions</a>
</nav>'''


def schema():
    return {
        "@context": "https://schema.org",
        "@type": ["BeautySalon", "DaySpa", "HairSalon"],
        "name": "Carole St-Pierre salon & spa",
        "url": SITE_URL,
        "telephone": "+1-450-455-7999",
        "email": EMAIL,
        "image": SITE_URL + "/assets/img/ritual-scalp.webp",
        "logo": SITE_URL + "/assets/img/logo-mark.png",
        "priceRange": "$$",
        "address": {"@type": "PostalAddress", "streetAddress": "3210 boul. de la Gare, suite 170", "addressLocality": "Vaudreuil-Dorion",
                    "addressRegion": "QC", "postalCode": "J7V 8W5", "addressCountry": "CA"},
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": d, "opens": o, "closes": c}
            for d, o, c in [("Monday", "10:00", "17:00"), ("Tuesday", "09:00", "19:00"), ("Wednesday", "09:00", "20:00"),
                            ("Thursday", "09:00", "20:00"), ("Friday", "09:00", "20:00"), ("Saturday", "09:00", "17:00"),
                            ("Sunday", "10:00", "16:00")]],
        "sameAs": [INSTAGRAM, FACEBOOK],
        "founder": {"@type": "Person", "name": "Carole St-Pierre"},
    }


def page(slug, title, description, body, tone="dark", loader=False, extra_schema=None):
    blocks = [schema()] + (extra_schema or [])
    ld = "\n".join(f'<script type="application/ld+json">{json.dumps(b, ensure_ascii=False)}</script>' for b in blocks)
    loader_html = ('<div class="loader" aria-hidden="true"><div class="loader-inner"><img src="assets/img/logo-mark.png" alt="" width="64" height="64">'
                   '<div class="word"><span>Naturally</span> <span><em>yours.</em></span></div><div class="count">000</div></div></div>') if loader else ""
    canonical = SITE_URL + "/" + ("" if slug == "index.html" else slug)
    doc = f'''<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(description)}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0f2a22">
<meta property="og:type" content="website">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(description)}">
<meta property="og:image" content="{SITE_URL}/assets/img/ritual-scalp.webp">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preload" href="assets/fonts/manrope-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/fraunces-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/main.css">
<script>document.documentElement.classList.replace("no-js","js");</script>
{ld}
<script src="assets/vendor/gsap.min.js" defer></script>
<script src="assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/vendor/lenis.min.js" defer></script>
<script src="assets/js/config.js" defer></script>
<script src="assets/js/main.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{loader_html}
{header(slug, tone)}
<main id="main">
{body}
</main>
{footer()}
</body>
</html>
'''
    with open(os.path.join(ROOT, slug), "w", encoding="utf-8") as f:
        f.write(doc)
    return slug


def phero(crumb, title_lines, lead, image, alt, facts, jumps=None, tag="", cta=None):
    facts_html = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in facts)
    jump_html = ""
    if jumps:
        jump_html = '<nav class="jump" aria-label="On this page">' + "".join(f'<a href="#{a}">{t}</a>' for a, t in jumps) + "</nav>"
    tag_html = f'<span class="chip chip--lime tag mono">{tag}</span>' if tag else ""
    cta_html = cta if cta is not None else f'<div class="btn-row">{book_btn()}{btn("Call " + PHONE, TEL, "ghost", icon="phone")}</div>'
    return f'''<section class="frame phero grain" data-parallax-root>
  <div class="phero-inner">
    <div class="crumbs" data-reveal="fade"><a href="index.html">Home</a><span>/</span><span>{crumb}</span></div>
    <h1 class="phero-title" data-split>{lines(*title_lines)}</h1>
    <div class="phero-grid">
      <div class="phero-media" data-reveal="clip">{img(image, alt, "(min-width: 900px) 55vw, 100vw", eager=True, parallax=8)}{tag_html}</div>
      <div class="phero-meta" data-reveal>
        <p class="lead">{lead}</p>
        {cta_html}
        <dl class="phero-facts">{facts_html}</dl>
      </div>
    </div>
    {jump_html}
  </div>
</section>'''


def cta_band(title_html="Your moment <em>is waiting.</em>", sub="Book online in under a minute, or call and we will find the perfect time and specialist for you."):
    return f'''<section class="frame is-dark grain">
  <div class="container section cta">
    <span class="eyebrow" data-reveal="fade"><span class="num">✦</span> Open 7 days · Vaudreuil-Dorion</span>
    <h2 class="display" data-split>{title_html}</h2>
    <p class="lead" data-reveal>{sub}</p>
    <div class="cta-row" data-reveal>
      <div class="btn-row">{book_btn()}{btn("Buy a gift card", GIFT, "ghost", ext=True)}</div>
      <div class="cta-contacts">
        <a href="{TEL}"><span class="mono">Call</span><strong>{PHONE}</strong></a>
        <a href="{MAPS}" target="_blank" rel="noopener"><span class="mono">Find us</span><strong>3210 boul. de la Gare</strong></a>
        <span><span class="mono" style="display:block;color:var(--on-dark-3)">Today</span><strong class="status" data-open-status="short" style="font-size:1.05rem"></strong></span>
      </div>
    </div>
  </div>
</section>'''


def faq(items, start=1):
    out = []
    for i, (q, a) in enumerate(items, start):
        out.append(f'<details><summary><span class="n">{i:02d}</span><span>{q}</span><span class="pm">{ic("plus")}</span></summary><div class="ans">{a}</div></details>')
    return '<div class="faq">' + "".join(out) + "</div>"


def stars():
    return '<div class="stars" aria-label="5 stars">' + ic("star") * 5 + "</div>"


def review_card(name, date, text, variant=""):
    cls = "review" + (f" review--{variant}" if variant else "")
    return (f'<article class="{cls}"><blockquote>{E(text)}</blockquote>'
            f'<footer><strong>{E(name)}</strong><span class="mono">Google · {E(date)}</span></footer></article>')


def ritual_title(name):
    head, _, last = name.rpartition(" ")
    return f"{head} <em>{last}</em>" if head else f"<em>{name}</em>"


def phone_mock():
    return '''<div class="phone" aria-hidden="true"><div class="screen">
  <div class="app-head"><img src="assets/img/logo-mark.png" alt="">Carole St-Pierre</div>
  <p class="app-hi">Hi Sophie, <em>time for you?</em></p>
  <div class="app-days"><span>Mon<b>12</b></span><span class="on">Tue<b>13</b></span><span>Wed<b>14</b></span><span>Thu<b>15</b></span><span>Fri<b>16</b></span></div>
  <div class="app-slot"><span><strong>Aromatic massage</strong>60 min · Mila</span><i>10:30</i></div>
  <div class="app-slot"><span><strong>Kombucha facial</strong>Éminence · Mélanie</span><i>1:15</i></div>
  <div class="app-slot"><span><strong>Cut &amp; style</strong>Aveda · Jeff</span><i>4:00</i></div>
  <div class="app-cta">Confirm booking</div>
</div></div>'''


def menu_layout(groups, label="Menu sections"):
    """groups: list of (id, short label, title_html, intro, image or None, content_html)."""
    nav = "".join(f'<a href="#{gid}"><span>{E(short)}</span><span class="n">{i:02d}</span></a>' for i, (gid, short, *_r) in enumerate(groups, 1))
    out = []
    for i, (gid, short, title, intro, image, content) in enumerate(groups, 1):
        media = f'<div class="menu-group-media" data-reveal="clip">{img(image, "", "(min-width: 1024px) 70vw, 100vw")}</div>' if image else ""
        intro_html = f'<p class="lead">{intro}</p>' if intro else ""
        out.append(f'''<section class="menu-group" id="{gid}" aria-labelledby="{gid}-t">
  {media}
  <div class="menu-group-head" data-reveal><span class="eyebrow"><span class="num">{i:02d}</span> — {E(short)}</span><h2 class="h2" id="{gid}-t">{title}</h2>{intro_html}</div>
  <div data-reveal>{content}</div>
</section>''')
    return f'''<div class="menu-layout">
  <nav class="menu-nav" aria-label="{label}">{nav}</nav>
  <div>{"".join(out)}</div>
</div>'''


def team_strip(slugs, num, title, lead=""):
    from content import TEAM
    by = {t[1]: t for t in TEAM}
    people = "".join(
        f'<a class="person" href="team.html#{s}"><figure>{img("team/" + s, "Portrait of " + by[s][0], "280px")}</figure><div><strong>{E(by[s][0])}</strong><span>{E(by[s][2])}</span></div></a>'
        for s in slugs)
    return f'''<section class="section is-paper2">
  <div class="container">{sec_head(num, "Your specialists", "Book by name", title, lead)}</div>
  <div data-scroller><div class="people" data-reveal="fade">{people}</div></div>
  <div class="container mt-l" data-reveal><div class="btn-row" style="justify-content:space-between"><a class="link-arrow" href="team.html">Meet the whole team {ic("arrow")}</a><div class="round-btns"><button type="button" data-prev aria-label="Previous">{ic("left")}</button><button type="button" data-next aria-label="Next">{ic("arrow")}</button></div></div></div>
</section>'''


def note(text):
    return f'<p class="price-note">{ic("info")}<span>{text}</span></p>'


def ritual_steps(num, left, right, title, steps, lead=""):
    cards = "".join(f'<article class="step" data-reveal><span class="n">{i:02d}</span><h3>{t}</h3><p>{d}</p><span class="big" aria-hidden="true">{i:02d}</span></article>'
                    for i, (t, d) in enumerate(steps, 1))
    cls = "steps--3" if len(steps) == 3 else "steps--4"
    return f'''<section class="frame is-dark grain">
  <div class="container section">
    {sec_head(num, left, right, title, lead)}
    <div class="steps {cls}" data-stagger>{cards}</div>
  </div>
</section>'''
