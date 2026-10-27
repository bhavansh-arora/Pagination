#!/usr/bin/env python3
"""
Static site generator for danreynoldsphotography.com.

Layout lives here; copy and lists (testimonials, galleries, films, FAQs) live in
tools/content.py. Run `python3 tools/build.py` to regenerate every page — the
output is plain HTML in the repository root with no runtime dependencies.
"""
import json
from pathlib import Path

from content import (SITE_URL, IG_PHOTO, IG_FILMS, FACEBOOK, YOUTUBE, TWITTER,
                     TESTIMONIALS, STORIES, WEDDING_FILMS, COMMERCIAL_FILMS,
                     PORTFOLIO, FILTERS, FAQS)

ROOT = Path(__file__).resolve().parent.parent
EDITED_MARK = "<!-- editor:edited -->"
FORCE = "--force" in __import__("sys").argv
META = json.loads((Path(__file__).parent / "image-meta.json").read_text())

# --------------------------------------------------------------------------- #
# Icons
# --------------------------------------------------------------------------- #
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ARROW_UR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>'
ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5v17l15-8.5z"/></svg>'
IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>'
QUOTE = '<svg class="qmark" viewBox="0 0 40 28" fill="currentColor" aria-hidden="true"><path d="M0 28V17.2C0 7.6 4.6 1.9 13.8 0l1.6 3.3C10.3 5 7.8 8.3 7.5 13.2H15V28H0zm22.6 0V17.2C22.6 7.6 27.2 1.9 36.4 0L38 3.3c-5.1 1.7-7.6 5-7.9 9.9h7.5V28h-15z"/></svg>'
# The logo (rebuilt as vectors from Dan's logo): mark, name and "Visual storyteller" line.
BRAND = '<a class="brand" href="index.html" aria-label="Dan Reynolds, visual storyteller: home"><svg class="brand__mark" viewBox="0 0 132.5 152" fill="currentColor" aria-hidden="true"><path d="M0 0H67A65 65 0 0 1 109.73 113.98L98.89 99.52A47 47 0 0 0 67 18H0Z"/><path d="M0 31H18V117H59L73.25 136H0Z"/><path d="M45 75H69L126.75 152H102.75Z"/></svg><span class="brand__word"><svg class="brand__name" viewBox="222 205 557 37" fill="currentColor" aria-hidden="true"><path d="M222.3 241V206H237.6Q243.3 206 247.6 208.2Q251.9 210.3 254.3 214.3Q256.7 218.2 256.7 223.5Q256.7 228.8 254.3 232.7Q251.9 236.7 247.6 238.8Q243.3 241 237.6 241ZM228.8 235.5H237.3Q241.2 235.5 244.1 234Q247 232.6 248.6 229.8Q250.2 227.2 250.2 223.5Q250.2 219.8 248.6 217.2Q247 214.4 244.1 213Q241.2 211.5 237.3 211.5H228.8ZM269 241 284.8 206H291.2L307 241H300.2L296.7 232.9H279.2L275.7 241ZM281.4 227.8H294.5L287.9 212.5ZM322.4 241V206H327.8L347.1 229.7V206H353.6V241H348.2L328.9 217.3V241ZM404.1 241V206H418.4Q425.4 206 429.4 209.3Q433.4 212.7 433.4 218.4Q433.4 222.4 431.4 225.3Q429.4 228.1 425.9 229.6L433.9 241H426.9L419.8 230.8Q419.1 230.8 418.4 230.8H410.6V241ZM410.6 225.4H418.1Q422.4 225.4 424.6 223.6Q426.8 221.8 426.8 218.4Q426.8 215.2 424.6 213.3Q422.4 211.5 418.1 211.5H410.6ZM453.9 241V206H479.4V211.4H460.4V220.6H477.3V225.9H460.4V235.6H480.1V241ZM511.3 241V228.7L497.5 206H504.5L514.7 223.1L525.1 206H531.5L517.8 228.7V241ZM548 241V206H553.3L572.6 229.7V206H579V241H573.7L554.4 217.3V241ZM616 241.5Q612 241.5 608.5 240.2Q605 238.8 602.5 236.4Q600 233.9 598.5 230.7Q597.1 227.4 597.1 223.5Q597.1 219.6 598.5 216.3Q600 213.1 602.5 210.6Q605 208.2 608.5 206.8Q612 205.5 616 205.5Q620.1 205.5 623.5 206.8Q627 208.2 629.5 210.6Q632 213.1 633.5 216.3Q634.9 219.6 634.9 223.5Q634.9 227.4 633.5 230.7Q632 233.9 629.5 236.4Q627 238.8 623.5 240.2Q620.1 241.5 616 241.5ZM616 235.8Q619.5 235.8 622.3 234.2Q625.1 232.7 626.7 229.8Q628.3 227.1 628.3 223.5Q628.3 219.9 626.7 217.2Q625.1 214.3 622.3 212.8Q619.5 211.2 616 211.2Q612.5 211.2 609.7 212.8Q606.9 214.3 605.3 217.2Q603.7 219.9 603.7 223.5Q603.7 227.1 605.3 229.8Q606.9 232.7 609.7 234.2Q612.5 235.8 616 235.8ZM653.6 241V206H660.1V235.5H678.4V241ZM696.8 241V206H712.1Q717.8 206 722.1 208.2Q726.4 210.3 728.8 214.3Q731.2 218.2 731.2 223.5Q731.2 228.8 728.8 232.7Q726.4 236.7 722.1 238.8Q717.8 241 712.1 241ZM703.3 235.5H711.8Q715.7 235.5 718.6 234Q721.5 232.6 723.1 229.8Q724.6 227.2 724.6 223.5Q724.6 219.8 723.1 217.2Q721.5 214.4 718.6 213Q715.7 211.5 711.8 211.5H703.3ZM762.8 241.5Q758.7 241.5 755 240.3Q751.2 239.2 749 237.3L751.3 232.2Q753.4 233.9 756.5 235Q759.6 236.1 762.8 236.1Q766.9 236.1 768.8 234.8Q770.6 233.5 770.6 231.6Q770.6 229.9 769.5 229Q768.3 228 766.5 227.4Q764.6 226.8 762.4 226.3Q760.2 225.8 758 225.2Q755.7 224.5 753.9 223.4Q752 222.3 750.9 220.6Q749.8 218.8 749.8 215.9Q749.8 213.1 751.3 210.7Q752.8 208.3 756 206.9Q759.1 205.5 763.9 205.5Q767 205.5 770.1 206.3Q773.2 207.1 775.5 208.6L773.5 213.7Q771.1 212.2 768.6 211.6Q766.1 210.9 763.8 210.9Q759.8 210.9 758 212.3Q756.2 213.7 756.2 215.7Q756.2 217.2 757.4 218.2Q758.5 219.2 760.3 219.8Q762.2 220.3 764.4 220.8Q766.6 221.3 768.8 221.9Q771 222.6 772.9 223.7Q774.7 224.8 775.9 226.6Q777 228.3 777 231.1Q777 233.9 775.5 236.3Q773.9 238.7 770.8 240.1Q767.6 241.5 762.8 241.5Z"/></svg><svg class="brand__tag" viewBox="222 264 556 19" fill="currentColor" aria-hidden="true"><path d="M291.1 282 283.6 265H285.5L292 279.8L298.6 265H300.4L292.9 282ZM313.1 282V265H314.9V282ZM333.5 282.1Q331.6 282.1 329.8 281.5Q328.1 280.9 327.2 279.9L327.9 278.6Q328.8 279.4 330.3 280Q331.8 280.6 333.5 280.6Q335.9 280.6 337 279.7Q338.1 278.9 338.1 277.6Q338.1 276.6 337.5 276Q336.9 275.4 336 275.1Q335.1 274.7 333.9 274.4Q332.8 274.2 331.7 273.9Q330.6 273.6 329.7 273.1Q328.7 272.6 328.2 271.7Q327.6 270.9 327.6 269.5Q327.6 268.3 328.2 267.2Q328.9 266.1 330.3 265.5Q331.7 264.9 333.9 264.9Q335.3 264.9 336.7 265.2Q338.1 265.7 339.1 266.4L338.5 267.8Q337.4 267.1 336.2 266.7Q335 266.4 333.9 266.4Q331.5 266.4 330.4 267.3Q329.4 268.2 329.4 269.5Q329.4 270.5 329.9 271.1Q330.5 271.6 331.4 272Q332.4 272.4 333.5 272.6Q334.6 272.9 335.7 273.2Q336.8 273.5 337.8 274Q338.7 274.5 339.3 275.4Q339.8 276.2 339.8 277.5Q339.8 278.8 339.1 279.8Q338.5 280.9 337.1 281.5Q335.7 282.1 333.5 282.1ZM359.5 282.1Q356.3 282.1 354.4 280.3Q352.5 278.4 352.5 274.7V265H354.3V274.7Q354.3 277.7 355.7 279.1Q357 280.5 359.5 280.5Q362 280.5 363.4 279.1Q364.7 277.7 364.7 274.7V265H366.5V274.7Q366.5 278.4 364.6 280.3Q362.8 282.1 359.5 282.1ZM377.3 282 385.1 265H386.9L394.7 282H392.8L390.8 277.5H381.2L379.2 282ZM381.9 276H390.1L386 266.9ZM405.8 282V265H407.6V280.4H417.2V282ZM447 282.1Q445.1 282.1 443.3 281.5Q441.6 280.9 440.7 279.9L441.4 278.6Q442.3 279.4 443.8 280Q445.3 280.6 447 280.6Q449.4 280.6 450.5 279.7Q451.6 278.9 451.6 277.6Q451.6 276.6 451 276Q450.4 275.4 449.5 275.1Q448.6 274.7 447.4 274.4Q446.3 274.2 445.2 273.9Q444.1 273.6 443.2 273.1Q442.2 272.6 441.7 271.7Q441.1 270.9 441.1 269.5Q441.1 268.3 441.8 267.2Q442.4 266.1 443.8 265.5Q445.2 264.9 447.4 264.9Q448.8 264.9 450.2 265.2Q451.6 265.7 452.6 266.4L452 267.8Q450.9 267.1 449.7 266.7Q448.5 266.4 447.4 266.4Q445 266.4 443.9 267.3Q442.9 268.2 442.9 269.5Q442.9 270.5 443.4 271.1Q444 271.6 444.9 272Q445.9 272.4 447 272.6Q448.1 272.9 449.2 273.2Q450.3 273.5 451.2 274Q452.2 274.5 452.8 275.4Q453.3 276.2 453.3 277.5Q453.3 278.8 452.6 279.8Q452 280.9 450.6 281.5Q449.2 282.1 447 282.1ZM471.1 282V266.6H465.1V265H478.9V266.6H472.9V282ZM496.5 282.1Q494.6 282.1 492.9 281.5Q491.3 280.9 490.1 279.7Q488.9 278.5 488.2 276.9Q487.6 275.4 487.6 273.5Q487.6 271.6 488.2 270.1Q488.9 268.5 490.1 267.3Q491.3 266.1 492.9 265.5Q494.6 264.9 496.5 264.9Q498.4 264.9 500.1 265.5Q501.7 266.1 502.9 267.3Q504.1 268.5 504.8 270.1Q505.4 271.6 505.4 273.5Q505.4 275.4 504.8 276.9Q504.1 278.5 502.9 279.7Q501.7 280.9 500.1 281.5Q498.4 282.1 496.5 282.1ZM496.5 280.5Q498.6 280.5 500.2 279.6Q501.8 278.7 502.7 277.1Q503.6 275.5 503.6 273.5Q503.6 271.5 502.7 269.9Q501.8 268.3 500.2 267.4Q498.6 266.5 496.5 266.5Q494.4 266.5 492.8 267.4Q491.2 268.3 490.3 269.9Q489.4 271.5 489.4 273.5Q489.4 275.5 490.3 277.1Q491.2 278.7 492.8 279.6Q494.4 280.5 496.5 280.5ZM516.7 282V265H523.1Q526.3 265 528.2 266.5Q530 268.1 530 270.8Q530 272.8 529 274.2Q528 275.6 526.1 276.2L530.3 282H528.3L524.4 276.5Q523.8 276.6 523.1 276.6H518.5V282ZM518.5 275.1H523Q525.6 275.1 526.9 274Q528.2 272.8 528.2 270.8Q528.2 268.8 526.9 267.7Q525.6 266.6 523 266.6H518.5ZM547.6 282V276.1L540.8 265H542.7L548.6 274.5L554.4 265H556.2L549.4 276.1V282ZM572.1 282V266.6H566.1V265H579.9V266.6H573.9V282ZM593 282V265H604.6V266.6H594.8V272.6H603.6V274.1H594.8V280.4H605V282ZM617.3 282V265H619.1V280.4H628.7V282ZM640.3 282V265H642.1V280.4H651.7V282ZM663 282V265H674.6V266.6H664.8V272.6H673.6V274.1H664.8V280.4H675V282ZM686.7 282V265H693.1Q696.3 265 698.2 266.5Q700 268.1 700 270.8Q700 272.8 699 274.2Q698 275.6 696.1 276.2L700.3 282H698.3L694.4 276.5Q693.8 276.6 693.1 276.6H688.5V282ZM688.5 275.1H693Q695.6 275.1 696.9 274Q698.2 272.8 698.2 270.8Q698.2 268.8 696.9 267.7Q695.6 266.6 693 266.6H688.5ZM223 274H263V275.6H223ZM724 274H777V275.6H724Z"/></svg></span></a>'
CURTAIN_MARK = '<svg class="curtain__mark" viewBox="0 0 132.5 152" fill="currentColor" aria-hidden="true"><path d="M0 0H67A65 65 0 0 1 109.73 113.98L98.89 99.52A47 47 0 0 0 67 18H0Z"/><path d="M0 31H18V117H59L73.25 136H0Z"/><path d="M45 75H69L126.75 152H102.75Z"/></svg>'
MONO_PATHS = '<path d="M7 5v30h15"/><path d="M7 5h14.5a9.5 9.5 0 0 1 0 19H13"/><path d="M19 24l13 12"/>'
MONO = f'<svg class="brand__mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">{MONO_PATHS}</svg>'


