#!/usr/bin/env python3
"""
Co-Allies static site builder.

Pages live in src/pages/*.html with a small front-matter block:

    <!--
    title: Page title
    description: Meta description
    nav: fertility
    body: header-light
    -->

Each page is wrapped in the shared <head>, header, menu, closing CTA, footer and
scripts, then written to the repository root (ready for any static host).

Macros available inside pages:
    {{BOOK}} {{PHONE}} {{PHONE_HREF}} {{EMAIL}} {{LINKEDIN}}
    {{icon:name}}                         inline SVG icon
    {{marquee:Word|Word|Word[|class]}}    looping marquee band
    {{btn:Label|href|variant}}            pill button with arrow (variant: ember, light, ghost, sm)
    {{cta}}                               shared closing call-to-action

Run:  python3 tools/build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "pages"

SITE = {
    "BOOK": "https://calendly.com/nathaliadmf/seance-de-coaching-gratuite-de-30-minutes",
    "PHONE": "438 822 5015",
    "PHONE_HREF": "tel:+14388225015",
    "EMAIL": "nathaliadmf@co-allies.com",
    "LINKEDIN": "https://www.linkedin.com/in/nathaliadmf/",
    "URL": "https://www.co-allies.com",
}

ICONS = {
    "arrow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "arrow-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7l10 10M17 9v8H9"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    "mail": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "linkedin": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4V21H3zM9.5 9.75h3.8v1.6h.05c.53-1 1.84-2.05 3.78-2.05 4.04 0 4.79 2.66 4.79 6.12V21h-4v-4.9c0-1.17-.02-2.68-1.63-2.68-1.64 0-1.89 1.28-1.89 2.6V21h-4z"/></svg>',
    "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    "heart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.5 3.6 4 7.1 4c2 0 3.6 1.1 4.9 2.8C13.3 5.1 14.9 4 16.9 4c3.5 0 5.7 3.5 4.4 6.8C19.5 15.4 12 20 12 20z"/></svg>',
    "leaf": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l8-8"/></svg>',
    "spark": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
    "calendar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
    "clock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    "lock": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    "compass": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.3A6.5 6.5 0 0 1 21.5 20"/></svg>',
    "wave": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/><path d="M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/><path d="M2 7c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1"/></svg>',
    "chat": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z"/></svg>',
    "sun": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
    "path": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>',
    "info": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/></svg>',
    "star": '<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 0c1.3 10.6 8.4 18 20 20-11.6 2-18.7 9.4-20 20C18.7 29.4 11.6 22 0 20 11.6 18 18.7 10.6 20 0z"/></svg>',
}

NAV = [
    ("fertility", "fertility.html", "Fertility"),
    ("coaching", "coaching.html", "Coaching"),
    ("approach", "approach.html", "Approach"),
    ("about", "about.html", "About"),
    ("contact", "contact.html", "Contact"),
]


def icon(name):
    return ICONS[name]


def btn(label, href, variant=""):
    classes = ["btn"]
    for v in filter(None, variant.split()):
        classes.append("btn--" + v)
    ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
    if "ghost" in variant:
        return f'<a class="{" ".join(classes)}" href="{href}"{ext} data-magnetic="0.2">{label}</a>'
    return (f'<a class="{" ".join(classes)}" href="{href}"{ext} data-magnetic="0.2">'
            f'<span>{label}</span><span class="btn__icon">{icon("arrow")}</span></a>')


def marquee(words, cls=""):
    star = f'<span class="marquee__star">{icon("star")}</span>'
    items = "".join(f'<span class="marquee__item">{w}{star}</span>' for w in words) * 2
    label = " · ".join(words)
    return (f'<div class="marquee {cls}" role="marquee" aria-label="{label}"><div class="marquee__track">'
            f'<div class="marquee__group" aria-hidden="true">{items}</div>'
            f'<div class="marquee__group" aria-hidden="true">{items}</div></div></div>')


def head(meta):
    title = meta["title"]
    desc = meta["description"]
    slug = meta.get("_slug", "index")
    url = SITE["URL"] + ("/" if slug == "index" else f"/{slug}.html")
    jsonld = ""
    if slug == "index":
        data = {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Co-Allies",
            "description": desc,
            "url": SITE["URL"],
            "telephone": "+1-438-822-5015",
            "email": SITE["EMAIL"],
            "image": SITE["URL"] + "/assets/img/og.jpg",
            "areaServed": ["Montréal", "Québec", "Canada"],
            "address": {"@type": "PostalAddress", "addressLocality": "Montréal", "addressRegion": "QC", "addressCountry": "CA"},
            "founder": {"@type": "Person", "name": "Nathalia del Moral Fleury", "jobTitle": "Co-Active coach", "sameAs": [SITE["LINKEDIN"]]},
            "knowsAbout": ["Fertility coaching", "IVF emotional support", "Transition coaching", "Executive coaching", "Conscious leadership", "Inner Development Goals"],
        }
        jsonld = f'<script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>'
    preload = meta.get("preload", "")
    preload_tag = f'<link rel="preload" as="image" href="{preload}" fetchpriority="high">' if preload else ""
    return f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#f4ede3">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Co-Allies">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE['URL']}/assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<script>document.documentElement.className="js";if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("reduced");</script>
<link rel="preload" href="assets/fonts/fraunces-latin-full-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
{preload_tag}
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/main.css">
{jsonld}
</head>"""


