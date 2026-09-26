#!/usr/bin/env python3
"""Record smooth, frame-perfect scroll footage of a website as MP4.

The page's clock is frozen and stepped forward exactly one frame at a time, so
scrolling is perfectly smooth, timers tick at real speed, and nothing stutters
the way a live screen recording does.

  python record.py phone     -> launchmint-phone.mp4    (1080x1920, for reels / stories)
  python record.py desktop   -> launchmint-desktop.mp4  (1920x1080)
  python record.py clips     -> short clips of each moment, for cutting to the voiceover

Needs: pip install playwright imageio-ffmpeg && python -m playwright install chromium
"""

import math
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

URL = "https://launchmint.store"
FPS = 30
OUT = Path(__file__).parent

DEVICES = {
    # 390x693 CSS pixels at ~2.77x = 1080x1920 video
    "phone": dict(viewport={"width": 390, "height": 693}, device_scale_factor=1080 / 390, is_mobile=True,
                  has_touch=True,
                  user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
                             "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"),
    # 1280x720 CSS pixels at 1.5x = 1920x1080 video
    "desktop": dict(viewport={"width": 1280, "height": 720}, device_scale_factor=1.5),
}

# Camera moves: ("hold", seconds) | ("to", selector-or-y, seconds, offset) | ("tap", selector) | ("hover", selector)
# Selectors are found by their visible text so the plan survives small design changes.
PLANS = {
    "phone": [
        ("hold", 2.6),                                     # headline + price-rise timer
        ("to", "text=Choose a product", 1.4, -120),        # the 3 steps + first button
        ("hold", 1.6),
        ("to", "text=This Isn't Luck", 1.8, -60),          # proof
        ("hold", 1.2),
        ("to", "text=Chris started", 1.6, -330),           # member stories
        ("hold", 1.4),
        ("to", "text=SYSTEM ACCESS", 2.4, -200),           # the price card
        ("hold", 0.8),
        ("tap", "a:has-text('GET INSTANT ACCESS →') >> nth=0"),
        ("hold", 1.6),
        ("to", "text=TRY IT FOR", 2.0, -140),              # guarantee
        ("hold", 1.8),
        ("to", "text=Everything is there", 1.6, -330),     # closing line + button
        ("hold", 2.2),
    ],
    "desktop": [
        ("hold", 2.6),
        ("hover", "a:has-text('GET INSTANT ACCESS') >> nth=0"),
        ("hold", 1.2),
        ("to", "text=Watch exactly how", 1.8, -60),
        ("hold", 1.2),
        ("to", "text=This Isn't Luck", 1.8, -60),
        ("hold", 1.4),
        ("to", "text=SYSTEM ACCESS", 2.4, -140),
        ("hold", 0.6),
        ("hover", "a:has-text('GET INSTANT ACCESS →') >> nth=0"),
        ("tap", "a:has-text('GET INSTANT ACCESS →') >> nth=0"),
        ("hold", 1.6),
        ("to", "text=TRY IT FOR", 2.0, -120),
        ("hold", 1.6),
        ("to", "text=Everything is there", 1.6, -260),
        ("hold", 2.2),
    ],
}

# Short clips, one per moment, for cutting to the voiceover. (name, device, plan)
CLIPS = [
    ("hook-headline", "phone", [("hold", 4.0)]),
    ("steps", "phone", [("to", "text=Choose a product", 0.01, -120), ("hold", 3.0)]),
    ("proof-scroll", "phone", [("to", "text=This Isn't Luck", 0.01, -60), ("to", "text=Wade had tried", 4.5, -330),
                               ("hold", 0.5)]),
    ("price-tap", "phone", [("to", "text=SYSTEM ACCESS", 0.01, -200), ("hold", 1.2),
                            ("tap", "a:has-text('GET INSTANT ACCESS →') >> nth=0"), ("hold", 1.4)]),
    ("guarantee", "phone", [("to", "text=TRY IT FOR", 0.01, -140), ("hold", 3.0)]),
    ("closing", "phone", [("to", "text=Everything is there", 0.01, -330), ("hold", 3.5)]),
]

# A soft finger-tap / cursor overlay drawn into the page (it isn't part of the site).
OVERLAY_JS = """
() => {
  if (document.getElementById('__rec_overlay')) return;
  const o = document.createElement('div'); o.id = '__rec_overlay';
  o.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
  o.innerHTML = '<div id="__tap" style="position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;'
    + 'background:rgba(255,255,255,.55);box-shadow:0 0 0 2px rgba(0,0,0,.18),0 6px 18px rgba(0,0,0,.25);opacity:0;transform:scale(.6)"></div>'
    + '<svg id="__cursor" width="26" height="26" viewBox="0 0 24 24" style="position:absolute;opacity:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">'
    + '<path d="M4 2l15 9.5-6.6 1.3 3.9 7.4-2.9 1.5-3.9-7.4L4 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  document.body.appendChild(o);
}
"""


def ease(t):
    """Smooth start and stop (ease-in-out cubic)."""
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