def icon_btn(cls="btn__icon", icon=ARROW):
    return f'<span class="{cls}">{icon}</span>'


# --------------------------------------------------------------------------- #
# Image helpers
# --------------------------------------------------------------------------- #
def focus(name):
    m = META[name]
    return f'{m["fx"]}% {m["fy"]}%' if "fx" in m else "50% 50%"


def img(name, alt, sizes="100vw", lazy=True, priority=False):
    m = META[name]
    w = 1600 if m["w"] >= 1600 else m["w"]
    h = round(m["h"] * w / m["w"])
    srcset = (f"assets/img/{name}-800.webp 800w, assets/img/{name}-1600.webp {w}w" if m["w"] > 800
              else f"assets/img/{name}-1600.webp {w}w")
    load = 'loading="lazy" decoding="async"' if lazy else 'decoding="async"'
    if priority:
        load += ' fetchpriority="high"'
    # Crops are anchored on detected faces (image-meta.json fx/fy) so people are never cut off.
    return (f'<img src="assets/img/{name}-1600.webp" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" '
            f'alt="{alt}" {load} style="object-position:{focus(name)}">')


def media(name, alt, ratio="", sizes="100vw", extra="", lazy=True, reveal=True):
    cls = " ".join(x for x in ["media", ratio, extra, "reveal-img" if reveal else ""] if x)
    return f'<div class="{cls}" style="background-color:{META[name]["c"]}">{img(name, alt, sizes, lazy=lazy)}</div>'


def bg(name):
    return f'background-image:url(assets/img/{name}-800.webp);background-position:{focus(name)}'


def yt(vid, label, hd=True, extra="", over=""):
    thumb = "maxresdefault" if hd else "hqdefault"
    return (f'<button class="yt {extra}" type="button" data-cursor="Play" data-id="{vid}" aria-label="Play film: {label}">'
            f'<img src="https://i.ytimg.com/vi/{vid}/{thumb}.jpg" alt="{label} (wedding film thumbnail)" loading="lazy" decoding="async" width="1280" height="720">'
            f'<span class="yt__play">{PLAY}</span>{over}</button>')


# --------------------------------------------------------------------------- #
# Shared chrome
# --------------------------------------------------------------------------- #
NAV = [
    ("index.html", "Home"),
    ("about.html", "About"),
    ("portfolio.html", "Portfolio"),
    ("films.html", "Films"),
    ("investment.html", "Investment"),
    ("contact.html", "Contact"),
]


def header(active):
    links = "".join(
        f'<li><a class="nav__link" href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}</a></li>'
        for h, t in NAV[1:])
    mobile = "".join(
        f'<li><a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}<small>0{i + 1}</small></a></li>'
        for i, (h, t) in enumerate(NAV))
    return f"""
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="site-header__inner">
    {BRAND}
    <nav class="nav" aria-label="Primary"><ul class="nav__list">{links}</ul></nav>
    <a class="btn btn--gold btn--sm header-cta" href="contact.html">Book a call</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
      Menu<span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
    </button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <nav aria-label="Mobile"><ul class="mobile-menu__list">{mobile}</ul></nav>
  <div class="mobile-menu__foot">
    <a class="btn btn--gold btn--block" href="contact.html">Check your date {icon_btn()}</a>
    <div class="mobile-menu__social">
      <a class="pill" href="{IG_PHOTO}" target="_blank" rel="noopener">Instagram · Photo</a>
      <a class="pill" href="{IG_FILMS}" target="_blank" rel="noopener">Instagram · Films</a>
      <a class="pill" href="{YOUTUBE}" target="_blank" rel="noopener">YouTube</a>
      <a class="pill" href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a>
    </div>
  </div>
</div>"""


def footer():
    explore = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in NAV)
    return f"""
<footer class="site-footer">
  <div class="footer-card">
    <div class="footer-cta">
      <div>
        <span class="label label--dot label--live">Limited dates each year</span>
        <p class="h-xl mt-m" data-lines>Let's tell<br>your <em>story.</em></p>
      </div>
      <a class="footer-cta__btn" href="contact.html" data-magnetic-strong><span>Check<br>your date{ARROW_UR}</span></a>
    </div>
    <div class="footer-grid">
      <div class="footer-col footer-col--intro">
        {BRAND}
        <p class="mt-m">Documentary wedding photography and cinematic films by Dan &amp; Lydia Reynolds.</p>
      </div>
      <div class="footer-col"><h3>Explore</h3><ul>{explore}</ul></div>
      <div class="footer-col"><h3>Follow</h3><ul>
        <li><a href="{IG_PHOTO}" target="_blank" rel="noopener">Instagram · Photo</a></li>
        <li><a href="{IG_FILMS}" target="_blank" rel="noopener">Instagram · Films</a></li>
        <li><a href="{YOUTUBE}" target="_blank" rel="noopener">YouTube</a></li>
        <li><a href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a></li>
        <li><a href="{TWITTER}" target="_blank" rel="noopener">X / Twitter</a></li>
      </ul></div>
      <div class="footer-col"><h3>Serving</h3><ul>
        <li>Chicago</li><li>Peoria &amp; Central Illinois</li><li>Milwaukee</li><li>Madison, WI</li><li>Destinations worldwide</li>
      </ul></div>
    </div>
    <span class="footer-wordmark" aria-hidden="true">Dan Reynolds</span>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> Dan Reynolds Photography</span>
      <span>Illinois &amp; Wisconsin</span>
      <a href="#main">Back to top ↑</a>
    </div>
  </div>
</footer>"""


