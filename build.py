#!/usr/bin/env python3
"""Static site builder for the MDJ Mortgages site.

Assembles src/pages/*.html with the shared head/header/footer partials and
writes finished pages to site/. No dependencies beyond the standard library.

Tokens available inside pages and partials:
  {{include:name}} contents of src/partials/name.html
  {{icon:name}}   inline SVG icon from ICONS below
  {{nav:key}}     becomes aria-current="page" when key matches the page's nav
  {{title}} {{description}} {{canonical}} {{year}}  (head partial)
"""
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "site"
SITE_URL = "https://www.mdjmortgages.com"

_S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
_F = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"'

ICONS = {
    "arrow": f'<svg {_S}><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "arrow-left": f'<svg {_S}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    "chev-down": f'<svg {_S}><path d="m6 9 6 6 6-6"/></svg>',
    "chev-left": f'<svg {_S}><path d="m15 18-6-6 6-6"/></svg>',
    "chev-right": f'<svg {_S}><path d="m9 18 6-6-6-6"/></svg>',
    "phone": f'<svg {_S}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    "mail": f'<svg {_S}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    "clock": f'<svg {_S}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    "pin": f'<svg {_S}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    "calendar": f'<svg {_S}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
    "check": f'<svg {_S} stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>',
    "star": f'<svg {_F}><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z"/></svg>',
    "shield": f'<svg {_S}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    "award": f'<svg {_S}><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></svg>',
    "key": f'<svg {_S}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></svg>',
    "home": f'<svg {_S}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    "move": f'<svg {_S}><path d="M3 11 9 6l6 5v8H3z"/><path d="M15 11h6M18 8l3 3-3 3"/><path d="M7 19v-4h4v4"/></svg>',
    "refresh": f'<svg {_S}><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></svg>',
    "briefcase": f'<svg {_S}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16M2 13h20"/></svg>',
    "sunset": f'<svg {_S}><path d="M17 18a5 5 0 0 0-10 0M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/></svg>',
    "umbrella": f'<svg {_S}><path d="M22 12a10 10 0 0 0-20 0z"/><path d="M12 12v8a2 2 0 0 0 4 0M12 2v1"/></svg>',
    "building": f'<svg {_S}><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>',
    "globe": f'<svg {_S}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>',
    "piggy": f'<svg {_S}><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1M16 11h.01"/></svg>',
    "heart": f'<svg {_S}><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/></svg>',
    "users": f'<svg {_S}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    "video": f'<svg {_S}><path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
    "chat": f'<svg {_S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    "calculator": f'<svg {_S}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M16 14v4M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/></svg>',
    "pound": f'<svg {_S}><path d="M18 7c0-5.3-8-5.3-8 0v10M6 13h8M6 21h12c-2.5 0-4-1.5-4-4"/></svg>',
    "gift": f'<svg {_S}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    "bell": f'<svg {_S}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    "file": f'<svg {_S}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    "sparkle": f'<svg {_S}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>',
    "trend": f'<svg {_S}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>',
    "lock": f'<svg {_S}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    "search": f'<svg {_S}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    "whatsapp": f'<svg {_F}><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6zm8.4-18.2A11.8 11.8 0 0 0 1.7 17.7L0 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4c6.5 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z"/></svg>',
    "google": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>',
    "facebook": f'<svg {_F}><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9a1 1 0 0 1 1-1z"/></svg>',
    "instagram": f'<svg {_S}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>',
    "linkedin": f'<svg {_F}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z"/></svg>',
    "youtube": f'<svg {_F}><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9l5.8 3.1z"/></svg>',
    "tiktok": f'<svg {_F}><path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.4a2.9 2.9 0 1 1-2-2.7V9.2a6.3 6.3 0 1 0 5.4 6.2V8.6a8.2 8.2 0 0 0 4.8 1.5V6.7z"/></svg>',
}


def render_tokens(html: str, nav: str) -> str:
    html = re.sub(
        r"\{\{include:([a-z0-9-]+)\}\}",
        lambda m: (SRC / "partials" / f"{m.group(1)}.html").read_text(encoding="utf-8"),
        html,
    )
    def icon(m):
        name = m.group(1)
        if name not in ICONS:
            raise KeyError(f"Unknown icon: {name}")
        return ICONS[name]

    html = re.sub(r"\{\{icon:([a-z0-9-]+)\}\}", icon, html)
    html = re.sub(
        r"\{\{nav:([a-z0-9-]+)\}\}",
        lambda m: ' aria-current="page"' if m.group(1) == nav else "",
        html,
    )
    return html


def parse_page(path: Path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*", raw, re.S)
    if not m:
        raise ValueError(f"{path.name}: missing <!--meta {{...}} --> block")
    meta = json.loads(m.group(1))
    return meta, raw[m.end():]


def build():
    head = (SRC / "partials" / "head.html").read_text(encoding="utf-8")
    header = (SRC / "partials" / "header.html").read_text(encoding="utf-8")
    footer = (SRC / "partials" / "footer.html").read_text(encoding="utf-8")

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    shutil.copytree(ROOT / "assets", OUT / "assets")

    pages = sorted((SRC / "pages").glob("*.html"))
    sitemap = []
    for page in pages:
        meta, body = parse_page(page)
        slug = page.name
        canonical = SITE_URL + ("/" if slug == "index.html" else f"/{slug}")
        doc = (
            head.replace("{{title}}", meta["title"])
            .replace("{{description}}", meta["description"])
            .replace("{{canonical}}", canonical)
            .replace("{{extra_head}}", meta.get("extra_head", ""))
            + header
            + '<main id="main">\n'
            + body
            + "\n</main>\n"
            + footer
        )
        doc = doc.replace("{{year}}", str(date.today().year))
        doc = render_tokens(doc, meta.get("nav", ""))
        leftover = re.findall(r"\{\{[^}]+\}\}", doc)
        if leftover:
            raise ValueError(f"{slug}: unresolved tokens {leftover}")
        (OUT / slug).write_text(doc, encoding="utf-8")
        sitemap.append(canonical)
        print(f"  built {slug}")

    urls = "\n".join(f"  <url><loc>{u}</loc></url>" for u in sitemap)
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
        encoding="utf-8",
    )
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    print(f"Built {len(pages)} pages into {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    build()