LOGO = ('<svg class="logo__mark" viewBox="0 0 40 26" aria-hidden="true"><circle cx="13" cy="13" r="11.2"/><circle cx="27" cy="13" r="11.2"/></svg>'
        '<span>co<em>-</em>allies</span>')


def header(active):
    cur = ' aria-current="page"'
    links = "".join(
        f'<li><a class="nav__link" href="{href}"{cur if key == active else ""}>{label}</a></li>'
        for key, href, label in NAV
    )
    menu_links = '<li><a href="index.html"' + (' aria-current="page"' if active == "home" else "") + '><span>00</span>Home</a></li>'
    menu_links += "".join(
        f'<li><a href="{href}"{cur if key == active else ""}><span>0{i + 1}</span>{label}</a></li>'
        for i, (key, href, label) in enumerate(NAV)
    )
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
<header class="site-header">
  <div class="container">
    <a class="logo" href="index.html" aria-label="Co-Allies, home">{LOGO}</a>
    <nav class="nav" aria-label="Main">
      <ul class="nav__list">{links}</ul>
      {btn("Book a free session", SITE["BOOK"], "sm")}
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu"><span class="menu-toggle__text">Menu</span><span class="menu-toggle__lines" aria-hidden="true"></span></button>
    </nav>
  </div>
</header>
<div class="menu" id="menu" aria-label="Menu">
  <div class="container menu__inner">
    <ul class="menu__list">{menu_links}</ul>
    <div class="menu__foot">
      {btn("Book your free 30-min session", SITE["BOOK"], "ember")}
      <div class="menu__meta"><a href="{SITE['PHONE_HREF']}">{SITE['PHONE']}</a><a href="mailto:{SITE['EMAIL']}">{SITE['EMAIL']}</a><span>Montréal, QC</span></div>
    </div>
  </div>
</div>"""


def cta(meta):
    title = meta.get("cta_title", "Let’s talk about <em>your vision.</em>")
    lead = meta.get("cta_lead", "Your first 30 minutes are free. No pressure, no pitch. Just an honest conversation about where you are and where you want to go.")
    return f"""<section class="cta theme-dark grain" aria-labelledby="cta-title">
  <div class="cta__orb" aria-hidden="true"></div>
  <div class="container cta__inner">
    <span class="eyebrow eyebrow--plain" data-reveal><span class="dot dot--live"></span>Now welcoming new clients</span>
    <h2 class="display cta__title" id="cta-title" data-split>{title}</h2>
    <p class="lead cta__lead" data-reveal>{lead}</p>
    <div class="btn-row justify-center" data-reveal>
      {btn("Book your free session", SITE["BOOK"], "ember")}
      {btn("Send a message", "contact.html#write", "ghost")}
    </div>
    <div class="cta__contact" data-reveal>
      <a href="{SITE['PHONE_HREF']}">{icon('phone')}{SITE['PHONE']}</a>
      <a href="mailto:{SITE['EMAIL']}">{icon('mail')}{SITE['EMAIL']}</a>
    </div>
  </div>
