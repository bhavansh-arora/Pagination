"""Build the live Squarespace snippets (code/live/<page>.html).

Each snippet is pasted once into a Squarespace Code Block. It carries the site's intro screen and
page-transition curtain (with exactly the site's styling), so the very first frame Squarespace paints
already looks like the site; assets/js/squarespace.js then loads the latest published page from the
site editor. The same code is available in the site editor under "Squarespace" for any page.
Run:  python3 build_live.py /path/to/danreynoldsphotography
"""
import os
import sys

SITE_DIR = sys.argv[1] if len(sys.argv) > 1 else "/home/user/danreynoldsphotography"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "code", "live")
HOST = "https://danreynoldsphotography.codebunny.net/"
PAGES = {"home": "index.html", "about": "about.html", "portfolio": "portfolio.html", "galleries": "galleries.html", "films": "films.html",
         "investment": "investment.html", "contact": "contact.html", "page-not-found": "404.html", "thank-you": "thank-you.html",
         "drone": "drone.html", "st-louis-wedding-photographer": "st-louis-wedding-photographer.html", "links": "links.html",
         "privacy-policy": "privacy-policy.html", "terms-of-service": "terms-of-service.html"}


def read(path):
    with open(os.path.join(SITE_DIR, path), encoding="utf-8") as f:
        return f.read()


def main():
    # The code itself comes from the site (tools/squarespace_code.py writes admin/squarespace-code.html, which the
    # site editor also hands out under "Squarespace"); here it is only filled in for each page.
    tpl = read("admin/squarespace-code.html")
    os.makedirs(OUT, exist_ok=True)
    for name, page in PAGES.items():
        out = tpl.replace("{{HOST}}", HOST).replace("{{PAGE}}", page).replace("{{NAME}}", name + " page")
        with open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8") as f:
            f.write(out)
        print(f"{name}.html  {len(out):,} bytes")


if __name__ == "__main__":
    main()