CHROME = f"""
<div class="preloader" aria-hidden="true">
  <div class="preloader__inner">
    <svg class="preloader__mark" viewBox="0 0 132.5 152" fill="currentColor" aria-hidden="true"><path pathLength="1" d="M0 0H67A65 65 0 0 1 109.73 113.98L98.89 99.52A47 47 0 0 0 67 18H0Z"/><path pathLength="1" d="M0 31H18V117H59L73.25 136H0Z"/><path pathLength="1" d="M45 75H69L126.75 152H102.75Z"/></svg>
    <p class="preloader__name"><span><svg viewBox="222 205 557 37" fill="currentColor" aria-hidden="true"><path d="M222.3 241V206H237.6Q243.3 206 247.6 208.2Q251.9 210.3 254.3 214.3Q256.7 218.2 256.7 223.5Q256.7 228.8 254.3 232.7Q251.9 236.7 247.6 238.8Q243.3 241 237.6 241ZM228.8 235.5H237.3Q241.2 235.5 244.1 234Q247 232.6 248.6 229.8Q250.2 227.2 250.2 223.5Q250.2 219.8 248.6 217.2Q247 214.4 244.1 213Q241.2 211.5 237.3 211.5H228.8ZM269 241 284.8 206H291.2L307 241H300.2L296.7 232.9H279.2L275.7 241ZM281.4 227.8H294.5L287.9 212.5ZM322.4 241V206H327.8L347.1 229.7V206H353.6V241H348.2L328.9 217.3V241ZM404.1 241V206H418.4Q425.4 206 429.4 209.3Q433.4 212.7 433.4 218.4Q433.4 222.4 431.4 225.3Q429.4 228.1 425.9 229.6L433.9 241H426.9L419.8 230.8Q419.1 230.8 418.4 230.8H410.6V241ZM410.6 225.4H418.1Q422.4 225.4 424.6 223.6Q426.8 221.8 426.8 218.4Q426.8 215.2 424.6 213.3Q422.4 211.5 418.1 211.5H410.6ZM453.9 241V206H479.4V211.4H460.4V220.6H477.3V225.9H460.4V235.6H480.1V241ZM511.3 241V228.7L497.5 206H504.5L514.7 223.1L525.1 206H531.5L517.8 228.7V241ZM548 241V206H553.3L572.6 229.7V206H579V241H573.7L554.4 217.3V241ZM616 241.5Q612 241.5 608.5 240.2Q605 238.8 602.5 236.4Q600 233.9 598.5 230.7Q597.1 227.4 597.1 223.5Q597.1 219.6 598.5 216.3Q600 213.1 602.5 210.6Q605 208.2 608.5 206.8Q612 205.5 616 205.5Q620.1 205.5 623.5 206.8Q627 208.2 629.5 210.6Q632 213.1 633.5 216.3Q634.9 219.6 634.9 223.5Q634.9 227.4 633.5 230.7Q632 233.9 629.5 236.4Q627 238.8 623.5 240.2Q620.1 241.5 616 241.5ZM616 235.8Q619.5 235.8 622.3 234.2Q625.1 232.7 626.7 229.8Q628.3 227.1 628.3 223.5Q628.3 219.9 626.7 217.2Q625.1 214.3 622.3 212.8Q619.5 211.2 616 211.2Q612.5 211.2 609.7 212.8Q606.9 214.3 605.3 217.2Q603.7 219.9 603.7 223.5Q603.7 227.1 605.3 229.8Q606.9 232.7 609.7 234.2Q612.5 235.8 616 235.8ZM653.6 241V206H660.1V235.5H678.4V241ZM696.8 241V206H712.1Q717.8 206 722.1 208.2Q726.4 210.3 728.8 214.3Q731.2 218.2 731.2 223.5Q731.2 228.8 728.8 232.7Q726.4 236.7 722.1 238.8Q717.8 241 712.1 241ZM703.3 235.5H711.8Q715.7 235.5 718.6 234Q721.5 232.6 723.1 229.8Q724.6 227.2 724.6 223.5Q724.6 219.8 723.1 217.2Q721.5 214.4 718.6 213Q715.7 211.5 711.8 211.5H703.3ZM762.8 241.5Q758.7 241.5 755 240.3Q751.2 239.2 749 237.3L751.3 232.2Q753.4 233.9 756.5 235Q759.6 236.1 762.8 236.1Q766.9 236.1 768.8 234.8Q770.6 233.5 770.6 231.6Q770.6 229.9 769.5 229Q768.3 228 766.5 227.4Q764.6 226.8 762.4 226.3Q760.2 225.8 758 225.2Q755.7 224.5 753.9 223.4Q752 222.3 750.9 220.6Q749.8 218.8 749.8 215.9Q749.8 213.1 751.3 210.7Q752.8 208.3 756 206.9Q759.1 205.5 763.9 205.5Q767 205.5 770.1 206.3Q773.2 207.1 775.5 208.6L773.5 213.7Q771.1 212.2 768.6 211.6Q766.1 210.9 763.8 210.9Q759.8 210.9 758 212.3Q756.2 213.7 756.2 215.7Q756.2 217.2 757.4 218.2Q758.5 219.2 760.3 219.8Q762.2 220.3 764.4 220.8Q766.6 221.3 768.8 221.9Q771 222.6 772.9 223.7Q774.7 224.8 775.9 226.6Q777 228.3 777 231.1Q777 233.9 775.5 236.3Q773.9 238.7 770.8 240.1Q767.6 241.5 762.8 241.5Z"/></svg></span></p>
    <p class="preloader__tag"><span><svg viewBox="222 264 556 19" fill="currentColor" aria-hidden="true"><path d="M291.1 282 283.6 265H285.5L292 279.8L298.6 265H300.4L292.9 282ZM313.1 282V265H314.9V282ZM333.5 282.1Q331.6 282.1 329.8 281.5Q328.1 280.9 327.2 279.9L327.9 278.6Q328.8 279.4 330.3 280Q331.8 280.6 333.5 280.6Q335.9 280.6 337 279.7Q338.1 278.9 338.1 277.6Q338.1 276.6 337.5 276Q336.9 275.4 336 275.1Q335.1 274.7 333.9 274.4Q332.8 274.2 331.7 273.9Q330.6 273.6 329.7 273.1Q328.7 272.6 328.2 271.7Q327.6 270.9 327.6 269.5Q327.6 268.3 328.2 267.2Q328.9 266.1 330.3 265.5Q331.7 264.9 333.9 264.9Q335.3 264.9 336.7 265.2Q338.1 265.7 339.1 266.4L338.5 267.8Q337.4 267.1 336.2 266.7Q335 266.4 333.9 266.4Q331.5 266.4 330.4 267.3Q329.4 268.2 329.4 269.5Q329.4 270.5 329.9 271.1Q330.5 271.6 331.4 272Q332.4 272.4 333.5 272.6Q334.6 272.9 335.7 273.2Q336.8 273.5 337.8 274Q338.7 274.5 339.3 275.4Q339.8 276.2 339.8 277.5Q339.8 278.8 339.1 279.8Q338.5 280.9 337.1 281.5Q335.7 282.1 333.5 282.1ZM359.5 282.1Q356.3 282.1 354.4 280.3Q352.5 278.4 352.5 274.7V265H354.3V274.7Q354.3 277.7 355.7 279.1Q357 280.5 359.5 280.5Q362 280.5 363.4 279.1Q364.7 277.7 364.7 274.7V265H366.5V274.7Q366.5 278.4 364.6 280.3Q362.8 282.1 359.5 282.1ZM377.3 282 385.1 265H386.9L394.7 282H392.8L390.8 277.5H381.2L379.2 282ZM381.9 276H390.1L386 266.9ZM405.8 282V265H407.6V280.4H417.2V282ZM447 282.1Q445.1 282.1 443.3 281.5Q441.6 280.9 440.7 279.9L441.4 278.6Q442.3 279.4 443.8 280Q445.3 280.6 447 280.6Q449.4 280.6 450.5 279.7Q451.6 278.9 451.6 277.6Q451.6 276.6 451 276Q450.4 275.4 449.5 275.1Q448.6 274.7 447.4 274.4Q446.3 274.2 445.2 273.9Q444.1 273.6 443.2 273.1Q442.2 272.6 441.7 271.7Q441.1 270.9 441.1 269.5Q441.1 268.3 441.8 267.2Q442.4 266.1 443.8 265.5Q445.2 264.9 447.4 264.9Q448.8 264.9 450.2 265.2Q451.6 265.7 452.6 266.4L452 267.8Q450.9 267.1 449.7 266.7Q448.5 266.4 447.4 266.4Q445 266.4 443.9 267.3Q442.9 268.2 442.9 269.5Q442.9 270.5 443.4 271.1Q444 271.6 444.9 272Q445.9 272.4 447 272.6Q448.1 272.9 449.2 273.2Q450.3 273.5 451.2 274Q452.2 274.5 452.8 275.4Q453.3 276.2 453.3 277.5Q453.3 278.8 452.6 279.8Q452 280.9 450.6 281.5Q449.2 282.1 447 282.1ZM471.1 282V266.6H465.1V265H478.9V266.6H472.9V282ZM496.5 282.1Q494.6 282.1 492.9 281.5Q491.3 280.9 490.1 279.7Q488.9 278.5 488.2 276.9Q487.6 275.4 487.6 273.5Q487.6 271.6 488.2 270.1Q488.9 268.5 490.1 267.3Q491.3 266.1 492.9 265.5Q494.6 264.9 496.5 264.9Q498.4 264.9 500.1 265.5Q501.7 266.1 502.9 267.3Q504.1 268.5 504.8 270.1Q505.4 271.6 505.4 273.5Q505.4 275.4 504.8 276.9Q504.1 278.5 502.9 279.7Q501.7 280.9 500.1 281.5Q498.4 282.1 496.5 282.1ZM496.5 280.5Q498.6 280.5 500.2 279.6Q501.8 278.7 502.7 277.1Q503.6 275.5 503.6 273.5Q503.6 271.5 502.7 269.9Q501.8 268.3 500.2 267.4Q498.6 266.5 496.5 266.5Q494.4 266.5 492.8 267.4Q491.2 268.3 490.3 269.9Q489.4 271.5 489.4 273.5Q489.4 275.5 490.3 277.1Q491.2 278.7 492.8 279.6Q494.4 280.5 496.5 280.5ZM516.7 282V265H523.1Q526.3 265 528.2 266.5Q530 268.1 530 270.8Q530 272.8 529 274.2Q528 275.6 526.1 276.2L530.3 282H528.3L524.4 276.5Q523.8 276.6 523.1 276.6H518.5V282ZM518.5 275.1H523Q525.6 275.1 526.9 274Q528.2 272.8 528.2 270.8Q528.2 268.8 526.9 267.7Q525.6 266.6 523 266.6H518.5ZM547.6 282V276.1L540.8 265H542.7L548.6 274.5L554.4 265H556.2L549.4 276.1V282ZM572.1 282V266.6H566.1V265H579.9V266.6H573.9V282ZM593 282V265H604.6V266.6H594.8V272.6H603.6V274.1H594.8V280.4H605V282ZM617.3 282V265H619.1V280.4H628.7V282ZM640.3 282V265H642.1V280.4H651.7V282ZM663 282V265H674.6V266.6H664.8V272.6H673.6V274.1H664.8V280.4H675V282ZM686.7 282V265H693.1Q696.3 265 698.2 266.5Q700 268.1 700 270.8Q700 272.8 699 274.2Q698 275.6 696.1 276.2L700.3 282H698.3L694.4 276.5Q693.8 276.6 693.1 276.6H688.5V282ZM688.5 275.1H693Q695.6 275.1 696.9 274Q698.2 272.8 698.2 270.8Q698.2 268.8 696.9 267.7Q695.6 266.6 693 266.6H688.5ZM223 274H263V275.6H223ZM724 274H777V275.6H724Z"/></svg></span></p>
  </div>
  <div class="preloader__foot"><span>Photo + Film</span><span class="preloader__count" data-count-loader>000</span></div>
  <div class="preloader__bar"><span></span></div>
</div>
<div class="curtain" aria-hidden="true">{CURTAIN_MARK}</div>
<div class="scroll-progress" aria-hidden="true"><span></span></div>
<div class="cursor" aria-hidden="true"><span class="cursor__ring"><span class="cursor__label"></span></span><span class="cursor__dot"></span></div>
<div class="hover-preview" aria-hidden="true"><div class="hover-preview__inner"></div></div>"""

