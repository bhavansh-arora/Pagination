"""Builds every page of the site into the folder above this one.

    python3 _build/build.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import p_about, p_hair, p_home, p_massage, p_medispa, p_misc, p_rituals, p_skin, p_team, p_visit, p_weddings  # noqa: E402,F401

def write_sitemap():
    from csp import ROOT, SITE_URL
    pages = ["", "weddings.html", "hair.html", "skin.html", "massage.html", "medispa.html", "rituals.html", "team.html", "about.html", "visit.html", "privacy.html"]
    urls = "".join(f"  <url><loc>{SITE_URL}/{p}</loc></url>\n" for p in pages)
    with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    with open(os.path.join(ROOT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")


PAGES = [p_home, p_weddings, p_hair, p_skin, p_massage, p_medispa, p_rituals, p_team, p_about, p_visit, p_misc]

if __name__ == "__main__":
    for mod in PAGES:
        print("built", mod.build())
    write_sitemap()
