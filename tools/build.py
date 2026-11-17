#!/usr/bin/env python3
"""Static site generator for codebunny.net.

    python3 tools/build.py      -> writes HTML, sitemap.xml, robots.txt etc. into ./public

No dependencies. Copy lives in tools/content.py and project data in tools/projects.json.
"""
import datetime
import html
import json
import os
from urllib.parse import quote

from blog import CATEGORIES as BCATS, load_articles, render as render_md, inline as inline_md, plain as plain_md
from content import (CATS, HOME_FAQ, INDUSTRIES, PROCESS, SERVICES, SITE,
                     TEMPLATES, TESTIMONIALS)

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "..", "public")
PROJECTS = json.load(open(os.path.join(ROOT, "projects.json")))
P = {p["slug"]: p for p in PROJECTS}
BASE = SITE["base"]
TODAY = datetime.date.today().isoformat()
VERSION = datetime.datetime.now().strftime("%Y%m%d%H%M")
WA = f"https://wa.me/{SITE['whatsapp']}?text={quote(SITE['whatsapp_text'])}"
CLIENT_SITES = [p for p in PROJECTS if p["cat"] != "templates"]
SITEMAP = []
LASTMOD = {}
SVC_BLOG = {"website-design": ["strategy", "design"], "seo": ["seo"], "website-redesign": ["design", "strategy"], "ecommerce": ["tech"], "mobile-app-development": ["tech"], "software-development": ["tech"]}
IND_BLOG = {"coaches": "coaches", "photographers": "photographers", "solar": "solar", "local-business": "local"}
ARTICLES = load_articles()

esc = html.escape


def strip(s):
    """Remove simple inline tags for plain-text contexts (meta, JSON-LD)."""
    import re
    return re.sub(r"<[^>]+>", "", s)


# --------------------------------------------------------------------------- icons
ICONS = {
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "ext": '<path d="M7 17L17 7M8 7h9v9"/>',
    "check": '<path d="M20 6L9 17l-5-5"/>',
    "layout": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 20V9"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    "refresh": '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M3 21v-5h5"/>',
    "cart": '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L22 8H6"/>',
    "phone": '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    "cpu": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "spark": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    "zap": '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    "chat": '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
}
WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>'


def icon(name, cls=""):
    return f'<svg class="{cls}" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'


ARROW = f'<span class="arrow">{icon("arrow")}</span>'


# --------------------------------------------------------------------------- schema
ORG_ID = BASE + "/#org"


def org_graph():
    return [
        {
            "@type": "Organization", "@id": ORG_ID, "name": SITE["name"], "url": BASE + "/",
            "logo": {"@type": "ImageObject", "url": BASE + "/icon-512.png", "width": 512, "height": 512},
            "image": BASE + "/assets/img/og/og-default.jpg",
            "email": SITE["email"],
            "description": "Code Bunny is a web design and development studio building fast, SEO-ready websites, mobile apps and custom software for small businesses worldwide.",
            "slogan": "Websites that win you clients.",
            "founder": {"@type": "Person", "@id": BASE + "/about/#founder", "name": SITE["founder"], "jobTitle": "Founder & Lead Developer"},
            "areaServed": [{"@type": "Country", "name": c} for c in SITE["countries"]],
            "knowsAbout": ["Web design", "Web development", "Search engine optimization", "Mobile app development", "E-commerce", "AI chatbots", "React", "Next.js", "Node.js"],
            "contactPoint": [{"@type": "ContactPoint", "contactType": "sales", "email": SITE["email"], "telephone": "+" + SITE["whatsapp"], "availableLanguage": ["English", "Hindi"]}],
            "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "@id": f"{BASE}/services/{s['slug']}/#service", "name": s["name"]}} for s in SERVICES],
        },
        {"@type": "WebSite", "@id": BASE + "/#website", "url": BASE + "/", "name": SITE["name"], "publisher": {"@id": ORG_ID}, "inLanguage": "en"},
    ]


def crumbs_schema(trail):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + u} for i, (n, u) in enumerate(trail)]}


def faq_schema(faqs):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faqs]}


# --------------------------------------------------------------------------- layout
NAV = [("Work", "/work/"), ("Services", "/services/"), ("Industries", "/industries/"), ("Templates", "/templates/"), ("Blog", "/blog/"), ("About", "/about/"), ("Contact", "/contact/")]


def head(*, path, title, desc, schema, og_image="og-default.jpg", noindex=False, preload_img=None, og_type="website", extra_meta=""):
    url = BASE + path
    full_title = title if ("Code Bunny" in title or len(title) > 47) else f"{title} | Code Bunny"
    graph = {"@context": "https://schema.org", "@graph": org_graph() + [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": strip(full_title), "description": desc, "isPartOf": {"@id": BASE + "/#website"}, "about": {"@id": ORG_ID}, "inLanguage": "en", "dateModified": TODAY}
    ] + schema}
    if not noindex:
        SITEMAP.append(path)
    pre = f'<link rel="preload" as="image" href="{preload_img}" fetchpriority="high">' if preload_img else ""
    loader_flag = "true" if path == "/" else "false"
    boot = ('<script>(function(h){h.className=h.className.replace("no-js","js");try{if(' + loader_flag +
            '&&!sessionStorage.getItem("cbv")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)h.classList.add("is-loading")}catch(e){}})(document.documentElement)</script>')
    return f"""<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
{boot}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="{'noindex, follow' if noindex else 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<meta name="author" content="{SITE['founder']}">
<meta name="theme-color" content="#0d0b0a">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Code Bunny">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/assets/img/og/{og_image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Code Bunny: web design and development studio">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(full_title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{BASE}/assets/img/og/{og_image}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin>
{pre}
<link rel="preload" href="/assets/js/vendor/gsap.min.js" as="script">
<link rel="stylesheet" href="/assets/css/site.css?v={VERSION}">
<link rel="alternate" type="application/rss+xml" title="Code Bunny Blog" href="{BASE}/blog/feed.xml">
{extra_meta}
<script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""


def nav(active):
    links = "".join(f'<a href="{u}"{" aria-current=\"page\"" if active == u else ""}>{n}</a>' for n, u in NAV)
    big = "".join(f'<a class="big" href="{u}">{n}<span>0{i+1}</span></a>' for i, (n, u) in enumerate(NAV))
    return f"""<header class="nav" role="banner">
  <div class="wrap nav-inner">
    <a href="/" class="brand" aria-label="Code Bunny home">
      <img class="bunny" src="/assets/img/brand/bunny.webp" alt="" width="34" height="34">
      <img class="wordmark" src="/assets/img/brand/wordmark.webp" alt="Code Bunny" width="118" height="22">
    </a>
    <nav class="nav-links" aria-label="Main">{links}</nav>
    <div class="nav-cta">
      <a class="btn btn-ghost btn-sm" href="{WA}" target="_blank" rel="noopener">WhatsApp</a>
      <a class="btn btn-sm" href="/free-website-preview/">Free preview</a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="drawer"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" aria-hidden="true">
  {big}
  <a class="btn btn-block" href="/free-website-preview/">Get a free website preview {ARROW}</a>
  <div class="drawer-meta"><a href="mailto:{SITE['email']}">{SITE['email']}</a><a href="{WA}" target="_blank" rel="noopener">WhatsApp +{SITE['whatsapp'][:2]} {SITE['whatsapp'][2:]}</a></div>
</div>
"""


def footer():
    svc = "".join(f'<li><a href="/services/{s["slug"]}/">{s["name"]}</a></li>' for s in SERVICES)
    ind = "".join(f'<li><a href="/industries/{i["slug"]}/">{i["name"]}</a></li>' for i in INDUSTRIES)
    return f"""<footer class="footer" role="contentinfo">
  <div class="wrap">
    <div class="foot-top">
      <div>
        <h2>Let's make your website <em>your best hire.</em></h2>
        <div class="hero-actions"><a class="btn" href="/free-website-preview/">Get a free preview {ARROW}</a></div>
      </div>
      <div class="foot-col"><h3>Services</h3><ul>{svc}</ul></div>
      <div class="foot-col"><h3>Industries</h3><ul>{ind}<li><a href="/templates/">Ready-made sites</a></li></ul></div>
      <div class="foot-col"><h3>Studio</h3><ul>
        <li><a href="/work/">Our work</a></li><li><a href="/blog/">Blog &amp; guides</a></li><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li>
        <li><a href="mailto:{SITE['email']}">{SITE['email']}</a></li>
        <li><a href="{WA}" target="_blank" rel="noopener">WhatsApp</a></li>
      </ul></div>
    </div>
    <div class="foot-big" aria-hidden="true">CodeBunny</div>
    <div class="foot-bottom">
      <span>© <span data-year>{datetime.date.today().year}</span> Code Bunny. Web design &amp; development studio, founded by {SITE['founder']}.</span>
      <span><a href="/privacy/">Privacy</a> · <a href="/sitemap.xml">Sitemap</a></span>
    </div>
  </div>
</footer>
<a class="wa" href="{WA}" target="_blank" rel="noopener" aria-label="Chat with Code Bunny on WhatsApp">{WA_SVG}</a>
<script src="/assets/js/vendor/gsap.min.js" defer></script>
<script src="/assets/js/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/js/vendor/SplitText.min.js" defer></script>
<script src="/assets/js/vendor/Flip.min.js" defer></script>
<script src="/assets/js/vendor/lenis.min.js" defer></script>
<script src="/assets/js/site.js?v={VERSION}" defer></script>
</body>
</html>
"""


def page(path, body, **kw):
    active = kw.pop("active", None)
    doc = head(path=path, **kw) + nav(active) + '<main id="main">' + body + "</main>" + footer()
    target = os.path.join(OUT, path.strip("/"), "index.html") if path.endswith("/") else os.path.join(OUT, path.lstrip("/"))
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w") as f:
        f.write(doc)


# --------------------------------------------------------------------------- components
def img_srcset(slug, sizes="(max-width: 860px) 100vw, 50vw", eager=False, alt=""):
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img class="desk" src="/assets/img/work/{slug}-1200.webp" srcset="/assets/img/work/{slug}-640.webp 640w, /assets/img/work/{slug}-1200.webp 1200w" '
            f'sizes="{sizes}" width="1200" height="750" alt="{esc(alt)}" {load}>')


def wcard(p, cls="", sizes="(max-width: 860px) 100vw, 50vw", phone=False, eager=False):
    ph = ""
    if phone and os.path.exists(os.path.join(OUT, "assets/img/work", p["slug"] + "-m.webp")):
        ph = f'<div class="phone" aria-hidden="true"><img src="/assets/img/work/{p["slug"]}-m.webp" width="420" height="909" alt="" loading="lazy"></div>'
    tags = "".join(f'<span class="tag">{esc(t)}</span>' for t in p["tags"])
    alt = f'{p["name"]} website homepage designed and built by Code Bunny'
    return f"""<a class="wcard {cls} rv" href="{p['url']}" target="_blank" rel="noopener" data-cat="{p['cat']}">
  <div class="media">{img_srcset(p['slug'], sizes, eager, alt)}{ph}<span class="visit">{esc(p['domain'])} {icon('ext')}</span></div>
  <div class="meta"><div><h3>{esc(p['name'])}</h3><p>{esc(p['blurb'])}</p><div class="tagrow">{tags}</div></div><span class="loc">{esc(p['location'])}</span></div>