STICKY = """
<div class="sticky-cta" aria-label="Quick actions">
  <a class="btn btn--ghost" href="portfolio.html">Our work</a>
  <a class="btn btn--gold" href="contact.html">Check your date</a>
</div>"""

FONTS = ("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500"
         "&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap")


def page(filename, title, description, body, active=None, og_image="golden-hour-portrait", extra_head="", sticky=True):
    active = filename if active is None else active
    canonical = f"{SITE_URL}/" if filename == "index.html" else f"{SITE_URL}/{filename.replace('.html', '')}"
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#080706">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dan Reynolds Photography">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE_URL}/assets/img/og/{og_image}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@reynoldspix">
<link rel="icon" href="assets/brand/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="assets/css/styles.css">
<link rel="stylesheet" href="assets/css/editor-global.css">
<style id="page-styles"></style>
<script>try{{var d=document.documentElement;if(sessionStorage.getItem("dr-nav")){{d.classList.add("is-entering");sessionStorage.removeItem("dr-nav")}}else if(!sessionStorage.getItem("dr-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{d.classList.add("is-loading")}}setTimeout(function(){{d.classList.remove("is-loading","is-entering")}},5000)}}catch(e){{}}</script>
{extra_head}
</head>
<body>
{CHROME}
<!-- editor:header -->{header(active)}
<!-- /editor:header -->
<main id="main">
<!-- editor:main -->
{body}
<!-- /editor:main -->
</main>
<!-- editor:footer -->{footer()}
<!-- /editor:footer -->
{STICKY if sticky else ""}
<script src="assets/vendor/gsap.min.js" defer></script>
<script src="assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/js/main.js" defer></script>
<script src="assets/js/motion.js" defer></script>
</body>
</html>
"""
    out = ROOT / filename
    # Pages saved from the visual editor (/admin) are the source of truth: never overwrite them.
    if out.exists() and EDITED_MARK in out.read_text() and not FORCE:
        print(f"  skipped {filename} (edited in the visual editor; use --force to overwrite)")
        return
    out.write_text(html)


# --------------------------------------------------------------------------- #
# Reusable sections
# --------------------------------------------------------------------------- #
def head(num, label, title, lede="", right_label="", split=True):
    lede_html = f'<p class="lede reveal">{lede}</p>' if lede else ""
    return f"""
    <div class="head{' head--split' if split and lede else ''}">
      <div class="head__top"><span class="label">({num}) — {label}</span><span class="label">{right_label}</span></div>
      <h2 class="h-xl" data-lines>{title}</h2>
      {lede_html}
    </div>"""


def page_hero(label, right, title, lede, extra=""):
    return f"""
<section class="page-hero">
  <div class="container">
    <div class="page-hero__meta reveal"><span class="label label--dot">{label}</span><span class="label">{right}</span></div>
    <div class="page-hero__grid">
      <h1 class="h-xl page-hero__title" data-lines>{title}</h1>
      <p class="lede reveal" data-delay="2">{lede}</p>
    </div>
    {extra}
  </div>
</section>"""


def process_section(num):
    steps = [
        ("01", "Submit an inquiry", "Fill out the form, or message us on Instagram or Facebook with any questions at all. "
         "The more you tell us about your day, the better.", "lexi-lucas-1", "Wedding invitation, shoes and jewellery laid flat"),
        ("02", "Schedule a call", "We'll answer your questions and show you how we'll capture your day with authenticity, "
         "artistry and emotion, so you can relive every moment exactly as it happened.", "dan-coffee", "Dan sipping coffee outdoors"),
        ("03", "Book it", "Lock in your date, then relax. Every emotion, vow and joyful moment will be preserved beautifully "
         "for a lifetime, with a blend of cinematic artistry and honest storytelling.", "golden-hour-portrait",
         "A couple holding hands at golden hour"),
    ]
    cards = "".join(f"""
      <article class="stack-card" style="--i:{i}"><span class="stack-card__shade" aria-hidden="true"></span>
        <div class="stack-card__text">
          <div class="row" style="justify-content:space-between"><span class="stack-card__num">Step {n} / 03</span><span class="pill">{['Day 1', 'Within a week', 'Your date is yours'][i]}</span></div>
          <div class="stack" style="--stack:16px"><h3>{t}</h3><p>{d}</p></div>
        </div>
        {media(im, alt, "", "(min-width:900px) 45vw, 90vw", reveal=False)}
      </article>""" for i, (n, t, d, im, alt) in enumerate(steps))
    return f"""
<section class="section">
  <div class="container">
    {head(num, "How it works", "Three simple<br><em>steps.</em>", "From first hello to the moment you hold your gallery, the process is calm, clear and personal.", "Inquire · Call · Book")}
    <div class="stack-cards" data-stack>{cards}</div>
  </div>
</section>"""


def quotes_section(num):
    cards = "".join(f"""
      <figure class="qcard reveal" data-delay="{i}">
        {media(im, alt, "", "(min-width:900px) 33vw, 86vw", reveal=False)}
        <div class="qcard__body">
          <blockquote><p>“{q}”</p></blockquote>
          <figcaption class="qcard__who"><strong>{who}</strong>{QUOTE}</figcaption>
        </div>
      </figure>""" for i, (q, who, im, alt) in enumerate(TESTIMONIALS))
    return f"""
<section class="section">
  <div class="container">
    {head(num, "Kind words", "Loved by<br><em>our couples.</em>", "Energetic, friendly and calm. Here's what it feels like to have us there on the day.", "Real reviews")}
    <div class="quotes">{cards}</div>
  </div>
</section>"""


def words_marquee(words):
    spans = "".join(f"<span>{w}</span>" for w in words)
    return f'<div class="marquee marquee--words" aria-hidden="true"><div class="marquee__track">{spans}{spans}</div></div>'


# --------------------------------------------------------------------------- #
# HOME
# --------------------------------------------------------------------------- #
def build_home():
    hcards = "".join(f"""
      <a class="hcard" href="{url}" target="_blank" rel="noopener" data-cursor="View">
        <div class="hcard__media"><div class="hcard__tag"><span class="pill">Full gallery ↗</span></div>{media(im, alt, "", "(min-width:1024px) 36vw, 78vw", reveal=False)}</div>
        <div class="hcard__meta"><h3 class="hcard__name">{a} <em>&amp;</em> {b}</h3><span class="label">0{i + 1}</span></div>
      </a>""" for i, (a, b, im, url, alt) in enumerate(STORIES))

    insta = ["colin-amanda-6", "lexi-lucas-9", "quinn-charlotte-2", "roseleina-cameron-3", "ethan-gwyn-3",
             "lexi-lucas-10", "ben-tamar", "yura-joe-2", "brian-tori", "kelly-adam-2"]
    def couple(name):  # "lexi-lucas-9" -> "Lexi & Lucas"
        parts = [w.capitalize() for w in name.split("-") if not w.isdigit()]
        return " & ".join(parts)

    def insta_list(dup):
        hide = ' aria-hidden="true" tabindex="-1"' if dup else ""
        return "".join(
            f'<a class="marquee__item" href="{IG_PHOTO if n % 2 == 0 else IG_FILMS}" target="_blank" rel="noopener" data-cursor="Follow" aria-label="{couple(s)} on Instagram"{hide}>'
            f'{img(s, f"{couple(s)} wedding photo by Dan Reynolds Photography", "300px")}</a>'
            for n, s in enumerate(insta))
    insta_items = insta_list(False) + insta_list(True)

    rose = TESTIMONIALS[1]
    body = f"""
<section class="hero" aria-label="Introduction">
  <div class="hero__frame">
    <div class="hero__media hero__slides" data-hero-slides>
      <div class="hero__slide is-active">{img("golden-hour-portrait", "A bride and groom holding hands on a stone path at sunset", "100vw", lazy=False, priority=True)}</div>
      <div class="hero__slide">{img("chicago-skyline-couple", "A couple on the Chicago lakefront with the skyline behind", "100vw")}</div>
      <div class="hero__slide">{img("ethan-gwyn-4", "A couple walking through autumn trees at sunset", "100vw")}</div>
      <div class="hero__slide">{img("garden-estate-portrait", "A couple embracing on an estate lawn at golden hour", "100vw")}</div>
    </div>
    <a class="hero__card reveal" data-delay="4" href="films.html" data-cursor="Watch">
      <div class="hero__card-media"><img src="https://i.ytimg.com/vi/Gpq9IPxnIhE/mqdefault.jpg" alt="What if Wes Anderson filmed a wedding? (wedding film thumbnail)" width="320" height="180"><span>{PLAY}</span></div>
      <div class="hero__card-body"><div><span class="label">Latest film</span><strong>What if Wes Anderson filmed a wedding?</strong></div>{icon_btn("circle-btn", ARROW_UR)}</div>
    </a>
    <div class="hero__content">
      <div class="hero__top reveal"><span class="label label--dot">Wedding photo + film · Illinois &amp; Wisconsin</span>
        <div class="hero__index" aria-hidden="true"><span data-hero-current>01</span><span class="hero__index-bar"><span></span></span><span>04</span></div></div>
      <h1 class="h-display hero__title" data-lines aria-label="Moments you'll see, hear and feel again.">Moments you'll<br><span class="rotator" data-nosplit><em class="rotator__word">see</em><em class="rotator__word">hear</em><em class="rotator__word">feel</em></span> again.</h1>
      <div class="hero__bottom">
        <p class="hero__sub reveal" data-delay="2">Documentary-style wedding photos and cinematic films by husband-and-wife team Dan &amp; Lydia Reynolds.</p>
        <div class="row reveal" data-delay="3">
          <a class="btn btn--gold" href="contact.html">Check your date {icon_btn()}</a>
          <a class="btn btn--glass" href="portfolio.html">See the work</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="head__top reveal"><span class="label">(01) — The studio</span><span class="label">Peoria · Chicago · Wisconsin</span></div>
    <p class="statement mt-l" data-scrub-words>We're Dan &amp; Lydia<span class="inline-img inline-img--round" style="{bg('lydia')}"></span>, a husband-and-wife team telling love stories<span class="inline-img" style="{bg('golden-hour-portrait')}"></span> through honest photographs and <em>cinematic film</em><span class="inline-img" style="{bg('dan-filming')}"></span> so you can feel your day all over again.</p>
    <div class="statement-foot reveal">
      <div class="row"><span class="pill">Documentary approach</span><span class="pill">Two artists at every wedding</span><span class="pill">Hand-edited by Dan</span></div>
      <a class="link" href="about.html">Meet Dan &amp; Lydia {ARROW}</a>
    </div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("02", "What we do", "Two crafts,<br><em>one story.</em>", "One team with one shared vision, so your photos and your film feel like they belong together.", "Photo · Film · Both")}
    <div class="bento">
      <a class="tile tile--media c-7 r-2 span-6 reveal" href="portfolio.html" data-cursor="Explore">
        {media("ceremony-dip", "A groom dipping his bride for a kiss as guests cheer", "", "(min-width:1100px) 58vw, 100vw", reveal=False)}
        <div class="tile__overlay"><div><span class="label">01 — Photography</span><p class="tile__title">Stills that feel <em>alive.</em></p></div>{icon_btn("circle-btn", ARROW_UR)}</div>
      </a>
      <a class="tile tile--media c-5 r-2 span-6 reveal" data-delay="1" href="films.html" data-cursor="Watch">
        {media("dan-filming", "Dan setting up a cinema camera on a tripod", "", "(min-width:1100px) 42vw, 100vw", reveal=False)}
        <div class="tile__overlay"><div><span class="label">02 — Film</span><p class="tile__title">Cinematic <em>films.</em></p></div>{icon_btn("circle-btn", ARROW_UR)}</div>
      </a>
      <div class="tile c-4 reveal">
        <div class="tile__top"><span class="label">On average</span><span class="pill">Per hour</span></div>
        <div><div class="tile__num foil"><span data-count="100">100</span><sup>images</sup></div>
        <p class="mt-s">Delivered for every hour of coverage. A first look adds about 40% more.</p></div>
      </div>
      <div class="tile c-4 reveal" data-delay="1">
        <div class="tile__top"><div class="avatars"><span style="{bg('dan-coffee')}"></span><span style="{bg('lydia')}"></span></div><span class="label">Dan + Lydia</span></div>
        <div><p class="h-md">Two artists at <em>every</em> wedding.</p>
        <p class="mt-s">Dan leads photo and film while Lydia shoots alongside, keeping the day calm and flowing.</p></div>
      </div>
      <a class="tile tile--gold c-4 reveal" data-delay="2" href="contact.html">
        <div class="tile__top"><span class="label">Dates go fast</span>{icon_btn("circle-btn", ARROW_UR)}</div>
        <div><div class="tile__num"><span data-count="18">18</span><sup>months+</sup></div>
        <p class="mt-s">Couples are already booking more than 18 months ahead. Check your date today.</p></div>
      </a>
      <div class="tile tile--quote c-8 span-6 reveal">
        <div class="tile__top">{QUOTE}<span class="label">Kind words</span></div>
        <blockquote><p>“{rose[0]}”</p></blockquote>
        <div class="row" style="justify-content:space-between"><strong>{rose[1]}</strong><a class="link" href="about.html">More about us {ARROW}</a></div>
      </div>
      <div class="tile c-4 span-6 reveal" data-delay="1">
        <div class="tile__top"><span class="label">Film teaser</span><span class="pill">30–60 sec</span></div>
        <div><div class="tile__num foil"><span data-count="14">14</span><sup>days</sup></div>
        <p class="mt-s">Your teaser film lands within two weeks, ready to share while the glow is still fresh.</p></div>
      </div>
    </div>
  </div>
</section>

<section class="hscroll" data-hscroll aria-label="Recent love stories">
  <div class="container hscroll__head">
    <div class="head__top"><span class="label">(03) — Recent love stories</span><a class="link" href="portfolio.html">All work {ARROW}</a></div>
    <h2 class="h-xl mt-m" data-lines>Real couples,<br><em>real moments.</em></h2>
  </div>
  <div class="hscroll__sticky">
    <div class="hscroll__track">
      <div class="hscroll__intro" aria-hidden="true">
        <div><span class="label">(03) — Recent love stories</span><p class="h-xl mt-m">Real couples, <em>real moments.</em></p></div>
        <div class="stack"><p class="body">Scroll through a few recent weddings, then open each couple's full gallery.</p><a class="link" href="portfolio.html" tabindex="-1">Full portfolio {ARROW}</a></div>
      </div>
      {hcards}
      <a class="hscroll__end" href="portfolio.html" data-cursor="Open">
        <span class="hscroll__end-circle">{ARROW_UR}</span>
        <span class="hscroll__end-text">See every<br><em>love story</em></span>
      </a>
    </div>
    <div class="hscroll__progress" aria-hidden="true"><span></span></div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    <div class="head__top reveal"><span class="label">(04) — Featured film</span><a class="link" href="films.html">All films {ARROW}</a></div>
    <div class="mt-l reveal">{yt("Gpq9IPxnIhE", "What if Wes Anderson filmed a wedding?", extra="yt--feature",
        over='<span class="yt__over"><span class="h-lg">What if <em>Wes Anderson</em> filmed a wedding?</span></span>')}</div>
  </div>
</section>

{process_section("05")}

{words_marquee(["Authentic", "Cinematic", "Timeless", "Documentary", "Heartfelt", "Unposed"])}

{quotes_section("06")}

<section class="section section--flush-top">
  <div class="container">
    {head("07", "Follow along", "Behind the <em>lens.</em>", "", f'<a href="{IG_PHOTO}" target="_blank" rel="noopener">@danreynoldsphotography</a>', split=False)}
    <div class="row reveal" style="margin-top:-24px;margin-bottom:36px">
      <a class="btn btn--ghost btn--sm" href="{IG_PHOTO}" target="_blank" rel="noopener">{IG} @danreynoldsphotography</a>
      <a class="btn btn--ghost btn--sm" href="{IG_FILMS}" target="_blank" rel="noopener">{IG} @danreynoldsfilms</a>
    </div>
  </div>
  <div class="marquee"><div class="marquee__track">{insta_items}</div></div>
</section>
"""
    schema = {
        "@context": "https://schema.org", "@type": "ProfessionalService", "name": "Dan Reynolds Photography",
        "description": "Documentary-style wedding photography and cinematic wedding films by Dan & Lydia Reynolds.",
        "url": SITE_URL, "image": f"{SITE_URL}/assets/img/og/golden-hour-portrait.jpg", "priceRange": "From $3,500",
        "founder": {"@type": "Person", "name": "Dan Reynolds"},
        "areaServed": ["Chicago, IL", "Peoria, IL", "Central Illinois", "Milwaukee, WI", "Madison, WI"],
        "sameAs": [IG_PHOTO, IG_FILMS, FACEBOOK, YOUTUBE, TWITTER],
    }
    page("index.html", "Dan Reynolds | Chicago &amp; Peoria Wedding Photographer &amp; Films",
         "Documentary wedding photography and cinematic films by husband-and-wife team Dan & Lydia Reynolds, serving Chicago, Central Illinois, Milwaukee and Madison.",
         body,
         extra_head=('<link rel="preload" as="image" href="assets/img/golden-hour-portrait-800.webp" '
                     'imagesrcset="assets/img/golden-hour-portrait-800.webp 800w, assets/img/golden-hour-portrait-1600.webp 1600w" imagesizes="100vw">\n'
                     f'<script type="application/ld+json">{json.dumps(schema)}</script>'))


# --------------------------------------------------------------------------- #
# ABOUT
# --------------------------------------------------------------------------- #
def build_about():
    chapters = [
        ("i.", "Rochester, New York", "dan-seattle", "Dan grinning while holding an ice cream cone",
         "<p>I grew up in Rochester, a city with a deep connection to photography, thanks in part to Kodak. My dad worked there. "
         "I didn't realise it at the time, but being surrounded by a culture of imagery and innovation planted a seed that would later shape my career.</p>"),
        ("ii.", "A trip to Ireland", "dan-lydia-mountains", "Dan and Lydia in front of jagged mountain peaks",
         "<p>The moment came when I bought a nice camera for a trip to Ireland. I just wanted better photos of the landscapes and history I'd always "
         "dreamed of seeing. Instead, I fell in love with photography: composition, light, and the way a single frame can hold so much emotion.</p>"
         "<p>That trip changed everything, and soon a hobby became something much more meaningful.</p>"),
        ("iii.", "Today, together", "dan-filming", "Dan setting up a cinema camera",
         "<p>Over the years, Lydia and I have built a full photography and video production team, capturing everything from weddings to commercial "
         "projects. Weddings have become our passion: the energy, the emotion and the once-in-a-lifetime moments.</p>"
         "<p>We've grown into a team couples trust to capture their day exactly as it happens.</p>"),
    ]
    chapter_html = "".join(f"""
        <article class="chapter reveal">
          {media(im, alt, "", "(min-width:960px) 50vw, 100vw", reveal=False)}
          <div class="chapter__body"><div class="row" style="justify-content:space-between"><span class="label">Chapter {n}</span></div><h3 class="h-md">{t}</h3><div class="body">{txt}</div></div>
        </article>""" for n, t, im, alt, txt in chapters)
    venues = [("Sarabande", "Chicago"), ("Ovation", "Chicago"), ("Joliet Union Station", "Joliet"),
              ("Haven on the Farm", "Illinois"), ("Sanctuary Events", "Illinois"), ("Le Fleur — 905 Room", "Illinois")]
    venue_list = "".join(f'<li class="reveal"><span>{v}</span><span class="label">{c}</span></li>' for v, c in venues)
    manny = TESTIMONIALS[2]
    body = f"""
{page_hero("About us", "Dan &amp; Lydia Reynolds", "Get to know<br>the team with<br><em>the vision.</em>",
           "Hey! We're Dan and Lydia, a husband-and-wife team capturing weddings with authenticity, artistry and heart.")}

<div class="frame">{media("dan-patagonia", "Dan photographing a turquoise mountain lake beneath snowy peaks", "ratio-cinema about-hero-media", "100vw")}</div>

<section class="section">
  <div class="container">
    <div class="head__top reveal"><span class="label">(01) — Our approach</span><span class="label">A true team effort</span></div>
    <p class="statement mt-l" data-scrub-words>The business carries Dan's name<span class="inline-img inline-img--round" style="{bg('dan-coffee')}"></span>, but it's truly a team effort. We complement each other's strengths<span class="inline-img inline-img--round" style="{bg('lydia')}"></span> so you can be <em>fully present</em> while we capture every emotion, moment and memory.</p>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("02", "The team", "Meet the<br><em>two of us.</em>", "Cinematic films and timeless images from Dan; a keen eye for detail, organisation and creative input from Lydia.", "Photo · Film")}
    <div class="team">
      <article class="person reveal">
        {media("dan-coffee", "Dan sipping coffee outdoors", "", "(min-width:760px) 50vw, 100vw", reveal=False)}
        <div class="person__body"><span class="label" style="color:var(--accent)">Lead photographer &amp; filmmaker</span><h3 class="h-lg">Dan</h3><p>Rochester-raised, coffee-powered and a little obsessed with the newest cameras. Dan hand-edits every single image himself.</p></div>
      </article>
      <article class="person reveal" data-delay="1">
        {media("lydia", "Lydia smiling against a white wall", "", "(min-width:760px) 50vw, 100vw", reveal=False)}
        <div class="person__body"><span class="label" style="color:var(--accent)">Photographer &amp; creative partner</span><h3 class="h-lg">Lydia</h3><p>The calm in the room. Lydia keeps the timeline flowing, spots the details everyone else misses and makes every guest feel at ease.</p></div>
      </article>
    </div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container story-layout">
    <div class="story-layout__aside stack" style="--stack:24px">
      <div class="head__top reveal"><span class="label">(03) — Our story</span><span class="label">Since Rochester</span></div>
      <h2 class="h-xl" data-lines>My story<br>began with<br><em>Kodak.</em></h2>
      <p class="lede reveal">From a Kodak town to Ireland's coastline to wedding days across the Midwest.</p>
      <ul class="loves reveal" role="list"><li>Strong coffee</li><li>Travel</li><li>Fresh, seasonal food</li><li>Our cats</li><li>New camera gear</li><li>Golden hour</li></ul>
    </div>
    <div class="chapters">{chapter_html}</div>
  </div>
</section>

{words_marquee([v for v, _ in venues])}

<section class="section">
  <div class="container">
    {head("04", "Favourite venues", "Places we<br><em>love</em> to shoot.", "From Chicago ballrooms to Central Illinois farms, spaces we know inside out, including where the best light falls.", "Illinois")}
    <ul class="venue-list" role="list">{venue_list}</ul>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container container--narrow center">
    <div class="reveal" style="display:flex;justify-content:center;margin-bottom:28px">{QUOTE}</div>
    <p class="statement" style="font-size:clamp(1.6rem,1rem + 2.4vw,3.2rem)" data-scrub-words>“{manny[0]}”</p>
    <p class="label mt-l reveal">— {manny[1]}</p>
  </div>
</section>
"""
    page("about.html", "About Dan &amp; Lydia — Dan Reynolds Photography",
         "Meet Dan & Lydia Reynolds, a husband-and-wife wedding photography and film team. Rochester roots, a love of storytelling and a documentary approach.",
         body, og_image="dan-patagonia")


# --------------------------------------------------------------------------- #
# PORTFOLIO
# --------------------------------------------------------------------------- #
def build_portfolio():
    counts = {}
    for _, k, _, _ in PORTFOLIO:
        counts[k] = counts.get(k, 0) + 1
    chips = "".join(
        f'<button class="chip" type="button" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}<span>{len(PORTFOLIO) if k == "all" else counts.get(k, 0)}</span></button>'
        for k, t in FILTERS)
    items = "".join(f"""
      <a class="masonry__item" data-cursor="View" href="assets/img/{im}-1600.webp" data-full="assets/img/{im}-1600.webp" data-story="{k}" data-caption="{cap}">
        {media(im, alt, "", "(min-width:1300px) 25vw, (min-width:760px) 33vw, 50vw", reveal=False)}
        <span class="masonry__tag"><span class="pill">{cap}</span></span>
      </a>""" for im, k, cap, alt in PORTFOLIO)
    index_rows = "".join(f"""
      <li class="reveal"><a class="index-row" href="{url}" target="_blank" rel="noopener" data-preview="assets/img/{im}-800.webp">
        <span class="index-row__num">0{i + 1}</span>
        <span class="index-row__thumb">{img(im, alt, "120px")}</span>
        <span class="index-row__name">{a} <em>&amp;</em> {b}</span>
        <span class="index-row__cta btn btn--ghost btn--sm">Open gallery {ARROW_UR}</span>
      </a></li>""" for i, (a, b, im, url, alt) in enumerate(STORIES))
    body = f"""
{page_hero("Portfolio", f"{len(PORTFOLIO)} selected frames", f"Love stories,<br><em>as they unfolded.</em>",
           "Quiet touches, nervous laughter and unfiltered joy. A selection of recent weddings across Illinois and beyond.")}

<section class="container" style="padding-bottom:var(--section)">
  <div class="filters-bar reveal"><div class="filters" data-filters role="group" aria-label="Filter by couple">{chips}</div></div>
  <div class="masonry">{items}</div>
  <div class="tile mt-l reveal" style="min-height:0;flex-direction:row;flex-wrap:wrap;align-items:center">
    <div><span class="label">Want the full story?</span><p class="h-md mt-s">See a complete wedding, <em>start to finish.</em></p></div>
    <a class="btn btn--gold" href="contact.html">Request a full gallery {icon_btn()}</a>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("02", "Client galleries", "Recent<br><em>love stories.</em>", "Every couple receives a private online gallery to view, download and share with family and friends.", "Hover to preview")}
    <ol class="index-list" role="list">{index_rows}</ol>
  </div>
</section>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true">
  <div class="lightbox__bar"><span data-count>01 / 01</span><span class="lightbox__caption" data-caption></span><button class="icon-btn" type="button" data-close aria-label="Close viewer">{CLOSE}</button></div>
  <div class="lightbox__stage"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Full-size photo"></div>
  <div class="lightbox__nav">
    <button class="icon-btn" type="button" data-prev aria-label="Previous image">{ARROW_L}</button>
    <button class="icon-btn" type="button" data-next aria-label="Next image">{ARROW}</button>
  </div>
</div>
"""
    page("portfolio.html", "Portfolio — Dan Reynolds Photography",
         "Wedding photography portfolio by Dan Reynolds: documentary, cinematic and timeless love stories from Chicago, Central Illinois and Wisconsin.",
         body, og_image="colin-amanda-2")


# --------------------------------------------------------------------------- #
# FILMS
# --------------------------------------------------------------------------- #
def film_cards(films):
    return "".join(f"""
      <article class="film-card reveal" data-delay="{i % 3}">
        {yt(v, t.replace('&amp;', '&'), hd)}
        <div class="film-card__meta"><h3 class="film-card__title">{t}</h3><span class="label">{m}</span></div>
      </article>""" for i, (v, t, m, hd) in enumerate(films))


def build_films():
    kit = [
        ("Camera system", "Sony", "Accurate colour science and cinema-quality video for our hybrid photo + film workflow."),
        ("Stabiliser", "DJI Ronin 4D", "Fluid, cinematic movement through every moment of the day."),
        ("Aerials", "DJI Mavic 3", "Sweeping drone footage of your venue and surroundings."),
        ("Sound", "Pro audio", "Every vow, laugh and toast recorded clearly for the ceremony and selected events."),
    ]
    kit_tiles = "".join(f"""
      <div class="tile c-3 reveal" data-delay="{i}"><span class="label">{a}</span><div><p class="h-md">{b}</p><p class="mt-s">{c}</p></div></div>"""
                        for i, (a, b, c) in enumerate(kit))
    body = f"""
{page_hero("Films", f"{len(WEDDING_FILMS)} wedding films", "Films you don't<br>just watch. You<br><em>feel</em> them.",
           "Cinematic wedding films shot on cinema-grade gear, with pro audio for every vow and toast.")}

<div class="frame reveal">{yt("Gpq9IPxnIhE", "What if Wes Anderson filmed a wedding?", extra="yt--feature",
     over='<span class="yt__over"><span class="h-lg">What if <em>Wes Anderson</em> filmed a wedding?</span><span class="pill" style="color:var(--ivory);border-color:rgba(239,231,218,.4)">Featured</span></span>')}</div>

<section class="section">
  <div class="container">
    {head("01", "Wedding films", "Recent<br><em>films.</em>", "Highlight films, teasers and full ceremonies from couples across Illinois and Wisconsin.", f'<a href="{YOUTUBE}" target="_blank" rel="noopener">YouTube ↗</a>')}
    <div class="film-grid">{film_cards(WEDDING_FILMS)}</div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("02", "The kit", "Cinema tools,<br><em>quietly used.</em>", "Every film package includes a lighting kit, pro audio and a storytelling consultation while you plan.", "Gear")}
    <div class="bento">
      {kit_tiles}
      <div class="tile c-4 reveal"><span class="label">Highlight film</span><div><div class="tile__num foil">3–<span data-count="7">7</span><sup>min</sup></div><p class="mt-s">Your day, told as a cinematic story.</p></div></div>
      <div class="tile c-4 reveal" data-delay="1"><span class="label">Teaser</span><div><div class="tile__num foil">30–<span data-count="60">60</span><sup>sec</sup></div><p class="mt-s">Social-ready and delivered within 14 days.</p></div></div>
      <a class="tile tile--gold c-4 reveal" data-delay="2" href="investment.html"><div class="tile__top"><span class="label">Film packages</span>{icon_btn("circle-btn", ARROW_UR)}</div><div><p class="h-md">From <em>$3,500</em></p><p class="mt-s">See what's included in every film collection.</p></div></a>
    </div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("03", "Commercial &amp; events", "Beyond<br>the <em>aisle.</em>", "Brand films, venue promos and event documentaries for businesses and causes we believe in.", "Commercial")}
    <div class="film-grid">{film_cards(COMMERCIAL_FILMS)}</div>
  </div>
