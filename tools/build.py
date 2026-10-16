#!/usr/bin/env python3
"""
Static site generator for danreynoldsphotography.com.

Every page shares one header, footer and image helper, so editing copy here and
re-running `python3 tools/build.py` keeps all pages consistent. Output is plain
HTML written to the repository root — no runtime dependencies.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
META = json.loads((Path(__file__).parent / "image-meta.json").read_text())

SITE_URL = "https://www.danreynoldsphotography.com"
IG_PHOTO = "https://www.instagram.com/danreynoldsphotography"
IG_FILMS = "https://www.instagram.com/danreynoldsfilms"
FACEBOOK = "https://www.facebook.com/danreynoldsphotographypeoria"
YOUTUBE = "https://www.youtube.com/@danreynoldsphotography2735"
TWITTER = "https://twitter.com/reynoldspix"

# --------------------------------------------------------------------------- #
# Icons
# --------------------------------------------------------------------------- #
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>'
ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>'
CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'
PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5v17l15-8.5z"/></svg>'
IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/></svg>'
QUOTE = '<svg viewBox="0 0 40 28" fill="currentColor" aria-hidden="true"><path d="M0 28V17.2C0 7.6 4.6 1.9 13.8 0l1.6 3.3C10.3 5 7.8 8.3 7.5 13.2H15V28H0zm22.6 0V17.2C22.6 7.6 27.2 1.9 36.4 0L38 3.3c-5.1 1.7-7.6 5-7.9 9.9h7.5V28h-15z"/></svg>'
MONO = ('<svg class="brand__mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'
        '<path d="M7 5v30h15"/><path d="M7 5h14.5a9.5 9.5 0 0 1 0 19H13"/><path d="M19 24l13 12"/></svg>')
BADGE = ('<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="bp" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs>'
         '<text font-family="Jost, sans-serif" font-size="9.4" letter-spacing="3.3" fill="currentColor"><textPath href="#bp">VISUAL STORYTELLER · PHOTO + FILM · </textPath></text>'
         '<path d="M60 49v22M49 60h22" stroke="currentColor" stroke-width="1"/></svg>')

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def img(name, alt, sizes="100vw", lazy=True, cls="", pos=None, priority=False):
    m = META[name]
    w = 1600 if m["w"] >= 1600 else m["w"]
    h = round(m["h"] * w / m["w"])
    # Crop around detected faces (tools/image-meta.json fx/fy) so people are never cut off.
    if "fx" in m:
        pos = f'{m["fx"]}% {m["fy"]}%'
    style = f' style="object-position:{pos}"' if pos else ""
    load = 'loading="lazy" decoding="async"' if lazy else 'decoding="async"'
    if priority:
        load += ' fetchpriority="high"'
    c = f' class="{cls}"' if cls else ""
    srcset = f'assets/img/{name}-800.webp 800w, assets/img/{name}-1600.webp {w}w' if m["w"] > 800 else f'assets/img/{name}-1600.webp {w}w'
    return (f'<img src="assets/img/{name}-1600.webp" srcset="{srcset}" '
            f'sizes="{sizes}" width="{w}" height="{h}" alt="{alt}" {load}{c}{style}>')


def media(name, alt, ratio="", sizes="100vw", extra="", pos=None, lazy=True, reveal=True):
    bg = META[name]["c"]
    cls = " ".join(x for x in ["media", ratio, extra, "reveal-img" if reveal else ""] if x)
    return f'<div class="{cls}" style="background:{bg}">{img(name, alt, sizes, lazy=lazy, pos=pos)}</div>'


NAV = [
    ("index.html", "Home"),
    ("about.html", "About"),
    ("portfolio.html", "Portfolio"),
    ("films.html", "Films"),
    ("investment.html", "Investment"),
    ("contact.html", "Contact"),
]


def header(active, overlay):
    links = "".join(
        f'<li><a class="nav__link" href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}</a></li>'
        for h, t in NAV if h != "index.html"
    )
    mobile = "".join(
        f'<li><a href="{h}"{" aria-current=\"page\"" if h == active else ""}><small>0{i + 1}</small>{t}</a></li>'
        for i, (h, t) in enumerate(NAV)
    )
    return f"""
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header{' site-header--overlay' if overlay else ''}">
  <div class="container site-header__inner">
    <a class="brand" href="index.html" aria-label="Dan Reynolds — Visual Storyteller, home">
      {MONO}
      <span class="brand__text"><span class="brand__name">Dan Reynolds</span><span class="brand__tag">Visual Storyteller</span></span>
    </a>
    <nav class="nav" aria-label="Primary"><ul class="nav__list">{links}</ul></nav>
    <a class="btn header-cta" href="contact.html">Check your date</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
      <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
    </button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <nav aria-label="Mobile"><ul class="mobile-menu__list">{mobile}</ul></nav>
  <div class="mobile-menu__foot">
    <a class="btn btn--light btn--block" href="contact.html">Check your date {ARROW}</a>
    <div class="mobile-menu__social">
      <a href="{IG_PHOTO}" target="_blank" rel="noopener">Instagram — Photo</a>
      <a href="{IG_FILMS}" target="_blank" rel="noopener">Instagram — Films</a>
      <a href="{YOUTUBE}" target="_blank" rel="noopener">YouTube</a>
      <a href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a>
    </div>
  </div>
</div>"""


def footer():
    return f"""
<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="stack" style="--stack:28px">
        <p class="footer-title">Your story, told <em>exactly</em> as it happened.</p>
        <a class="btn btn--light" href="contact.html">Start your inquiry {ARROW}</a>
      </div>
      <div class="footer-col">
        <h3>Explore</h3>
        <ul>{''.join(f'<li><a href="{h}">{t}</a></li>' for h, t in NAV)}</ul>
      </div>
      <div class="footer-col">
        <h3>Follow</h3>
        <ul>
          <li><a href="{IG_PHOTO}" target="_blank" rel="noopener">@danreynoldsphotography</a></li>
          <li><a href="{IG_FILMS}" target="_blank" rel="noopener">@danreynoldsfilms</a></li>
          <li><a href="{YOUTUBE}" target="_blank" rel="noopener">YouTube</a></li>
          <li><a href="{FACEBOOK}" target="_blank" rel="noopener">Facebook</a></li>
          <li><a href="{TWITTER}" target="_blank" rel="noopener">X / Twitter</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Serving</h3>
        <ul>
          <li>Chicago</li><li>Central Illinois &amp; Peoria</li><li>Milwaukee</li><li>Madison, WI</li><li>&amp; destinations worldwide</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> Dan Reynolds Photography. All rights reserved.</span>
      <span>Wedding photography &amp; cinematic film — Illinois &amp; Wisconsin</span>
    </div>
    <span class="footer-wordmark" aria-hidden="true">Dan Reynolds</span>
  </div>
</footer>"""


CHROME = f"""
<div class="preloader" aria-hidden="true">
  <div class="preloader__inner">
    <svg class="preloader__mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1"><path pathLength="1" d="M7 5v30h15"/><path pathLength="1" d="M7 5h14.5a9.5 9.5 0 0 1 0 19H13"/><path pathLength="1" d="M19 24l13 12"/></svg>
    <p class="preloader__name"><span>Dan Reynolds</span></p>
    <p class="preloader__tag"><span>Visual Storyteller</span></p>
  </div>
  <div class="preloader__foot"><span>Photo + Film</span><span class="preloader__count" data-count-loader>000</span></div>
  <div class="preloader__bar"><span></span></div>