</a>"""


def faq_block(faqs, light=False, title="Questions, <em>answered.</em>", eyebrow="FAQ"):
    items = "".join(f'<details><summary>{esc(q)}<span class="pm" aria-hidden="true"></span></summary><div class="ans"><p>{a}</p></div></details>' for q, a in faqs)
    return f"""<section class="section{' light' if light else ''}" aria-labelledby="faq-h">
  <div class="wrap faq-wrap">
    <div class="rv"><span class="eyebrow">{eyebrow}</span><h2 class="h2" id="faq-h" style="margin-top:22px">{title}</h2>
      <p class="lead" style="margin-top:22px">Still curious? <a class="link-arrow" href="/contact/">Ask us anything</a></p></div>
    <div class="faq rv rv-d1">{items}</div>
  </div>
</section>"""


def cta_block(title="Want to see your new website <em>before you pay?</em>", lead=None):
    lead = lead or f"Tell us about your business and we'll design a live homepage preview, free, usually {SITE['preview_turnaround']}. No card. No contract. No pressure."
    return f"""<section class="cta" aria-labelledby="cta-h">
  <div class="wrap">
    <img class="cta-bunny" src="/assets/img/brand/bunny.webp" alt="" width="64" height="64" loading="lazy">
    <h2 class="h1 rv" id="cta-h">{title}</h2>
    <p class="lead rv rv-d1">{lead}</p>
    <div class="hero-actions rv rv-d2"><a class="btn" href="/free-website-preview/">Get my free preview {ARROW}</a><a class="btn btn-ghost" href="{WA}" target="_blank" rel="noopener">Chat on WhatsApp</a></div>
  </div>
</section>"""


def phero(trail, eyebrow, h1, lead, actions=""):
    cr = "".join(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(trail) - 1 else f'<li aria-current="page">{esc(n)}</li>' for i, (n, u) in enumerate(trail))
    return f"""<section class="phero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap">
    <nav aria-label="Breadcrumb"><ol class="crumbs">{cr}</ol></nav>
    <span class="eyebrow fade-up">{eyebrow}</span>
    <h1 class="h1" style="margin-top:24px">{h1}</h1>
    <p class="lead fade-up d2">{lead}</p>
    {f'<div class="hero-actions fade-up d3">{actions}</div>' if actions else ''}
  </div>
</section>"""


def checklist(items):
    return '<ul class="checklist">' + "".join(f"<li>{icon('check')}<span>{i}</span></li>" for i in items) + "</ul>"


def quotes_block():
    q = "".join(f"""<figure class="quote rv{' rv-d1' if i % 2 else ''}"><span class="stars" aria-label="5 out of 5 stars">★★★★★</span><blockquote>{esc(t['q'])}</blockquote>
  <figcaption><span class="av" aria-hidden="true">{''.join(w[0] for w in t['n'].split()[:2])}</span><span><b>{esc(t['n'])}</b><span>{esc(t['r'])}</span></span></figcaption></figure>""" for i, t in enumerate(TESTIMONIALS))
    return f"""<section class="section light" aria-labelledby="q-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">Kind words</span><h2 class="h2" id="q-h">Founders who needed it done <em>right, and fast.</em></h2></div>
    <p class="lead rv rv-d1">Direct access to the person building your site, clear communication and work that ships. That's the whole pitch.</p></div>
    <div class="quotes">{q}</div>
  </div>
</section>"""


def process_block(light=False):
    s = "".join(f'<li class="step rv rv-d{i}"><span class="kicker-num">0{i+1}</span><span class="when">{w}</span><h3>{n}</h3><p>{d}</p></li>' for i, (n, w, d) in enumerate(PROCESS))
    return f"""<section class="section{' light' if light else ''}" aria-labelledby="p-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">How it works</span><h2 class="h2" id="p-h">From first call to live site <em>in about two weeks.</em></h2></div>
    <p class="lead rv rv-d1">A tight, founder-led process. No account managers, no bloated handoffs, no surprises on the invoice.</p></div>
    <ol class="steps">{s}</ol>
  </div>
</section>"""


def preview_form(heading=True):
    ind_opts = "".join(f"<option>{esc(v)}</option>" for v in ["Coaching / consulting", "Photography / videography", "Solar / energy", "Salon / spa / beauty", "Health / medical / dental", "Finance / mortgage / legal", "Education / training", "Restaurant / food", "Trades / home services", "E-commerce / retail", "SaaS / startup", "Other"])
    svc_opts = "".join(f"<option>{esc(v)}</option>" for v in ["New website", "Website redesign", "SEO", "E-commerce / booking site", "Mobile app", "Custom software / AI chatbot", "Free website & SEO audit", "Buy a ready-made site", "Something else"])
    return f"""<form class="form-card" data-form action="https://formsubmit.co/ajax/{SITE['form_inbox']}" method="POST" novalidate>
  {'<h2 class="h3" style="margin-bottom:8px">Tell us about your business</h2><p class="muted" style="margin-bottom:26px">Takes about 60 seconds. We reply personally.</p>' if heading else ''}
  <fieldset class="seg" style="border:0;margin:0 0 28px;min-width:0"><legend class="sr-only">What would you like?</legend>
    <label><input type="radio" name="request" value="Free website preview" checked><span><b>Free website preview</b><small>See your new homepage first</small></span></label>
    <label><input type="radio" name="request" value="Project enquiry"><span><b>Start a project</b><small>Quote, question or template</small></span></label>
  </fieldset>
  <div class="fgrid">
    <div class="field"><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required placeholder="Jane Smith"></div>
    <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required placeholder="jane@yourbusiness.com"></div>
    <div class="field"><label for="f-business">Business name</label><input id="f-business" name="business" autocomplete="organization" required placeholder="Smith Studio"></div>
    <div class="field"><label for="f-phone">Phone / WhatsApp <span class="opt">(optional)</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+1 555 123 4567"></div>
    <div class="field"><label for="f-site">Current website <span class="opt">(if any)</span></label><input id="f-site" name="current_website" type="text" inputmode="url" placeholder="yourbusiness.com"></div>
    <div class="field"><label for="f-ind">Industry</label><select id="f-ind" name="industry">{ind_opts}</select></div>
    <div class="field full" data-project-only><label for="f-svc">What do you need?</label><select id="f-svc" name="service">{svc_opts}</select></div>
    <div class="field full"><label for="f-msg">Anything we should know? <span class="opt">(optional)</span></label><textarea id="f-msg" name="message" placeholder="Who are your ideal customers? Any sites you love? Colours, must-haves, deadlines…"></textarea></div>
  </div>
  <input type="hidden" name="source" value="">
  <input class="hp" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
  <div class="form-foot"><small>By sending this you agree to be contacted about your request. We never share your details. <a href="/privacy/" style="text-decoration:underline">Privacy</a></small>
    <button class="btn" type="submit">Send request {ARROW}</button></div>
  <div class="form-status" role="status" aria-live="polite"></div>
</form>"""


def preview_aside():
    return f"""<aside>
  <div class="aside-card"><h3>What you get, <em class="serif-em">free</em></h3>{checklist(['A custom-designed homepage for your business', 'Hosted on a live, private link you can share', 'Mobile and desktop versions', 'Your logo, colours and real services', f'Delivered {SITE["preview_turnaround"]}', 'Zero obligation to continue'])}</div>
  <div class="aside-card"><h3>Prefer to talk?</h3>
    <a class="contact-line" href="mailto:{SITE['email']}"><span class="ic">{icon('mail')}</span><span><small>Email</small>{SITE['email']}</span></a>
    <a class="contact-line" href="{WA}" target="_blank" rel="noopener"><span class="ic">{WA_SVG}</span><span><small>WhatsApp</small>+{SITE['whatsapp'][:2]} {SITE['whatsapp'][2:7]} {SITE['whatsapp'][7:]}</span></a>
    <div class="contact-line"><span class="ic">{icon('clock')}</span><span><small>Response time</small>Usually within one business day</span></div>
  </div>
</aside>"""


def url_demo():
    demo = ["dan-reynolds-photography", "highfifteen", "ecohorizon", "aristafilms", "mdj-mortgages"]
    names = ["yourstudio", "yourcoaching", "yoursolar", "yourfilms", "yourbrand"]
    imgs = "".join(f'<img src="/assets/img/work/{s}-1200.webp" width="1200" height="750" alt="" loading="lazy"{" class=on" if i == 0 else ""}>' for i, s in enumerate(demo))
    return f"""<div class="url-demo rv" data-url-demo='{json.dumps(names)}' aria-hidden="true">
  <span class="badge-free">Free preview</span>
  <div class="url-bar">{icon('lock', 'lock')}<span><span class="typed">yourbrand</span><span class="caret"></span><b>.codebunny.net</b></span></div>
  <div class="frame">{imgs}</div>
