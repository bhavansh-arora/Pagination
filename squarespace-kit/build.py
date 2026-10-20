"""Build self-contained Squarespace Code Block pages from the live site's source.

Each output file (code/self-contained/<page>.html) holds everything for one page: the site CSS,
a Squarespace adapter, the page HTML (with the loading screen and page-transition curtain), and
the site scripts. Photos still load from the site host. Run from anywhere:

    python3 build.py /path/to/danreynoldsphotography
"""
import os
import re
import sys

SITE_DIR = sys.argv[1] if len(sys.argv) > 1 else "/home/user/danreynoldsphotography"
KIT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(KIT, "code", "self-contained")
HOST = "https://danreynoldsphotography.codebunny.net/"
GSAP = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/"
PAGES = {"index.html": ("home", "/"), "about.html": ("about", "/about"), "portfolio.html": ("portfolio", "/portfolio"),
         "films.html": ("films", "/films"), "investment.html": ("investment", "/investment"), "contact.html": ("contact", "/contact")}


def read(path):
    with open(os.path.join(SITE_DIR, path), encoding="utf-8") as f:
        return f.read()


def absolute(html):
    """Point relative asset paths at the site host and page links at Squarespace slugs."""
    for page, (_, slug) in PAGES.items():
        html = re.sub(r'href="%s(#[^"]*)?"' % re.escape(page), lambda m, s=slug: 'href="%s%s"' % (s, m.group(1) or ""), html)
    html = re.sub(r'((?:src|href|data-full|data-preview|poster|data-src))="assets/', r'\1="' + HOST + "assets/", html)
    html = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r'(^|,\s*)assets/', r"\1" + HOST + "assets/", m.group(1)) + '"', html)
    return re.sub(r"""url\((["']?)assets/""", lambda m: "url(" + m.group(1) + HOST + "assets/", html)


def page_body(page):
    src = read(page)
    style = re.search(r'<style id="page-styles">.*?</style>', src, re.S)
    boot = re.search(r"<script>try\{var d=document\.documentElement.*?</script>", src, re.S)
    body = src.split("<body>", 1)[1].split('<script src="assets/vendor/gsap', 1)[0]
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    if page == "contact.html":
        # The Squarespace Form block is moved into this slot (inquiries reach Squarespace and its integrations).
        body = re.sub(r'<form class="form" data-inquiry.*?</form>', '<div class="sq-form-slot" id="sq-form-slot"></div>', body, flags=re.S)
    body = re.sub(r"\n\s*\n+", "\n", absolute(body)).strip()
    body = body.replace("yoou'll", "you'll")  # typo currently on the live home page
    return (absolute(style.group(0)) if style else ""), (boot.group(0) if boot else ""), body


def main():
    css = read("assets/css/styles.css").replace('url("../brand/', 'url("' + HOST + "assets/brand/")
    css = re.sub(r"\s*\n\s*", "\n", re.sub(r"/\*.*?\*/", "", css, flags=re.S)).strip()
    with open(os.path.join(KIT, "code", "1-header-injection.html"), encoding="utf-8") as f:
        adapter = re.search(r"<style>(.*?)</style>", f.read(), re.S).group(1).strip()
    main_js = read("assets/js/main.js").strip()
    motion_js = read("assets/js/motion.js").strip()
    # Page transitions: Squarespace pages have no .html extension (/about, /films).
    old = r"!/(\.html|\/)$/.test(url.pathname)"
    assert old in motion_js, "motion.js link check changed; update build.py"
    motion_js = motion_js.replace(old, r"!/(\.html|\/|\/[^.\/]+)$/.test(url.pathname)")
    form_move = """document.addEventListener("DOMContentLoaded", function () {
  var slot = document.getElementById("sq-form-slot"), form = document.querySelector(".sqs-block-form");
  if (!slot || !form) return;
  var holder = form.closest(".fe-block");
  slot.appendChild(form);
  if (holder) holder.style.display = "none";
});"""
    os.makedirs(OUT, exist_ok=True)
    for page, (name, _) in PAGES.items():
        style, boot, body = page_body(page)
        out = f"""<!-- Dan Reynolds Photography · {name.upper()} page · self-contained (all CSS + JS included).
     Paste ALL of this into one Squarespace Code Block (HTML mode, Display Source off). -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap">
<style>
/* ===== Site styles ===== */
{css}
/* ===== Squarespace adapter ===== */
{adapter}
</style>
{style}
{boot}
<div class="drx">
{body}
</div>
<script src="{GSAP}gsap.min.js"></script>
<script src="{GSAP}ScrollTrigger.min.js"></script>
<script>
{form_move}
</script>
<script>
/* ===== Site script: main ===== */
{main_js}
</script>
<script>
/* ===== Site script: motion (page transitions, scroll effects) ===== */
{motion_js}
</script>
"""
        with open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8") as f:
            f.write(out)
        print(f"{name}.html  {len(out):,} bytes")


if __name__ == "__main__":
    main()
