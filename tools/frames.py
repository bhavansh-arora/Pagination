"""Download 4 stills for each YouTube film, crop letterbox bars and save WebP.
Usage: python3 tools/frames.py assets/img/f VIDEO_ID[,VIDEO_ID...]"""
import sys, os, io, urllib.request
from PIL import Image, ImageStat

ids = sys.argv[2].split(",")
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
names = {"maxresdefault": "", "maxres1": "-1", "maxres2": "-2", "maxres3": "-3"}

def crop_bars(im):
    w, h = im.size
    g = im.convert("L")
    def bar(y):
        s = ImageStat.Stat(g.crop((0, y, w, y + 1)))
        return s.mean[0] < 5 and s.stddev[0] < 3
    top = 0
    while top < h // 3 and bar(top):
        top += 1
    bot = h - 1
    while bot > h * 2 // 3 and bar(bot):
        bot -= 1
    if top > 2 or bot < h - 3:
        im = im.crop((0, top + 2, w, bot - 1))
    return im

report = []
for vid in ids:
    for src, suf in names.items():
        url = f"https://i.ytimg.com/vi/{vid}/{src}.jpg"
        try:
            data = urllib.request.urlopen(url, timeout=30).read()
        except Exception as e:
            report.append(f"FAIL {vid} {src} {e}")
            continue
        im = crop_bars(Image.open(io.BytesIO(data)).convert("RGB"))
        base = os.path.join(out, f"{vid}{suf}")
        im.save(base + ".webp", "WEBP", quality=80, method=6)
        sm = im.copy()
        sm.thumbnail((640, 640))
        sm.save(base + "-sm.webp", "WEBP", quality=76, method=6)
        report.append(f"{vid}{suf} {im.size[0]}x{im.size[1]}")
print("\n".join(report))