</div>"""


# --------------------------------------------------------------------------- pages
def chat_block():
    """Real WhatsApp messages from Dan Reynolds (Dan Reynolds Photography), replayed as you scroll."""
    tick = '<svg class="ticks" viewBox="0 0 18 11" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 6l3.5 3.5L11 2M7 9.5L8 10.5 16.5 2"/></svg>'
    def out(text, t, mid="", react=""):
        r = '<span class="react" aria-label="reacted with a heart">❤️</span>' if react else ""
        return f'<div class="msg out{" has-react" if react else ""}"{f" id={chr(34)}{mid}{chr(34)}" if mid else ""}>{text}<span class="t">{t} {tick}</span>{r}</div>'
    def inc(text, t, extra="", attrs=""):
        return f'<div class="msg in {extra}"{attrs}>{text}<span class="t">{t}</span></div>'
    msgs = (out("As of now there are 4 sample posts you can remove those and add your content.", "6:23 PM")
            + out("Also, the website editor is ready. It just needs a one-time setup from your side.<br><br>Open <u>danreynoldsphotography.com/editor</u>, click I&#8217;m the owner: set it up and follow the steps on the screen.", "6:35 PM", "m-editor", react=True)
            + out("Let me know if you face any issues.", "6:35 PM")
            + inc("That is amazing!!", "7:23 PM", attrs=' data-react-on="m-editor"')
            + inc("Thank you!", "7:23 PM", attrs=' data-wait="700"')
            + out("You&#8217;re very welcome Dan! Glad you like it.", "8:13 PM")
            + out("Is there anything else you&#8217;d like me to change or improve in the website?", "8:14 PM")
            + inc("Anything we can do about SEO? I think the site looks great. I&#8217;m going to try to make my first blog next week", "8:14 PM", attrs=' data-wait="1700"')
            + inc("I got a lot of compliments on it", "8:14 PM", "star"))
    chips = [("spark", "Built-in website editor"), ("layout", "Blog ready on launch day"), ("chat", "Direct WhatsApp support"), ("search", "SEO foundations included")]
    chip_html = "".join(f"<li>{icon(i)}{t}</li>" for i, t in chips)
    return f"""<section class="section chat-sec" aria-labelledby="chat-h">
  <div class="wrap chat-grid">
    <div>
      <span class="eyebrow rv">Straight from WhatsApp</span>
      <h2 class="chat-quote" id="chat-h">&ldquo;I got a lot of <em>compliments</em> on it.&rdquo;</h2>
      <div class="chat-who rv"><span class="av" aria-hidden="true">DR</span><span><b>Daniel Reynolds</b><span>Dan Reynolds Photography · Chicago &amp; Peoria, Illinois</span></span></div>
      <p class="lead rv" style="margin-top:28px">Dan's site launched with a built-in editor and a blog, so he can publish his own wedding stories without waiting on a developer. We stayed one message away the whole time. Then the compliments started rolling in.</p>
      <ul class="feat-chips rv">{chip_html}</ul>
      <div class="hero-actions rv"><a class="btn" href="/free-website-preview/">Get a site like Dan's {ARROW}</a><a class="btn btn-ghost" href="https://www.danreynoldsphotography.com/" target="_blank" rel="noopener">Visit his site ↗</a></div>
    </div>
    <figure class="phone-x" aria-label="WhatsApp conversation between Code Bunny and Daniel Reynolds">
      <div class="screen">
        <span class="island" aria-hidden="true"></span>
        <div class="sbar" aria-hidden="true"><span>8:14</span><span>5G ▮</span></div>
        <div class="chead"><span class="back" aria-hidden="true">‹</span><span class="av" aria-hidden="true">DR</span><span><b>Daniel Reynolds</b><small class="status">online</small></span></div>
        <div class="chat" data-chat data-lenis-prevent>{msgs}<div class="typing-b" aria-hidden="true"><i></i><i></i><i></i></div></div>
        <div class="cbar" aria-hidden="true"><i></i><span></span><i></i></div>
      </div>
      <div class="burst" aria-hidden="true"></div>
      <figcaption class="sr-only">Real messages from Daniel Reynolds after his website launched: "That is amazing!! Thank you!" and "I think the site looks great. I got a lot of compliments on it."</figcaption>
    </figure>
  </div>
</section>"""


def build_home():
    wall_slugs = [p["slug"] for p in CLIENT_SITES] + [p["slug"] for p in PROJECTS if p["cat"] == "templates"]
    row1, row2 = wall_slugs[0::2], wall_slugs[1::2]

    def row(slugs, cls=""):
        cells = "".join(f'<div class="shot"><div class="chrome"><i></i><i></i><i></i></div><img src="/assets/img/work/{s}-640.webp" width="640" height="400" alt="" {"" if i < 4 else "loading=lazy"}></div>' for i, s in enumerate(slugs))
        return f'<div class="wall-row {cls}">{cells}{cells}</div>'

    names = [p["name"] for p in CLIENT_SITES]
    strip_html = "".join(f"<span>{esc(n)}</span>" for n in names)
    feat = [P[s] for s in ["dan-reynolds-photography", "aristafilms", "ecohorizon", "highfifteen", "thrill-lands", "custombotify", "capturedbykatherine", "sunflow"]]
    panels = ""
    for i, p in enumerate(feat):
        ph = ""
        if os.path.exists(os.path.join(OUT, "assets/img/work", p["slug"] + "-m.webp")):
            ph = f'<div class="phone" aria-hidden="true"><img src="/assets/img/work/{p["slug"]}-m.webp" width="420" height="909" alt="" loading="lazy"></div>'
        tags = "".join(f'<span class="tag">{esc(t)}</span>' for t in p["tags"])
        panels += f"""<a class="hs-panel wcard{' sm' if i % 3 == 2 else ''}" href="{p['url']}" target="_blank" rel="noopener">
  <div class="idx"><b>0{i+1}</b>/ {esc(CATS[p['cat']])}</div>
  <div class="media">{img_srcset(p['slug'], '(max-width: 900px) 100vw, 62vw', alt=p['name'] + ' website by Code Bunny')}{ph}<span class="visit">{esc(p['domain'])} {icon('ext')}</span></div>
  <div class="meta"><div><h3>{esc(p['name'])}</h3><p>{esc(p['blurb'])}</p><div class="tagrow">{tags}</div></div><span class="loc">{esc(p['location'])}</span></div>
</a>"""
    panels += f'<div class="hs-end"><span class="eyebrow no-line">{len(PROJECTS) - len(feat)} more</span><p class="h2">See every <em>live</em> site.</p><a class="btn" href="/work/">Full portfolio {ARROW}</a></div>'

    svc_img = {"website-design": "dan-reynolds-photography", "seo": "ecohorizon", "website-redesign": "co-allies", "ecommerce": "tpl-furniture", "mobile-app-development": "dancecart", "software-development": "custombotify"}
    svcs = "".join(f'<a class="svc rv" href="/services/{s["slug"]}/" data-img="/assets/img/work/{svc_img[s["slug"]]}-640.webp"><span class="num">0{i+1}</span><h3>{s["name"]}</h3><p>{s["card"]}</p><span class="go">{icon("arrow")}</span></a>' for i, s in enumerate(SERVICES))
    inds = ""
    for i, ind in enumerate(INDUSTRIES):
        n = sum(1 for p in PROJECTS if p["cat"] in ind["cats"])
        inds += f'<a class="ind rv rv-d{i}" href="/industries/{ind["slug"]}/"><img src="/assets/img/work/{ind["img"]}-640.webp" width="640" height="400" alt="" loading="lazy"><span class="count">{n} live sites</span><h3>{ind["name"]}</h3><p>{ind["card"]}</p><span class="link-arrow">Explore {icon("arrow")}</span></a>'
    latest = blog_teasers(3) if ARTICLES else ""

    body = f"""
<div class="loader" aria-hidden="true"><div class="loader-in"><img src="/assets/img/brand/bunny.webp" alt="" width="72" height="72"><div class="loader-word">Code<em>Bunny</em></div><div class="loader-bar"><i></i></div><div class="loader-count"><span>0</span>%</div></div></div>
<section class="hero" aria-labelledby="hero-h">
  <canvas class="gl" aria-hidden="true"></canvas>
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap hero-copy">
    <span class="eyebrow fade-up">Web design &amp; development studio</span>
    <h1 class="h1" id="hero-h"><span class="line"><span>Websites that</span></span><span class="line"><span>win you <em>clients.</em></span></span></h1>
    <p class="hero-aside fade-up" aria-hidden="true"><svg viewBox="0 0 64 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="--len:90"><path d="M2 4c14 2 30 10 40 20M42 24l-2-10M42 24l-10-1"/></svg><span>and a lot of compliments</span><svg class="scribble" viewBox="0 0 200 14" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="--len:240"><path d="M2 9c40-6 80-7 120-4 25 2 50 3 76-1"/></svg></p>
    <div class="hero-row">
      <div>
        <p class="lead fade-up">Code Bunny designs and builds fast, SEO-ready websites for coaches, photographers, solar companies and local businesses. {len(CLIENT_SITES)} live sites across {len(SITE['countries'])} countries, and we'll design yours before you pay a cent.</p>
        <div class="hero-actions fade-up d2"><a class="btn" href="/free-website-preview/">Get a free website preview {ARROW}</a><a class="btn btn-ghost" href="/work/">See our work</a></div>
        <p class="hero-note fade-up d3"><span class="dot" aria-hidden="true"></span>Now taking 3 new projects this month</p>
      </div>
      <div class="hero-stats fade-up d3" aria-label="Studio at a glance">
        <div><b>{SITE['projects_delivered']}+</b><span>projects delivered</span></div>
        <div><b>{SITE['years']} yrs</b><span>shipping real products</span></div>
      </div>
    </div>
  </div>
  <div class="wall" aria-hidden="true"><div class="wall-plane">{row(row1)}{row(row2, 'rev')}</div></div>
</section>

<div class="strip" aria-label="Some of our clients"><div class="strip-track">{strip_html}{strip_html}</div></div>

<section class="section light preview-band" aria-labelledby="pv-h">
  <div class="wrap preview-grid">
    <div>
      <span class="eyebrow rv">Our free website preview</span>
      <h2 class="h2" id="pv-h" style="margin-top:22px">See your new website <em>before</em> you spend a thing.</h2>
      <p class="lead rv rv-d1" style="margin-top:22px">Most agencies ask you to pay for a mood board. We'd rather show you. Tell us about your business and we'll design a real, working homepage on a live link, completely free.</p>
      <ol class="preview-steps rv rv-d2">
        <li><div><h3>Tell us about your business</h3><p>A 60-second form: who you serve, what you sell, any sites you love.</p></div></li>
        <li><div><h3>We design your homepage</h3><p>A custom preview on <b>yourbrand.codebunny.net</b>, {SITE['preview_turnaround']}.</p></div></li>
        <li><div><h3>Love it? We build the rest.</h3><p>Get a fixed quote for the full site. Not for you? Walk away, no cost.</p></div></li>
      </ol>
      <div class="hero-actions rv rv-d3"><a class="btn btn-dark" href="/free-website-preview/">Claim my free preview {ARROW}</a></div>
      <div class="preview-points"><span>{icon('check')}No card required</span><span>{icon('check')}No contract</span><span>{icon('check')}Yours to keep if you build with us</span></div>
    </div>
    {url_demo()}
  </div>
