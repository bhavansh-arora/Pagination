#!/usr/bin/env python3
"""Stamp the site's CSS, JS and image links with a content hash (styles.css?v=1a2b3c4d).

Browsers may keep a cached copy of an unchanged URL for a while (GitHub Pages: 10 minutes), so a page
could load new HTML with an old stylesheet. A changed file gets a new ?v=, so it is always fetched fresh.
Run after changing anything in assets/css or assets/js:  python3 tools/version_assets.py
"""
import hashlib, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ["assets/css/styles.css", "assets/js/main.js", "assets/js/motion.js",
          "assets/vendor/gsap.min.js", "assets/vendor/ScrollTrigger.min.js"]
ASSETS += [str(p.relative_to(ROOT)) for p in sorted((ROOT / "assets/css/colours").glob("*.css"))]


def main():
    ver = {a: hashlib.sha1((ROOT / a).read_bytes()).hexdigest()[:8] for a in ASSETS if (ROOT / a).exists()}
    pages = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "admin" not in p.parts]
    img_ver = {}

    def stamp_img(m):
        path = m.group(1)
        f = ROOT / path.replace("../", "")
        if not f.exists():
            return m.group(0)
        if path not in img_ver:
            img_ver[path] = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
        return path + "?v=" + img_ver[path]
    changed = 0
    for page in pages:
        html = page.read_text(encoding="utf-8")
        new = html
        for a, v in ver.items():
            new = re.sub(r'((?:href|src)="(?:\.\./)?' + re.escape(a) + r')(\?v=[0-9a-f]+)?"', r'\1?v=' + v + '"', new)
        # Images too: a changed photo under the same name is always fetched fresh.
        new = re.sub(r'((?:\.\./)?assets/img/[A-Za-z0-9_./-]+\.(?:webp|jpe?g|png|avif|svg|gif))(?:\?v=[0-9a-f]+)?', stamp_img, new)
        if new != html:
            page.write_text(new, encoding="utf-8"); changed += 1
    print(f"{changed} pages updated")


if __name__ == "__main__":
    main()
