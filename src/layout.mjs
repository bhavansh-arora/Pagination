import { site } from "./data.mjs";

export const ic = {
  arrow: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
  arrowUR: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" stroke="currentColor" stroke-width="1.6"/></svg>`,
  play: `<svg class="play-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`,
  star: `<svg class="tape__star" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 0l3.2 12.3L34.1 5.9l-6.4 10.9L40 20l-12.3 3.2 6.4 10.9-10.9-6.4L20 40l-3.2-12.3-10.9 6.4 6.4-10.9L0 20l12.3-3.2L5.9 5.9l10.9 6.4z"/></svg>`,
  back: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 2.5 8 7 12.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
};

export const btn = (href, text, cls = "btn--ember", extra = "") =>
  `<a class="btn ${cls}" href="${href}" ${extra}><span>${text}</span><span class="btn__ic">${ic.arrow}</span></a>`;

const nav = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["films.html", "Films"],
  ["experience.html", "Experience"],
  ["contact.html", "Contact"],
];

export function head({ title, description, base = "", path = "", image = "assets/img/films/OAF6KZrBGzk.jpg", jsonld = [] }) {
  const url = `${site.url}/${path}`;
  const og = `${site.url}/${image}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#0c0a08">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${base}assets/css/style.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>`;
}

export function header({ base = "", active = "" }) {
  const links = nav
    .filter(([h]) => h !== "index.html")
    .map(([h, t]) => `<a href="${base}${h}"${active === h ? ' aria-current="page"' : ""}>${t}</a>`)
    .join("");
  const mlinks = nav
    .map(([h, t], i) => `<a href="${base}${h}"${active === h ? ' aria-current="page"' : ""}><small>0${i + 1}</small>${t}</a>`)
    .join("");
  return `<body>
<a class="skip" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="curtain" aria-hidden="true"><span class="curtain__mark">Mark Arista — Films</span></div>
<div class="cursor" aria-hidden="true"></div>
<header class="header">
  <div class="wrap">
    <a class="logo" href="${base}index.html" aria-label="Mark Arista Films — home">
      <span class="logo__name">Mark Arista</span>
      <span class="logo__sub">Films · Hawaii</span>
    </a>
    <nav class="nav" aria-label="Primary">${links}</nav>
    <div class="header__end">
      <a class="btn btn--ember btn--sm header__cta" href="${base}contact.html"><span>Check your date</span><span class="btn__ic">${ic.arrow}</span></a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <nav class="menu__links" aria-label="Mobile">${mlinks}</nav>
  <div class="menu__foot">
    <a href="mailto:${site.email}">${site.email}</a>
    <a href="${site.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
  </div>
</div>`;
}

export function footer({ base = "", mbar = true }) {
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__intro">
        <p class="label label--dot">Booking weddings across Hawaii &amp; beyond</p>
        <p class="h3">Your love story is worth <span class="it">telling.</span></p>
        <div>${btn(base + "contact.html", "Check your date")}</div>
      </div>
      <div class="footer__col">
        <p class="label">Explore</p>
        ${nav.map(([h, t]) => `<a href="${base}${h}">${t}</a>`).join("")}
      </div>
      <div class="footer__col">
        <p class="label">Say hello</p>
        <a href="mailto:${site.email}">${site.email}</a>
        <a href="${site.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
        <a href="${site.facebook}" target="_blank" rel="noopener">Facebook ↗</a>
      </div>
      <div class="footer__col">
        <p class="label">In Hawaii it's</p>
        <span class="h4" style="color:var(--cream)" data-clock>—</span>
        <span>Mahalo · Salamat po</span>
      </div>
    </div>
    <p class="footer__word" aria-hidden="true">Mark <span class="it">Arista</span></p>
    <div class="footer__bar">
      <span>© <span data-year>2026</span> Mark Arista Films · Hawaii Wedding Videographer</span>
      <span>Website by <a href="https://codebunny.net" target="_blank" rel="noopener">Code Bunny</a></span>
    </div>
  </div>
</footer>
${mbar ? `<div class="mbar" aria-label="Quick actions">
  <a class="btn btn--ember" href="${base}contact.html"><span>Check your date</span></a>
  <a class="mbar__films" href="${base}films.html">Films</a>
</div>` : ""}
<div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Film player">
  <div class="lightbox__bg" data-close></div>
  <button class="lightbox__close" type="button" data-close><span class="label">Close</span><i aria-hidden="true">✕</i></button>
  <div class="lightbox__frame"></div>
  <p class="lightbox__cap label"></p>
</div>
<script src="${base}assets/js/config.js"></script>
<script src="${base}assets/vendor/gsap.min.js" defer></script>
<script src="${base}assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="${base}assets/vendor/lenis.min.js" defer></script>
<script src="${base}assets/js/main.js" defer></script>
</body>
</html>`;
}

export const ctaBlock = ({ base = "", image = "assets/img/films/uX9gSYDRctw.jpg", film = "" }) => `
<section class="section cta" aria-labelledby="cta-title">
  <div class="cta__bg"><img src="${base}${image}" alt="" loading="lazy" data-parallax="12"></div>
  <div class="wrap">
    <p class="label label--dot" data-reveal>Now booking · Hawaii &amp; destination</p>
    <h2 class="display cta__title" id="cta-title" data-split>So what's <span class="it">your story?</span></h2>
    <p class="lead cta__lead" data-reveal style="--d:.2s">Tell me about the two of you, your people and your plans. I read every message personally.</p>
    <div class="cta__btn" data-reveal style="--d:.3s"><span class="magnet" data-magnetic="0.35">${btn(`${base}contact.html${film ? `?film=${film}` : ""}`, "Check your date")}</span></div>
  </div>
</section>`;