</section>

<section class="section hs" aria-labelledby="work-h" style="padding-bottom:0">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">Selected work</span><h2 class="h2" id="work-h">Real sites. Real businesses. <em>Live right now.</em></h2></div>
    <div class="rv rv-d1"><p class="lead">Every project here is live on the web. Scroll through, then click any one and explore it yourself.</p><p style="margin-top:22px"><a class="link-arrow" href="/work/">View all {len(PROJECTS)} projects {icon('arrow')}</a></p></div></div>
  </div>
  <div class="hs-pin"><div class="hs-track">{panels}</div><div class="hs-bar" aria-hidden="true"><i></i></div><div class="hs-counter" aria-hidden="true">01 / 0{len(feat)}</div></div>
</section>

{chat_block()}

<section class="section-tight" aria-label="Studio numbers">
  <div class="wrap"><div class="numbers rv">
    <div><b data-count="{SITE['projects_delivered']}">{SITE['projects_delivered']}<sup>+</sup></b><span>Projects delivered for founders and small businesses</span></div>
    <div><b data-count="{len(CLIENT_SITES)}">{len(CLIENT_SITES)}</b><span>Client sites and products live in this portfolio</span></div>
    <div><b data-count="{len(SITE['countries'])}">{len(SITE['countries'])}</b><span>Countries, from Hawaii to Bengaluru</span></div>
    <div><b data-count="{SITE['years']}">{SITE['years']}<sup>yrs</sup></b><span>Building and shipping real products</span></div>
  </div></div>
</section>

<section class="section" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">What we do</span><h2 class="h2" id="svc-h">Everything you need to <em>grow online.</em></h2></div>
    <p class="lead rv rv-d1">Design, development, SEO and the software behind it, under one roof, from one team that's accountable for results.</p></div>
    <div class="svc-list">{svcs}</div>
  </div>
</section>

<section class="section" style="padding-top:0" aria-labelledby="ind-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">Industries</span><h2 class="h2" id="ind-h">We know <em>your</em> customers.</h2></div>
    <p class="lead rv rv-d1">Most of our work is for a handful of industries, so we already know what makes their customers click, trust and book.</p></div>
    <div class="ind-grid">{inds}</div>
  </div>
</section>

{process_block(light=True)}

<section class="section" aria-labelledby="f-h">
  <div class="wrap founder">
    <figure class="founder-photo rv"><img src="/assets/img/brand/bhavansh.webp" width="600" height="900" alt="Bhavansh Arora, founder of Code Bunny" loading="lazy"><figcaption><span><b>{SITE['founder']}</b><br><span class="muted">Founder &amp; lead developer</span></span><img src="/assets/img/brand/bunny.webp" width="36" height="36" alt=""></figcaption></figure>
    <div>
      <span class="eyebrow rv">A note from the founder</span>
      <h2 class="sr-only" id="f-h">About the founder</h2>
      <blockquote class="rv rv-d1" style="margin-top:26px">"I started Code Bunny because small businesses deserve the kind of website big brands pay <em>agencies a fortune</em> for, built by someone who actually picks up the phone."</blockquote>
      <p class="sig rv rv-d2"><b>{SITE['founder']}</b>, founder. {SITE['years']} years building websites, apps and software, including our own products CustomBotify and Thrill Lands.</p>
      <div class="hero-actions rv rv-d3"><a class="btn btn-ghost" href="/about/">Our story {ARROW}</a></div>
    </div>
  </div>
</section>

{quotes_block()}
{latest}
{faq_block(HOME_FAQ)}
{cta_block()}
"""
    page("/", body, title="Web Design & Development Studio | Code Bunny",
         desc=f"Code Bunny designs fast, SEO-ready websites for coaches, photographers, solar and local businesses. {len(CLIENT_SITES)} live sites in {len(SITE['countries'])} countries. Free preview.",
         schema=[faq_schema(HOME_FAQ)], active="/", preload_img=None)


def build_work():
    counts = {k: sum(1 for p in PROJECTS if p["cat"] == k) for k in CATS}
    chips = f'<button class="chip" data-filter="all" aria-pressed="true">All<span class="n">{len(PROJECTS)}</span></button>' + "".join(
        f'<button class="chip" data-filter="{k}" aria-pressed="false">{v}<span class="n">{counts[k]}</span></button>' for k, v in CATS.items() if counts[k])
    order = sorted(PROJECTS, key=lambda p: (not p["featured"], list(CATS).index(p["cat"])))
    cards = "".join(wcard(p, sizes="(max-width: 640px) 100vw, (max-width: 1020px) 50vw, 33vw") for p in order)
    items = [{"@type": "ListItem", "position": i + 1, "item": {"@type": "CreativeWork", "name": p["name"], "url": p["url"], "description": p["blurb"], "image": f"{BASE}/assets/img/work/{p['slug']}-1200.webp", "creator": {"@id": ORG_ID}, "genre": CATS[p["cat"]]}} for i, p in enumerate(order)]
    body = phero([("Home", "/"), ("Work", "/work/")], "Portfolio", f"{len(PROJECTS)} websites. <em>All live.</em>",
                 "Coaching brands, wedding filmmakers, solar installers, clinics, schools and SaaS products in the US, Canada, the UK, Ireland, Australia, New Zealand and India. Filter by industry and click through to explore each one.") + f"""
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter projects by industry">{chips}</div>
    <p id="filter-live" class="sr-only" aria-live="polite"></p>
    <div class="grid-work">{cards}</div>
  </div>
</section>
{cta_block('Your business could be <em>next on this page.</em>')}"""
    page("/work/", body, title="Our Work: Website Design Portfolio", desc=f"Explore {len(PROJECTS)} live websites designed and built by Code Bunny for coaches, wedding photographers, solar companies, clinics, schools and startups worldwide.",
         schema=[crumbs_schema([("Home", "/"), ("Work", "/work/")]), {"@type": "ItemList", "name": "Code Bunny portfolio", "numberOfItems": len(items), "itemListElement": items}], active="/work/")


def build_services():
    cards = "".join(f'<a class="card rv rv-d{i%3}" href="/services/{s["slug"]}/"><span class="ic">{icon(s["icon"])}</span><h3>{s["name"]}</h3><p>{s["card"]}</p><span class="link-arrow" style="margin-top:auto;align-self:flex-start">Learn more</span></a>' for i, s in enumerate(SERVICES))
    body = phero([("Home", "/"), ("Services", "/services/")], "Services", "Design, build, rank. <em>Repeat.</em>",
                 "Six things we do exceptionally well, all aimed at the same goal: a website that brings you more customers.",
                 f'<a class="btn" href="/free-website-preview/">Get a free preview {ARROW}</a><a class="btn btn-ghost" href="/contact/?interest=build">Request a quote</a>') + f"""
<section class="section" style="padding-top:0"><div class="wrap"><div class="cards-3">{cards}</div></div></section>
{process_block(light=True)}
{faq_block(HOME_FAQ[1:5])}
{cta_block()}"""
    page("/services/", body, title="Web Design, SEO, App & Software Services", desc="Website design and development, SEO, redesigns, e-commerce, mobile apps and AI automation from Code Bunny, a founder-led studio that ships fast.",
         schema=[crumbs_schema([("Home", "/"), ("Services", "/services/")]), faq_schema(HOME_FAQ[1:5])], active="/services/")

    for s in SERVICES:
        path = f"/services/{s['slug']}/"
        trail = [("Home", "/"), ("Services", "/services/"), (s["name"], path)]
        rel = [p for p in PROJECTS if p["cat"] in s["cats"]][:3]
        blocks = "".join(f'<div class="card rv rv-d{i}"><span class="kicker-num">0{i+1}</span><h3 class="h3" style="margin-top:8px">{b[0]}</h3><p>{b[1]}</p></div>' for i, b in enumerate(s["blocks"]))
        others = "".join(f'<a class="svc rv" href="/services/{o["slug"]}/"><span class="num">→</span><h3>{o["name"]}</h3><p>{o["card"]}</p><span class="go">{icon("arrow")}</span></a>' for o in SERVICES if o is not s)
        body = phero(trail, s["name"], s["h1"], s["intro"], f'<a class="btn" href="/free-website-preview/">Get a free preview {ARROW}</a><a class="btn btn-ghost" href="/contact/?interest=build">Request a quote</a>') + f"""
<section class="section light"><div class="wrap split">
  <div class="rv"><span class="eyebrow">What's included</span><h2 class="h2" style="margin-top:22px">Everything you need. <em>Nothing you don't.</em></h2></div>
  <div class="rv rv-d1">{checklist(s['includes'])}</div>
</div></section>
<section class="section"><div class="wrap"><div class="cards-3">{blocks}</div></div></section>
<section class="section" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Related work</span><h2 class="h2">See it <em>in the wild.</em></h2></div><p class="lead rv rv-d1"><a class="link-arrow" href="/work/">Browse the full portfolio</a></p></div>
  <div class="grid-work">{''.join(wcard(p, sizes='(max-width: 640px) 100vw, 33vw') for p in rel)}</div>
</div></section>
{process_block(light=True)}
{related_guides(SVC_BLOG.get(s['slug']), "Guides on <em>" + esc(s['short'].lower()) + ".</em>")}
{faq_block(s['faq'])}
<section class="section-tight"><div class="wrap"><span class="eyebrow rv">More services</span><div class="svc-list" style="margin-top:28px">{others}</div></div></section>
{cta_block()}"""
        svc_schema = {"@type": "Service", "@id": BASE + path + "#service", "name": s["name"], "serviceType": s["name"], "description": s["desc"], "provider": {"@id": ORG_ID},
                      "areaServed": [{"@type": "Country", "name": c} for c in SITE["countries"]], "url": BASE + path,
                      "hasOfferCatalog": {"@type": "OfferCatalog", "name": s["name"], "itemListElement": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": strip(x)}} for x in s["includes"]]}}
        page(path, body, title=s["title"], desc=s["desc"], schema=[crumbs_schema(trail), svc_schema, faq_schema(s["faq"])], active="/services/")


def build_industries():
    cards = ""
    for i, ind in enumerate(INDUSTRIES):
        n = sum(1 for p in PROJECTS if p["cat"] in ind["cats"])
        cards += f'<a class="ind rv rv-d{i}" href="/industries/{ind["slug"]}/"><img src="/assets/img/work/{ind["img"]}-640.webp" width="640" height="400" alt="" loading="lazy"><span class="count">{n} live sites</span><h3>{ind["name"]}</h3><p>{ind["card"]}</p><span class="link-arrow">Explore</span></a>'
    body = phero([("Home", "/"), ("Industries", "/industries/")], "Industries", "Specialists, <em>not generalists.</em>",
                 "We've built dozens of sites in a few industries, so we already know what your customers need to see before they book.") + f"""
