"""Judge how good a website looks, the way a customer would see it.

Opens each site in a real browser twice (a laptop screen and an iPhone),
takes screenshots, and checks the things people notice without knowing
anything technical: does it fit the phone, can you read it, is there a clear
"Call" or "Book" button, do the images look sharp, does it look abandoned.

Optionally asks Claude to look at the screenshots and rate the design like a
web designer would (needs an ANTHROPIC_API_KEY).
"""

import datetime
import os
import re
import time
from pathlib import Path

from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright
import requests

THIS_YEAR = datetime.date.today().year

MEASURE_JS = r"""
() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
  };
  const parseColor = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1};
  };
  const lum = ({r, g, b}) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const bgOf = (el) => {
    let e = el;
    while (e && e.nodeType === 1) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; // text over an image: can't judge
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.5) return c;
      e = e.parentElement;
    }
    return {r: 255, g: 255, b: 255, a: 1};
  };

  // Text elements: leaf-ish nodes that actually hold words.
  const textEls = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (t.textContent.trim().length < 3) continue;
    const el = t.parentElement;
    if (!el || seen.has(el) || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    seen.add(el);
    if (visible(el)) textEls.push(el);
    if (textEls.length > 600) break;
  }

  let small = 0, lowContrast = 0, judged = 0;
  const fonts = {};
  for (const el of textEls) {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const words = el.textContent.trim().split(/\s+/).length;
    if (size < 12 && words >= 3) small++;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    if (fam) fonts[fam] = (fonts[fam] || 0) + words;
    const fg = parseColor(cs.color), bg = bgOf(el);
    if (fg && bg) {
      judged++;
      const l1 = lum(fg), l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const big = size >= 24 || (size >= 18.5 && parseInt(cs.fontWeight) >= 700);
      if (ratio < (big ? 3 : 4.5)) lowContrast++;
    }
  }
  const totalWords = Object.values(fonts).reduce((a, b) => a + b, 0) || 1;
  const mainFonts = Object.entries(fonts).filter(([, w]) => w / totalWords > 0.03).map(([f]) => f);

  // Tap targets
  const clickables = [...document.querySelectorAll('a[href], button, input[type=submit], [role=button]')].filter(visible);
  let tiny = 0;
  for (const el of clickables) {
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && el.closest('p, li, td, span') && getComputedStyle(el).display === 'inline';
    if (!inline && el.textContent.trim().length > 0 && (r.height < 24 || r.width < 24)) tiny++;
  }

  // Call to action on the first screen
  const ctaRe = /(call|book|schedule|appointment|quote|contact|get started|order|reserve|enquire|inquire|free consult|sign up|buy|shop now)/i;
  const firstScreenCta = clickables.some((el) => {
    const r = el.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) return false;
    const href = (el.getAttribute('href') || '').toLowerCase();
    return href.startsWith('tel:') || ctaRe.test(el.textContent || '') || ctaRe.test(el.getAttribute('aria-label') || '');
  });

  // Images
  const imgs = [...document.images].filter(visible);
  let blurry = 0, broken = 0, bigImgs = 0, firstScreenVisual = false;
  const dpr = window.devicePixelRatio || 1;
  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    if (img.complete && img.naturalWidth === 0) { broken++; continue; }
    if (r.width >= 200) {
      bigImgs++;
      if (img.naturalWidth && img.naturalWidth < r.width * Math.min(dpr, 1.5) * 0.7) blurry++;
    }
    if (r.top < vh && r.width > vw * 0.4 && r.height > 150) firstScreenVisual = true;
  }
  if (!firstScreenVisual) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.top >= vh) continue;
      if (r.width > vw * 0.5 && r.height > 200) {
        const bi = getComputedStyle(el).backgroundImage;
        if (bi && bi.includes('url(')) { firstScreenVisual = true; break; }
        if (el.tagName === 'VIDEO' || el.tagName === 'CANVAS') { firstScreenVisual = true; break; }
      }
    }
  }

  // Copyright year
  const bodyText = document.body.innerText || '';
  const years = [...bodyText.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)].map((m) => parseInt(m[1]));

  const src = document.documentElement.outerHTML.slice(0, 400000);
  const builders = [
    ['Wix', /wixstatic\.com|wix-warmup-data|_wixCssImports/], ['Squarespace', /squarespace\.com|static1\.squarespace/],
    ['Weebly', /weebly\.com|editmysite\.com/], ['GoDaddy Website Builder', /img1\.wsimg\.com|godaddy/i],
    ['Jimdo', /jimdo/i], ['Webflow', /webflow\.(com|io)/], ['Shopify', /cdn\.shopify\.com/],
    ['Duda', /dudaone|multiscreensite|irp\.cdn-website\.com/], ['WordPress', /wp-content|wp-includes/],
    ['Joomla', /\/media\/jui\/|joomla/i], ['Adobe Muse', /muse\.adobe|musecdn/i], ['Microsoft FrontPage', /FrontPage/],
    ['Flash', /\.swf["'?]/i],
  ];
  const builtWith = builders.filter(([, re]) => re.test(src)).map(([n]) => n);
  const tools = [
    ['Google Ads', /AW-\d{6,}|googleadservices\.com|google_conversion_id/], ['Google Analytics', /\bG-[A-Z0-9]{6,}|UA-\d{4,}-\d|google-analytics\.com/],
    ['Google Tag Manager', /GTM-[A-Z0-9]{4,}/], ['Facebook Pixel', /connect\.facebook\.net\/[^"']*fbevents|fbq\(/],
    ['TikTok Pixel', /analytics\.tiktok\.com/], ['Calendly', /calendly\.com/], ['Acuity Scheduling', /acuityscheduling\.com/],
    ['Square Appointments', /squareup\.com\/appointments|square\.site\/book/], ['Vagaro', /vagaro\.com/],
    ['Booksy', /booksy\.com/], ['Zocdoc', /zocdoc\.com/], ['OpenTable', /opentable\.com/], ['Mindbody', /mindbodyonline\.com/],
    ['Housecall Pro', /housecallpro\.com/], ['Jobber', /getjobber\.com|jobber\.com/], ['ServiceTitan', /servicetitan/i],
    ['Podium chat', /podium\.com/], ['Tidio chat', /tidio/i], ['Intercom chat', /intercom/i], ['LiveChat', /livechatinc\.com/],
    ['Tawk.to chat', /tawk\.to/],
  ];
  const marketing = tools.filter(([, re]) => re.test(src)).map(([n]) => n);
  const jq = window.jQuery && window.jQuery.fn && window.jQuery.fn.jquery;
  const meta = document.querySelector('meta[name=viewport]');
  const gen = document.querySelector('meta[name=generator]');
  return {
    viewportMeta: !!meta && /width\s*=\s*device-width/i.test(meta.content || ''),
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    innerWidth: vw,
    textCount: textEls.length,
    smallText: small,
    judged, lowContrast,
    fonts: mainFonts,
    clickables: clickables.length,
    tinyTaps: tiny,
    firstScreenCta,
    images: imgs.length, bigImgs, blurry, broken, firstScreenVisual,
    copyrightYear: years.length ? Math.max(...years) : null,
    favicon: !!document.querySelector('link[rel~="icon"]'),
    generator: gen ? gen.content : '',
    builtWith, marketing, jquery: jq || '',
    title: document.title,
    words: bodyText.split(/\s+/).length,
    usesTables: document.querySelectorAll('table[width], td[bgcolor], font, center, marquee').length,
  };
}
"""


