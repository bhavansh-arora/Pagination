import { site, films, frame, frameSm, frames, venueOf, regions, reviews } from "./data.mjs";

export const ic = {
  arrow: `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
  arrowUR: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" stroke="currentColor" stroke-width="1.6"/></svg>`,
  play: `<svg class="play-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`,
  star: `<svg class="star-ic" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 0l3.2 12.3L34.1 5.9l-6.4 10.9L40 20l-12.3 3.2 6.4 10.9-10.9-6.4L20 40l-3.2-12.3-10.9 6.4 6.4-10.9L0 20l12.3-3.2L5.9 5.9l10.9 6.4z"/></svg>`,
  rate: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>`,
  back: `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 2.5 8 7 12.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
  prev: `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M14 8H3M7 3.5 2.5 8 7 12.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

export const stars = () => `<span class="stars" aria-label="5 out of 5 stars">${ic.rate.repeat(5)}</span>`;

export const btn = (href, text, cls = "btn--ember", extra = "") =>
  `<a class="btn ${cls}" href="${href}" ${extra}><span>${text}</span><span class="btn__ic">${ic.arrow}</span></a>`;

/** Responsive frame image. */
export const im = (base, id, suffix = "", { alt = "", sizes = "100vw", cls = "", eager = false, attrs = "" } = {}) =>
  `<img${cls ? ` class="${cls}"` : ""} src="${base}${frame(id, suffix)}" srcset="${base}${frameSm(id, suffix)} 640w, ${base}${frame(id, suffix)} 1280w" sizes="${sizes}" alt="${alt}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${attrs}>`;

const regionLabel = (id) => regions.find((r) => r.id === id)?.label || "";
export const pad = (n) => String(n).padStart(2, "0");

/** Film card with hover "scrub" preview through the film's four frames. */
export const scrubCard = (base, f, { sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw", n = null, cls = "" } = {}) => {
  const v = venueOf(f);
  const fr = frames(f);
  return `<article class="fcard ${cls}" data-region="${f.region}" data-venue="${f.venue}">
  <a class="scrub" href="${base}films/${f.slug}.html" data-cursor="Watch" aria-label="${f.couple} — ${v.name}">
    ${fr.map((s, k) => im(base, f.video, s, { alt: k === 0 ? `${f.couple} at ${v.name}` : "", sizes, cls: k === 0 ? "is-on" : "" })).join("\n    ")}
    <span class="scrub__bar" aria-hidden="true">${fr.map(() => "<i></i>").join("")}</span>
    <span class="scrub__tag">${v.name}</span>
    ${n !== null ? `<span class="scrub__n">${pad(n)}</span>` : ""}
  </a>
  <div class="fcard__row">
    <div>
      <h3 class="fcard__title"><a href="${base}films/${f.slug}.html">${f.couple}</a></h3>
      <p class="fcard__sub">${v.area} · ${f.tags.slice(0, 2).join(", ")}</p>
    </div>
    <button class="fcard__play" type="button" data-video="${f.video}" data-title="${f.couple} — ${v.name}" aria-label="Play ${f.couple} film">${ic.play}</button>
  </div>
</article>`;
};

/** Continuous film-strip marquee of frames. */
export const filmStrip = (base, list, { dir = -1, small = false } = {}) =>
  `<div class="strip${small ? " strip--sm" : ""}" aria-hidden="true"><div class="strip__track" data-marquee="${dir}"><div class="strip__set">${list
    .map(([id, s]) => `<span class="strip__cell">${im(base, id, s, { sizes: small ? "220px" : "420px" })}</span>`)
    .join("")}</div></div></div>`;

const nav = [
  ["index.html", "Home"],
  ["films.html", "Films"],
  ["about.html", "About"],
  ["experience.html", "Experience"],
  ["contact.html", "Contact"],
];

export function head({ title, description, base = "", path = "", image = frame("hzfBBlhqEzI"), jsonld = [], preload = "" }) {
  const url = `${site.url}/${path}`;
  const og = `${site.url}/${image}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#0b0907">
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
<link rel="preconnect" href="https://www.youtube-nocookie.com">
${preload ? `<link rel="preload" as="image" href="${base}${preload}">` : ""}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${base}assets/css/style.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>`;
}

export function header({ base = "", active = "", overlay = true }) {
  const links = nav
    .filter(([h]) => h !== "index.html")
    .map(([h, t]) => `<a href="${base}${h}"${active === h ? ' aria-current="page"' : ""}>${t}${h === "films.html" ? `<sup>${films.length}</sup>` : ""}</a>`)
    .join("");
  const mlinks = nav
    .map(([h, t], i) => `<a href="${base}${h}"${active === h ? ' aria-current="page"' : ""}><small>0${i + 1}</small>${t}</a>`)
    .join("");
  return `<body${overlay ? "" : ' class="solid-top"'}>
<a class="skip" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="curtain" aria-hidden="true">
  <div class="curtain__p curtain__p--t"></div><div class="curtain__p curtain__p--b"></div>
  <div class="curtain__in"><span class="label curtain__eyebrow">Mark Arista Films</span><span class="curtain__name" data-curtain-name></span><i class="curtain__line"></i></div>
</div>
<script>try{var n=sessionStorage.getItem("ma-dest");if(n){document.querySelector("[data-curtain-name]").textContent=n;sessionStorage.removeItem("ma-dest")}}catch(e){}</script>
<div class="cursor" aria-hidden="true"></div>
<header class="header">
  <div class="wrap">
    <a class="logo" href="${base}index.html" aria-label="Mark Arista Films — home">
      <span class="logo__mark" aria-hidden="true">MA</span>
      <span class="logo__txt"><span class="logo__name">Mark Arista</span><span class="logo__sub">Films · Hawaii</span></span>
    </a>
    <nav class="nav" aria-label="Primary">${links}</nav>
    <div class="header__end">
      <a class="header__rate" href="${reviews.sourceUrl}" target="_blank" rel="noopener" aria-label="${reviews.rating} stars from ${reviews.count} reviews">${ic.rate}<b>${reviews.rating}</b><span>· ${reviews.count} reviews</span></a>
      <a class="btn btn--ember btn--sm header__cta" href="${base}contact.html"><span>Check your date</span><span class="btn__ic">${ic.arrow}</span></a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="menu__media" aria-hidden="true">${im(base, "OAF6KZrBGzk", "", { sizes: "100vw" })}</div>
  <nav class="menu__links" aria-label="Mobile">${mlinks}</nav>
  <div class="menu__foot">
    <a href="mailto:${site.email}">${site.email}</a>
    <a href="${site.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
  </div>
</div>`;
}

const footStrip = [["0RURO9MIxn4", "-3"], ["Ch_mROgi6YY", "-2"], ["itpNCKYn7B4", "-3"], ["z1kxigj8sno", ""], ["OAF6KZrBGzk", ""], ["WGo_VWh5wRI", "-3"], ["EiA5wwhOABk", ""], ["VGLLFgRVSeI", "-1"]];

const letters = (word, cls = "") => [...word].map((ch, i) => `<span class="fl${cls}" style="--i:${i}">${ch}</span>`).join("");
const flink = (href, text, ext = false) => `<a class="flink" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}><span data-t="${text}">${text}</span></a>`;

export function footer({ base = "", mbar = true }) {
  return `<footer class="footer" data-footer>
  <div class="footer__glow" aria-hidden="true"></div>
  <div class="footer__in">
  <a class="fcta" href="${base}contact.html" data-cursor="Let's talk" aria-label="Let's tell your story — check your date">
    <span class="fcta__track" data-marquee="-1"><span class="fcta__set">${[1, 2, 3].map(() => `<span>Let's tell <i>your story</i></span>${ic.star}<span class="fcta__o">Now booking 2027</span>${ic.star}`).join("")}</span></span>
  </a>
  <div class="footer__grid wrap">
    <a class="footer__yt" href="${site.youtube}" target="_blank" rel="noopener">
      <span class="footer__ytlbl"><span class="label label--dot">Watch on YouTube</span><span class="h4">@bymarkarista · ${films.length} films ↗</span></span>
      <span class="footer__tiles"><span class="footer__track" data-marquee="-1"><span class="footer__set">${footStrip.map(([id, s]) => `<span>${im(base, id, s, { sizes: "200px" })}</span>`).join("")}</span></span></span>
    </a>
    <div class="footer__intro" data-reveal>
      <p class="label label--dot">Booking weddings across Hawaii &amp; beyond</p>
      <p class="footer__big">Your love story is worth <span class="it">telling.</span></p>
      <div class="btns">${btn(base + "contact.html", "Check your date")}<a class="btn btn--ghost btn--plain" href="mailto:${site.email}"><span>${site.email}</span></a></div>
    </div>
    <div class="footer__cols">
      <div class="footer__col" data-reveal style="--d:.05s"><p class="label">Explore</p>${nav.map(([h, t]) => flink(base + h, t)).join("")}</div>
      <div class="footer__col" data-reveal style="--d:.12s"><p class="label">Follow</p>${flink(site.instagram, "Instagram ↗", true)}${flink(site.youtube, "YouTube ↗", true)}${flink(site.facebook, "Facebook ↗", true)}${flink(reviews.sourceUrl, "WeddingWire ↗", true)}</div>
      <div class="footer__col" data-reveal style="--d:.19s"><p class="label">In Hawaii it's</p><span class="footer__clock"><i class="footer__sun" aria-hidden="true"></i><span data-clock>—</span></span><span>Mahalo · Salamat po</span></div>
    </div>
  </div>
  <div class="wrap"><p class="footer__word" aria-hidden="true" data-word><span class="fw">${letters("Mark")}</span><span class="fw fw--it">${letters("Arista", " it")}</span></p></div>
  <div class="wrap footer__bar">
    <span>© <span data-year>2026</span> Mark Arista Films · Hawaii Wedding Videographer</span>
    <button class="totop" type="button" data-totop>
      <span class="totop__ic"><svg class="totop__ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" pathLength="100"/></svg><span class="totop__arr"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" stroke-width="1.6"/></svg><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" stroke-width="1.6"/></svg></span></span>
      <span class="totop__t">Back to top</span>
    </button>
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
<div class="hoverimg" aria-hidden="true"><img alt=""></div>
<script src="${base}assets/js/config.js"></script>
<script src="${base}assets/vendor/gsap.min.js" defer></script>
<script src="${base}assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="${base}assets/vendor/lenis.min.js" defer></script>
<script src="${base}assets/js/main.js" defer></script>
</body>
</html>`;
}

/** Closing call-to-action with moving frame columns and an inline date check. */
const ctaCols = [
  [["Ch_mROgi6YY", "-1"], ["0RURO9MIxn4", "-2"], ["EiA5wwhOABk", "-2"], ["k77corBaJ34", "-2"]],
  [["VGLLFgRVSeI", "-2"], ["D3WDQ0Mj978", "-3"], ["PsfFnelv-0M", "-1"], ["hzfBBlhqEzI", "-1"]],
  [["oMNoO73MD5k", "-2"], ["lPcMcX9jjmM", "-1"], ["uX9gSYDRctw", "-2"], ["4CJ1LGkKKEg", "-3"]],
  [["itpNCKYn7B4", "-2"], ["CWCR__HvvXI", "-3"], ["nymMeuzS7Lo", ""], ["ITdsnRT57i4", "-1"]],
];
export const ctaBlock = ({ base = "", film = "" }) => `
<section class="cta" aria-labelledby="cta-title">
  <div class="cta__cols" aria-hidden="true">${ctaCols.map((col, k) => `<div class="cta__col${k % 2 ? " cta__col--down" : ""}"><div class="cta__colin">${[...col, ...col].map(([id, s]) => `<span>${im(base, id, s, { sizes: "25vw" })}</span>`).join("")}</div></div>`).join("")}</div>
  <div class="cta__panel">
    <p class="label label--dot">Now booking · Hawaii &amp; destination</p>
    <h2 class="display cta__title" id="cta-title" data-split>So what's <span class="it">your story?</span></h2>
    <p class="cta__lead">Tell me about the two of you, your people and your plans. One wedding per day — so dates go first come, first served.</p>
    <form class="datecheck" action="${base}contact.html" method="get">
      <label class="sr-only" for="dc-date">Your wedding date</label>
      <input id="dc-date" name="date" type="date" required>
      ${film ? `<input type="hidden" name="film" value="${film}">` : ""}
      <button class="btn btn--ember" type="submit"><span>Check my date</span><span class="btn__ic">${ic.arrow}</span></button>
    </form>
    <p class="cta__meta">${stars()} <span>${reviews.rating} from ${reviews.count} couples on ${reviews.source}</span></p>
  </div>
</section>`;

export { regionLabel };