<section class="section" style="padding-top:0"><div class="wrap"><div class="ind-grid">{cards}</div></div></section>
{cta_block()}"""
    page("/industries/", body, title="Industries We Design Websites For", desc="Website design for coaches, wedding photographers and videographers, solar companies and local service businesses, by a studio that knows your customers.",
         schema=[crumbs_schema([("Home", "/"), ("Industries", "/industries/")])], active="/industries/")

    for ind in INDUSTRIES:
        path = f"/industries/{ind['slug']}/"
        trail = [("Home", "/"), ("Industries", "/industries/"), (ind["name"], path)]
        rel = [p for p in PROJECTS if p["cat"] in ind["cats"]]
        feat = "".join(wcard(p, sizes="(max-width: 640px) 100vw, (max-width: 1020px) 50vw, 33vw") for p in rel)
        body = phero(trail, f"Website design for {ind['name'].lower()}", ind["h1"], ind["intro"], f'<a class="btn" href="/free-website-preview/">Get a free preview {ARROW}</a><a class="btn btn-ghost" href="#work">See {len(rel)} examples</a>') + f"""
<section class="section light"><div class="wrap split">
  <div class="rv"><span class="eyebrow">What your site needs</span><h2 class="h2" style="margin-top:22px">Built around how <em>your customers</em> decide.</h2>
  <p class="lead" style="margin-top:22px">Every {ind['name'].lower().rstrip('s')} site we build starts from what's worked across our {len(rel)} live projects in your space.</p></div>
  <div class="rv rv-d1">{checklist(ind['needs'])}</div>
</div></section>
{chat_block() if ind['slug'] == 'photographers' else ''}
<section class="section" id="work"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Portfolio</span><h2 class="h2">{len(rel)} {ind['name'].lower()} sites, <em>live now.</em></h2></div><p class="lead rv rv-d1">Click through and explore any of them. Then imagine yours.</p></div>
  <div class="grid-work">{feat}</div>
</div></section>
{process_block(light=True)}
{related_guides([IND_BLOG[ind['slug']]], "Free guides for <em>" + esc(ind['name'].lower()) + ".</em>")}
{faq_block(ind['faq'])}
{cta_block()}"""
        svc_schema = {"@type": "Service", "name": ind["title"], "serviceType": "Website design", "description": ind["desc"], "provider": {"@id": ORG_ID}, "audience": {"@type": "BusinessAudience", "name": ind["name"]}, "url": BASE + path}
        page(path, body, title=ind["title"], desc=ind["desc"], schema=[crumbs_schema(trail), svc_schema, faq_schema(ind["faq"])], active="/industries/")


def build_templates():
    rows = ""
    for t in TEMPLATES:
        p = P[t["slug"]]
        badge = f' · {t["badge"]}' if t.get("badge") else ""
        rows += f"""<article class="tpl rv">
  <a class="tpl-media" href="{p['url']}" target="_blank" rel="noopener">{img_srcset(p['slug'], '(max-width: 860px) 100vw, 55vw', alt=p['name'] + ' website template preview')}</a>
  <div><span class="status">For sale · Live{badge}</span><h3>{t['key']}: {esc(p['name'])}</h3><span class="dom">{p['domain']}</span><p>{t['desc']}</p>
    {checklist(t['feat'] + ['Unique asset: sells to one buyer only'])}
    <div class="tagrow">{''.join(f'<span class="tag">{x}</span>' for x in t['stack'])}</div>
    <div class="hero-actions"><a class="btn btn-sm" href="/contact/?site={p['domain']}">Inquire about {t['key']} {ARROW}</a><a class="btn btn-ghost btn-sm" href="{p['url']}" target="_blank" rel="noopener">Live demo ↗</a></div>
  </div>
</article>"""
    faqs = [("What's included when I buy a site?", "Every sale includes the full source code, design assets and the domain or subdomain where noted, plus a walkthrough of the codebase and an agreed handoff window for questions."),
            ("Can I customise a site after I buy it?", "Absolutely. You get the full source code, so you can re-brand, extend or restyle it however you like. We're happy to do the customisation for you too."),
            ("Can more than one person buy the same template?", "No. Each listed site is a unique asset and sells to one buyer only. The first serious offer wins.")]
    body = phero([("Home", "/"), ("Templates", "/templates/")], "Marketplace", "Skip the build. <em>Own it today.</em>",
                 f"{len(TEMPLATES)} niche-ready websites designed and built by Code Bunny. Source code, design assets and domain transfer with every sale, and each one sells to a single owner.",
                 f'<a class="btn" href="#listings">Browse listings {ARROW}</a><a class="btn btn-ghost" href="/contact/?interest=build">Want one custom?</a>') + f"""
<section class="section" id="listings" style="padding-top:0"><div class="wrap">{rows}</div></section>
{faq_block(faqs)}
{cta_block('Don\'t see your niche? <em>We\'ll design it.</em>')}"""
    items = [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Product", "name": f"{t['key']} website template: {P[t['slug']]['name']}", "description": t["desc"], "image": f"{BASE}/assets/img/work/{t['slug']}-1200.webp", "brand": {"@type": "Brand", "name": "Code Bunny"}, "url": P[t["slug"]]["url"]}} for i, t in enumerate(TEMPLATES)]
    page("/templates/", body, title="Ready-Made Websites for Sale", desc="Buy a ready-made, professionally designed website for beauty, salons, clinics, dentists, interiors, furniture, events, solar or manufacturing. Source code included.",
         schema=[crumbs_schema([("Home", "/"), ("Templates", "/templates/")]), {"@type": "ItemList", "itemListElement": items}, faq_schema(faqs)], active="/templates/")


def build_about():
    timeline = [("Day one", "Code Bunny founded", "Started building websites and small tools for local businesses and founders, learning what actually drives conversions."),
                ("Product lab", "First automation product shipped", "Built CustomBotify so small businesses could set up an AI chatbot without a developer."),
                ("Templates", "Template line launched", "Packaged our best booking and storefront systems into ready-made sites anyone can own."),
                ("Today", f"{len(CLIENT_SITES)} live sites, {len(SITE['countries'])} countries", "Coaches, filmmakers, solar installers, clinics and schools, plus the free website preview that lets new clients see before they buy.")]
    tl = "".join(f'<li class="step rv rv-d{i}"><span class="when">{a}</span><h3>{b}</h3><p>{c}</p></li>' for i, (a, b, c) in enumerate(timeline))
    values = [("zap", "Shipped, not just designed", "We measure success in live, working sites, not polished mockups that never launch."),
              ("chat", "Talk to the builder", "You work directly with the person writing your code. No account managers, no telephone game."),
              ("search", "Built to be found", "SEO, speed and accessibility are part of the build, not an upsell."),
              ("shield", "You own everything", "Full source code, design files and accounts. No lock-in, ever."),
              ("spark", "See it before you pay", "Our free preview means you judge real work, not promises."),
              ("globe", "Any time zone", "Clients from Hawaii to New Zealand. We work around your day.")]
    vals = "".join(f'<div class="card rv rv-d{i%3}"><span class="ic">{icon(a)}</span><h3>{b}</h3><p>{c}</p></div>' for i, (a, b, c) in enumerate(values))
    stack = ["HTML / CSS / JavaScript", "React", "Next.js", "React Native", "Node.js", "Python", "Tailwind CSS", "OpenAI API", "Stripe", "PostgreSQL", "MongoDB", "Vercel", "Caddy / Nginx", "Google Search Console", "GA4", "Figma"]
    body = phero([("Home", "/"), ("About", "/about/")], "About Code Bunny", "A small studio with a <em>big-agency</em> standard.",
                 f"Code Bunny is a founder-led web design and development studio. For {SITE['years']} years we've designed, built and shipped websites, apps and software for founders and small businesses around the world.") + f"""
<section class="section" style="padding-top:0"><div class="wrap founder">
  <figure class="founder-photo rv"><img src="/assets/img/brand/bhavansh.webp" width="600" height="900" alt="Bhavansh Arora, founder of Code Bunny" loading="lazy"><figcaption><span><b>{SITE['founder']}</b><br><span class="muted">Founder &amp; lead developer</span></span><img src="/assets/img/brand/bunny.webp" width="36" height="36" alt=""></figcaption></figure>
  <div class="prose rv rv-d1">
    <h2>Hi, I'm Bhavansh.</h2>
    <p>I founded Code Bunny with a simple belief: <strong>small businesses deserve websites as good as the big brands'</strong>, without the big-agency price tag, the slow handoffs or the account manager who's never seen the code.</p>
    <p>Code Bunny is part studio, part product lab. Alongside client work we build and run our own products: <strong>CustomBotify</strong>, a no-code AI chatbot builder, and live sites like <strong>Thrill Lands</strong> and <strong>LaunchMint</strong>. Building our own products keeps us honest: we know what it takes to make a site that actually earns money.</p>
    <p>Today we've shipped {SITE['projects_delivered']}+ projects for coaches, wedding photographers and filmmakers, solar installers, clinics, schools and startups in {', '.join(SITE['countries'][:-1])} and {SITE['countries'][-1]}.</p>
    <p>And because we're confident in our work, we'll <a href="/free-website-preview/">design your homepage for free</a> before you commit.</p>
    <div class="hero-actions"><a class="btn" href="/contact/">Work with us {ARROW}</a></div>
  </div>
</div></section>
<section class="section light"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">How we work</span><h2 class="h2">What you can <em>count on.</em></h2></div></div>
  <div class="cards-3">{vals}</div>
</div></section>
<section class="section"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Journey</span><h2 class="h2">The Code Bunny <em>story.</em></h2></div></div>
  <ol class="steps">{tl}</ol>