class Recorder:
    def __init__(self, page, frames_dir, max_scroll):
        self.page, self.dir, self.n = page, frames_dir, 0
        self.y, self.max_scroll = 0.0, max_scroll
        self.cursor = None

    def frame(self):
        self.page.evaluate("y => window.scrollTo(0, y)", round(self.y))
        self.page.clock.run_for(round(1000 / FPS))
        self.page.screenshot(path=str(self.dir / f"f{self.n:05d}.jpg"), type="jpeg", quality=94)
        self.n += 1

    def target_y(self, target, offset):
        if isinstance(target, (int, float)):
            y = target
        else:
            box = self.page.locator(target).first.evaluate(
                "e => { const r = e.getBoundingClientRect(); return r.top + window.scrollY; }")
            y = box + offset
        return max(0, min(self.max_scroll, y))

    def hold(self, seconds):
        for _ in range(max(1, round(seconds * FPS))):
            self.frame()

    def move_to(self, target, seconds, offset=0):
        start, end = self.y, self.target_y(target, offset)
        steps = max(1, round(seconds * FPS))
        for i in range(1, steps + 1):
            self.y = start + (end - start) * ease(i / steps)
            self.frame()

    def _center(self, selector):
        return self.page.locator(selector).first.evaluate(
            "e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")

    def hover(self, selector, seconds=0.9):
        """Glide a cursor onto a button (desktop)."""
        x1, y1 = self._center(selector)
        x0, y0 = self.cursor or (x1 - 260, y1 + 160)
        self.page.evaluate("() => document.getElementById('__cursor').style.opacity = 1")
        steps = round(seconds * FPS)
        for i in range(1, steps + 1):
            t = ease(i / steps)
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            self.page.evaluate("([x, y]) => { const c = document.getElementById('__cursor'); "
                               "c.style.left = (x - 4) + 'px'; c.style.top = (y - 2) + 'px'; }", [x, y])
            self.page.mouse.move(x, y)  # real hover, so the button's hover style shows
            self.frame()
        self.cursor = (x1, y1)

    def tap(self, selector, seconds=0.6):
        """A soft finger-tap ripple on a button, without actually clicking it."""
        x, y = self._center(selector)
        self.page.evaluate("([x, y]) => { const t = document.getElementById('__tap'); "
                           "t.style.left = x + 'px'; t.style.top = y + 'px'; }", [x, y])
        steps = round(seconds * FPS)
        for i in range(steps):
            t = i / steps
            scale = 0.6 + 0.6 * math.sin(min(1, t * 1.6) * math.pi / 2)
            opacity = 0.9 * (1 - t) if t > 0.35 else 0.9
            self.page.evaluate("([s, o]) => { const t = document.getElementById('__tap'); "
                               "t.style.transform = 'scale(' + s + ')'; t.style.opacity = o; }", [scale, opacity])
            self.frame()
        self.page.evaluate("() => document.getElementById('__tap').style.opacity = 0")


def record(device, plan, out_path):
    frames = Path(tempfile.mkdtemp(prefix="frames-"))
    exe = os.environ.get("CHROME_PATH")
    proxy = os.environ.get("HTTPS_PROXY")
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe or None, proxy={"server": proxy} if proxy else None)
        ctx = browser.new_context(ignore_https_errors=True, **DEVICES[device])
        page = ctx.new_page()
        page.clock.install()
        page.goto(URL, wait_until="load", timeout=90000)
        page.clock.run_for(1500)
        # Load lazy images and fonts, hide scrollbars, and switch off smooth-scroll CSS.
        page.add_style_tag(content="html{scroll-behavior:auto!important}::-webkit-scrollbar{display:none}"
                                   "html{scrollbar-width:none}")
        height = page.evaluate("document.documentElement.scrollHeight")
        for y in range(0, height, 500):
            page.evaluate("y => window.scrollTo(0, y)", y)
            page.wait_for_timeout(150)
            page.clock.run_for(150)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(1500)
        page.clock.run_for(1500)
        height = page.evaluate("document.documentElement.scrollHeight")
        # Retry any image that failed to load (e.g. a payment logo), and wait for them all.
        for _ in range(3):
            broken = page.evaluate("""() => { let n = 0; for (const img of document.images) {
                img.loading = 'eager';
                if (img.complete && img.naturalWidth === 0 && img.src) { const s = img.src; img.src = ''; img.src = s; n++; }
              } return n; }""")
            if not broken:
                break
            page.wait_for_timeout(2500)
        page.evaluate(OVERLAY_JS)
        # Freeze the page's clock: from here on it only moves when a frame is captured.
        page.clock.pause_at(page.evaluate("Date.now()") + 50)
        vh = page.evaluate("window.innerHeight")
        rec = Recorder(page, frames, max(0, height - vh))

        for step in plan:
            kind = step[0]
            if kind == "hold":
                rec.hold(step[1])
            elif kind == "to":
                _, target, seconds, offset = step
                rec.move_to(target, seconds, offset)
            elif kind == "tap":
                rec.tap(step[1])
            elif kind == "hover":
                rec.hover(step[1])
        browser.close()

    encode(frames, SIZES[device], out_path)
    shutil.rmtree(frames, ignore_errors=True)
    print(f"  {out_path.name}: {rec.n / FPS:.1f}s")


SIZES = {"phone": (1080, 1920), "desktop": (1920, 1080)}


def encode(frames, size, out_path):
    """Frames -> H.264 MP4 at exactly the target size (rounding can leave a frame a pixel short)."""
    w, h = size
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-framerate", str(FPS),
                    "-i", str(Path(frames) / "f%05d.jpg"), "-vf", f"scale={w}:{h}:flags=lanczos,setsar=1",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", str(out_path)], check=True)


def main():
    what = sys.argv[1] if len(sys.argv) > 1 else "phone"
    if what in ("phone", "desktop"):
        record(what, PLANS[what], OUT / f"launchmint-{what}.mp4")
    elif what == "clips":
        (OUT / "clips").mkdir(exist_ok=True)
        for name, device, plan in CLIPS:
            record(device, plan, OUT / "clips" / f"{name}.mp4")
    else:
        sys.exit("Use: phone, desktop or clips")


if __name__ == "__main__":
    main()
