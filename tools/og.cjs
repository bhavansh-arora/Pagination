// Generates the 1200x630 link-preview cards (WhatsApp, iMessage, Facebook, LinkedIn, Slack, X).
// Usage: node tools/og.cjs   (needs Playwright; writes assets/img/og/*.jpg)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets/img/og");
// Images are inlined so the card renders the same wherever the script runs.
const fileUrl = (rel) => {
  const ext = path.extname(rel).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,` + fs.readFileSync(path.join(ROOT, rel)).toString("base64");
};

const card = ({ img, pos = "50% 50%", kicker, title, sub, gray = false }) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..500,100;1,9..144,300..500,100&display=block">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0b0907;color:#f4ecdf;font-family:"DM Sans",sans-serif;position:relative}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos};${gray ? "filter:grayscale(1) contrast(1.05);" : ""}}
.sh{position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,9,7,.92) 0%,rgba(11,9,7,.62) 46%,rgba(11,9,7,.12) 100%),linear-gradient(0deg,rgba(11,9,7,.85) 0%,rgba(11,9,7,0) 55%)}
.vf{position:absolute;inset:28px}
.vf i{position:absolute;width:26px;height:26px;border:2px solid rgba(255,255,255,.8)}
.vf i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}.vf i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
.vf i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}.vf i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
.top{position:absolute;left:64px;right:64px;top:58px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:14px}
.mark{width:46px;height:46px;border-radius:11px;background:#f4ecdf;color:#0b0907;display:grid;place-items:center;font-family:Fraunces;font-style:italic;font-size:22px;letter-spacing:-.03em}
.name{font-family:Fraunces;font-size:26px;letter-spacing:-.02em;line-height:1}
.name small{display:block;font-family:"DM Sans";font-weight:600;font-size:11px;letter-spacing:.32em;color:rgba(244,236,223,.7);margin-top:6px}
.rec{display:flex;align-items:center;gap:10px;font-weight:600;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.85)}
.rec:before{content:"";width:10px;height:10px;border-radius:50%;background:#ef5a2c}
.body{position:absolute;left:64px;right:64px;bottom:62px}
.kicker{display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#f6b36a;margin-bottom:18px}
.kicker:before{content:"";width:8px;height:8px;border-radius:50%;background:#ef5a2c}
h1{font-family:Fraunces;font-weight:400;font-size:${title.replace(/<[^>]+>/g, "").length > 30 ? 74 : 88}px;line-height:.95;letter-spacing:-.035em;max-width:900px;font-variation-settings:"opsz" 144,"SOFT" 100}
h1 em{font-style:italic;font-weight:300;color:#f6b36a}
.foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:26px;gap:24px}
.sub{font-size:22px;color:rgba(244,236,223,.85);max-width:640px;line-height:1.35}
.rate{display:flex;align-items:center;gap:10px;padding:10px 18px;border-radius:999px;background:rgba(11,9,7,.55);border:1px solid rgba(244,236,223,.3);font-size:17px;white-space:nowrap}
.rate b{color:#f6b36a;letter-spacing:2px}
</style></head><body>
<img class="bg" src="${fileUrl(img)}"><div class="sh"></div>
<div class="vf"><i></i><i></i><i></i><i></i></div>
<div class="top"><div class="brand"><span class="mark">MA</span><span class="name">Mark Arista<small>FILMS · HAWAII</small></span></div><span class="rec">Rec · 4K · 24 fps</span></div>
<div class="body"><p class="kicker">${kicker}</p><h1>${title}</h1>
<div class="foot"><p class="sub">${sub}</p><span class="rate"><b>★★★★★</b> 5.0 · 23 reviews</span></div></div>
</body></html>`;

(async () => {
  const { films, venues } = await import(path.join(ROOT, "src/data.mjs"));
  const venueOf = (f) => venues[f.venue];
  const frame = (id, s = "") => `assets/img/f/${id}${s}.webp`;
  fs.mkdirSync(path.join(OUT, "films"), { recursive: true });

  const pages = [
    ["home", { img: frame("OAF6KZrBGzk"), pos: "60% 50%", kicker: "Hawaii wedding films · Filipino warmth", title: "Your love story is worth <em>telling.</em>", sub: `${films.length} wedding films across Oahu, Hawaii Island and beyond.` }],
    ["about", { img: "assets/img/mark-smile.jpg", pos: "60% 40%", gray: true, kicker: "About · Hawaii · Filipino roots", title: "Hi there! <em>I'm Mark.</em>", sub: "Hawaii wedding videographer, centered on you, your love and your people." }],
    ["films", { img: frame("Ch_mROgi6YY"), pos: "50% 50%", kicker: `The archive · ${Object.keys(venues).length} venues`, title: `${films.length} films. <em>One story each.</em>`, sub: "Kualoa Ranch, Lanikuhonua, Four Seasons Oahu, Turtle Bay and more." }],
    ["experience", { img: frame("WGo_VWh5wRI", "-2"), pos: "50% 40%", kicker: "The experience", title: "Filmed with heart.<br><em>Planned with care.</em>", sub: "From your first hello to the film you'll replay every anniversary." }],
    ["contact", { img: frame("uX9gSYDRctw"), pos: "50% 50%", kicker: "Now booking · Hawaii & destination", title: "So what's <em>your story?</em>", sub: "Check your date. One wedding per day." }],
  ];
  const jobs = pages.map(([name, c]) => [path.join(OUT, name + ".jpg"), c]);
  for (const f of films) {
    const v = venueOf(f);
    jobs.push([path.join(OUT, "films", f.slug + ".jpg"), {
      img: frame(f.video, f.cover), kicker: "A wedding film by Mark Arista",
      title: f.couple.replace(" + ", " <em>+</em> "), sub: `${v.name} · ${v.area}`,
    }]);
  }

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [out, c] of jobs) {
    await p.setContent(card(c), { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: out, type: "jpeg", quality: 84 });
  }
  // Home-screen icon (iPhone "Add to Home Screen", some share sheets) and a PNG favicon.
  const icon = await b.newPage({ viewport: { width: 180, height: 180 } });
  await icon.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400&display=block"></head>
<body style="margin:0;width:180px;height:180px;background:#0b0907;display:grid;place-items:center"><span style="font-family:Fraunces;font-style:italic;font-size:86px;color:#f4ecdf;letter-spacing:-.04em;line-height:1">MA</span>
<i style="position:absolute;right:20px;top:20px;width:14px;height:14px;border-radius:50%;background:#ef5a2c"></i></body></html>`, { waitUntil: "networkidle" });
  await icon.evaluate(() => document.fonts.ready);
  await icon.screenshot({ path: path.join(ROOT, "assets/img/apple-touch-icon.png") });
  await icon.setViewportSize({ width: 180, height: 180 });
  await b.close();
  console.log("wrote", jobs.length, "cards + icon");
})();