</div></section>
<section class="section-tight" style="padding-top:0"><div class="wrap split">
  <div class="rv"><span class="eyebrow">Toolkit</span><h2 class="h3" style="margin-top:18px">Modern, proven technology. <em>Chosen per project.</em></h2></div>
  <ul class="pill-list rv rv-d1">{''.join(f'<li>{x}</li>' for x in stack)}</ul>
</div></section>
{quotes_block()}
{cta_block()}"""
    person = {"@type": "Person", "@id": BASE + "/about/#founder", "name": SITE["founder"], "jobTitle": "Founder & Lead Developer", "worksFor": {"@id": ORG_ID}, "image": BASE + "/assets/img/brand/bhavansh.webp", "url": BASE + "/about/", "knowsAbout": ["Web development", "React", "Next.js", "Node.js", "SEO", "AI chatbots"]}
    page("/about/", body, title="About Code Bunny & Founder Bhavansh Arora", desc=f"Meet Code Bunny, a founder-led web design and development studio. {SITE['years']} years and {SITE['projects_delivered']}+ projects shipped for small businesses worldwide.",
         schema=[crumbs_schema([("Home", "/"), ("About", "/about/")]), person], active="/about/")


def build_contact():
    faqs = [("What happens after I send the form?", "We read every message personally and reply, usually within one business day. For free previews, we may ask a couple of quick questions, then get designing."),
            ("Do I need to have content and photos ready?", "No. Send what you have. We can work from your current site, social profiles or a short call, and suggest imagery where needed."),
            ("Can I buy one of your ready-made sites?", "Yes. Choose “Start a project” and mention which template, or browse the <a href=\"/templates/\">templates page</a>.")]
    body = phero([("Home", "/"), ("Contact", "/contact/")], "Contact", "Let's build something <em>worth showing off.</em>",
                 "Request your free website preview, ask for a quote, or just say hello. You'll hear back from the founder himself.") + f"""
<section class="section" style="padding-top:0"><div class="wrap form-shell">{preview_form()}{preview_aside()}</div></section>
{faq_block(faqs, light=True)}"""
    page("/contact/", body, title="Contact Code Bunny: Get a Free Website Preview", desc="Contact Code Bunny for a free website preview, a project quote or a ready-made site. Email, WhatsApp or the form. We reply within one business day.",
         schema=[crumbs_schema([("Home", "/"), ("Contact", "/contact/")]), {"@type": "ContactPage", "url": BASE + "/contact/", "name": "Contact Code Bunny"}, faq_schema(faqs)], active="/contact/", og_image="og-preview.jpg")


def build_preview():
    faqs = [("Is it really free? What's the catch?", "No catch. We invest a few hours designing your homepage because most people who see their preview want to build with us. If you don't, you owe nothing."),
            ("What exactly will I receive?", f"A custom-designed homepage for your business, built in real code and hosted on a private live link (like yourbrand.codebunny.net), viewable on desktop and mobile. Usually {SITE['preview_turnaround']}."),
            ("Do I own the preview?", "The preview design becomes yours when you go ahead with the full build. If you don't, we take the preview offline."),
            ("Who is the free preview for?", "Small businesses, coaches, creatives and founders who want a new website or a redesign and would rather see real work than a sales deck."),
            ("How many previews do you do?", "We limit free previews each week so every one gets proper attention. If we're fully booked, we'll tell you when we can start.")]
    examples = [P[s] for s in ["capturedbykatherine", "sunflow", "co-allies", "jackalbert", "mdj-mortgages", "ibrefrigeration"]]
    body = f"""
<section class="phero" aria-labelledby="pv-h1">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap preview-grid">
    <div>
      <nav aria-label="Breadcrumb"><ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">Free website preview</li></ol></nav>
      <span class="eyebrow fade-up">Free website preview</span>
      <h1 class="h1" id="pv-h1" style="margin-top:24px;font-size:clamp(2.8rem,6.4vw,6rem)">See your new website <em>before you pay.</em></h1>
      <p class="lead fade-up d2" style="margin-top:28px">We'll design a custom homepage for your business and put it on a live link, free, {SITE['preview_turnaround']}. Love it, and we'll build the rest. Don't, and you walk away. No card, no contract.</p>
      <div class="hero-actions fade-up d3"><a class="btn" href="#form">Claim my free preview {ARROW}</a><a class="btn btn-ghost" href="/work/">See examples</a></div>
    </div>
    {url_demo()}
  </div>
</section>
<section class="section light"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">How it works</span><h2 class="h2">Three steps. <em>Zero risk.</em></h2></div></div>
  <div class="cards-3">
    <div class="card rv"><span class="kicker-num">01</span><h3 class="h3">Tell us about you</h3><p>Fill in the 60-second form below: your business, customers and any sites you love.</p></div>
    <div class="card rv rv-d1"><span class="kicker-num">02</span><h3 class="h3">We design your homepage</h3><p>A real, coded homepage with your branding and services, on a private live link.</p></div>
    <div class="card rv rv-d2"><span class="kicker-num">03</span><h3 class="h3">You decide</h3><p>Request tweaks, get a fixed quote for the full site, or walk away. Entirely your call.</p></div>
  </div>
</div></section>
<section class="section"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Live on codebunny.net</span><h2 class="h2">This is the level <em>you'll get.</em></h2></div><p class="lead rv rv-d1">Each of these is live on a codebunny.net link, exactly how your free preview will be delivered.</p></div>
  <div class="grid-work">{''.join(wcard(p, sizes='(max-width: 640px) 100vw, 33vw') for p in examples)}</div>
</div></section>
<section class="section" id="form" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Claim your preview</span><h2 class="h2">Let's design <em>your</em> homepage.</h2></div><p class="lead rv rv-d1">We limit free previews each week so every one gets real attention.</p></div>
  <div class="form-shell">{preview_form(heading=False)}{preview_aside()}</div>
</div></section>
{faq_block(faqs, light=True)}
{cta_block('Still on the fence? <em>Just ask.</em>', 'Message us on WhatsApp or email and we\'ll answer any question, no sales pitch.')}"""
    offer = {"@type": "Offer", "name": "Free website preview", "price": "0", "priceCurrency": "USD", "description": "A free, custom-designed homepage preview on a live link, with no obligation.", "seller": {"@id": ORG_ID}, "url": BASE + "/free-website-preview/", "availability": "https://schema.org/InStock"}
    page("/free-website-preview/", body, title="Free Website Preview: See It Before You Pay", desc="Get a free, custom-designed homepage for your business on a live link. No card, no contract. See your new website before you pay with Code Bunny.",
         schema=[crumbs_schema([("Home", "/"), ("Free website preview", "/free-website-preview/")]), offer, faq_schema(faqs)], og_image="og-preview.jpg")


# --------------------------------------------------------------------------- blog
def pretty_date(iso):
    return datetime.date.fromisoformat(iso).strftime("%b %-d, %Y")


def pick_shot(a):
    shots = BCATS[a["cat"]]["shots"]
    return shots[sum(map(ord, a["slug"])) % len(shots)]


def cover(a, big=False, eager=False):
    c = BCATS[a["cat"]]
    shot = pick_shot(a)
    w = 1200 if big else 640
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<div class="cover{" big" if big else ""}" style="--hue:{c["hue"]}">'
            f'<span class="cover-glow" aria-hidden="true"></span>'
            f'<span class="cover-cat">{esc(c["short"])}</span>'
            f'<span class="cover-shot"><span class="chrome"><i></i><i></i><i></i></span>'
            f'<img src="/assets/img/work/{shot}-{w}.webp" width="{w}" height="{w * 10 // 16}" alt="Example: {esc(P[shot]["name"])} website designed by Code Bunny" {load}></span></div>')


def blog_card(a, cls=""):
    c = BCATS[a["cat"]]
    return f"""<a class="bcard rv {cls}" href="/blog/{a['slug']}/" data-cat="{a['cat']}" data-title="{esc(a['title'].lower())}">
  {cover(a)}
  <div class="bmeta"><span class="bcat" style="--hue:{c['hue']}">{esc(c['name'])}</span><span>{a['minutes']} min read</span></div>
  <h3>{esc(a['title'])}</h3><p>{esc(a['desc'])}</p>
</a>"""


def blog_teasers(n=3, cats=None, title="Free guides to <em>grow your business.</em>", exclude=None):
    pool = [a for a in ARTICLES if (not cats or a["cat"] in cats) and a["slug"] != exclude]
    if not pool:
        return ""
    picks = pool[:n]
    return f"""<section class="section" aria-labelledby="bt-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">From the blog</span><h2 class="h2" id="bt-h">{title}</h2></div>
    <p class="lead rv rv-d1">Straight-talking guides from building {len(CLIENT_SITES)} live websites. <a class="link-arrow" href="/blog/">All {len(ARTICLES)} articles</a></p></div>
    <div class="bgrid">{''.join(blog_card(a) for a in picks)}</div>
  </div>
</section>"""


def shortcode_for(a):
    cat = a["cat"]

    def sc(code):
        if code == "cta":
            lines = {
                "coaches": ("Want a coaching site that books calls?", "We'll design your new homepage, with your offer, your story and a booking button that works, free, before you pay anything."),
                "photographers": ("Want a portfolio site that books the date?", "We've built sites for wedding photographers and filmmakers from Hawaii to New Zealand. Let us design your new homepage, free."),
                "solar": ("Want a solar site that brings in quotes?", "We'll design your new homepage, with calculator, incentives and quote form, free and with no obligation."),
                "local": ("Want more calls and bookings from Google?", "We'll design a new homepage for your business on a live link, free. If you love it, we build the rest."),
            }.get(cat, ("See your new website before you pay", "Tell us about your business and we'll design a custom homepage on a live link, free. No card, no contract."))
            return (f'<aside class="inline-cta"><div><span class="eyebrow no-line">Free website preview</span><p class="ic-t">{lines[0]}</p><p>{lines[1]}</p></div>'
                    f'<a class="btn" href="/free-website-preview/?ref={a["slug"]}">Get my free preview {ARROW}</a></aside>')
        if code == "audit":
            return (f'<aside class="inline-cta alt"><div><span class="eyebrow no-line">Free SEO check</span><p class="ic-t">Not sure what\'s holding your site back?</p><p>Send us your URL and we\'ll reply with the top fixes for speed, SEO and conversions. Free, written by a human.</p></div>'
                    f'<a class="btn" href="/contact/?interest=audit">Get my free audit {ARROW}</a></aside>')
        if code.startswith("work:"):
            ps = [P[s] for s in code[5:].split(",") if s in P]
            return '<div class="post-work">' + "".join(wcard(p, sizes="(max-width: 640px) 100vw, 360px") for p in ps) + "</div>"
        raise ValueError(code)
    return sc


def article_form():
    return f"""<section class="section article-end" id="get-started" aria-labelledby="ae-h">
  <div class="wrap">
    <div class="sec-head"><div class="rv"><span class="eyebrow">Your turn</span><h2 class="h2" id="ae-h">Rather have us <em>do it for you?</em></h2></div>
    <p class="lead rv rv-d1">Tell us about your business and we'll design your new homepage on a live link, free, {SITE['preview_turnaround']}. No card, no contract.</p></div>
    <div class="form-shell">{preview_form(heading=False)}{preview_aside()}</div>
  </div>
