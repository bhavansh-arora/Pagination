#!/usr/bin/env python3
"""
Static site builder for ASB Media Group.

  python3 build.py

Reads src/pages/*.html, wraps each in the shared partials (src/partials/),
expands {{icon:name}} snippets, and writes finished pages to the repo root.
Each page starts with a meta comment:

  <!--meta {"title": "...", "desc": "...", "nav": "work", "loader": false} -->
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_URL = "https://www.asbmediagroup.com"

ICONS = {
    "arrow": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "arrow-ur": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    "arrow-l": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    "play": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4.5v15a.5.5 0 0 0 .76.43l12.5-7.5a.5.5 0 0 0 0-.86L6.76 4.07A.5.5 0 0 0 6 4.5Z"/></svg>',
    "check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    "close": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    "star": '<svg class="marquee__star" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 0c1.2 10.6 9.4 18.8 20 20-10.6 1.2-18.8 9.4-20 20C18.8 29.4 10.6 21.2 0 20 10.6 18.8 18.8 10.6 20 0Z"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" width="16" height="16"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    # industry icons
    "i-heart": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 34S5 25.5 5 15a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10.5-15 19-15 19Z"/></svg>',
    "i-bolt": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M22 3 7 23h12l-2 14 16-21H21l1-13Z"/></svg>',
    "i-wheel": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="20" cy="20" r="15"/><circle cx="20" cy="20" r="4"/><path d="M20 5v11M20 24v11M5 20h11M24 20h11"/></svg>',
    "i-move": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="22" cy="7" r="3"/><path d="M12 36l5-10 5 4v6M17 26l2-11 6 4 6-2M19 15l-6 3-3 6"/></svg>',
    "i-box": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 12 20 5l15 7v16l-15 7-15-7V12Z"/><path d="M5 12l15 7 15-7M20 19v16"/></svg>',
    "i-ball": '<svg class="ind__icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="20" cy="20" r="15"/><path d="m20 13 6.5 4.7-2.5 7.6h-8l-2.5-7.6L20 13ZM20 5v8M33 15l-6.5 2.7M28 32l-4-6.7M12 32l4-6.7M7 15l6.5 2.7"/></svg>',
}

NAV = [
    ("work", "work.html", "Work"),
    ("services", "services.html", "Services"),
    ("weddings", "weddings.html", "Weddings"),
    ("stills", "photography.html", "Stills"),
    ("about", "about.html", "Studio"),
    ("contact", "contact.html", "Contact"),
]


def nav_html(active):
    out = []
    for key, href, label in NAV:
        cur = ' aria-current="page"' if key == active else ""
        out.append(f'<a class="nav__link" href="{href}"{cur}>{label}</a>')
    return "\n          ".join(out)


def expand_icons(html):
    return re.sub(r"\{\{icon:([\w-]+)\}\}", lambda m: ICONS[m.group(1)], html)


def build():
    import sys
    sys.path.insert(0, str(SRC))
    import cases
    cases.generate(SRC / "pages")
    partials = {p.stem: p.read_text() for p in (SRC / "partials").glob("*.html")}
    pages = sorted((SRC / "pages").glob("*.html"))
    sitemap = []
    for page in pages:
        raw = page.read_text()
        m = re.match(r"\s*<!--meta (.*?)-->\s*", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        body = raw[m.end():] if m else raw
        slug = page.name
        canonical = f"{SITE_URL}/{'' if slug == 'index.html' else slug}"
        ctx = {
            "title": meta.get("title", "ASB Media Group"),
            "desc": meta.get("desc", ""),
            "og": meta.get("og", "assets/img/film-funbike.webp"),
            "canonical": canonical,
            "nav": nav_html(meta.get("nav")),
            "schema": meta.get("schema", ""),
            "loader": partials["loader"] if meta.get("loader") else "",
            "bodyclass": meta.get("bodyclass", ""),
        }
        html = partials["head"] + partials["header"] + body + partials["footer"]
        for k, v in ctx.items():
            html = html.replace("{{" + k + "}}", v)
        html = expand_icons(html)
        (ROOT / slug).write_text(html)
        if not meta.get("noindex"):
            sitemap.append(canonical)
        print("built", slug)
    urls = "\n".join(f"  <url><loc>{u}</loc></url>" for u in sitemap)
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    )


if __name__ == "__main__":
    build()