</div>
<div class="curtain" aria-hidden="true"><svg class="curtain__mark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M7 5v30h15"/><path d="M7 5h14.5a9.5 9.5 0 0 1 0 19H13"/><path d="M19 24l13 12"/></svg></div>
<div class="scroll-progress" aria-hidden="true"><span></span></div>
<div class="cursor" aria-hidden="true"><span class="cursor__ring"><span class="cursor__label"></span></span><span class="cursor__dot"></span></div>
<div class="hover-preview" aria-hidden="true"><div class="hover-preview__inner"></div></div>"""

STICKY = f"""
<div class="sticky-cta" aria-label="Quick actions">
  <a class="btn btn--ghost" href="portfolio.html">See work</a>
  <a class="btn btn--light" href="contact.html">Check your date</a>
</div>"""


def page(filename, title, description, body, active=None, overlay=False, og_image="golden-hour-portrait", extra_head="", sticky=True):
    active = active or filename
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
<link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap">
<link rel="stylesheet" href="assets/css/styles.css">
<script>try{{var d=document.documentElement;if(sessionStorage.getItem("dr-nav")){{d.classList.add("is-entering");sessionStorage.removeItem("dr-nav")}}else if(!sessionStorage.getItem("dr-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{d.classList.add("is-loading")}}setTimeout(function(){{d.classList.remove("is-loading","is-entering")}},5000)}}catch(e){{}}</script>
{extra_head}
</head>
<body>
{CHROME}
{header(active, overlay)}
<main id="main">
{body}
</main>
{footer()}
{STICKY if sticky else ""}
<script src="assets/vendor/gsap.min.js" defer></script>
<script src="assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="assets/js/main.js" defer></script>
<script src="assets/js/motion.js" defer></script>
</body>
</html>
"""
    (ROOT / filename).write_text(html)


def cta_band(eyebrow, title, image, primary=("Check your date", "contact.html"), secondary=None):
    sec = f'<a class="btn btn--outline-light" href="{secondary[1]}">{secondary[0]}</a>' if secondary else ""
    return f"""
<section class="cta-band">
  <div class="bg" data-parallax>{img(image, "", "100vw")}</div>
  <div class="container">
    <p class="eyebrow eyebrow--plain reveal">{eyebrow}</p>
    <h2 data-lines>{title}</h2>
    <div class="btn-row reveal" data-delay="2"><a class="btn btn--light" href="{primary[1]}">{primary[0]} {ARROW}</a>{sec}</div>
  </div>
</section>"""