</section>
"""
    page("films.html", "Wedding Films — Dan Reynolds Photography",
         "Cinematic wedding films and highlight reels by Dan Reynolds, shot on Sony cinema gear with pro audio and drone coverage. Chicago, Illinois and Wisconsin.",
         body, og_image="dan-filming")


# --------------------------------------------------------------------------- #
# INVESTMENT
# --------------------------------------------------------------------------- #
def build_investment():
    faqs = "".join(f"""
      <details class="reveal">
        <summary>{q}<span class="faq__icon" aria-hidden="true"></span></summary>
        <div class="faq__body"><div>{a}</div></div>
      </details>""" for q, a in FAQS)
    faq_schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS]}
    body = f"""
{page_hero("Investment", "Collections from $3,500", "And so the<br><em>adventure begins.</em>",
           "Photo and film collections built around one idea: when you look back, you don't just see the day, you feel it all over again.")}

<div class="frame">{media("garden-estate-portrait", "A couple embracing on an estate lawn at sunset", "ratio-cinema about-hero-media", "100vw")}</div>

<section class="section">
  <div class="container">
    <div class="head__top reveal"><span class="label">(01) — Our philosophy</span><span class="label">Real · Raw · Personal</span></div>
    <p class="statement mt-l" data-scrub-words>We capture the quiet touches<span class="inline-img" style="{bg('lexi-lucas-10')}"></span>, the nervous laughter, the teary-eyed vows<span class="inline-img" style="{bg('lexi-lucas-6')}"></span> and the <em>unfiltered joy</em> that make your love story uniquely yours.</p>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container">
    {head("02", "Collections", "Choose your<br><em>story.</em>", "All photo or video packages begin at $3,500. Our most popular collections include 8 hours of coverage.", "Photo · Film · Both")}
    <div class="pricing">
      <article class="price-card reveal">
        {media("lexi-lucas-9", "A wedding party cheering with bouquets raised", "", "(min-width:1000px) 36vw, 100vw", reveal=False)}
        <div class="price-card__body">
          <div class="price-card__head"><span class="label">Photo package I</span><span class="pill">6 hours</span></div>
          <div class="price"><small>From</small><strong>$3,500</strong></div>
          <ul class="checklist" role="list">
            <li>6 hours of wedding coverage</li>
            <li>A team of 2 photographers: Dan and Lydia</li>
            <li>Complimentary engagement session</li>
            <li>Timeline planning assistance</li>
            <li>Signature hand edits on every photo</li>
            <li>One 8×10 and twenty 4×6 archival prints</li>
            <li>Full print release and high-res downloads</li>
            <li>Private online gallery for at least 6 months</li>
          </ul>
          <p class="price-card__note"><strong>Most popular:</strong> our comprehensive collection with 8 hours of coverage.</p>
          <a class="btn btn--ghost btn--block" href="contact.html">Enquire about photo {icon_btn()}</a>
        </div>
      </article>
      <article class="price-card price-card--feature reveal" data-delay="1">
        {media("dan-bts", "Dan filming with a cinema camera rig", "", "(min-width:1000px) 36vw, 100vw", reveal=False)}
        <div class="price-card__body">
          <div class="price-card__head"><span class="label">Video package I</span><span class="pill">6 hours</span></div>
          <div class="price"><small>From</small><strong>$3,500</strong></div>
          <ul class="checklist" role="list">
            <li>6 hours of wedding coverage</li>
            <li>2 filmmakers with premium cinema gear</li>
            <li>Storytelling consultation while you plan</li>
            <li>Professional lighting kit</li>
            <li>Pro audio for ceremony and selected events</li>
            <li>3–7 minute cinematic highlight film</li>
            <li>30–60 second teaser within 14 days</li>
          </ul>
          <ul class="checklist checklist--addon" role="list" aria-label="Available add-ons">
            <li>Drone video</li><li>Full ceremony film</li><li>Dances &amp; speeches footage</li>
          </ul>
          <p class="price-card__note"><strong>Most popular:</strong> 8 hours of coverage, including the full ceremony edit.</p>
          <a class="btn btn--gold btn--block" href="contact.html">Enquire about film {icon_btn()}</a>
        </div>
      </article>
      <a class="price-card price-card--combo reveal" data-delay="2" href="contact.html">
        <span class="label">Photo + film</span>
        <div class="stack" style="--stack:18px">
          <p class="h-lg">All in <em>one.</em></p>
          <p>One team, one vision, one seamless day. Ask about special pricing on combined photo and film collections.</p>
        </div>
        <span class="btn" style="--bg:var(--night);--fg:var(--ivory);--bd:var(--night)">Ask about combos {icon_btn()}</span>
      </a>
    </div>
  </div>