</section>"""


def footer():
    return f"""<footer class="site-footer">
  <div class="container">
    <div class="footer__top">
      <div class="footer__brand">
        <a class="logo" href="index.html" aria-label="Co-Allies, home">{LOGO}</a>
        <p>One-to-one coaching with Nathalia del Moral Fleury, for the seasons that ask more of you than a plan. Based in Montréal.</p>
        {btn("Book a free session", SITE["BOOK"], "ember sm")}
      </div>
      <div class="footer__col">
        <h2 class="mono">Coaching</h2>
        <a href="fertility.html">Fertility</a>
        <a href="coaching.html#transition">Transition</a>
        <a href="coaching.html#founders">Founders &amp; CEOs</a>
        <a href="coaching.html#conscious">Conscious leadership</a>
      </div>
      <div class="footer__col">
        <h2 class="mono">Explore</h2>
        <a href="index.html">Home</a>
        <a href="approach.html">The approach</a>
        <a href="about.html">About Nathalia</a>
        <a href="contact.html">Contact</a>
      </div>
      <div class="footer__col footer__col--wide">
        <h2 class="mono">Say hello</h2>
        <a href="{SITE['PHONE_HREF']}">{SITE['PHONE']}</a>
        <a href="mailto:{SITE['EMAIL']}">{SITE['EMAIL']}</a>
        <a href="{SITE['LINKEDIN']}" target="_blank" rel="noopener">LinkedIn ↗</a>
        <span class="muted" style="color:var(--on-dark-3)">Montréal, Québec, Canada</span>
      </div>
    </div>
    <div class="footer__land">
      <p class="mono">Land acknowledgement</p>
      <p>We acknowledge that our office is located on unceded Indigenous lands. Tiohtià:ke (Montréal) is historically known as a gathering place for many First Nations, and the Kanien’kehá:ka Nation is recognized as the custodian of these lands and waters.</p>
    </div>
    <div class="footer__word" aria-hidden="true">co<em>-</em>allies</div>
    <div class="footer__bottom">
      <span>© <span data-year>2026</span> Co-Allies · Nathalia del Moral Fleury</span>
      <span class="footer__disclaimer">Coaching is not a substitute for medical, psychological or psychiatric care.</span>
      <span>Site by <a href="https://codebunny.net" target="_blank" rel="noopener">Code Bunny</a></span>
    </div>
  </div>
</footer>
<nav class="mobile-cta" aria-label="Quick actions">
  <a href="{SITE['PHONE_HREF']}">Call</a>
  <a href="{SITE['BOOK']}" target="_blank" rel="noopener">Book free 30 min</a>
</nav>
<script src="assets/vendor/gsap.min.js" defer></script>
<script src="assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/vendor/lenis.min.js" defer></script>
<script src="assets/js/main.js" defer></script>
</body>
</html>"""


FM = re.compile(r"^\s*<!--(.*?)-->", re.S)


def parse(text):
    m = FM.match(text)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        text = text[m.end():]
    return meta, text


def expand(text, meta):
    text = text.replace("{{cta}}", cta(meta))
    for k, v in SITE.items():
        text = text.replace("{{" + k + "}}", v)
    text = re.sub(r"\{\{icon:([a-z\-]+)\}\}", lambda m: icon(m.group(1)), text)

    def _btn(m):
        parts = m.group(1).split("|")
        while len(parts) < 3:
            parts.append("")
        return btn(*[p.strip() for p in parts[:3]])
    text = re.sub(r"\{\{btn:(.*?)\}\}", _btn, text)

    def _mq(m):
        parts = [p.strip() for p in m.group(1).split("|")]
        cls = parts.pop() if parts[-1].startswith("marquee--") else ""
        return marquee(parts, cls)
    text = re.sub(r"\{\{marquee:(.*?)\}\}", _mq, text)
    return text


def build():
    out = []
    for path in sorted(SRC.glob("*.html")):
        meta, body = parse(path.read_text(encoding="utf-8"))
        meta["_slug"] = path.stem
        body_class = meta.get("body", "")
        page = [
            head(meta),
            f'<body class="{("page-" + path.stem + " " + body_class).strip()}">',
            header(meta.get("nav", "")),
            '<main id="main">',
            expand(body, meta).strip(),
            "</main>",
            footer(),
        ]
        html = "\n".join(page)
        html = re.sub(r'class="([^"]*?)\s+"', r'class="\1"', html)
        (ROOT / f"{path.stem}.html").write_text(html, encoding="utf-8")
        out.append(path.stem)
    # sitemap
    urls = "".join(
        f"<url><loc>{SITE['URL']}/{'' if s == 'index' else s + '.html'}</loc></url>"
        for s in out if s != "404"
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n',
        encoding="utf-8",
    )
    print("Built:", ", ".join(out))


if __name__ == "__main__":
    build()