def yt(vid, label, hd=True, sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"):
    thumb = "maxresdefault" if hd else "hqdefault"
    return (f'<button class="yt" type="button" data-cursor="Play" data-id="{vid}" aria-label="Play film: {label}">'
            f'<img src="https://i.ytimg.com/vi/{vid}/{thumb}.jpg" alt="" loading="lazy" decoding="async" width="1280" height="720">'
            f'<span class="yt__play">{PLAY}</span></button>')


# --------------------------------------------------------------------------- #
# Content
# --------------------------------------------------------------------------- #
TESTIMONIALS = [
    ("Words cannot describe how amazing it was to work with Dan and Lydia for our wedding photography!", "Rose", "roseleina-cameron-2",
     "A groom dipping his bride for a kiss outside a brick venue"),
    ("We worked with Dan and his wife Lydia for our engagement and wedding photos and video, and we cannot recommend them enough! "
     "They were energetic, friendly and made us feel so comfortable. All our guests even commented on how great they were!",
     "Eileen + Matt", "julia-kirk", "A couple embracing among autumn flowers"),
    ("I just wanted to express how grateful we are for what an incredible experience it was. Thank you for your professionalism, "
     "but also for being so personable.", "Manny + Karina", "manny-karina", "Manny and Karina walking across an open field at sunset"),
]

STORIES = [
    ("Ethan", "Gwyn", "ethan-gwyn-barn", "https://danreynolds.passgallery.com/-gwynandethanmills/gallery", "Ethan and Gwyn in front of a red barn venue"),
    ("Amanda", "Rick", "amanda-rick", "https://danreynolds.passgallery.com/-amandaandrickfrance/gallery", "Amanda and Rick kissing in a golden autumn meadow"),
    ("Kelly", "Adam", "kelly-adam", "https://danreynolds.passgallery.com/-kellyandadamporter/gallery", "Kelly and Adam walking through a sunlit garden"),
    ("Steve", "Taylor", "steve-taylor", "https://danreynolds.passgallery.com/-steveandtaylortorresweddinggallery/gallery", "Steve and Taylor with their wedding party"),
]

WEDDING_FILMS = [
    ("k7mlTdWmj0o", "Wedding Show Reel", "Photo + film reel", True),
    ("uMWyF0awV_Y", "Clara + Vince", "Chicago, Illinois", True),
    ("iQ8-pWzK3gg", "Rebekah + Tyler", "Fairlie — Chicago", True),
    ("I9k8FBiaOtc", "Julia + Kirk", "Westmoreland Country Club", True),
    ("2XM_cg0nLqE", "Lauren + Ben", "Madison, Wisconsin", False),
    ("yAqZ-5NoTB4", "Lauren + Joel", "Chicago, Illinois", True),
    ("7_heEQhFX18", "Eileen + Matthew", "Wedding film", False),
    ("5Lx9Q7I5jT8", "Yura + Joe", "Highlight reel", True),
    ("pIeFJgLjOj4", "Eleanor + Ryan", "Full highlight film", True),
    ("fAk-YClUN1Q", "Jade + Lars", "Highlight film", True),
    ("nWng4rPcNxw", "Chloe + Grant", "Highlight reel", True),
    ("iq3GEm4Duq8", "Jevon + Keyariah", "Highlight film", True),
    ("QsGi2K15s3o", "Toni + Andy", "Wedding film", True),
    ("xVkxb2pO-w0", "Liz + Ryan", "Highlight reel", True),
    ("DNkte8PT0Ns", "Ashley + Alex", "Highlight reel", False),
    ("v3B8ATsWutQ", "Liz + Michael", "Highlight reel", False),
]
COMMERCIAL_FILMS = [
    ("v4EgbQTo9XU", "St. Jude Run &amp; Telethon", "Peoria, Illinois — 2023", True),
    ("M250nWZPbeg", "Gather Illinois", "Venue promo — 4K", False),
    ("O0xD8kRDsFM", "Signature Smile Arts", "Brand film — Homewood, IL", False),
    ("i3sRv-bI0Hk", "NYU — Liu Fellowship in Implantology", "Event documentary", False),
]

PORTFOLIO = [
    # (image, story key, caption, alt)
    ("colin-amanda-2", "colin-amanda", "Colin + Amanda", "Colin and Amanda walking out of a stone archway"),
    ("lexi-lucas-6", "lexi-lucas", "Lexi + Lucas", "Lexi walking with her father toward the ceremony"),
    ("ethan-gwyn-3", "ethan-gwyn", "Ethan + Gwyn", "Ethan and Gwyn standing in autumn light"),
    ("golden-hour-portrait", "more", "Golden hour", "A bride and groom holding hands at golden hour"),
    ("roseleina-cameron-1", "roseleina-cameron", "Roseleina + Cameron", "A groom adjusting his cufflinks"),
    ("lexi-lucas-3", "lexi-lucas", "Lexi + Lucas", "Lexi with her bridesmaids in deep red dresses"),
    ("colin-amanda-1", "colin-amanda", "Colin + Amanda", "Colin and Amanda touching foreheads, eyes closed"),
    ("chicago-skyline-couple", "more", "Chicago", "A couple on the lakefront with the Chicago skyline behind"),
    ("ethan-gwyn-1", "ethan-gwyn", "Ethan + Gwyn", "Ethan and Gwyn with their wedding party in autumn woods"),
    ("lexi-lucas-2", "lexi-lucas", "Lexi + Lucas", "Lexi in her gown by the window"),
    ("roseleina-cameron-3", "roseleina-cameron", "Roseleina + Cameron", "Roseleina sitting on Cameron's lap at the bar"),
    ("colin-amanda-3", "colin-amanda", "Colin + Amanda", "Colin and Amanda sitting on stone steps"),
    ("ceremony-dip", "more", "The ceremony", "A groom dipping his bride for a kiss during the recessional"),
    ("lexi-lucas-8", "lexi-lucas", "Lexi + Lucas", "Lexi and Lucas sharing a quiet moment under the trees"),
    ("ben-tamar", "more", "Ben + Tamar", "Black and white portrait of Ben and Tamar"),
    ("ethan-gwyn-2", "ethan-gwyn", "Ethan + Gwyn", "Ethan and Gwyn smiling, autumn bokeh behind"),
    ("quinn-charlotte-2", "more", "Quinn + Charlotte", "A bride standing on a dock at sunset"),
    ("lexi-lucas-5", "lexi-lucas", "Lexi + Lucas", "Bridesmaids holding red bouquets"),
    ("colin-amanda-6", "colin-amanda", "Colin + Amanda", "Colin and Amanda laughing on brownstone steps"),
    ("roseleina-cameron-4", "roseleina-cameron", "Roseleina + Cameron", "Roseleina and Cameron in a dark room beside a window"),
    ("bouquet-detail", "more", "Details", "Dried flower bouquet catching the evening light"),
    ("lexi-lucas-1", "lexi-lucas", "Lexi + Lucas", "Flat lay of wedding shoes, invitation and jewellery"),
    ("ethan-gwyn-4", "ethan-gwyn", "Ethan + Gwyn", "Ethan and Gwyn walking through autumn trees at sunset"),
    ("colin-amanda-5", "colin-amanda", "Colin + Amanda", "Colin and Amanda dancing on the sidewalk"),
    ("quinn-charlotte-1", "more", "Quinn + Charlotte", "A couple dancing in a white room"),
    ("lexi-lucas-9", "lexi-lucas", "Lexi + Lucas", "The wedding party cheering and raising bouquets"),
    ("garden-estate-portrait", "more", "Garden estate", "A couple on a manicured lawn at sunset"),
    ("roseleina-cameron-2", "roseleina-cameron", "Roseleina + Cameron", "Cameron dipping Roseleina outside Sanctuary"),
    ("lexi-lucas-7", "lexi-lucas", "Lexi + Lucas", "Lucas dipping Lexi down the aisle"),
    ("colin-amanda-4", "colin-amanda", "Colin + Amanda", "Colin and Amanda in front of a gothic campus building"),
    ("yura-joe-2", "more", "Yura + Joe", "Joe holding Yura's face in warm backlight"),
    ("lexi-lucas-4", "lexi-lucas", "Lexi + Lucas", "Close-up of a floral corsage"),
    ("brian-tori", "more", "Brian + Tori", "Brian and Tori on the steps of an old brick building"),
    ("ellie-jack-1" if "ellie-jack-1" in META else "ellie-jack", "more", "Ellie + Jack", "Ellie and Jack walking across a garden bridge"),
    ("lexi-lucas-10", "lexi-lucas", "Lexi + Lucas", "Black and white of two hands joining"),
    ("kelly-adam-2", "more", "Kelly + Adam", "Kelly and Adam laughing as guests throw petals"),
    ("brooke-chase", "more", "Brooke + Chase", "A bride holding a white bouquet against lace"),
    ("yura-joe-1", "more", "Yura + Joe", "Bridesmaids celebrating with champagne"),
]
FILTERS = [
    ("all", "All work"),
    ("colin-amanda", "Colin + Amanda"),
    ("lexi-lucas", "Lexi + Lucas"),
    ("ethan-gwyn", "Ethan + Gwyn"),
    ("roseleina-cameron", "Roseleina + Cameron"),
    ("more", "More love stories"),
]

FAQS = [
    ("Do you travel?",
     "<p>Yes! There is no travel charge for weddings in Chicago, Central Illinois, Milwaukee or Madison, Wisconsin. "
     "For other areas we charge a small fee to cover our expenses — and we love an adventure.</p>"),
    ("What gear do you use?",
     "<p>Because of the hybrid photo + video nature of our work, we've chosen the Sony system for its accurate colour science and "
     "cinema-quality video. We also use a DJI Ronin 4D and a DJI Mavic 3 drone.</p>"),
    ("How far in advance should we book you?",
     "<p>Dates are extremely limited, so we recommend reaching out as soon as possible. We already have weddings booked more than "
     "18 months out.</p>"),
    ("Do you have insurance?", "<p>Yes — full coverage on all of our gear, as well as professional liability insurance.</p>"),
    ("How many photos will we get?",
     "<p><strong>Short answer:</strong> it depends.</p><p><strong>Slightly longer answer:</strong> the more variety in your wedding day, "
     "the more photos you'll have. If all of your events are in one space you might have fewer images than at a venue with lots of "
     "different backdrops and scenery.</p><p>On average we deliver <strong>100 images per hour</strong>. If you do a first look, you can "
     "expect about <strong>40% more</strong> images than a wedding without one.</p>"),
    ("How long until we get our images and films back?",
     "<p>Generally your images are delivered within 8–12 weeks. During busy season (September – November) turnaround may be a little "
     "longer.</p><p>We never outsource our editing — every single image is hand-edited by Dan.</p>"),
    ("Do you offer engagement photos?", "<p>Absolutely. All wedding packages include a complimentary engagement session.</p>"),
]

# --------------------------------------------------------------------------- #
# HOME
# --------------------------------------------------------------------------- #
def build_home():

    slides = "".join(f"""
        <figure class="t-slide" aria-roledescription="slide" aria-label="{n + 1} of {len(TESTIMONIALS)}">
          {media(im, alt, "", "(min-width:900px) 40vw, 100vw", reveal=False)}
          <blockquote>
            <p class="t-quote">“{q}”</p>
            <figcaption class="t-cite">{who}</figcaption>
          </blockquote>
        </figure>""" for n, (q, who, im, alt) in enumerate(TESTIMONIALS))
    dots = "".join(f'<button class="t-dot" type="button" aria-label="Show testimonial {n + 1}" aria-current="{"true" if n == 0 else "false"}"></button>' for n in range(len(TESTIMONIALS)))

    social_imgs = ["colin-amanda-6", "lexi-lucas-9", "quinn-charlotte-2", "roseleina-cameron-3", "ethan-gwyn-3", "lexi-lucas-10"]
    social = "".join(f'<a href="{IG_PHOTO if n % 2 == 0 else IG_FILMS}" target="_blank" rel="noopener" aria-label="View on Instagram">{media(s, "", "", "(min-width:900px) 16vw, 33vw", reveal=False)}</a>' for n, s in enumerate(social_imgs))

    body = f"""
<section class="hero" aria-label="Introduction">
  <div class="hero__media hero__slides" data-hero-slides>
    <div class="hero__slide is-active">{img("golden-hour-portrait", "A bride and groom holding hands on a stone path, lit by the setting sun", "100vw", lazy=False, priority=True, pos="50% 65%")}</div>
    <div class="hero__slide">{img("chicago-skyline-couple", "A couple on the Chicago lakefront with the skyline behind", "100vw", pos="50% 50%")}</div>
    <div class="hero__slide">{img("ethan-gwyn-4", "A couple walking through autumn trees at sunset", "100vw", pos="50% 60%")}</div>
    <div class="hero__slide">{img("garden-estate-portrait", "A couple embracing on an estate lawn at golden hour", "100vw", pos="50% 55%")}</div>
  </div>
  <div class="hero__index" aria-hidden="true"><span data-hero-current>01</span><span class="hero__index-bar"><span></span></span><span>04</span></div>
  <div class="container hero__content">
    <p class="eyebrow hero__eyebrow reveal">Wedding photography &amp; film</p>
    <h1 class="hero__title" data-lines aria-label="Moments you'll want to see, hear and feel all over again.">Moments you'll<br>want to <span class="rotator" data-nosplit><span class="rotator__word">see</span><span class="rotator__word">hear</span><span class="rotator__word">feel</span></span><br>all over again.</h1>
    <div class="hero__foot">
      <p class="hero__sub reveal" data-delay="3">Documentary-style wedding photos and cinematic films by Dan &amp; Lydia Reynolds, for couples across Chicago, Central Illinois and Wisconsin.</p>
      <div class="btn-row reveal" data-delay="4">
        <a class="btn btn--light" href="contact.html">Check your date {ARROW}</a>
        <a class="btn btn--outline-light" href="films.html">Watch the films</a>
      </div>
    </div>
  </div>
  <span class="hero__meta" aria-hidden="true">Chicago · Peoria · Milwaukee · Madison</span>
</section>

<section class="section section--ivory quote-band">
  <div class="container">
    <div class="quote-mark reveal">{QUOTE}</div>
    <blockquote>
      <p data-scrub-words>We take photos as a <em>return ticket</em> to a moment otherwise gone.</p>
      <cite>— Katie Thurmes</cite>
    </blockquote>
  </div>
</section>

<section class="section section--paper2">
  <div class="container split split--wide-media">
    <div class="collage">
      {media("dan-bts", "Dan laughing behind a camera with two lenses mounted", "ratio-portrait", "(min-width:900px) 45vw, 90vw", pos="40% 50%")}
      <div class="collage__small reveal" data-delay="2">{media("lydia", "Lydia smiling in front of a white wall", "ratio-portrait", "(min-width:900px) 20vw, 40vw", reveal=False, pos="60% 50%")}</div>
      <div class="collage__badge" aria-hidden="true">{BADGE}</div>
    </div>
    <div class="stack" style="--stack:28px">
      <p class="eyebrow reveal">Hello, friend</p>
      <h2 data-lines>That's me, <em>Dan.</em></h2>
      <p class="lede reveal">I take photos, I film — and sometimes I do both at the same time.</p>
      <div class="prose reveal">
        <p>I have a passion for capturing images that are true to the moments as they happen. We take a documentary approach to photo and film: giving guidance when it's needed, but being careful to let your day flow naturally.</p>
        <p>I love coffee, and I love diving into the latest photo and video tools that let me deliver stunning images and films. My wife Lydia and I always work together on weddings and large events. We both love travel, delicious food made with fresh ingredients — and cats.</p>
      </div>
      <div class="btn-row reveal">
        <a class="link-arrow" href="about.html">Meet Dan &amp; Lydia {ARROW}</a>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head section-head--split">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">What we do</p>
        <h2 data-lines>Two crafts.<br><em>One story.</em></h2>
      </div>
      <p class="prose reveal" style="max-width:42ch">A husband-and-wife team with one shared vision, so your photos and your film feel like they belong together.</p>
    </div>
    <div class="disciplines">
      <a class="discipline reveal" href="portfolio.html" data-cursor="Explore">
        {media("ceremony-dip", "A groom dipping his bride for a kiss as guests cheer", "", "(min-width:760px) 50vw, 100vw", "media--zoom", reveal=False)}
        <div class="discipline__body">
          <span class="discipline__num">01 — Photography</span>
          <h3 class="discipline__title">Stills</h3>
          <p class="discipline__text">Candid, emotional, true-to-life frames: the nervous laughter, the teary vows and the unfiltered joy.</p>
          <span class="link-arrow">View portfolio {ARROW}</span>
        </div>
      </a>
      <a class="discipline reveal" data-delay="2" href="films.html" data-cursor="Watch">
        {media("dan-filming", "Dan operating a cinema camera on a tripod", "", "(min-width:760px) 50vw, 100vw", "media--zoom", reveal=False, pos="62% 50%")}
        <div class="discipline__body">
          <span class="discipline__num">02 — Film</span>
          <h3 class="discipline__title">Motion</h3>
          <p class="discipline__text">Cinematic wedding films with pro audio, so you hear every vow, laugh and toast exactly as it happened.</p>
          <span class="link-arrow">Watch films {ARROW}</span>
        </div>
      </a>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true">
  <div class="marquee__track">
    <span>Authentic</span><span>Cinematic</span><span>Timeless</span><span>Documentary</span><span>Heartfelt</span><span>Unposed</span>
    <span>Authentic</span><span>Cinematic</span><span>Timeless</span><span>Documentary</span><span>Heartfelt</span><span>Unposed</span>
  </div>
</div>

<section class="hscroll" data-hscroll aria-label="Recent love stories">
  <div class="hscroll__sticky">
    <div class="hscroll__track">
      <div class="hscroll__intro">
        <p class="eyebrow reveal">Recent love stories</p>
        <h2 data-lines>Real couples,<br><em>real moments.</em></h2>
        <p class="prose reveal">Scroll through a few recent weddings, then open the full galleries.</p>
        <a class="link-arrow reveal" href="portfolio.html">Full portfolio {ARROW}</a>
      </div>
      {"".join(f'''
      <a class="hcard" href="{url}" target="_blank" rel="noopener" data-cursor="View">
        <div class="hcard__media">{media(im, alt, "", "(min-width:1024px) 34vw, 78vw", "", reveal=False)}</div>
        <div class="hcard__meta"><span class="hcard__num">0{i + 1}</span><h3 class="hcard__name">{a} <em>&amp;</em> {b}</h3><span class="story__place">Gallery ↗</span></div>
      </a>''' for i, (a, b, im, url, alt) in enumerate(STORIES))}
      <a class="hscroll__end" href="portfolio.html" data-cursor="Open">
        <span class="hscroll__end-circle">{ARROW}</span>
        <span class="hscroll__end-text">See every<br><em>love story</em></span>
      </a>
    </div>
    <div class="hscroll__progress" aria-hidden="true"><span></span></div>
  </div>
</section>

<section class="section section--night">
  <div class="container film-feature">
    <div class="reveal">{yt("Gpq9IPxnIhE", "What if Wes Anderson filmed a wedding?")}</div>
    <div class="stack" style="--stack:24px">
      <p class="eyebrow reveal">Featured film</p>
      <h2 data-lines>What if <em>Wes Anderson</em><br>filmed a wedding?</h2>
      <p class="prose reveal">Symmetry, pastel palettes and a whole lot of heart. A playful experiment that shows what cinema-grade gear and true storytelling can do with a wedding day.</p>
      <div class="reveal"><a class="btn btn--outline-light" href="films.html">All films {ARROW}</a></div>
    </div>
  </div>
</section>

<section class="section section--ivory testimonials" data-slider aria-roledescription="carousel" aria-label="Kind words from couples">
  <div class="container">
    <p class="eyebrow reveal" style="margin-bottom:clamp(32px,4vw,56px)">Kind words</p>
    <div class="t-track" tabindex="0" data-cursor="Drag">{slides}</div>
    <div class="t-controls">
      <div class="t-dots">{dots}</div>
      <div class="t-arrows">
        <button class="icon-btn" type="button" data-prev aria-label="Previous testimonial">{ARROW_L}</button>
        <button class="icon-btn" type="button" data-next aria-label="Next testimonial">{ARROW}</button>
      </div>
    </div>
  </div>
</section>

<section class="section section--paper2 section--tight">
  <div class="container">
    <div class="stats">
      <div class="stat reveal"><div class="stat__num"><span data-count="2">2</span></div><p class="stat__label">Artists at every wedding: Dan &amp; Lydia</p></div>
      <div class="stat reveal" data-delay="1"><div class="stat__num"><span data-count="100">100</span><sup>/hr</sup></div><p class="stat__label">Images delivered per hour, on average</p></div>
      <div class="stat reveal" data-delay="2"><div class="stat__num"><span data-count="14">14</span><sup>days</sup></div><p class="stat__label">Until your film teaser arrives</p></div>
      <div class="stat reveal" data-delay="3"><div class="stat__num"><span data-count="18">18</span><sup>mo+</sup></div><p class="stat__label">Booked in advance: dates go fast</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head section-head--split">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">Follow along</p>
        <h2 data-lines>Behind the <em>lens</em>.</h2>
      </div>
      <div class="handles reveal">
        <a class="handle" href="{IG_PHOTO}" target="_blank" rel="noopener">{IG}@danreynoldsphotography</a>
        <a class="handle" href="{IG_FILMS}" target="_blank" rel="noopener">{IG}@danreynoldsfilms</a>
      </div>
    </div>
    <div class="social-grid">{social}</div>
  </div>
</section>

{cta_band("Limited dates each year", "Let us capture<br>your <em>special day.</em>", "chicago-skyline-couple", secondary=("See investment", "investment.html"))}
"""
    schema = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Dan Reynolds Photography",
        "description": "Documentary-style wedding photography and cinematic wedding films by Dan & Lydia Reynolds.",
        "url": SITE_URL,
        "image": f"{SITE_URL}/assets/img/golden-hour-portrait-1600.webp",
        "priceRange": "From $3,500",
        "founder": {"@type": "Person", "name": "Dan Reynolds"},
        "areaServed": ["Chicago, IL", "Peoria, IL", "Central Illinois", "Milwaukee, WI", "Madison, WI"],
        "sameAs": [IG_PHOTO, IG_FILMS, FACEBOOK, YOUTUBE, TWITTER],
    }
    page("index.html", "Dan Reynolds — Wedding Photography &amp; Film | Chicago, Peoria &amp; Wisconsin",
         "Documentary-style wedding photography and cinematic wedding films by husband-and-wife team Dan & Lydia Reynolds. Serving Chicago, Central Illinois, Milwaukee and Madison.",
         body, overlay=True,
         extra_head=f'<link rel="preload" as="image" href="assets/img/golden-hour-portrait-800.webp" imagesrcset="assets/img/golden-hour-portrait-800.webp 800w, assets/img/golden-hour-portrait-1600.webp 1600w" imagesizes="100vw">\n<script type="application/ld+json">{json.dumps(schema)}</script>')