DOWN_SIGNS = (
    "ERR_NAME_NOT_RESOLVED", "ERR_CONNECTION_REFUSED", "ERR_CONNECTION_TIMED_OUT", "ERR_CONNECTION_RESET",
    "ERR_ADDRESS_UNREACHABLE", "ERR_TIMED_OUT", "Timeout", "error page (5",
)


def looks_down(error):
    return any(sign in error for sign in DOWN_SIGNS)


def mark_down(lead, error):
    """A business listed with a website that doesn't load is one of the best leads there is."""
    reason = ("the address doesn't exist any more" if "NAME_NOT_RESOLVED" in error
              else "the server isn't responding" if "error page" not in error else "it shows a server error")
    lead.update({
        "site_down": True, "grade": "F", "score": 0, "opportunity": 100, "error": "",
        "verdict": "Website is down. Best prospect.",
        "issues": [{"area": "Trust", "label": "Website loads", "passed": False, "points": 100, "key": "down",
                    "finding": f"The website doesn't load: {reason}. Anyone who clicks it on Google gets an error.",
                    "fix": "Get the site back online, or build a new one.",
                    "pitch": "your website isn't loading at the moment. I got an error when I tried to open it"}],
    })
    lead["checks"] = list(lead["issues"])


def _certificate_broken(url):
    """True when browsers show a full-page 'Your connection is not private' warning."""
    if not url.startswith("https://"):
        return False
    try:
        requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
        return False
    except requests.exceptions.SSLError:
        return True
    except requests.RequestException:
        return False