</section>

{process_section("03")}

<section class="section section--flush-top">
  <div class="container">
    {head("04", "The experience", "Stress-free,<br><em>start to finish.</em>", "", "On the day · After the day", split=False)}
    <div class="bento">
      <div class="tile tile--media c-6 span-6 reveal" style="min-height:420px">{media("roseleina-cameron-3", "Roseleina sitting on Cameron's lap at the bar, both laughing", "", "(min-width:1100px) 50vw, 100vw", reveal=False)}</div>
      <div class="tile c-6 span-6 reveal" data-delay="1">
        <span class="label">On the day</span>
        <p class="body">From the quiet anticipation of getting ready to the emotional vows, the lively reception and the in-between moments, we document your day with artistic vision and journalistic storytelling. Discreet but intentional, we guide portraits when needed and otherwise let the day unfold naturally.</p>
        <span class="label">After the day</span>
        <p class="body">We curate and hand-edit everything. Photos arrive in a beautiful online gallery to view, download and share. Your film arrives as a cinematic story of the day, plus extra edits such as the full ceremony.</p>
      </div>
    </div>
  </div>
</section>

<section class="section section--flush-top">
  <div class="container faq-layout">
    <div class="faq-layout__aside stack" style="--stack:22px">
      <div class="head__top reveal"><span class="label">(05) — FAQ</span><span class="label">Good to know</span></div>
      <h2 class="h-xl" data-lines>Questions,<br><em>answered.</em></h2>
      <p class="lede reveal">Still wondering about something? Message us any time on Instagram or send an inquiry.</p>
      <a class="btn btn--gold reveal" href="contact.html">Ask us anything {icon_btn()}</a>
    </div>
    <div class="faq">{faqs}</div>
  </div>