</section>"""


def build_blog():
    feed_items = []
    for a in ARTICLES:
        c = BCATS[a["cat"]]
        path = f"/blog/{a['slug']}/"
        body_html, toc, faqs = render_md(a["body"], shortcode_for(a))
        trail = [("Home", "/"), ("Blog", "/blog/"), (c["name"], f"/blog/category/{a['cat']}/"), (a["title"], path)]
        cr = "".join(f'<li><a href="{u}">{esc(n)}</a></li>' if i < len(trail) - 1 else f'<li aria-current="page">{esc(n)}</li>' for i, (n, u) in enumerate(trail))
        toc_html = "".join(f'<li><a href="#{i}">{inline_md(t)}</a></li>' for i, t in toc)
        tk = "".join(f"<li>{icon('check')}<span>{inline_md(t)}</span></li>" for t in a["takeaways"])
        related = [x for x in ARTICLES if x["cat"] == a["cat"] and x["slug"] != a["slug"]][:3]
        if len(related) < 3:
            related += [x for x in ARTICLES if x["slug"] != a["slug"] and x not in related][: 3 - len(related)]
        body = f"""<article class="post">
<header class="phero post-hero">
  <div class="hero-glow" aria-hidden="true" style="--hue:{c['hue']}"></div>
  <div class="wrap wrap-mid">
    <nav aria-label="Breadcrumb"><ol class="crumbs">{cr}</ol></nav>
    <a class="bcat" style="--hue:{c['hue']}" href="/blog/category/{a['cat']}/">{esc(c['name'])}</a>
    <h1 class="h1 post-title">{esc(a['title'])}</h1>
    <p class="lead">{esc(a['desc'])}</p>
    <div class="byline"><img src="/assets/img/brand/bhavansh.webp" width="44" height="44" alt=""><span>By <a href="/about/" rel="author">{SITE['founder']}</a>, founder of Code Bunny<br><time datetime="{a['updated']}">Updated {pretty_date(a['updated'])}</time> · {a['minutes']} min read</span></div>
  </div>
</header>
<div class="wrap wrap-mid post-cover">{cover(a, big=True, eager=True)}</div>
<div class="section light post-wrap">
  <div class="wrap post-grid">
    <aside class="post-side">
      <nav class="toc" aria-label="On this page"><b>On this page</b><ol>{toc_html}</ol></nav>
      <div class="side-cta"><img src="/assets/img/brand/bunny.webp" width="40" height="40" alt=""><p><b>See your new website before you pay.</b> We'll design your homepage free.</p><a class="btn btn-sm btn-dark" href="/free-website-preview/?ref={a['slug']}">Free preview {ARROW}</a></div>
    </aside>
    <div class="post-body">
      {f'<div class="takeaways"><b>Key takeaways</b><ul>{tk}</ul></div>' if tk else ''}
      <div class="prose-article">{body_html}</div>
      <div class="author-box"><img src="/assets/img/brand/bhavansh.webp" width="72" height="72" alt="{SITE['founder']}" loading="lazy"><div><b>Written by {SITE['founder']}</b><p>Founder of Code Bunny. {SITE['years']} years designing and building websites, apps and software for small businesses in {len(SITE['countries'])} countries, including {len(CLIENT_SITES)} sites live in our portfolio.</p><a class="link-arrow" href="/about/">More about Bhavansh</a></div></div>
    </div>
  </div>
</div>
</article>
{article_form()}
<section class="section" aria-labelledby="rel-h"><div class="wrap">
  <div class="sec-head"><div class="rv"><span class="eyebrow">Keep reading</span><h2 class="h2" id="rel-h">Related <em>guides.</em></h2></div><p class="lead rv rv-d1"><a class="link-arrow" href="/blog/category/{a['cat']}/">More in {esc(c['name'])}</a> &nbsp; <a class="link-arrow" href="{c['link'][0]}">{esc(c['link'][1])}</a></p></div>
  <div class="bgrid">{''.join(blog_card(x) for x in related)}</div>
</div></section>
<div class="sticky-cta" role="complementary" aria-label="Free website preview offer"><img src="/assets/img/brand/bunny.webp" width="32" height="32" alt=""><span><b>Free website preview.</b> See your new homepage before you pay.</span><a class="btn btn-sm" href="#get-started">Get mine</a><button class="x" type="button" aria-label="Dismiss">×</button></div>"""
        art_schema = {
            "@type": "BlogPosting", "@id": BASE + path + "#article", "headline": a["title"], "description": a["desc"],
            "image": [f"{BASE}/assets/img/og/blog/{a['slug']}.jpg"], "datePublished": a["date"], "dateModified": a["updated"],
            "author": {"@type": "Person", "@id": BASE + "/about/#founder", "name": SITE["founder"], "url": BASE + "/about/"},
            "publisher": {"@id": ORG_ID}, "mainEntityOfPage": {"@id": BASE + path + "#webpage"}, "articleSection": c["name"],
            "keywords": a["kw"], "wordCount": a["words"], "inLanguage": "en", "isAccessibleForFree": True,
            "about": [{"@type": "Thing", "name": k} for k in a["kw"][:3]],
        }
        schema = [crumbs_schema(trail), art_schema] + ([faq_schema([(q, ans) for q, ans in faqs])] if faqs else [])
        extra = (f'<meta property="article:published_time" content="{a["date"]}T09:00:00+00:00">\n<meta property="article:modified_time" content="{a["updated"]}T09:00:00+00:00">\n'
                 f'<meta property="article:author" content="{BASE}/about/">\n<meta property="article:section" content="{esc(c["name"])}">\n' + "".join(f'<meta property="article:tag" content="{esc(k)}">\n' for k in a["kw"]))
        page(path, body, title=a["title"], desc=a["desc"], schema=schema, active="/blog/", og_image=f"blog/{a['slug']}.jpg", og_type="article", extra_meta=extra)
        LASTMOD[path] = a["updated"]
        feed_items.append(a)

    # category hubs
    for key, c in BCATS.items():
        arts = [a for a in ARTICLES if a["cat"] == key]
        if not arts:
            continue
        path = f"/blog/category/{key}/"
        trail = [("Home", "/"), ("Blog", "/blog/"), (c["name"], path)]
        body = phero(trail, "Blog", f"{esc(c['name'])}<em>.</em>", f"{c['desc']} {len(arts)} free guides.",
                     f'<a class="btn" href="/free-website-preview/">Get a free preview {ARROW}</a><a class="btn btn-ghost" href="{c["link"][0]}">{esc(c["link"][1])}</a>') + f"""
<section class="section" style="padding-top:0"><div class="wrap">{cat_chips(key)}<div class="bgrid">{''.join(blog_card(a) for a in arts)}</div></div></section>
{cta_block()}"""
        items = [{"@type": "ListItem", "position": i + 1, "url": f"{BASE}/blog/{a['slug']}/", "name": a["title"]} for i, a in enumerate(arts)]
        page(path, body, title=f"{c['name']}: Guides & Articles", desc=f"{c['desc']} {len(arts)} free, practical guides from Code Bunny."[:158], schema=[crumbs_schema(trail), {"@type": "CollectionPage", "name": c["name"], "mainEntity": {"@type": "ItemList", "itemListElement": items}}], active="/blog/")

    # index
    feat = ARTICLES[0]
    body = phero([("Home", "/"), ("Blog", "/blog/")], "The Code Bunny blog", "Grow your business <em>online.</em>",
                 f"{len(ARTICLES)} free, no-fluff guides on websites, SEO, AI search and getting more leads, from a studio with {len(CLIENT_SITES)} live sites in {len(SITE['countries'])} countries.") + f"""
<section class="section" style="padding-top:0"><div class="wrap">
  <a class="bfeat rv" href="/blog/{feat['slug']}/">{cover(feat, big=True, eager=True)}<div><span class="bcat" style="--hue:{BCATS[feat['cat']]['hue']}">{esc(BCATS[feat['cat']]['name'])}</span><h2 class="h2">{esc(feat['title'])}</h2><p class="lead">{esc(feat['desc'])}</p><span class="link-arrow">Read the guide ({feat['minutes']} min)</span></div></a>
  <div class="blog-tools">{cat_chips(None)}<label class="bsearch"><span class="sr-only">Search articles</span>{icon('search')}<input type="search" placeholder="Search {len(ARTICLES)} articles…" data-blog-search></label></div>
  <p class="sr-only" aria-live="polite" id="bsearch-live"></p>
  <div class="bgrid" data-blog-grid>{''.join(blog_card(a) for a in ARTICLES[1:])}</div>