def _slug(url):
    s = re.sub(r"^https?://(www\.)?", "", url).strip("/")
    return re.sub(r"[^a-zA-Z0-9]+", "-", s)[:60] or "site"


def _launch(p):
    exe = os.environ.get("CHROME_PATH")
    kwargs = {"executable_path": exe} if exe else {}
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        kwargs["proxy"] = {"server": proxy, "bypass": "localhost,127.0.0.1"}
    return p.chromium.launch(**kwargs)


def _open(browser, url, **context_kwargs):
    ctx = browser.new_context(ignore_https_errors=True, **context_kwargs)
    page = ctx.new_page()
    start = time.time()
    resp = page.goto(url, wait_until="load", timeout=45000)
    load_seconds = time.time() - start
    try:
        page.wait_for_load_state("networkidle", timeout=6000)
    except PlaywrightTimeout:
        pass
    page.wait_for_timeout(800)
    return ctx, page, resp, load_seconds


# Every check a customer would notice. Each one records whether it passed, what we saw,
# what we'd do about it, and a short phrase for the outreach message.
def _judge(m_mobile, m_desktop, load_seconds, final_url):
    checks = []

    def check(area, label, failed, points, key, finding, ok_text, fix, pitch):
        checks.append({
            "area": area, "label": label, "passed": not failed, "points": points if failed else 0,
            "key": key, "finding": finding if failed else ok_text, "fix": fix, "pitch": pitch,
        })

    judged = m_desktop["judged"] or 1
    yr = m_desktop["copyrightYear"]
    slow = load_seconds > 4.5

    check("Phone", "Built for phones", not m_mobile["viewportMeta"], 20, "mobile",
          "Not built for phones. On a phone it shows a tiny, zoomed-out copy of the desktop site.",
          "Set up to fit phone screens.",
          "Rebuild the layout so it adapts to any screen size.",
          "the site isn't built for phones, so it shows up tiny and zoomed out")
    check("Phone", "Fits the screen", m_mobile["scrollWidth"] > m_mobile["innerWidth"] + 8, 12, "mobile",
          "The page is wider than a phone screen, so visitors have to scroll sideways.",
          "Fits the phone screen with no sideways scrolling.",
          "Fix the sections that overflow so everything fits the screen width.",
          "the page runs off the side of the screen on a phone")
    check("Phone", "Readable text",
          m_mobile["smallText"] >= 3 and m_mobile["smallText"] / (m_mobile["textCount"] or 1) > 0.2, 8, "mobile",
          "A lot of the text is too small to read on a phone without zooming in.",
          "Text is a comfortable size on a phone.",
          "Increase body text to at least 16px on phones.",
          "a lot of the text is too small to read on a phone")
    check("Phone", "Easy to tap",
          m_mobile["tinyTaps"] >= 3 and m_mobile["tinyTaps"] / (m_mobile["clickables"] or 1) > 0.3, 6, "mobile",
          "Many buttons and links are too small to tap easily with a finger.",
          "Buttons and links are big enough to tap.",
          "Make buttons at least 44px tall with space between them.",
          "the buttons are hard to tap with a finger")
    check("Phone", "Clear next step", not m_mobile["firstScreenCta"], 10, "cta",
          'No "Call", "Book" or "Contact" button on the first screen of the phone view.',
          'A "Call", "Book" or "Contact" button is visible straight away.',
          "Add a sticky Call / Book button that's always one tap away.",
          "there's no Call or Book button when the page first opens, so people have to hunt for how to reach you")

    check("Speed", "Loads quickly", slow, 12 if load_seconds > 8 else 6, "slow",
          f"Took about {load_seconds:.0f} seconds to load on a phone. Most people leave after about 3.",
          f"Loaded in about {load_seconds:.1f} seconds on a phone.",
          "Compress images, remove unused plugins, and use fast hosting.",
          f"it took about {load_seconds:.0f} seconds to load on my phone")

    check("Trust", "Secure padlock", not final_url.startswith("https://"), 10, "ssl",
          'Browsers label it "Not secure" because it has no padlock (HTTPS).',
          "Has the secure padlock (HTTPS).",
          "Add a free SSL certificate so the padlock shows.",
          'Chrome shows a "Not secure" warning next to your address')
    check("Trust", "Looks up to date", bool(yr and yr < THIS_YEAR - 1) or m_desktop["usesTables"] > 5,
          (10 if m_desktop["usesTables"] > 5 else 0) + ((8 if yr < THIS_YEAR - 3 else 4) if yr and yr < THIS_YEAR - 1 else 0),
          "dated",
          (f"The footer still says \u00a9 {yr}, which makes the business look inactive. " if yr and yr < THIS_YEAR - 1 else "")
          + ("Built with very old web techniques, so it looks dated." if m_desktop["usesTables"] > 5 else ""),
          "Nothing looks out of date.",
          "Refresh the design and keep the footer year current.",
          f"the footer still says \u00a9 {yr}, which can make people think you've closed" if yr and yr < THIS_YEAR - 1
          else "the design looks a few years old")
    check("Trust", "Images load", m_desktop["broken"] > 0, 8, "images",
          f"{m_desktop['broken']} image(s) are broken and don't show up.",
          "All images load.",
          "Replace or remove the broken images.",
          "a few images are broken and show up as empty boxes")

    check("Looks", "Strong first impression", not m_desktop["firstScreenVisual"], 6, "visual",
          "The first screen is mostly text with no strong photo or visual.",
          "Opens with a strong photo or visual.",
          "Lead with a big, real photo of the business, team or work.",
          "the homepage opens with a wall of text instead of a photo of your work")
    check("Looks", "Sharp photos",
          m_desktop["bigImgs"] > 0 and m_desktop["blurry"] / m_desktop["bigImgs"] > 0.3, 6, "images",
          "Some photos look blurry or stretched.",
          "Photos look sharp.",
          "Swap in higher-resolution photos.",
          "some of the photos look blurry or stretched")
    check("Looks", "Easy to read", m_desktop["lowContrast"] >= 3 and m_desktop["lowContrast"] / judged > 0.15, 8,
          "contrast",
          "Some text is faint against its background and hard to read.",
          "Text stands out clearly from the background.",
          "Darken the text colors or lighten the backgrounds.",
          "some of the text is faint and hard to read")
    check("Looks", "Consistent fonts", len(m_desktop["fonts"]) > 3, 6, "fonts",
          f"Mixes {len(m_desktop['fonts'])} different fonts, which looks messy.",
          "Uses a small, consistent set of fonts.",
          "Pick one font for headings and one for text.",
          "the fonts change from section to section, which looks a bit messy")
    check("Looks", "Tab icon", not m_desktop["favicon"], 2, "polish",
          "No little logo icon in the browser tab.",
          "Shows a logo icon in the browser tab.",
          "Add a favicon made from the logo.",
          "small details like the browser tab icon are missing")

    heuristic = max(0, 100 - sum(c["points"] for c in checks))
    issues = sorted([c for c in checks if not c["passed"]], key=lambda c: -c["points"])
    return heuristic, issues, checks


