// Captures a desktop (and, for featured work, a mobile) screenshot of every
// project in tools/projects.json. Usage: node tools/screenshots.js [slug ...]
// Output: tools/.shots/<slug>.png and <slug>-m.png  (then run tools/optimize.py)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const projects = require('./projects.json');
const only = process.argv.slice(2);
const out = path.join(__dirname, '.shots');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const list = projects.filter(p => !only.length || only.includes(p.slug));
  const queue = [...list];
  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      const jobs = [{ suffix: '', viewport: { width: 1440, height: 900 }, mobile: false }];
      if (p.featured) jobs.push({ suffix: '-m', viewport: { width: 390, height: 844 }, mobile: true });
      for (const j of jobs) {
        const ctx = await browser.newContext({ viewport: j.viewport, deviceScaleFactor: j.mobile ? 2 : 1, isMobile: j.mobile, hasTouch: j.mobile, ignoreHTTPSErrors: true });
        const page = await ctx.newPage();
        try {
          await page.goto(p.url, { waitUntil: 'load', timeout: 45000 });
          await page.waitForTimeout(+process.env.WAIT || 3500);
          await page.screenshot({ path: path.join(out, p.slug + j.suffix + '.png') });
          console.log('ok', p.slug + j.suffix);
        } catch (e) {
          console.log('FAIL', p.slug + j.suffix, e.message.split('\n')[0]);
        }
        await ctx.close();
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  await browser.close();
})();