</div></section>
{cta_block()}"""
    blog_schema = {"@type": "Blog", "@id": BASE + "/blog/#blog", "name": "Code Bunny Blog", "url": BASE + "/blog/", "publisher": {"@id": ORG_ID}, "inLanguage": "en",
                   "blogPost": [{"@type": "BlogPosting", "headline": a["title"], "url": f"{BASE}/blog/{a['slug']}/", "datePublished": a["date"]} for a in ARTICLES]}
    page("/blog/", body, title="Blog: Website, SEO & Lead Generation Guides", desc=f"{len(ARTICLES)} free guides on small business websites, SEO, AI search, web design and lead generation from Code Bunny.", schema=[crumbs_schema([("Home", "/"), ("Blog", "/blog/")]), blog_schema], active="/blog/")

    # RSS
    def rfc(iso):
        return datetime.datetime.fromisoformat(iso + "T09:00:00+00:00").strftime("%a, %d %b %Y %H:%M:%S +0000")
    items = "".join(f"<item><title>{esc(a['title'])}</title><link>{BASE}/blog/{a['slug']}/</link><guid isPermaLink=\"true\">{BASE}/blog/{a['slug']}/</guid><pubDate>{rfc(a['date'])}</pubDate><category>{esc(BCATS[a['cat']]['name'])}</category><description>{esc(a['desc'])}</description></item>" for a in feed_items)
    os.makedirs(os.path.join(OUT, "blog"), exist_ok=True)
    open(os.path.join(OUT, "blog", "feed.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Code Bunny Blog</title><link>{BASE}/blog/</link><atom:link href="{BASE}/blog/feed.xml" rel="self" type="application/rss+xml"/><description>Website, SEO and lead generation guides for small businesses.</description><language>en</language><lastBuildDate>{rfc(TODAY)}</lastBuildDate>{items}</channel></rss>\n')
    # data for OG image renderer
    json.dump([{"slug": a["slug"], "title": a["title"], "cat": BCATS[a["cat"]]["name"], "hue": BCATS[a["cat"]]["hue"], "shot": pick_shot(a)} for a in ARTICLES], open(os.path.join(ROOT, ".og-blog.json"), "w"))


def cat_chips(active):
    chips = f'<a class="chip" href="/blog/" aria-pressed="{"true" if active is None else "false"}">All<span class="n">{len(ARTICLES)}</span></a>'
    for k, c in BCATS.items():
        n = sum(1 for a in ARTICLES if a["cat"] == k)
        if n:
            chips += f'<a class="chip" href="/blog/category/{k}/" aria-pressed="{"true" if active == k else "false"}">{esc(c["name"])}<span class="n">{n}</span></a>'
    return f'<nav class="filters" aria-label="Blog categories">{chips}</nav>'


def related_guides(cats, title):
    return blog_teasers(3, cats=cats, title=title)



def build_privacy():
    body = phero([("Home", "/"), ("Privacy", "/privacy/")], "Legal", "Privacy <em>policy.</em>", f"Last updated {datetime.date.today().strftime('%B %Y')}. Short and in plain English.") + f"""
<section class="section" style="padding-top:0"><div class="wrap wrap-narrow prose">
  <h2>What we collect</h2><p>When you use our contact or free-preview form we collect what you type in: your name, email, business name and, optionally, your phone number, website and message. We don't use tracking cookies on this site.</p>
  <h2>How we use it</h2><p>Only to reply to your enquiry, prepare your free preview or quote, and deliver work you've asked for. We never sell or rent your information.</p>
  <h2>Who processes it</h2><p>Form submissions are delivered to our inbox through <a href="https://formsubmit.co" rel="noopener">FormSubmit</a>. Our site is hosted on our own server. Links to WhatsApp open WhatsApp's own service, which has its own privacy policy.</p>
  <h2>Your rights</h2><p>You can ask us to see, correct or delete the information you've sent us at any time. Email <a href="mailto:{SITE['email']}">{SITE['email']}</a>.</p>
</div></section>"""
    page("/privacy/", body, title="Privacy Policy", desc="How Code Bunny collects, uses and protects the information you share through our website forms.", schema=[crumbs_schema([("Home", "/"), ("Privacy", "/privacy/")])])


def build_404():
    body = f"""<section class="phero" style="min-height:80svh;display:grid;place-items:center;text-align:center">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap"><img class="cta-bunny" src="/assets/img/brand/bunny.webp" alt="" width="64" height="64"><span class="eyebrow no-line">Error 404</span>
  <h1 class="h1" style="margin:20px auto 0;max-width:14ch">This bunny <em>hopped away.</em></h1>
  <p class="lead" style="margin:24px auto 0">The page you're looking for doesn't exist or has moved.</p>
  <div class="hero-actions" style="justify-content:center"><a class="btn" href="/">Back home {ARROW}</a><a class="btn btn-ghost" href="/work/">See our work</a></div></div>
</section>"""
    doc = head(path="/404.html", title="Page not found", desc="This page could not be found.", schema=[], noindex=True) + nav(None) + '<main id="main">' + body + "</main>" + footer()
    open(os.path.join(OUT, "404.html"), "w").write(doc)


def build_redirect_stubs():
    """Old URLs from the previous site. The Caddyfile 301s these; stubs are a fallback."""
    for old, new in {"about.html": "/about/", "contact.html": "/contact/", "marketplace.html": "/templates/"}.items():
        open(os.path.join(OUT, old), "w").write(f'<!doctype html><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="{BASE}{new}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={new}"><script>location.replace("{new}"+location.search)</script><a href="{new}">This page has moved</a>')


def build_meta_files():
    def pri(p):
        if p == "/": return "1.0"
        if p in ("/free-website-preview/", "/work/", "/services/", "/blog/"): return "0.9"
        if p.startswith("/blog/category/"): return "0.6"
        return "0.8" if p.count("/") <= 3 and not p.startswith("/blog/") else "0.7"
    urls = "".join(f"<url><loc>{BASE}{p}</loc><lastmod>{LASTMOD.get(p, TODAY)}</lastmod><priority>{pri(p)}</priority></url>" for p in SITEMAP)
    open(os.path.join(OUT, "sitemap.xml"), "w").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')

    ai_bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User",
               "Google-Extended", "GoogleOther", "Applebot", "Applebot-Extended", "Bingbot", "DuckAssistBot", "meta-externalagent", "MistralAI-User", "YouBot", "CCBot", "Amazonbot"]
    robots = "# Code Bunny welcomes search engines and AI assistants.\n# Summaries for AI: /llms.txt  ·  Full text: /llms-full.txt\n\nUser-agent: *\nAllow: /\nDisallow: /404.html\n\n"
    robots += "".join(f"User-agent: {b}\n" for b in ai_bots) + "Allow: /\n\n" + f"Sitemap: {BASE}/sitemap.xml\n"
    open(os.path.join(OUT, "robots.txt"), "w").write(robots)
    open(os.path.join(OUT, f"{SITE['indexnow_key']}.txt"), "w").write(SITE["indexnow_key"])
    open(os.path.join(OUT, "site.webmanifest"), "w").write(json.dumps({"name": "Code Bunny", "short_name": "Code Bunny", "start_url": "/", "display": "standalone", "background_color": "#0d0b0a", "theme_color": "#0d0b0a",
                                                                       "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, indent=2))

    about = (f"Code Bunny ({BASE}) is a founder-led web design and development studio run by {SITE['founder']}, with {SITE['years']} years of experience and "
             f"{SITE['projects_delivered']}+ projects delivered. It designs and builds fast, SEO-ready websites, e-commerce and booking sites, mobile apps and custom software / AI chatbots "
             f"for small businesses, coaches, wedding photographers and videographers, solar companies and local businesses in {', '.join(SITE['countries'])}. "
             f"Its signature offer is a free website preview: a custom-designed homepage on a live link (yourbrand.codebunny.net), {SITE['preview_turnaround']}, with no payment or obligation. "
             f"Clients own their full source code. Contact: {SITE['email']}, WhatsApp +{SITE['whatsapp']}.")
    facts = ["## Quick facts",
             f"- Founder: {SITE['founder']}", f"- Experience: {SITE['years']} years, {SITE['projects_delivered']}+ projects delivered, {len(CLIENT_SITES)} client sites and products live in the portfolio",
             f"- Countries served: {', '.join(SITE['countries'])}", f"- Free website preview: yes, {SITE['preview_turnaround']}, no card or contract",
             "- Typical timeline: landing pages and small business sites in 1–2 weeks", "- Ownership: clients receive full source code and accounts",
             "- Notable work: Dan Reynolds Photography (danreynoldsphotography.com), Mark Arista Films, Eco Horizon, High Fifteen, CustomBotify, Thrill Lands",
             "- Client feedback: \"I think the site looks great. I got a lot of compliments on it.\" (Daniel Reynolds, Dan Reynolds Photography)"]
    lines = ["# Code Bunny", "", f"> {about}", ""] + facts + ["",
             "## Key pages", f"- [Free website preview]({BASE}/free-website-preview/)", f"- [Portfolio]({BASE}/work/)", f"- [Services]({BASE}/services/)", f"- [Blog]({BASE}/blog/)", f"- [Ready-made sites for sale]({BASE}/templates/)", f"- [About]({BASE}/about/)", f"- [Contact]({BASE}/contact/)", "", "## Services"]
    lines += [f"- [{s['name']}]({BASE}/services/{s['slug']}/): {s['card']}" for s in SERVICES]
    lines += ["", "## Industries"] + [f"- [{i['title']}]({BASE}/industries/{i['slug']}/): {i['card']}" for i in INDUSTRIES]
    lines += ["", "## Selected live work"] + [f"- [{p['name']}]({p['url']}) ({p['location']}): {p['blurb']}" for p in CLIENT_SITES]
    for k, c in BCATS.items():
        arts = [a for a in ARTICLES if a["cat"] == k]
        if arts:
            lines += ["", f"## Guides: {c['name']}"] + [f"- [{a['title']}]({BASE}/blog/{a['slug']}/): {a['desc']}" for a in arts]
    lines += ["", "## Optional", f"- [Full text of every guide]({BASE}/llms-full.txt)"]
    open(os.path.join(OUT, "llms.txt"), "w").write("\n".join(lines) + "\n")

    full = ["# Code Bunny: full site content for AI assistants", "", about, ""] + facts + ["", "## Frequently asked questions"]
    full += [f"### {q}\n{strip(a)}\n" for q, a in HOME_FAQ]
    for s_ in SERVICES:
        full += ["", f"## Service: {s_['name']} ({BASE}/services/{s_['slug']}/)", strip(s_["intro"]), "Includes: " + "; ".join(s_["includes"]) + "."]
    for a in ARTICLES:
        full += ["", "---", "", f"# {a['title']}", f"URL: {BASE}/blog/{a['slug']}/", f"Author: {SITE['founder']} · Updated {a['updated']}", "", a["desc"], ""]
        if a["takeaways"]:
            full += ["Key takeaways:"] + [f"- {t}" for t in a["takeaways"]] + [""]
        full.append(plain_md(a["body"]))
    open(os.path.join(OUT, "llms-full.txt"), "w").write("\n".join(full) + "\n")


if __name__ == "__main__":
    build_home(); build_work(); build_services(); build_industries(); build_templates()
    build_about(); build_contact(); build_preview(); build_privacy(); build_404()
    build_blog(); build_redirect_stubs(); build_meta_files()
    print(f"{len(ARTICLES)} articles. Built {len(SITEMAP)} indexable pages into {os.path.normpath(OUT)}")