</section>
"""
    page("investment.html", "Investment &amp; Packages — Dan Reynolds Photography",
         "Wedding photography and film packages from $3,500: two photographers, a free engagement session and cinematic highlight films. See pricing and FAQs.",
         body, og_image="garden-estate-portrait",
         extra_head=f'<script type="application/ld+json">{json.dumps(faq_schema)}</script>')


# --------------------------------------------------------------------------- #
# CONTACT
# --------------------------------------------------------------------------- #
def build_contact():
    body = f"""
{page_hero("Get in touch", "We reply personally", "Let's talk about<br>your <em>day.</em>",
           "Interested in working together? Share the details below and we'll be in touch soon. The more you tell us, the better!")}

<section class="container" style="padding-bottom:var(--section)">
  <div class="contact-grid">
    <aside class="contact-aside reveal">
      {media("julia-kirk", "A couple kissing among autumn hydrangeas", "", "(min-width:1024px) 40vw, 100vw", reveal=False)}
      <div class="contact-aside__body">
        <span class="label label--dot" style="color:rgba(239,231,218,.8)">Based in Peoria, Illinois</span>
        <p class="h-md">No travel fee for Chicago, Central Illinois, Milwaukee &amp; Madison.</p>
        <div class="contact-links">
          <a class="contact-link" href="{IG_PHOTO}" target="_blank" rel="noopener"><span><small>Instagram · Photo</small>@danreynoldsphotography</span>{IG}</a>
          <a class="contact-link" href="{IG_FILMS}" target="_blank" rel="noopener"><span><small>Instagram · Films</small>@danreynoldsfilms</span>{IG}</a>
          <a class="contact-link" href="{FACEBOOK}" target="_blank" rel="noopener"><span><small>Facebook</small>Dan Reynolds Photography</span>{ARROW_UR}</a>
        </div>
      </div>
    </aside>

    <div class="form-panel reveal" data-delay="1">
      <form class="form" data-inquiry action="https://formspree.io/f/YOUR_FORM_ID" method="POST" novalidate>
        <input type="hidden" name="_subject" value="New wedding inquiry — danreynoldsphotography.com">
        <label class="hp" aria-hidden="true">Leave blank <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>
        <div class="form-row form-row--2">
          <div class="field"><label for="f-name">Your name</label><input class="input" id="f-name" name="name" type="text" autocomplete="name" required placeholder="First &amp; last"><span class="field__error">Please tell us your name.</span></div>
          <div class="field"><label for="f-partner">Partner's name <span class="opt">(optional)</span></label><input class="input" id="f-partner" name="partner" type="text" placeholder="First &amp; last"></div>
        </div>
        <div class="form-row form-row--2">
          <div class="field"><label for="f-email">Email</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com"><span class="field__error">Please enter a valid email address.</span></div>
          <div class="field"><label for="f-phone">Phone <span class="opt">(optional)</span></label><input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(000) 000-0000"></div>
        </div>
        <div class="form-row form-row--2">
          <div class="field"><label for="f-date">Wedding date</label><input class="input" id="f-date" name="date" type="date"></div>
          <div class="field"><label for="f-venue">Venue / location</label><input class="input" id="f-venue" name="venue" type="text" placeholder="Venue, city"></div>
        </div>
        <fieldset class="field">
          <legend>I'm interested in</legend>
          <div class="choice-group mt-s">
            <label class="choice"><input type="radio" name="service" value="Photography"><span>Photography</span></label>
            <label class="choice"><input type="radio" name="service" value="Film"><span>Film</span></label>
            <label class="choice"><input type="radio" name="service" value="Photo + Film" checked><span>Photo + Film</span></label>
            <label class="choice"><input type="radio" name="service" value="Engagement / Other"><span>Something else</span></label>
          </div>
        </fieldset>
        <div class="form-row form-row--2">
          <div class="field"><label for="f-guests">Estimated guests</label><select class="input" id="f-guests" name="guests"><option value="">Select…</option><option>Under 50</option><option>50–100</option><option>100–150</option><option>150–250</option><option>250+</option></select></div>
          <div class="field"><label for="f-source">How did you find us?</label><select class="input" id="f-source" name="source"><option value="">Select…</option><option>Instagram</option><option>Google</option><option>Venue / planner</option><option>Friend or family</option><option>YouTube</option><option>Other</option></select></div>
        </div>
        <div class="field"><label for="f-msg">Tell us about your day</label><textarea class="input" id="f-msg" name="message" required placeholder="Your story, your vision, the moments that matter most…"></textarea><span class="field__error">A few words about your day helps us a lot.</span></div>
        <div class="form__foot">
          <button class="btn btn--gold" type="submit">Send inquiry {icon_btn()}</button>
          <p class="form__fine">We reply to every inquiry personally. Your details are never shared.</p>
        </div>
      </form>
      <div class="form-success" role="status" aria-live="polite">
        <span class="label label--dot">Inquiry received</span>
        <p class="h-lg">Thank you, <em>friend.</em></p>
        <p class="body">We've got your note and can't wait to hear more about your day. Dan or Lydia will be in touch soon to set up a call. Meanwhile, come say hi on <a class="link" href="{IG_PHOTO}" target="_blank" rel="noopener">Instagram</a>.</p>
      </div>
    </div>
  </div>
