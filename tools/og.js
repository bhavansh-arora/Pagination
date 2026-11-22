// Renders Open Graph share images (1200x630) from the live local site assets.
// Usage: (serve ./public on :8080) node tools/og.js
const { chromium } = require('playwright');
const path = require('path');
const cards = [
  { file: 'og-default.jpg', eyebrow: 'Web design & development studio', title: 'Websites that win you <em>clients.</em>', shots: ['dan-reynolds-photography', 'highfifteen', 'ecohorizon'] },
  { file: 'og-preview.jpg', eyebrow: 'Free website preview', title: 'See your new website <em>before you pay.</em>', shots: ['aristafilms', 'sunflow', 'capturedbykatherine'] },
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const c of cards) {
    const imgs = c.shots.map((s, i) => `<img src="/assets/img/work/${s}-640.webp" style="position:absolute;width:520px;border-radius:14px;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 60px -20px #000;left:${700 + i * 70}px;top:${70 + i * 150}px;transform:rotate(${-6 + i * 4}deg)">`).join('');
    await p.goto('http://localhost:8080/404.html');
    await p.setContent(`<html><head><link rel="stylesheet" href="http://localhost:8080/assets/css/site.css"></head><body style="margin:0;width:1200px;height:630px;overflow:hidden;background:#0b1628;position:relative;opacity:1">
      <div style="position:absolute;inset:0;background:radial-gradient(50% 60% at 80% 40%,rgba(201,158,84,.26),transparent 70%)"></div>
      ${imgs.replace(/src="\//g, 'src="http://localhost:8080/')}
      <div style="position:absolute;left:64px;top:60px;display:flex;align-items:center;gap:14px"><img src="http://localhost:8080/assets/img/brand/bunny.webp" width="56" height="56"><img src="http://localhost:8080/assets/img/brand/wordmark.webp" width="200"></div>
      <div style="position:absolute;left:64px;bottom:70px;width:640px"><div class="eyebrow" style="margin-bottom:22px">${c.eyebrow}</div>
      <div class="display" style="font-size:78px;color:#f4efe4">${c.title}</div><div style="margin-top:22px;color:#aeb7c6;font-size:22px">codebunny.net</div></div></body></html>`);
    await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(__dirname, '..', 'public/assets/img/og', c.file), type: 'jpeg', quality: 86 });
  }
  await b.close();
})();

// ---- Blog share images: one per article (reads tools/.og-blog.json written by build.py)
(async () => {
  const fs = require('fs');
  const file = path.join(__dirname, '.og-blog.json');
  if (!fs.existsSync(file)) return;
  const posts = JSON.parse(fs.readFileSync(file, 'utf8'));
  const outDir = path.join(__dirname, '..', 'public/assets/img/og/blog');
  fs.mkdirSync(outDir, { recursive: true });
  const only = process.argv.includes('--all') ? null : (s) => !fs.existsSync(path.join(outDir, s + '.jpg'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('http://localhost:8080/404.html');
  const H = 'http://localhost:8080';
  let n = 0;
  for (const a of posts) {
    if (only && !only(a.slug)) continue;
    const size = a.title.length > 70 ? 50 : a.title.length > 50 ? 58 : 68;
    await p.setContent(`<html><head><link rel="stylesheet" href="${H}/assets/css/site.css"></head><body style="margin:0;width:1200px;height:630px;overflow:hidden;background:#0b1628;position:relative;opacity:1">
      <div style="position:absolute;inset:0;background:radial-gradient(45% 60% at 85% 35%,${a.hue}55,transparent 70%),radial-gradient(40% 50% at 0% 100%,${a.hue}22,transparent 70%)"></div>
      <img src="${H}/assets/img/work/${a.shot}-640.webp" style="position:absolute;width:520px;right:-70px;top:150px;border-radius:14px;border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 80px -20px #000;transform:rotate(-5deg)">
      <div style="position:absolute;left:64px;top:56px;display:flex;align-items:center;gap:14px"><img src="${H}/assets/img/brand/bunny.webp" width="52" height="52"><img src="${H}/assets/img/brand/wordmark.webp" width="180"></div>
      <div style="position:absolute;left:64px;bottom:64px;width:690px"><div style="display:flex;align-items:center;gap:10px;font:500 17px Geist,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#aeb7c6;margin-bottom:20px"><span style="width:10px;height:10px;border-radius:50%;background:${a.hue}"></span>${a.cat}</div>
      <div class="display" style="font-size:${size}px;line-height:1.02;color:#f4efe4">${a.title.replace(/&/g, '&amp;')}</div><div style="margin-top:22px;color:#75829a;font:400 20px Geist,sans-serif">codebunny.net/blog</div></div></body></html>`);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(outDir, a.slug + '.jpg'), type: 'jpeg', quality: 80 });
    n++;
  }
  console.log('blog og images rendered:', n);
  await b.close();
})();
