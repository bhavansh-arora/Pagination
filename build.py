#!/usr/bin/env python3
"""Static site builder for Alpha Visuals.

Each page lives in src/pages/<name>.html and starts with a JSON front-matter
comment (title, desc, canonical, page, optional preload/schema). Shared markup
lives in src/partials and is pulled in with <!-- @include name -->.

Run `python3 build.py` and the finished pages are written to the repo root.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
PARTIALS = SRC / "partials"
DEFAULT_OG = (
    "https://cdn.prod.website-files.com/67c0fdfdbbb1b28204dfe61d/"
    "6ac48528e155fb54ad260041_Screenshot%202026-10-06%20at%2015.50.21-p-1600.png"
)


def partial(name):
    return (PARTIALS / f"{name}.html").read_text()


def includes(text):
    return re.sub(r"[ \t]*<!-- @include ([\w-]+) -->\n?", lambda m: partial(m.group(1)), text)


def faq_schema(body):
    pairs = re.findall(r"<summary>(.*?)</summary>\s*<p class=\"ans\">(.*?)</p>", body, re.S)
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": html.unescape(q),
                "acceptedAnswer": {"@type": "Answer", "text": html.unescape(re.sub(r"<[^>]+>", "", a))},
            }
            for q, a in pairs
        ],
    }
    return '<script type="application/ld+json">\n' + json.dumps(data, indent=2, ensure_ascii=False) + "\n  </script>"


def nav_for(page):
    out = partial("nav")
    return re.sub(
        rf'data-nav="{re.escape(page)}"',
        f'data-nav="{page}" aria-current="page"',
        out,
    )


def build_page(path):
    raw = path.read_text()
    m = re.match(r"<!--(.*?)-->\n", raw, re.S)
    meta = json.loads(m.group(1))
    body = includes(raw[m.end():])
    page = meta["page"]

    schema = faq_schema(body) if meta.get("schema") == "@faq" else meta.get("schema", "")
    head = partial("head")
    for key, value in {
        "title": html.escape(meta["title"], quote=True),
        "desc": html.escape(meta["desc"], quote=True),
        "canonical": meta.get("canonical", ""),
        "og_image": meta.get("og_image", DEFAULT_OG),
        "preload": meta.get("preload", ""),
        "schema": schema,
        "page": page,
    }.items():
        head = head.replace("{{" + key + "}}", value)

    doc = (
        head
        + partial("sprite")
        + nav_for(page)
        + '\n  <main id="main">\n'
        + body.rstrip()
        + "\n  </main>\n\n"
        + partial("footer")
    )
    out = ROOT / path.name
    out.write_text(doc)
    return out


def main():
    for path in sorted((SRC / "pages").glob("*.html")):
        print("built", build_page(path).relative_to(ROOT))


if __name__ == "__main__":
    main()
