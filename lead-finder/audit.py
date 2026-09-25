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
    title: document.title,
    words: bodyText.split(/\s+/).length,
    usesTables: document.querySelectorAll('table[width], td[bgcolor], font, center, marquee').length,
  };
}
"""


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


# Each check: (points taken off, plain-English finding, short pitch phrase)
def _judge(m_mobile, m_desktop, load_seconds, final_url):
    issues = []

    def add(points, key, finding, pitch):
        issues.append({"points": points, "key": key, "finding": finding, "pitch": pitch})

    if not m_mobile["viewportMeta"]:
        add(20, "mobile", "Not built for phones. On a phone it shows a tiny, zoomed-out copy of the desktop site.",
            "the site isn't built for phones")
    if m_mobile["scrollWidth"] > m_mobile["innerWidth"] + 8:
        add(12, "mobile", "The page is wider than a phone screen, so visitors have to scroll sideways.",
            "the page runs off the side of a phone screen")
    if m_mobile["smallText"] >= 3 and m_mobile["smallText"] / m_mobile["textCount"] > 0.2:
        add(8, "mobile", "A lot of the text is too small to read on a phone without zooming in.",
            "the text is too small to read on a phone")
    if m_mobile["tinyTaps"] >= 3 and m_mobile["tinyTaps"] / m_mobile["clickables"] > 0.3:
        add(6, "mobile", "Many buttons and links are too small to tap easily with a finger.",
            "buttons are hard to tap on a phone")
    if load_seconds > 8:
        add(12, "slow", f"Very slow: took about {load_seconds:.0f} seconds to load on a phone.",
            "the site is slow to load")
    elif load_seconds > 4.5:
        add(6, "slow", f"A bit slow: took about {load_seconds:.0f} seconds to load on a phone.",
            "the site is slow to load")
    if not final_url.startswith("https://"):
        add(10, "ssl", 'Browsers label it "Not secure" because it has no padlock (HTTPS).',
            'browsers show a "Not secure" warning')
    if not m_mobile["firstScreenCta"]:
        add(10, "cta", 'No "Call", "Book" or "Contact" button on the first screen of the phone view.',
            "there's no clear call or booking button")
    judged = m_desktop["judged"] or 1
    if m_desktop["lowContrast"] >= 3 and m_desktop["lowContrast"] / judged > 0.15:
        add(8, "contrast", "Some text is faint against its background and hard to read.",
            "some text is hard to read")
    if len(m_desktop["fonts"]) > 3:
        add(6, "fonts", f"Mixes {len(m_desktop['fonts'])} different fonts, which looks messy.",
            "the design looks a little inconsistent")
    if m_desktop["broken"]:
        add(8, "images", f"{m_desktop['broken']} image(s) are broken and don't show up.",
            "some images are broken")
    if m_desktop["bigImgs"] and m_desktop["blurry"] / m_desktop["bigImgs"] > 0.3:
        add(6, "images", "Some photos look blurry or stretched.", "some photos look blurry")
    if not m_desktop["firstScreenVisual"]:
        add(6, "visual", "The first screen is mostly text with no strong photo or visual.",
            "the homepage has no strong first impression")
    yr = m_desktop["copyrightYear"]
    if yr and yr < THIS_YEAR - 1:
        add(8 if yr < THIS_YEAR - 3 else 4, "dated",
            f"The footer still says © {yr}, which makes the business look inactive.",
            f"the footer still says © {yr}")
    if m_desktop["usesTables"] > 5:
        add(10, "dated", "Built with very old web techniques. It likely looks dated.", "the site looks dated")
    if not m_desktop["favicon"]:
        add(2, "polish", "No little logo icon in the browser tab.", "small missing details like the tab icon")

    heuristic = max(0, 100 - sum(i["points"] for i in issues))
    issues.sort(key=lambda i: -i["points"])
    return heuristic, issues


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

    heuristic, issues = _judge(m_mobile, m_desktop, load_seconds, final_url)
    result.update({
        "website": final_url,
        "title": m_desktop.get("title", ""),
        "load_seconds": round(load_seconds, 1),
        "heuristic_score": heuristic,
        "issues": issues,
        "mobile_shot": str(mobile_shot),
        "desktop_shot": str(desktop_shot),
        "built_with": m_desktop.get("generator", ""),
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

