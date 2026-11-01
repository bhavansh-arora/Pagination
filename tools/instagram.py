#!/usr/bin/env python3
"""Put the latest Instagram posts in the home page's photo strip (the scrolling row under "Behind the lens").

Run by .github/workflows/instagram.yml once a day. It needs INSTAGRAM_TOKEN: a long-lived token from the Instagram API
(with Instagram Login) for the account to show; without it, nothing changes. Each run it:
  - renews the token (it lasts 60 days from the last renewal) and, if Instagram hands back a different one, writes it
    to the file named in NEW_TOKEN_FILE so the workflow can save it;
  - downloads the newest photos (videos and reels use their cover image) as small WebP files in assets/img/instagram/;
  - rewrites the strip in index.html (the element marked data-instagram), each photo linking to its post;
  - removes downloaded photos that are no longer shown.
"""
import html
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
DIR = ROOT / "assets" / "img" / "instagram"
API = os.environ.get("INSTAGRAM_API", "https://graph.instagram.com")
COUNT = int(os.environ.get("INSTAGRAM_COUNT", "10"))
WIDTH = 800  # strip photos are at most 300px wide, so 800 covers sharp screens


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "site-instagram-strip"}), timeout=60) as r:
        return r.read()


def api(path, **params):
    return json.loads(get(API + path + "?" + urllib.parse.urlencode(params)))


def block(src, start):
    """The element starting at index `start` (a <div ...>), balanced."""
    depth = 0
    for t in re.finditer(r"<(/?)div\b[^>]*>", src[start:]):
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return start + t.end()
    raise ValueError("unbalanced <div> in the Instagram strip")


def alt_text(caption):
    text = re.sub(r"[#@][\w.]+", "", (caption or "").split("\n")[0])
    text = re.sub(r"[^\w\s&,.'!?:;()\-–—’]", "", text)
    text = re.sub(r"\s+", " ", text).strip(" -–—,.")
    if len(text) > 110:
        text = text[:110].rsplit(" ", 1)[0] + "…"
    return ("Instagram: " + text) if text else "A recent Instagram post by Dan Reynolds Photography"


def save_photo(post):
    """Download the post's image once; returns (path, width, height)."""
    from PIL import Image
    out = DIR / f"{post['id']}-{WIDTH}.webp"
    if not out.exists():
        im = Image.open(io.BytesIO(get(post["image"]))).convert("RGB")
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        DIR.mkdir(parents=True, exist_ok=True)
        im.save(out, "WEBP", quality=80, method=6)
    from PIL import Image as I2
    with I2.open(out) as im:
        return out, im.width, im.height


def item(post, path, w, h, copy):
    rel = path.relative_to(ROOT).as_posix()
    hide = ' aria-hidden="true" tabindex="-1"' if copy else ""
    alt = "" if copy else html.escape(alt_text(post.get("caption")))
    return (f'<a href="{html.escape(post["permalink"])}" target="_blank" rel="noopener" data-cursor="Follow" '
            f'aria-label="Open this post on Instagram" class="marquee__item"{hide}>'
            f'<img src="{rel}" sizes="300px" width="{w}" height="{h}" alt="{alt}" loading="lazy" decoding="async"></a>')


def main():
    token = os.environ.get("INSTAGRAM_TOKEN", "").strip()
    if not token:
        print("INSTAGRAM_TOKEN isn't set: the photo strip is left as it is.")
        return 0

    # Keep the token alive (allowed once it's a day old; a failure here isn't fatal).
    try:
        fresh = api("/refresh_access_token", grant_type="ig_refresh_token", access_token=token)
        days = int(fresh.get("expires_in", 0)) // 86400
        print(f"Token renewed: valid for {days} more days.")
        new = fresh.get("access_token")
        if new and new != token and os.environ.get("NEW_TOKEN_FILE"):
            Path(os.environ["NEW_TOKEN_FILE"]).write_text(new)
            print("Instagram returned a new token; the workflow saves it.")
    except Exception as e:  # noqa: BLE001
        print(f"Couldn't renew the token ({e}); carrying on with the current one.")

    data = api("/me/media", fields="id,caption,media_type,media_url,thumbnail_url,permalink,timestamp", limit=30, access_token=token)
    posts = []
    for p in data.get("data", []):
        img = p.get("thumbnail_url") if p.get("media_type") == "VIDEO" else p.get("media_url")
        if img and p.get("permalink"):
            posts.append(dict(p, image=img))
        if len(posts) == COUNT:
            break
    if len(posts) < 4:
        print(f"Only {len(posts)} usable posts came back: the photo strip is left as it is.")
        return 0

    src = PAGE.read_text(encoding="utf-8")
    m = re.search(r"<div\b[^>]*\bdata-instagram\b[^>]*>", src)
    if not m:
        print("index.html has no element marked data-instagram: nothing to update.", file=sys.stderr)
        return 1
    end = block(src, m.start())
    strip = src[m.start():end]
    t = re.search(r'<div\b[^>]*class="marquee__track"[^>]*>', strip)
    t_end = block(strip, t.start())
    saved = [(p,) + save_photo(p) for p in posts]
    # The strip scrolls endlessly by showing the photos twice; the second set is hidden from screen readers.
    items = "".join(item(p, path, w, h, False) for p, path, w, h in saved) + "".join(item(p, path, w, h, True) for p, path, w, h in saved)
    new_strip = strip[:t.end()] + items + "</div>" + strip[t_end:]
    unstamped = lambda x: re.sub(r"\?v=[0-9a-f]+", "", x)  # version_assets.py adds ?v= to photo links
    if unstamped(new_strip) != unstamped(strip):
        PAGE.write_text(src[:m.start()] + new_strip + src[end:], encoding="utf-8")
        print(f"Photo strip updated with the latest {len(saved)} posts.")
    else:
        print("Photo strip already shows the latest posts.")

    keep = {path.name for _, path, _, _ in saved}
    for f in DIR.glob("*.webp"):
        if f.name not in keep:
            f.unlink()
    return 0


if __name__ == "__main__":
    sys.exit(main())