def grade_for(score):
    if score >= 85:
        return "A", "Looks good. Probably not worth pitching."
    if score >= 70:
        return "B", "Decent, with a few things to fix."
    if score >= 55:
        return "C", "Noticeable problems. Good prospect."
    if score >= 40:
        return "D", "Looks poor on phones or dated. Strong prospect."
    return "F", "Needs a new website. Best prospect."


def audit_site(browser, phone, url, shots_dir, ai=None):
    result = {"website": url, "error": ""}
    if not url:
        result["error"] = "no website"
        return result
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    shots_dir = Path(shots_dir)
    shots_dir.mkdir(parents=True, exist_ok=True)
    slug = _slug(url)
    try:
        ctx_m, page_m, resp, load_seconds = _open(browser, url, **phone)
        if resp is not None and resp.status >= 400:
            ctx_m.close()
            result["error"] = f"the site answered with an error page ({resp.status})"
            return result
        final_url = page_m.url
        m_mobile = page_m.evaluate(MEASURE_JS)
        mobile_shot = shots_dir / f"{slug}-mobile.jpg"
        page_m.screenshot(path=str(mobile_shot), type="jpeg", quality=70)
        # Whole phone page, capped so a very long page doesn't make a giant file.
        height = min(page_m.evaluate("document.documentElement.scrollHeight") or 844, 5000)
        mobile_full_shot = shots_dir / f"{slug}-mobile-full.jpg"
        page_m.screenshot(path=str(mobile_full_shot), type="jpeg", quality=60, full_page=True,
                          clip={"x": 0, "y": 0, "width": phone["viewport"]["width"], "height": height})
        ctx_m.close()

        ctx_d, page_d, _, _ = _open(browser, url, viewport={"width": 1440, "height": 900})
        m_desktop = page_d.evaluate(MEASURE_JS)
        desktop_shot = shots_dir / f"{slug}-desktop.jpg"
        page_d.screenshot(path=str(desktop_shot), type="jpeg", quality=70)
        ctx_d.close()
    except (PlaywrightError, PlaywrightTimeout) as e:
        msg = str(e).splitlines()[0][:140]
        result["error"] = f"couldn't load site: {msg}"
        return result

    heuristic, issues, checks = _judge(m_mobile, m_desktop, load_seconds, final_url)
    if _certificate_broken(final_url):
        cert = {"area": "Trust", "label": "No security warning", "passed": False, "points": 20, "key": "cert",
                "finding": 'Visitors get a full-page "Your connection is not private" warning before the site opens.',
                "fix": "Renew or fix the SSL certificate.",
                "pitch": 'visitors get a big "Your connection is not private" warning before your site even opens'}
        checks.insert(0, cert)
        issues.insert(0, cert)
        heuristic = max(0, heuristic - 20)
    result.update({
        "website": final_url,
        "title": m_desktop.get("title", ""),
        "load_seconds": round(load_seconds, 1),
        "heuristic_score": heuristic,
        "issues": issues,
        "checks": checks,
        "mobile_full_shot": str(mobile_full_shot),
        "mobile_shot": str(mobile_shot),
        "desktop_shot": str(desktop_shot),
        "built_with": ", ".join(m_desktop.get("builtWith") or []) or m_desktop.get("generator", ""),
        "jquery": m_desktop.get("jquery", ""),
        "marketing": m_desktop.get("marketing") or [],
        "ai": None,
    })

    score = heuristic
    if ai is not None:
        rating = ai.rate(desktop_shot, mobile_shot, final_url)
        result["ai"] = rating
        if rating and "overall" in rating:
            # Blend: the design eye matters as much as the checklist.
            score = round(0.5 * heuristic + 0.5 * rating["overall"] * 10)
    result["score"] = score
    result["grade"], result["verdict"] = grade_for(score)
    result["opportunity"] = 100 - score
    return result


class Auditor:
    """Keeps one browser open while auditing many sites."""

    def __init__(self, shots_dir, ai=None):
        self.shots_dir = shots_dir
        self.ai = ai

    def __enter__(self):
        self._p = sync_playwright().start()
        self._phone = dict(self._p.devices["iPhone 13"])
        self._browser = _launch(self._p)
        return self

    def audit(self, url):
        return audit_site(self._browser, self._phone, url, self.shots_dir, self.ai)

    def __exit__(self, *exc):
        self._browser.close()
        self._p.stop()