</section>
"""
    page("contact.html", "Contact &amp; Inquire — Dan Reynolds Photography",
         "Check availability for wedding photography and film with Dan & Lydia Reynolds. Send an inquiry and we'll be in touch soon.",
         body, og_image="julia-kirk", sticky=False)


def build_404():
    body = f"""
<section class="notfound">
  <div class="container">
    <span class="label label--dot">Error 404</span>
    <h1 class="h-display mt-m" data-lines>This moment<br><em>got away.</em></h1>
    <p class="lede mt-m" style="margin-inline:auto">Looks like you've gotten turned around. Let's get you back to the good stuff.</p>
    <div class="row mt-l" style="justify-content:center"><a class="btn btn--gold" href="index.html">Go back home {icon_btn()}</a><a class="btn btn--ghost" href="portfolio.html">See the portfolio</a></div>
  </div>
</section>"""
    page("404.html", "Page not found — Dan Reynolds Photography", "This page could not be found.", body, active="", sticky=False,
         extra_head='<meta name="robots" content="noindex, follow">')


def build_meta_files():
    pages = ["", "about", "portfolio", "films", "investment", "contact"]
    urls = "".join(f"  <url><loc>{SITE_URL}/{p}</loc></url>\n" for p in pages)
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    css = ROOT / "assets/css/editor-global.css"
    if not css.exists():
        css.write_text("/* Styles saved from the visual editor for the shared header and footer. */\n/* editor:header */\n/* /editor:header */\n/* editor:footer */\n/* /editor:footer */\n")
    # Image library for the editor's asset manager.
    imgs = sorted(n for n in META)
    (ROOT / "admin" / "assets.json").write_text(json.dumps(
        [{"src": f"assets/img/{n}-1600.webp", "name": n} for n in imgs], indent=0) + "\n")
    (ROOT / "site.webmanifest").write_text(json.dumps({
        "name": "Dan Reynolds Photography", "short_name": "Dan Reynolds",
        "icons": [{"src": "assets/brand/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"},
                  {"src": "assets/brand/icon-512.png", "sizes": "512x512", "type": "image/png"}],
        "theme_color": "#080706", "background_color": "#0d0b09", "display": "standalone", "start_url": "./",
    }, indent=2) + "\n")


if __name__ == "__main__":
    build_home()
    build_about()
    build_portfolio()
    build_films()
    build_investment()
    build_contact()
    build_404()
    build_meta_files()
    print("Built site into", ROOT)
