// Renders Open Graph share images (1200x630) from the live local site assets.
// Usage: (serve ./public on :8080) node tools/og.js
const { chromium } = require('playwright');
const path = require('path');
const cards = [
  { file: 'og-default.jpg', eyebrow: 'Web design & development studio', title: 'Websites that win you <em>clients</em>, not compliments.', shots: ['dan-reynolds-photography', 'highfifteen', 'ecohorizon'] },
  { file: 'og-preview.jpg', eyebrow: 'Free website preview', title: 'See your new website <em>before you pay.</em>', shots: ['aristafilms', 'sunflow', 'capturedbykatherine'] },
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of cards) {
    const imgs = c.shots.map((s, i) => `<img src="/assets/img/work/${s}-640.webp" style="position:absolute;width:520px;border-radius:14px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 60px -20px #000;left:${700 + i * 70}px;top:${70 + i * 150}px;transform:rotate(${-6 + i * 4}deg)">`).join('');
    await p.goto('http://localhost:8080/404.html');
    await p.setContent(`<html><head><link rel="stylesheet" href="http://localhost:8080/assets/css/site.css"></head><body style="margin:0;width:1200px;height:630px;overflow:hidden;background:#0d0b0a;position:relative;opacity:1">
      <div style="position:absolute;inset:0;background:radial-gradient(50% 60% at 80% 40%,rgba(242,146,40,.28),transparent 70%)"></div>
      ${imgs.replace(/src="\//g, 'src="http://localhost:8080/')}
      <div style="position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:14px"><img src="http://localhost:8080/assets/img/brand/bunny.webp" width="56" height="56"><img src="http://localhost:8080/assets/img/brand/wordmark.webp" width="200"></div>
      <div style="position:absolute;left:64px;bottom:70px;width:640px"><div class="eyebrow" style="margin-bottom:22px">${c.eyebrow}</div>
      <div class="display" style="font-size:78px;color:#f3ece3">${c.title}</div><div style="margin-top:22px;color:#b3a99e;font-size:22px">codebunny.net</div></div></body></html>`);
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(__dirname, '..', 'public/assets/img/og', c.file), type: 'jpeg', quality: 86 });
  }
  await b.close();
})();
