"""Build the live Squarespace snippets (code/live/<page>.html).

Each snippet is pasted once into a Squarespace Code Block. It carries the site's intro screen and
page-transition curtain (with exactly the site's styling), so the very first frame Squarespace paints
already looks like the site; assets/js/squarespace.js then loads the latest published page from the
site editor. Run:  python3 build_live.py /path/to/danreynoldsphotography
"""
import os
import re
import sys

SITE_DIR = sys.argv[1] if len(sys.argv) > 1 else "/home/user/danreynoldsphotography"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "code", "live")
HOST = "https://danreynoldsphotography.codebunny.net/"
PAGES = {"home": "index.html", "about": "about.html", "portfolio": "portfolio.html", "films": "films.html",
         "investment": "investment.html", "contact": "contact.html", "page-not-found": "404.html"}
FONTS = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap"


def read(path):
    with open(os.path.join(SITE_DIR, path), encoding="utf-8") as f:
        return f.read()


def block(html, cls):
    """The <div class="cls ..."> element, balanced."""
    i = re.search(r'<div class="%s[" ]' % cls, html).start()
    depth = 0
    for t in re.finditer(r"<(/?)div\b[^>]*>", html[i:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return html[i:i + t.end()]
    raise ValueError(cls)


def main():
    css = read("assets/css/styles.css")
    root = re.search(r":root\s*\{.*?\n\}", css, re.S).group(0)
    # (Skip the reduced-motion rule: it only belongs inside its @media block, added back below.)
    rules = [l for l in css.split("\n") if ".cursor" not in l and re.match(r"\s*(\.is-loading body|\.is-(loading|loaded|entering|entered|leaving) \.(preloader|curtain)|\.preloader|\.curtain|@keyframes (draw|rise))", l)]
    intro_css = re.sub(r"\s+", " ", root) + "\n" + "\n".join(r.strip() for r in rules)
    intro_css = intro_css.replace('url("../brand/', 'url("' + HOST + "assets/brand/")
    intro_css += "\n@media (prefers-reduced-motion: reduce) { .preloader, .curtain { display: none !important; } }"
    # Squarespace's own page around the site: hidden from the first frame.
    sq_css = ("html,body,#siteWrapper,#page,.page-section:has(#drx-live),.page-section:has(#drx-live) .content-wrapper,"
              ".page-section:has(#drx-live) .content,.page-section:has(#drx-live) .fluid-engine,.fe-block:has(#drx-live),"
              ".sqs-block:has(#drx-live){background:#0d0b09!important}"
              ".page-section:has(#drx-live) .section-background,#header,.header-announcement-bar-wrapper,#footer-sections,footer.sections{display:none!important}"
              ".page-section:has(#drx-live){padding:0!important;min-height:100vh}#drx-live{min-height:100vh}")
    index = read("index.html")
    intro_html = block(index, "preloader") + "\n" + block(index, "curtain")
    # Same start-up as the site: loader on a first visit, curtain after a page change. A reload of an
    # already-visited page also starts under the curtain, which lifts once the page has arrived.
    boot = ("<script>window.__drBooted=1;try{var d=document.documentElement;"
            "if(sessionStorage.getItem(\"dr-nav\")){d.classList.add(\"is-entering\");sessionStorage.removeItem(\"dr-nav\")}"
            "else if(!sessionStorage.getItem(\"dr-seen\")&&!matchMedia(\"(prefers-reduced-motion: reduce)\").matches){d.classList.add(\"is-loading\")}"
            "else{d.classList.add(\"is-entering\")}"
            "setTimeout(function(){d.classList.remove(\"is-loading\",\"is-entering\")},8000)}catch(e){}</script>")
    os.makedirs(OUT, exist_ok=True)
    for name, page in PAGES.items():
        out = (f'<!-- Dan Reynolds Photography · {name} page (live from the site editor). Paste ALL of this into one Code Block. -->\n'
               # Order matters: the start-up script must run before any stylesheet is pending.
               f'{boot}\n<style>\n{sq_css}\n{intro_css}\n</style>\n{intro_html}\n<link rel="stylesheet" href="{FONTS}">\n'
               f'<div id="drx-live" data-page="{page}"></div>\n<script defer src="{HOST}assets/js/squarespace.js"></script>\n')
        with open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8") as f:
            f.write(out)
        print(f"{name}.html  {len(out):,} bytes")


if __name__ == "__main__":
    main()
