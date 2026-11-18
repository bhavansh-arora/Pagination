#!/usr/bin/env python3
"""Tiny static-site builder for Love to Cook.

Pages live in src/pages/*.html and start with a meta comment:
    <!--meta {"title": "...", "description": "...", "key": "classes"} -->
Shared partials (head, header, footer) live in src/partials/.

Shortcodes available inside pages and partials:
    {{arrow}}       animated arrow icon used inside .btn
    {{i:name}}      inline SVG icon from the sprite (#i-name)

Run:  python3 build.py      -> writes the finished *.html files to the repo root
"""
import json
import re
import time
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
VERSION = time.strftime("%Y%m%d%H%M")

ARROW = ('<span class="btn__icon"><svg aria-hidden="true"><use href="#i-arrow"/></svg>'
         '<svg aria-hidden="true"><use href="#i-arrow"/></svg></span>')

MBAR = {
    "default": ('<div class="mbar"><div class="mbar__txt"><small>Next class</small>'
                '<span data-mbar-next>Small classes · max 8</span></div>'
                '<a class="btn btn--butter btn--sm" href="classes.html">Book {{arrow}}</a></div>'),
    "detail": ('<div class="mbar"><div class="mbar__txt"><small>Reserve your seat</small>'
               '<span data-mbar-price>&nbsp;</span></div>'
               '<a class="btn btn--butter btn--sm" href="#book">Book {{arrow}}</a></div>'),
    "none": "",
}


def shortcodes(html: str) -> str:
    html = html.replace("{{arrow}}", ARROW)
    return re.sub(r"\{\{i:([a-z\-]+)\}\}", r'<svg aria-hidden="true"><use href="#i-\1"/></svg>', html)


def build():
    head = (SRC / "partials/head.html").read_text()
    header = (SRC / "partials/header.html").read_text()
    footer = (SRC / "partials/footer.html").read_text()
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text()
        m = re.match(r"\s*<!--meta\s+(\{.*?\})\s*-->", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        body = raw[m.end():] if m else raw
        key = meta.get("key", page.stem)
        out_name = page.name
        vals = {
            "title": meta.get("title", "Love to Cook"),
            "description": meta.get("description", ""),
            "key": key,
            "path": "" if out_name == "index.html" else out_name,
            "v": VERSION,
            "robots": '<meta name="robots" content="noindex, nofollow">' if meta.get("noindex") else "",
            "mbar": MBAR[meta.get("mbar", "default")],
        }
        html = head + header + body + footer
        for k, v in vals.items():
            html = html.replace("{{" + k + "}}", v)
        # mark the active nav item
        html = re.sub(rf'(<a [^>]*data-nav="{key}")', r'\1 aria-current="page"', html)
        html = shortcodes(html)
        (ROOT / out_name).write_text(html)
        print(f"built {out_name}")


if __name__ == "__main__":
    build()