# --------------------------------------------------------------------------- #
# ABOUT
# --------------------------------------------------------------------------- #
def build_about():
    venues = [
        ("Sarabande", "Chicago"), ("Ovation", "Chicago"), ("Joliet Union Station", "Joliet"),
        ("Haven on the Farm", "Illinois"), ("Sanctuary Events", "Illinois"), ("Le Fleur — 905 Room", "Illinois"),
    ]
    venue_list = "".join(f'<li class="reveal"><span>{v}</span><span>{c}</span></li>' for v, c in venues)
    body = f"""
<section class="page-hero">
  <div class="container page-hero__grid">
    <div>
      <p class="eyebrow reveal">About us</p>
      <h1 class="page-hero__title" data-lines>Get to know<br>the team with<br><em>the vision.</em></h1>
    </div>
    <p class="lede reveal" data-delay="2">Hey! We're Dan and Lydia, a husband-and-wife team capturing weddings with authenticity, artistry and heart.</p>
  </div>
</section>

<section class="container">
  {media("dan-patagonia", "Dan photographing a turquoise mountain lake beneath snowy peaks", "ratio-wide", "100vw", pos="50% 38%")}
</section>

<section class="section">
  <div class="container split">
    <div class="stack" style="--stack:24px">
      <p class="eyebrow reveal">Hey! We are Dan &amp; Lydia</p>
      <h2 data-lines>A true<br><em>team effort.</em></h2>
    </div>
    <div class="prose reveal">
      <p>I'm Dan Reynolds, the lead photographer and filmmaker behind Dan Reynolds Photography. My wife and I work together to capture weddings with authenticity, artistry and heart. The business carries my name, but it's truly a team effort: we complement each other's strengths so every detail is beautifully preserved.</p>
      <p>With years of experience in photography, filmmaking and storytelling, I focus on crafting cinematic wedding films and timeless images. Lydia brings her keen eye for detail, organisation and creative input to help the day flow seamlessly.</p>
      <p>Together we create a relaxed, enjoyable experience, so you can be fully present on your wedding day while we capture every emotion, moment and memory.</p>
    </div>
  </div>
</section>

<section class="section section--paper2">
  <div class="container">
    <div class="team">
      <article class="team-card reveal">
        {media("dan-coffee", "Dan sipping coffee outdoors", "", "(min-width:760px) 50vw, 100vw", reveal=False, pos="70% 50%")}
        <h3>Dan Reynolds</h3>
        <span class="team-card__role">Lead photographer &amp; filmmaker</span>
        <p>Rochester-raised, coffee-powered and a little obsessed with the newest cameras. Dan hand-edits every single image himself.</p>
      </article>
      <article class="team-card reveal" data-delay="2">
        {media("lydia", "Lydia smiling against a white wall", "", "(min-width:760px) 50vw, 100vw", reveal=False, pos="58% 50%")}
        <h3>Lydia Reynolds</h3>
        <span class="team-card__role">Photographer &amp; creative partner</span>
        <p>The calm in the room. Lydia keeps the timeline flowing, spots the details everyone else misses and makes every guest feel at ease.</p>
      </article>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow reveal">Our story</p>
      <h2 data-lines>My story began<br>with <em>Kodak.</em></h2>
    </div>
    <div class="chapters">
      <article class="chapter">
        <div class="chapter__media">{media("dan-seattle", "Dan grinning while holding an ice cream cone", "ratio-land", "(min-width:900px) 50vw, 100vw")}</div>
        <div class="reveal">
          <div class="chapter__head"><span class="numeral">i.</span><h3>Rochester, New York</h3></div>
          <div class="prose"><p>I grew up in Rochester, a city with a deep connection to photography, thanks in part to Kodak. My dad worked there. I didn't realise it at the time, but being surrounded by a culture of imagery and innovation planted a seed that would later shape my career.</p></div>
        </div>
      </article>
      <article class="chapter">
        <div class="chapter__media">{media("dan-lydia-mountains", "Dan and Lydia smiling in front of jagged mountain peaks and a lake", "ratio-land", "(min-width:900px) 50vw, 100vw")}</div>
        <div class="reveal">
          <div class="chapter__head"><span class="numeral">ii.</span><h3>A trip to Ireland</h3></div>
          <div class="prose"><p>The moment came when I bought a nice camera for a trip to Ireland. I just wanted better photos of the landscapes and history I'd always dreamed of seeing. Instead, I fell in love with photography: composition, light, and the way a single frame can hold so much emotion and story.</p><p>That trip changed everything. Soon after, I was diving deeper into photography and video, turning a hobby into something much more meaningful.</p></div>
        </div>
      </article>
      <article class="chapter">
        <div class="chapter__media">{media("dan-filming", "Dan setting up a cinema camera on a tripod", "ratio-land", "(min-width:900px) 50vw, 100vw", pos="62% 50%")}</div>
        <div class="reveal">
          <div class="chapter__head"><span class="numeral">iii.</span><h3>Today, together</h3></div>
          <div class="prose"><p>Over the years, Lydia and I have built a full photography and video production team, capturing everything from weddings to commercial projects. Weddings have become our passion: we love the energy, the emotion and the once-in-a-lifetime moments that unfold throughout the day.</p><p>We've grown into a team couples can trust to capture their day exactly as it happens, and to preserve those memories for a lifetime.</p></div>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="section section--ivory section--tight">
  <div class="container split">
    <div class="stack" style="--stack:20px">
      <p class="eyebrow reveal">Off the clock</p>
      <h2 data-lines>A few things<br><em>we love.</em></h2>
    </div>
    <ul class="loves reveal" role="list">
      <li>Strong coffee</li><li>Travel</li><li>Fresh, seasonal food</li><li>Our cats</li><li>New camera gear</li><li>Golden hour</li><li>Happy tears</li><li>A great first dance</li>
    </ul>
  </div>
</section>

<section class="section section--night">
  <div class="container split">
    <div class="stack" style="--stack:24px">
      <p class="eyebrow reveal">Some of our favourite venues</p>
      <h2 data-lines>Places we<br><em>love</em> to shoot.</h2>
      <p class="prose reveal">From Chicago ballrooms to Central Illinois farms, here are a few spaces we know inside out, so we already know where the best light falls.</p>
    </div>
    <ul class="venues" role="list">{venue_list}</ul>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="split">
      <div class="stack" style="--stack:24px">
        <div class="quote-mark reveal" style="margin:0;color:var(--accent)">{QUOTE}</div>
        <p class="t-quote reveal">“I just wanted to express how grateful we are for what an incredible experience it was. Thank you for your professionalism, but also for being so personable.”</p>
        <p class="t-cite reveal">Manny + Karina</p>
      </div>
      {media("brooke-chase", "A bride's lace sleeve and white rose bouquet", "ratio-land", "(min-width:900px) 50vw, 100vw")}
    </div>
  </div>
</section>

{cta_band("Are you ready?", "Let's book<br>your <em>date.</em>", "golden-hour-portrait", primary=("Connect with us", "contact.html"), secondary=("View investment", "investment.html"))}
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
        {media(im, alt, "", "(min-width:760px) 33vw, 50vw", reveal=False)}
        <span class="masonry__tag">{cap}</span>
      </a>""" for im, k, cap, alt in PORTFOLIO)
    body = f"""
<section class="page-hero">
  <div class="container page-hero__grid">
    <div>
      <p class="eyebrow reveal">Portfolio</p>
      <h1 class="page-hero__title" data-lines>Love stories,<br><em>as they unfolded.</em></h1>
    </div>
    <p class="lede reveal" data-delay="2">Quiet touches, nervous laughter and unfiltered joy. A selection of recent weddings across Illinois and beyond.</p>
  </div>
</section>

<section class="container" style="padding-bottom:var(--section)">
  <div class="filters reveal" data-filters role="group" aria-label="Filter by couple">{chips}</div>
  <div class="masonry mt-m">{items}</div>
  <div class="center mt-xl">
    <p class="muted" style="margin-bottom:20px">Want to see a full wedding, start to finish?</p>
    <a class="btn" href="contact.html">Request a full gallery {ARROW}</a>
  </div>
</section>

<section class="section section--paper2">
  <div class="container">
    <div class="section-head section-head--split">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">Client galleries</p>
        <h2 data-lines>Recent <em>love stories.</em></h2>
      </div>
      <p class="prose reveal" style="max-width:40ch">Every couple receives a private online gallery to view, download and share with family and friends.</p>
    </div>
    <ol class="index-list" role="list">{"".join(f'''
      <li class="reveal"><a class="index-row" href="{url}" target="_blank" rel="noopener" data-preview="assets/img/{im}-800.webp">
        <span class="index-row__num">0{i + 1}</span>
        <span class="index-row__thumb">{img(im, "", "120px")}</span>
        <span class="index-row__name">{a} <em>&amp;</em> {b}</span>
        <span class="index-row__cta">Open gallery {ARROW}</span>
      </a></li>''' for i, (a, b, im, url, alt) in enumerate(STORIES))}</ol>
  </div>
</section>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true">
  <div class="lightbox__bar"><span data-count>01 / 01</span><span class="lightbox__caption" data-caption></span><button class="icon-btn" type="button" data-close aria-label="Close viewer">{CLOSE}</button></div>
  <div class="lightbox__stage"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></div>
  <div class="lightbox__nav">
    <button class="icon-btn" type="button" data-prev aria-label="Previous image">{ARROW_L}</button>
    <button class="icon-btn" type="button" data-next aria-label="Next image">{ARROW}</button>
  </div>
</div>

{cta_band("Your turn", "Let's tell<br><em>your story.</em>", "ethan-gwyn-4")}
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
        <h3 class="film-card__title">{t}</h3>
        <p class="film-card__meta">{m}</p>
      </article>""" for i, (v, t, m, hd) in enumerate(films))


