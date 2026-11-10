#!/usr/bin/env python3
"""Write admin/squarespace-code.html: the code to paste into a Squarespace Code Block for any page.

The site editor fills in the page and this site's address ({{PAGE}}, {{NAME}}, {{HOST}}) and offers it under
"Squarespace" for whichever page is open, so a new page can be put on Squarespace without anyone running tools.
The code carries the site's intro screen and page-change curtain, styled exactly like the site, so the very first
frame Squarespace paints already looks right; assets/js/squarespace.js then loads the page as last published.
Run after changing the intro screen or colours in assets/css/styles.css (version_assets.py runs it too).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "admin" / "squarespace-code.html"
FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap"


def block(html, cls):
    """The <div class="cls ..."> element, balanced."""
    i = re.search(r'<div class="%s[" ]' % cls, html).start()
    depth = 0
    for t in re.finditer(r"<(/?)div\b[^>]*>", html[i:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return html[i:i + t.end()]
    raise ValueError(cls)


def build():
    css = (ROOT / "assets/css/styles.css").read_text(encoding="utf-8")
    root = re.search(r":root\s*\{.*?\n\}", css, re.S).group(0)
    # Top-level rules only: the indented reduced-motion rule belongs inside its @media block (added back below).
    rules = [l for l in css.split("\n") if ".cursor" not in l and re.match(
        r"(\.is-loading body|\.is-(loading|loaded|entering|entered|leaving) \.(preloader|curtain)|\.preloader|\.curtain|@keyframes (draw|rise))", l)]
    # The site's colours, scoped to the intro screen and curtain only, so they never override the page's own.
    intro_css = re.sub(r"\s+", " ", root).replace(":root", ".preloader, .curtain", 1) + "\n" + "\n".join(r.strip() for r in rules)
    intro_css = intro_css.replace('url("../brand/', 'url("{{HOST}}assets/brand/')
    intro_css += "\n@media (prefers-reduced-motion: reduce) { .preloader, .curtain { display: none !important; } }"
    # Squarespace's own page around the site: hidden from the first frame.
    sq_css = ("html,body,#siteWrapper,#page,.page-section:has(#drx-live),.page-section:has(#drx-live) .content-wrapper,"
              ".page-section:has(#drx-live) .content,.page-section:has(#drx-live) .fluid-engine,.fe-block:has(#drx-live),"
              ".sqs-block:has(#drx-live){background:var(--paper,#14100d)!important}"
              ".page-section:has(#drx-live) .section-background,#header,.header-announcement-bar-wrapper,#footer-sections,footer.sections{display:none!important}"
              ".page-section:has(#drx-live){padding:0!important;min-height:100vh}#drx-live{min-height:100vh}"
              # The plain copy of the page (for search engines and link previews): readable if it's ever shown.
              ".drx-booting .drx-seo{visibility:hidden}.drx-seo{max-width:760px;margin:0 auto;padding:110px 20px 64px;color:#f3ede3;font:17px/1.7 Georgia,serif}"
              ".drx-seo h1{font-size:2.4em;line-height:1.1;margin:0 0 .5em}.drx-seo h2,.drx-seo h3{font-size:1.5em;line-height:1.2;margin:1.4em 0 .4em}"
              ".drx-seo p,.drx-seo ul,.drx-seo ol{margin:0 0 1em}.drx-seo a{color:#a5b993}.drx-seo img{display:block;max-width:100%;height:auto;margin:1em 0;border-radius:12px}")
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    intro_html = block(index, "preloader") + "\n" + block(index, "curtain")
    # Start-up: the curtain after a page change (as on the site); otherwise the intro screen with its counter.
    # (drx-booting keeps the plain copy of the page invisible while the live page loads; it shows if loading fails.)
    boot = ("<script>window.__drBooted=1;try{var d=document.documentElement;d.classList.add(\"drx-booting\");"
            "if(sessionStorage.getItem(\"dr-nav\")){d.classList.add(\"is-entering\");sessionStorage.removeItem(\"dr-nav\")}"
            "else if(!sessionStorage.getItem(\"dr-seen\")&&!matchMedia(\"(prefers-reduced-motion: reduce)\").matches){d.classList.add(\"is-loading\")}"
            "setTimeout(function(){d.classList.remove(\"is-loading\",\"is-entering\",\"drx-booting\")},20000)}catch(e){}</script>")
    # Order matters: the start-up script must run before any stylesheet is pending.
    return ('<!-- Dan Reynolds Photography · {{NAME}} (live from the site editor). Paste ALL of this into one Code Block. -->\n'
            f'{boot}\n<style>\n{sq_css}\n{intro_css}\n</style>\n{intro_html}\n<link rel="stylesheet" href="{FONTS}">\n'
            '<div id="drx-live" data-page="{{PAGE}}"></div>\n<script defer src="{{HOST}}assets/js/squarespace.js"></script>\n')


def main():
    out = build()
    if not OUT.exists() or OUT.read_text(encoding="utf-8") != out:
        OUT.write_text(out, encoding="utf-8")
        print("admin/squarespace-code.html updated")


if __name__ == "__main__":
    main()