def build_films():
    body = f"""
<section class="page-hero">
  <div class="container page-hero__grid">
    <div>
      <p class="eyebrow reveal">Films</p>
      <h1 class="page-hero__title" data-lines>Don't just see it.<br><em>Feel it again.</em></h1>
    </div>
    <p class="lede reveal" data-delay="2">Cinematic wedding films shot on cinema-grade gear, with pro audio for every vow and toast.</p>
  </div>
</section>

<section class="container">
  <div class="reveal">{yt("Gpq9IPxnIhE", "What if Wes Anderson filmed a wedding?")}</div>
  <div class="story__meta"><h2 class="story__name" style="font-size:var(--step-2)">What if Wes Anderson filmed a wedding?</h2><span class="story__place">Featured</span></div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head section-head--split">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">Wedding films</p>
        <h2 data-lines>Recent <em>films.</em></h2>
      </div>
      <a class="link-arrow reveal" href="{YOUTUBE}" target="_blank" rel="noopener">YouTube channel {ARROW}</a>
    </div>
    <div class="film-grid">{film_cards(WEDDING_FILMS)}</div>
  </div>
</section>

<section class="section section--night">
  <div class="container">
    <div class="split" style="margin-bottom:clamp(48px,6vw,88px)">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">The kit</p>
        <h2 data-lines>Cinema tools,<br><em>quietly used.</em></h2>
      </div>
      <div class="prose reveal">
        <p>Our hybrid photo + film workflow runs on the Sony system for accurate colour and cinema-quality video, alongside a DJI Ronin 4D and a DJI Mavic 3 drone for sweeping aerials.</p>
        <p>Every film package includes a lighting kit, pro audio for the ceremony and selected events, and a storytelling consultation while you plan, so the film sounds as good as it looks.</p>
      </div>
    </div>
    <div class="stats" style="border-color:var(--line-night)">
      <div class="stat reveal" style="border-color:var(--line-night)"><div class="stat__num">3–<span data-count="7">7</span><sup>min</sup></div><p class="stat__label">Highlight film</p></div>
      <div class="stat reveal" data-delay="1" style="border-color:var(--line-night)"><div class="stat__num">30–<span data-count="60">60</span><sup>sec</sup></div><p class="stat__label">Social-ready teaser</p></div>
      <div class="stat reveal" data-delay="2" style="border-color:var(--line-night)"><div class="stat__num"><span data-count="14">14</span><sup>days</sup></div><p class="stat__label">Teaser turnaround</p></div>
      <div class="stat reveal" data-delay="3" style="border-color:var(--line-night)"><div class="stat__num">4K</div><p class="stat__label">Drone &amp; cinema capture</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head section-head--split">
      <div class="stack" style="--stack:20px">
        <p class="eyebrow reveal">Commercial &amp; events</p>
        <h2 data-lines>Beyond the <em>aisle.</em></h2>
      </div>
      <p class="prose reveal" style="max-width:42ch">Brand films, venue promos and event documentaries for businesses and causes we believe in.</p>
    </div>
    <div class="film-grid">{film_cards(COMMERCIAL_FILMS)}</div>
  </div>
</section>

{cta_band("Follow @danreynoldsfilms", "Let's make<br>your <em>film.</em>", "dan-filming", secondary=("Instagram — Films", IG_FILMS))}
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
<section class="page-hero--image hero">
  <div class="hero__media">{img("garden-estate-portrait", "A couple embracing on an estate lawn at sunset", "100vw", lazy=False, priority=True)}</div>
  <div class="container hero__content">
    <p class="eyebrow reveal">The investment</p>
    <h1 class="page-hero__title" data-lines>And so the<br><em>adventure begins…</em></h1>
    <p class="hero__sub mt-m reveal" data-delay="3">Photo and film collections from <strong style="font-weight:500">$3,500</strong>.</p>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="stack" style="--stack:20px">
      <p class="eyebrow reveal">Our philosophy</p>
      <h2 data-lines>Real, raw &amp;<br><em>deeply personal.</em></h2>
    </div>
    <div class="prose reveal">
      <p>Your wedding day is more than an event. It's a collection of once-in-a-lifetime moments, emotions and stories that deserve to be preserved exactly as they unfold: the quiet touches, the nervous laughter, the teary-eyed vows and the unfiltered joy that make your love story uniquely yours.</p>
      <p>We know how quickly the day moves. With high-end gear, a keen eye for detail and an instinct for anticipating moments before they happen, we work quietly and seamlessly, so you can be fully present while we capture the magic.</p>
    </div>
  </div>
</section>

<section class="section section--paper2">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow eyebrow--plain reveal">Collections</p>
      <h2 data-lines>Choose your <em>story.</em></h2>
      <p class="prose reveal">All photo or video packages begin at $3,500. Our most popular collections include 8 hours of coverage.</p>
    </div>
    <div class="packages">
      <article class="package reveal">
        <span class="package__badge">Photography</span>
        {media("lexi-lucas-9", "A wedding party cheering with bouquets raised", "", "(min-width:900px) 50vw, 100vw", reveal=False)}
        <div class="package__body">
          <p class="package__kicker">Photo Package I</p>
          <h3 class="package__title">Six hours of <em>stills</em></h3>
          <div class="package__price"><small>Starting at</small><strong>$3,500</strong></div>
          <ul class="checklist" role="list">
            <li>6 hours of wedding coverage</li>
            <li>A team of 2 photographers: Dan <em>and</em> Lydia</li>
            <li>Complimentary engagement session</li>
            <li>Timeline planning assistance</li>
            <li>Signature hand edits on every photo</li>
            <li>One 8×10 and twenty 4×6 archival prints</li>
            <li>Full print release: print as many as you like</li>
            <li>High-resolution digital downloads</li>
            <li>Private online gallery, hosted for at least 6 months</li>
          </ul>
          <p class="package__note"><strong>Most popular:</strong> our comprehensive photo collection with 8 hours of coverage.</p>
        </div>
      </article>
      <article class="package reveal" data-delay="2">
        <span class="package__badge">Film</span>
        {media("dan-bts", "Dan filming with a cinema camera rig", "", "(min-width:900px) 50vw, 100vw", reveal=False, pos="40% 50%")}
        <div class="package__body">
          <p class="package__kicker">Video Package I</p>
          <h3 class="package__title">Six hours of <em>film</em></h3>
          <div class="package__price"><small>Starting at</small><strong>$3,500</strong></div>
          <ul class="checklist" role="list">
            <li>6 hours of wedding coverage</li>
            <li>2 filmmakers with premium cinema gear</li>
            <li>Storytelling consultation while you plan</li>
            <li>Professional lighting kit</li>
            <li>Pro audio for the ceremony and selected events</li>
            <li>3–7 minute cinematic highlight film</li>
            <li>30–60 second teaser within 14 days</li>
          </ul>
          <ul class="checklist checklist--addon" role="list" aria-label="Available add-ons">
            <li>Drone video available</li>
            <li>Full ceremony film available</li>
            <li>Dances &amp; speeches footage available</li>
          </ul>
          <p class="package__note"><strong>Most popular:</strong> 8 hours of coverage, including the full ceremony edit.</p>
        </div>
      </article>
    </div>
    <div class="combo mt-l reveal">
      <div>
        <p class="eyebrow" style="color:var(--on-night-muted)">Photo + film</p>
        <h3 class="mt-s">Want it <em>all in one?</em></h3>
        <p class="mt-s" style="color:var(--on-night-muted);max-width:52ch">One team, one vision, one seamless day. Ask about special pricing on our combined photo and film collections.</p>
      </div>
      <a class="btn btn--light" href="contact.html">Ask about combos {ARROW}</a>
    </div>
  </div>
</section>

<section class="section section--ivory">
  <div class="container">
    <div class="section-head">
      <p class="eyebrow reveal">How it works</p>
      <h2 data-lines>Three simple<br><em>steps.</em></h2>
    </div>
    <div class="steps">
      <div class="step reveal"><span class="numeral">I.</span><h3>Submit an inquiry</h3><p class="muted">Fill out the form, or message us on Instagram or Facebook with any questions at all.</p></div>
      <div class="step reveal" data-delay="1"><span class="numeral">II.</span><h3>Schedule a call</h3><p class="muted">We'll answer your questions and show you how we'll capture your day with authenticity, artistry and emotion.</p></div>
      <div class="step reveal" data-delay="2"><span class="numeral">III.</span><h3>Book it</h3><p class="muted">Lock in your date, and know every emotion, vow and joyful moment will be preserved beautifully for a lifetime.</p></div>
    </div>
  </div>
</section>

<section class="section section--paper2">
  <div class="container split split--reverse">
    {media("roseleina-cameron-3", "Roseleina sitting on Cameron's lap at the bar, both laughing", "ratio-portrait", "(min-width:900px) 50vw, 100vw")}
    <div class="stack" style="--stack:24px">
      <p class="eyebrow reveal">The experience</p>
      <h2 data-lines>Stress-free,<br><em>start to finish.</em></h2>
      <div class="prose reveal">
        <p>From the quiet anticipation of getting ready to the emotional vows, the lively reception and the intimate in-between moments, we document your day with a blend of artistic vision and journalistic storytelling. We stay discreet but intentional, guiding portraits when needed and otherwise letting the day unfold naturally.</p>
        <p>Afterwards, we carefully curate and edit everything. Photos arrive in a beautiful online gallery, ready to view, download and share. Your film arrives as a cinematic story of the day, plus any extra edits such as the full ceremony.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container container--narrow">
    <div class="section-head section-head--center">
      <p class="eyebrow eyebrow--plain reveal">Good to know</p>
      <h2 data-lines>Frequently asked<br><em>questions.</em></h2>
    </div>
    <div class="faq">{faqs}</div>
  </div>
</section>

{cta_band("Book it!", "Let's show the world<br>your <em>love story.</em>", "chicago-skyline-couple", primary=("Send inquiry", "contact.html"))}
"""
    page("investment.html", "Investment &amp; Packages — Dan Reynolds Photography",
         "Wedding photography and film packages from $3,500. Two photographers, complimentary engagement session, cinematic highlight films and more. View pricing and FAQs.",
         body, overlay=True, og_image="garden-estate-portrait",
         extra_head=f'<script type="application/ld+json">{json.dumps(faq_schema)}</script>')


# --------------------------------------------------------------------------- #
# CONTACT
# --------------------------------------------------------------------------- #
def build_contact():
    body = f"""
<section class="page-hero">
  <div class="container page-hero__grid">
    <div>
      <p class="eyebrow reveal">Get in touch</p>
      <h1 class="page-hero__title" data-lines>Send us<br>a <em>note.</em></h1>
    </div>
    <p class="lede reveal" data-delay="2">Interested in working together? Share the details below and we'll be in touch soon. The more you tell us, the better!</p>
  </div>
</section>

<section class="container" style="padding-bottom:var(--section)">
  <div class="contact-grid">
    <aside class="contact-aside">
      {media("julia-kirk", "A couple kissing among autumn hydrangeas", "", "(min-width:1024px) 38vw, 100vw")}
      <ul class="info-list reveal" role="list">
        <li><span class="k">Instagram — Photo</span><a class="v" href="{IG_PHOTO}" target="_blank" rel="noopener">@danreynoldsphotography</a></li>
        <li><span class="k">Instagram — Films</span><a class="v" href="{IG_FILMS}" target="_blank" rel="noopener">@danreynoldsfilms</a></li>
        <li><span class="k">Based in</span><span class="v">Peoria, Illinois</span></li>
        <li><span class="k">No travel fee</span><span class="v">Chicago · Central Illinois · Milwaukee · Madison</span></li>
      </ul>
      <p class="muted reveal">Have questions first, or just want to say hi? Message us directly on Instagram or Facebook. We'd love to hear from you.</p>
    </aside>

    <div>
      <form class="form" data-inquiry action="https://formspree.io/f/YOUR_FORM_ID" method="POST" novalidate>
        <input type="hidden" name="_subject" value="New wedding inquiry — danreynoldsphotography.com">
        <label class="hp" aria-hidden="true">Leave blank <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="f-name">Your name</label>
            <input class="input" id="f-name" name="name" type="text" autocomplete="name" required placeholder="First &amp; last">
            <span class="field__error">Please tell us your name.</span>
          </div>
          <div class="field">
            <label for="f-partner">Partner's name <span class="opt">(optional)</span></label>
            <input class="input" id="f-partner" name="partner" type="text" placeholder="First &amp; last">
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="f-email">Email</label>
            <input class="input" id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com">
            <span class="field__error">Please enter a valid email address.</span>
          </div>
          <div class="field">
            <label for="f-phone">Phone <span class="opt">(optional)</span></label>
            <input class="input" id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(000) 000-0000">
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="f-date">Wedding date</label>
            <input class="input" id="f-date" name="date" type="date">
          </div>
          <div class="field">
            <label for="f-venue">Venue / location</label>
            <input class="input" id="f-venue" name="venue" type="text" placeholder="Venue, city">
          </div>
        </div>
        <fieldset class="field">
          <legend>I'm interested in</legend>
          <div class="choice-group">
            <label class="choice"><input type="radio" name="service" value="Photography"><span>Photography</span></label>
            <label class="choice"><input type="radio" name="service" value="Film"><span>Film</span></label>
            <label class="choice"><input type="radio" name="service" value="Photo + Film" checked><span>Photo + Film</span></label>
            <label class="choice"><input type="radio" name="service" value="Engagement / Other"><span>Something else</span></label>
          </div>
        </fieldset>
        <div class="form-row form-row--2">
          <div class="field">
            <label for="f-guests">Estimated guests</label>
            <select class="input" id="f-guests" name="guests">
              <option value="">Select…</option><option>Under 50</option><option>50–100</option><option>100–150</option><option>150–250</option><option>250+</option>
            </select>
          </div>
          <div class="field">
            <label for="f-source">How did you find us?</label>
            <select class="input" id="f-source" name="source">
              <option value="">Select…</option><option>Instagram</option><option>Google</option><option>Venue / planner</option><option>Friend or family</option><option>YouTube</option><option>Other</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="f-msg">Tell us about your day</label>
          <textarea class="input" id="f-msg" name="message" required placeholder="Your story, your vision, the moments that matter most…"></textarea>
          <span class="field__error">A few words about your day helps us a lot.</span>
        </div>
        <div class="form__foot">
          <button class="btn" type="submit">Send inquiry {ARROW}</button>
          <p class="form__fine">We reply to every inquiry personally. Your details are never shared.</p>
        </div>
      </form>
      <div class="form-success" role="status" aria-live="polite">
        <p class="eyebrow">Inquiry received</p>
        <h3 class="mt-s">Thank you, <em>friend.</em></h3>
        <p>We've got your note and can't wait to hear more about your day. Dan or Lydia will be in touch soon to set up a call. In the meantime, come say hi on <a href="{IG_PHOTO}" style="color:#d9a77f" target="_blank" rel="noopener">Instagram</a>.</p>
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
  <div class="container center">
    <p class="eyebrow eyebrow--plain">Error 404</p>
    <h1 class="mt-m" style="font-size:var(--step-5)">This moment<br><em>got away.</em></h1>
    <p class="prose mt-m" style="margin-inline:auto">Looks like you've gotten turned around. Let's get you back to the good stuff.</p>
    <div class="btn-row mt-l" style="justify-content:center"><a class="btn" href="index.html">Go back home {ARROW}</a><a class="btn btn--ghost" href="portfolio.html">See the portfolio</a></div>
  </div>
</section>"""
    page("404.html", "Page not found — Dan Reynolds Photography", "This page could not be found.", body, active="", sticky=False)


def build_meta_files():
    pages = ["", "about", "portfolio", "films", "investment", "contact"]
    urls = "".join(f"  <url><loc>{SITE_URL}/{p}</loc></url>\n" for p in pages)
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    (ROOT / "site.webmanifest").write_text(json.dumps({
        "name": "Dan Reynolds Photography", "short_name": "Dan Reynolds",
        "icons": [{"src": "assets/brand/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"}],
        "theme_color": "#080706", "background_color": "#0e0c0a", "display": "standalone", "start_url": "./",
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
