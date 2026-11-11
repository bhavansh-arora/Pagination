import { site, films, regions, venues, featured, reviews, venueOf, venueCount, frame, frameSm, frames, cover, storyOf } from "./data.mjs";
import { readFileSync } from "node:fs";
import { head, header, footer, btn, ic, im, pad, scrubCard, filmStrip, ctaBlock, stars, regionLabel } from "./layout.mjs";

const bySlug = (s) => films.find((f) => f.slug === s);
// Real picture shape of each film (width / height without letterbox bars), from tools/frames.py.
const aspects = JSON.parse(readFileSync(new URL("./aspects.json", import.meta.url), "utf8"));
const aspect = (id) => aspects[id] || 1.778;
const venueKeys = Object.keys(venues).sort((a, b) => venueCount(b) - venueCount(a));
const paliku = venueCount("paliku");

const orgLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.name,
  alternateName: site.person,
  description: "Hawaii wedding videographer creating story-led wedding films with Filipino warmth.",
  url: site.url,
  email: site.email,
  image: `${site.url}/assets/img/mark-arista.jpg`,
  areaServed: ["Oahu", "Hawaii Island", "Maui", "Kauai", "Hawaii", "Destination"],
  address: { "@type": "PostalAddress", addressRegion: "HI", addressCountry: "US" },
  sameAs: [site.instagram, site.facebook, site.youtube],
  aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.rating, reviewCount: reviews.count, bestRating: "5" },
};

const label = (n, t) => `<p class="label scene" data-reveal><b>Sc. ${pad(n)}</b> ${t}</p>`;

/* Shared: stats bento */
const statsBento = (base) => `
<div class="bento">
  <div class="bento__c bento__c--img">${im(base, "Ch_mROgi6YY", "-2", { sizes: "(min-width:1024px) 22vw, 50vw" })}<b>${films.length}</b><span>wedding films, all public on YouTube</span></div>
  <div class="bento__c"><b>${reviews.rating}</b>${stars()}<span>${reviews.count} reviews on ${reviews.source}</span></div>
  <div class="bento__c"><b>${paliku}</b><span>films at Kualoa Ranch's Paliku Gardens alone</span></div>
  <div class="bento__c bento__c--ember"><b>1</b><span>wedding per day. Multi-camera, with drone where allowed</span></div>
</div>`;

/* Shared: venue index rows */
const venueRows = (base, keys = venueKeys) => `<ol class="vlist">${keys
  .map((k, i) => {
    const v = venues[k];
    const c = venueCount(k);
    return `<li><a class="vrow" href="${base}films.html?venue=${k}" data-vp-img="${base}${frame(v.img, v.imgSuffix || "")}" data-vp-name="${v.name}" data-vp-area="${v.area}">
      <span class="vrow__thumb">${im(base, v.img, v.imgSuffix || "", { sizes: "96px" })}</span>
      <span class="vrow__n">${pad(i + 1)}</span>
      <span class="vrow__name">${v.name}</span>
      <span class="vrow__area">${v.area}</span>
      <span class="vrow__count">${c} film${c > 1 ? "s" : ""}</span>
      ${ic.arrowUR}
    </a></li>`;
  })
  .join("")}</ol>`;

/* Shared: review carousel */
const quoteCarousel = (base) => `
<section class="quotes" aria-labelledby="quotes-title" data-carousel>
  <div class="quotes__bg" aria-hidden="true">${im(base, "46cY5x1gD50", "", { sizes: "100vw" })}</div>
  <div class="wrap quotes__in">
    <div class="quotes__head">
      <p class="label label--dot" id="quotes-title">Kind words · ${reviews.source}</p>
      <a class="quotes__score" href="${reviews.sourceUrl}" target="_blank" rel="noopener"><b>${reviews.rating}</b>${stars()}<span>${reviews.count} reviews · 100% recommend ↗</span></a>
    </div>
    <div class="quotes__slides">
      ${reviews.items.map((r, i) => `<figure class="quote${i === 0 ? " is-on" : ""}" aria-hidden="${i !== 0}">
        <blockquote>“${r.q}”</blockquote>
        <figcaption><b>${r.n}</b><span class="label">${r.s}</span></figcaption>
      </figure>`).join("")}
    </div>
    <div class="quotes__nav">
      <button type="button" class="qbtn" data-prev aria-label="Previous review">${ic.prev}</button>
      <div class="quotes__dots">${reviews.items.map((_, i) => `<button type="button" aria-label="Review ${i + 1}"${i === 0 ? ' class="is-on"' : ""}><i></i></button>`).join("")}</div>
      <button type="button" class="qbtn" data-next aria-label="Next review">${ic.arrow}</button>
      <span class="label quotes__count"><span data-qi>01</span> / ${pad(reviews.items.length)}</span>
    </div>
  </div>
</section>`;

/* ============================== HOME ============================== */
export function home() {
  const base = "";
  const hv = bySlug("spencer-jenn");
  const heroSlides = [["hzfBBlhqEzI", ""], ["OAF6KZrBGzk", ""], ["Ch_mROgi6YY", ""], ["EiA5wwhOABk", ""], ["itpNCKYn7B4", "-2"]];
  const strip1 = [["0RURO9MIxn4", "-1"], ["46cY5x1gD50", ""], ["itpNCKYn7B4", "-2"], ["4CJ1LGkKKEg", ""], ["PsfFnelv-0M", "-1"], ["Ch_mROgi6YY", "-2"], ["VGLLFgRVSeI", "-1"], ["oMNoO73MD5k", ""], ["k77corBaJ34", "-1"], ["ik5kS-oYUXM", ""], ["DOKLGe2c1pM", ""], ["ITdsnRT57i4", "-1"], ["m2EHcSTe5ec", ""], ["hQkW0HfhK3Y", "-3"]];
  const reel = featured.map(bySlug);
  const people = [
    { id: "0RURO9MIxn4", s: "-2", c: "Cafe Julia, Honolulu", cls: "t1" },
    { id: "CWCR__HvvXI", s: "-3", c: "Hawaiian blessing", cls: "t2" },
    { id: "z1kxigj8sno", s: "", c: "Iglesia Ni Cristo", cls: "t3" },
    { id: "WGo_VWh5wRI", s: "-3", c: "Four Seasons Oahu", cls: "t5" },
    { id: "itpNCKYn7B4", s: "-3", c: "Salt Lake City", cls: "t6" },
    { id: "D3WDQ0Mj978", s: "-3", c: "Paliku Gardens", cls: "t7" },
    { id: "vcLTSUN_kzI", s: "-2", c: "Turtle Bay", cls: "t8" },
  ];
  const steps = [
    ["Say hello", "Share your date, venue and a little about you two. Two minutes, tops.", "ITdsnRT57i4", "-1"],
    ["Let's talk story", "A relaxed call: how you met, who matters most, what you want to feel.", "oMNoO73MD5k", "-2"],
    ["Plan the moments", "Timeline, traditions and the people not to miss — so you can stay present.", "4CJ1LGkKKEg", "-3"],
    ["Relive it", "Your film arrives — the one you'll press play on every anniversary.", "itpNCKYn7B4", "-2"],
  ];

  return `${head({
    title: "Mark Arista Films — Hawaii Wedding Videographer",
    description: `Hawaii wedding videographer Mark Arista. ${films.length} story-led wedding films with Filipino warmth — Kualoa Ranch, Lanikuhonua, Four Seasons Oahu and beyond. 5.0 from ${reviews.count} reviews.`,
    path: "",
    jsonld: [orgLd],
  })}
${header({ active: "index.html" })}
<div class="loader" aria-hidden="true">
  <div class="loader__panel loader__panel--t"></div>
  <div class="loader__panel loader__panel--b"></div>
  <div class="loader__in">
    <p class="label loader__eyebrow">Hawaii wedding films</p>
    <p class="loader__name"><span class="ln">${[..."Mark"].map((c, i) => `<span style="--i:${i}">${c}</span>`).join("")}</span> <span class="ln ln--it">${[..."Arista"].map((c, i) => `<span style="--i:${i + 4}">${c}</span>`).join("")}</span></p>
    <div class="loader__line"><i></i></div>
    <p class="label loader__status"><span class="loader__dot"></span><span data-status>Loading the film</span></p>
  </div>
</div>
<main id="main">

<section class="vhero vhero--video" data-yt="${site.heroVideo.id}" data-start="${site.heroVideo.start}" style="--ar:${aspect(site.heroVideo.id)}" aria-label="Introduction">
  <div class="vhero__media" aria-hidden="true">
    ${heroSlides.map(([id, s], i) => `<div class="vhero__slide${i === 0 ? " is-active" : ""}">${im(base, id, s, { sizes: "100vw" })}</div>`).join("\n    ")}
    <div class="vhero__yt"></div>
  </div>
  <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="vhero__hud wrap" aria-hidden="true">
    <span class="label rec">Rec <span class="tc" data-timecode>00:00:00:00</span></span>
    <span class="label hide-sm">4K · 24 fps · Hawaii</span>
  </div>
  <div class="vhero__body wrap">
    <div class="vhero__now" data-reveal data-hold>
      <span class="label">Now playing</span>
      <span class="vhero__nowt">${hv.couple} <i>·</i> ${venueOf(hv).name}</span>
      <button type="button" class="vhero__sound" data-video="${hv.video}" data-title="${hv.couple} — ${venueOf(hv).name}">${ic.sound}<span>Watch with sound</span></button>
    </div>
    <p class="label label--dot vhero__kicker" data-reveal data-hold>Hawaii wedding films · Filipino warmth</p>
    <h1 class="display vhero__title" data-split data-hold>Your love story is worth <span class="it">telling.</span></h1>
    <div class="vhero__foot" data-reveal data-hold>
      <p class="lead">Films centered entirely on you — your love, and the whole community surrounding you on your biggest day.</p>
      <div class="btns">${btn("contact.html", "Check your date")}<a class="btn btn--ghost" href="films.html"><span>Watch ${films.length} films</span><span class="btn__ic">${ic.play}</span></a></div>
    </div>
  </div>
  <div class="proof" data-reveal data-hold>
    <div class="wrap proof__in">
      <div><b>${films.length}</b><span>wedding films<br>on YouTube</span></div>
      <div><b>${reviews.rating}<i>★</i></b><span>${reviews.count} reviews<br>on ${reviews.source}</span></div>
      <div><b>${paliku}</b><span>films at<br>Kualoa Ranch</span></div>
      <div><b>${Object.keys(venues).length}</b><span>venues, Oahu to<br>Kona, Utah, Texas &amp; Yosemite</span></div>
    </div>
  </div>
</section>

${filmStrip(base, strip1)}

<section class="section hello" aria-labelledby="hello-title">
  <div class="wrap hello__grid">
    <div class="hello__media" aria-hidden="true">
      <figure class="hp hp--1" data-reveal>${`<img src="assets/img/mark-lens.jpg" alt="" loading="lazy">`}</figure>
      <figure class="hp hp--2" data-reveal style="--d:.1s"><img src="assets/img/mark-smile.jpg" alt="" loading="lazy"></figure>
      <figure class="hp hp--3" data-reveal style="--d:.2s"><img src="assets/img/mark-crouch.jpg" alt="" loading="lazy"></figure>
      <div class="badge"><svg viewBox="0 0 132 132"><defs><path id="c1" d="M66 66m-50 0a50 50 0 1 1 100 0a50 50 0 1 1-100 0"/></defs><text font-family="JetBrains Mono, monospace" font-size="10.5" letter-spacing="3.6" fill="#fff"><textPath href="#c1">ALOHA · MABUHAY · ALOHA · MABUHAY ·</textPath></text></svg><span>Two<br>homes</span></div>
    </div>
    <div class="hello__text">
      ${label(1, "Hello")}
      <h2 class="statement" id="hello-title" data-split>Hi there! I'm Mark — your Hawaii wedding filmmaker, with <span class="it">Filipino warmth</span> and a creative heart.</h2>
      <p class="body" data-reveal>Whether your celebration takes you to a Hawaiian beach and mountains, a classic church, or beneath the stars, I'm there to capture the magic — transforming once-in-a-lifetime moments into a story you'll relive for a lifetime.</p>
      <div class="hello__sign" data-reveal><span class="it">Mark Arista</span><span class="label">Founder · Filmmaker · Oahu</span><a class="link" href="about.html">My story ${ic.arrow}</a></div>
      ${statsBento(base)}
    </div>
  </div>
</section>

<section class="reel" aria-labelledby="reel-title">
  <div class="reel__pin">
    <div class="wrap reel__head">
      <div>${label(2, "Recent films")}<h2 class="display display--h2" id="reel-title" data-split>Real couples. <span class="it">Real islands.</span></h2></div>
      <div class="reel__meta"><p class="body">Move across a film to scrub through it. Tap to watch.</p>${btn("films.html", `All ${films.length} films`, "btn--ghost")}</div>
    </div>
    <div class="reel__viewport">
      <div class="reel__track">
        ${reel.map((f, i) => scrubCard(base, f, { n: i + 1, cls: "reel__card", sizes: "(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw" })).join("\n        ")}
        <a class="reel__end" href="films.html"><span class="label">The archive</span><b>${films.length}</b><span class="h4">films. Find one from your venue →</span></a>
      </div>
    </div>
    <div class="wrap reel__prog" aria-hidden="true"><i></i></div>
  </div>
</section>

<section class="section light people" aria-labelledby="people-title">
  <div class="wrap">
    <div class="people__head">
      ${label(3, "Your people")}
      <h2 class="display display--h2" id="people-title" data-split>Hawaiian light. <span class="it">Filipino heart.</span></h2>
      <p class="lead" data-reveal>The islands give every film its setting. My Filipino roots give it its soul — the lolas, titos, cousins and best friends who show up for you. They belong in the film.</p>
    </div>
    <div class="mosaic">
      ${people.map((p) => `<figure class="mosaic__t ${p.cls}" data-reveal>${im(base, p.id, p.s, { sizes: p.cls === "t1" ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 50vw" })}<figcaption>${p.c}</figcaption></figure>`).join("\n      ")}
      <div class="mosaic__t t4 mosaic__txt" data-reveal>
        <p>From the lei exchange to the veil, cord and arras — traditions filmed with understanding, not just coverage.</p>
        <div class="chips"><span class="chip">Lei exchange</span><span class="chip">Hawaiian blessing</span><span class="chip">Veil, cord &amp; arras</span><span class="chip">Money dance</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section venues" aria-labelledby="venues-title">
  <div class="wrap venues__grid">
    <div class="venues__side"><div>
      ${label(4, "Venues")}
      <h2 class="display display--h2" id="venues-title" data-split>Venues I know <span class="it">by heart.</span></h2>
      <p class="venues__big" data-reveal><b>${Object.keys(venues).length}</b> venues <span>·</span> <b>${films.length}</b> films</p>
      <p class="body" data-reveal>Already booked your venue? There's a good chance I've filmed there. Pick it to watch every film from it.</p>
      <figure class="vpreview" data-reveal>${im(base, venues.paliku.img, "", { sizes: "(min-width:1024px) 30vw, 100vw" })}<figcaption><span class="label" data-vp-area>${venues.paliku.area}</span><b data-vp-name>${venues.paliku.name}</b></figcaption></figure>
    </div></div>
    ${venueRows(base)}
  </div>
</section>

${quoteCarousel(base)}

<section class="section light" aria-labelledby="process-title">
  <div class="wrap">
    <div class="shead">
      ${label(5, "How it works")}
      <h2 class="display display--h2 shead__title" id="process-title" data-split>Four steps to <span class="it">your film.</span></h2>
      <div class="shead__end" data-reveal>${btn("experience.html", "The full experience", "btn--ghost")}</div>
    </div>
    <ol class="pcards">
      ${steps.map(([t, d, id, s], i) => `<li class="pcard" data-reveal style="--d:${i * 0.08}s">
        <div class="pcard__img">${im(base, id, s, { sizes: "(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw" })}<span class="pcard__n">${pad(i + 1)}</span></div>
        <h3 class="h4">${t}</h3><p>${d}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>

${ctaBlock({ base })}
</main>
${footer({})}`;
}

/* ============================== FILMS ============================== */
export function filmsPage() {
  const base = "";
  const all = films.map((f) => [f.video, f.cover]);
  const rowA = all.slice(0, 11), rowB = all.slice(11, 22), rowC = all.slice(22);
  const counts = Object.fromEntries(regions.map((r) => [r.id, films.filter((f) => f.region === r.id).length]));
  return `${head({
    title: `Wedding Films (${films.length}) — Mark Arista Films, Hawaii`,
    description: `Watch ${films.length} Hawaii wedding films by Mark Arista — Paliku Gardens at Kualoa Ranch, Lanikuhonua, Four Seasons Oahu, Turtle Bay, Cafe Julia and more.`,
    path: "films.html",
    image: frame("Ch_mROgi6YY"),
    jsonld: [orgLd],
  })}
${header({ active: "films.html" })}
<main id="main">
<section class="wall" aria-labelledby="films-title">
  <div class="wall__rows" aria-hidden="true">
    ${filmStrip(base, rowA, { dir: -1, small: true })}
    ${filmStrip(base, rowB, { dir: 1, small: true })}
    ${filmStrip(base, rowC, { dir: -1, small: true })}
  </div>
  <div class="wall__in wrap">
    <p class="label label--dot" data-reveal data-hold>The archive · ${Object.keys(venues).length} venues</p>
    <h1 class="display wall__title" id="films-title" data-split data-hold>${films.length} films. <span class="it">One story each.</span></h1>
    <p class="lead" data-reveal data-hold>Every wedding Mark has published, newest first. Find your venue, then imagine your people in the frame.</p>
  </div>
</section>

<section class="section--tight films" id="all" data-films aria-label="All films">
  <div class="wrap">
    <div class="toolbar" data-reveal>
      <div class="filters" role="group" aria-label="Filter by island">
        <button class="filter is-active" type="button" data-filter="all" aria-pressed="true">All<sup>${pad(films.length)}</sup></button>
        ${regions.map((r) => `<button class="filter" type="button" data-filter="${r.id}" aria-pressed="false">${r.label}<sup>${pad(counts[r.id])}</sup></button>`).join("")}
      </div>
      <label class="vselect"><span class="sr-only">Filter by venue</span>
        <select data-venue-filter>
          <option value="">Every venue</option>
          ${venueKeys.map((k) => `<option value="${k}">${venues[k].name} (${venueCount(k)})</option>`).join("")}
        </select>
      </label>
      <p class="label toolbar__count" aria-live="polite"><span data-count>${films.length}</span> films</p>
    </div>
    <div class="fgrid">
      ${films.map((f, i) => scrubCard(base, f, { n: i + 1 })).join("\n      ")}
    </div>
    <p class="fempty" hidden>No films match — try another venue.</p>
  </div>
</section>

${ctaBlock({ base })}
</main>
${footer({})}`;
}

/* ============================== FILM DETAIL ============================== */
export function filmPage(f, i) {
  const base = "../";
  const v = venueOf(f);
  const next = films[(i + 1) % films.length];
  const fr = frames(f);
  const story = storyOf(f);
  const related = films.filter((x) => x.slug !== f.slug && x.venue === f.venue).slice(0, 3);
  const more = related.length >= 3 ? related : related.concat(films.filter((x) => x.slug !== f.slug && x.venue !== f.venue && x.region === f.region).slice(0, 3 - related.length));
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${f.couple} — ${v.name} wedding film`,
    description: story,
    thumbnailUrl: [`${site.url}/${cover(f)}`],
    embedUrl: `https://www.youtube.com/embed/${f.video}`,
    contentUrl: `https://www.youtube.com/watch?v=${f.video}`,
    creator: { "@type": "Person", name: site.person },
  };
  const title = f.couple.replace(" + ", ' <span class="amp">+</span> ');
  return `${head({
    title: `${f.couple} — ${v.name} Wedding Film | Mark Arista Films`,
    description: `${f.couple}'s wedding film at ${v.name}, ${v.area}, by Hawaii wedding videographer Mark Arista.`,
    base,
    path: `films/${f.slug}.html`,
    image: cover(f),
    preload: cover(f),
    jsonld: [ld],
  })}
${header({ base, active: "films.html" })}
<main id="main">
<section class="vhero vhero--film" data-yt="${f.video}" data-start="30" style="--ar:${aspect(f.video)}" aria-label="${f.couple}">
  <div class="vhero__media" aria-hidden="true">
    <div class="vhero__slide is-active">${im(base, f.video, f.cover, { sizes: "100vw", eager: true })}</div>
    <div class="vhero__yt"></div>
  </div>
  <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="vhero__body wrap">
    <p class="label label--dot" data-reveal data-hold><a href="${base}films.html">Films</a> / ${pad(i + 1)} of ${films.length} · ${regionLabel(f.region)}</p>
    <h1 class="display vhero__title vhero__title--film" data-split data-hold>${title}</h1>
    <div class="vhero__foot" data-reveal data-hold>
      <dl class="meta">
        <div><dt class="label">Venue</dt><dd>${v.name}</dd></div>
        <div><dt class="label">Location</dt><dd>${v.area}</dd></div>
        <div><dt class="label">Feel</dt><dd>${f.tags.join(" · ")}</dd></div>
      </dl>
      <div class="btns"><button class="btn btn--ember" type="button" data-video="${f.video}" data-title="${f.couple} — ${v.name}"><span>Watch with sound</span><span class="btn__ic">${ic.play}</span></button></div>
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="frames-title">
  <div class="wrap">
    <h2 class="sr-only" id="frames-title">Frames from the film</h2>
    <div class="fbento">
      ${fr.map((s, k) => `<figure class="fbento__t" data-reveal style="--d:${k * 0.06}s">${im(base, f.video, s, { sizes: k === 0 ? "(min-width:1024px) 58vw, 100vw" : "(min-width:1024px) 28vw, 50vw", alt: k === 0 ? `${f.couple}, ${v.name}` : "" })}<figcaption class="label">${pad(k + 1)}</figcaption></figure>`).join("")}
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="story-title">
  <div class="wrap fstory">
    <div class="fstory__side">
      ${label(1, "The story")}
      <dl class="fdetails" data-reveal>
        <div><dt class="label">Couple</dt><dd>${f.couple}</dd></div>
        <div><dt class="label">Venue</dt><dd><a href="${base}films.html?venue=${f.venue}">${v.name} ↗</a></dd></div>
        <div><dt class="label">Where</dt><dd>${v.area}</dd></div>
        ${f.note ? `<div><dt class="label">Ceremony</dt><dd>${f.note.replace("Ceremony at ", "")}</dd></div>` : ""}
        <div><dt class="label">Watch</dt><dd><a href="https://www.youtube.com/watch?v=${f.video}" target="_blank" rel="noopener">YouTube ↗</a></dd></div>
      </dl>
    </div>
    <div class="fstory__main">
      <p class="statement statement--md" id="story-title" data-reveal>${story}</p>
      <div class="player" data-yt-inline="${f.video}" data-title="${f.couple} — ${v.name}" data-cursor="Play" role="button" tabindex="0" aria-label="Play ${f.couple} film" data-reveal>
        ${im(base, f.video, fr[1], { sizes: "(min-width:1024px) 60vw, 100vw" })}
        <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <span class="player__btn">${ic.play}<span>Play film</span></span>
      </div>
      <div class="btns" data-reveal>${btn(`${base}contact.html?film=${f.slug}`, "I want a film like this")}${btn(`${base}films.html?venue=${f.venue}`, `More at ${v.name}`, "btn--ghost")}</div>
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="more-title">
  <div class="wrap">
    <div class="shead shead--row">
      <h2 class="h3" id="more-title">${related.length ? `More from ${v.name}` : "More films"}</h2>
      ${btn(`${base}films.html`, `All ${films.length} films`, "btn--ghost btn--sm")}
    </div>
    <div class="fgrid fgrid--3">${more.map((x) => scrubCard(base, x)).join("")}</div>
  </div>
</section>

<a class="next" href="${base}films/${next.slug}.html" aria-label="Next film: ${next.couple}" data-cursor="Next">
  <div class="next__bg">${im(base, next.video, next.cover, { sizes: "100vw" })}</div>
  <div class="wrap">
    <p class="label">Next film →</p>
    <p class="display next__t">${next.couple.replace(" + ", ' <span class="amp">+</span> ')}</p>
    <p class="label">${venueOf(next).name} · ${venueOf(next).area}</p>
  </div>
</a>
</main>
${footer({ base })}`;
}

/* ============================== ABOUT ============================== */
export function about() {
  const base = "";
  const beliefs = [
    ["You're the story", "No two films look alike, because no two couples are alike. The edit is built around your voices, your vows and your people.", "PsfFnelv-0M", "-1"],
    ["Presence over poses", "I'd rather you live your day than perform it. I stay close, calm and unobtrusive, so the real moments happen on their own.", "ITdsnRT57i4", "-1"],
    ["Community matters", "The hug from your lola, the toast from your best friend, the whole family on the dance floor — they all belong in the film.", "0RURO9MIxn4", "-3"],
  ];
  return `${head({
    title: "About Mark Arista — Hawaii Wedding Videographer",
    description: "Meet Mark Arista: a Hawaii wedding videographer whose films are infused with Filipino warmth and centered on you, your love and your community.",
    path: "about.html",
    image: "assets/img/mark-arista.jpg",
    jsonld: [orgLd, { "@context": "https://schema.org", "@type": "Person", name: site.person, jobTitle: "Wedding Videographer", worksFor: site.name, sameAs: [site.instagram, site.youtube] }],
  })}
${header({ active: "about.html" })}
<main id="main">
<section class="ahero" aria-labelledby="about-title">
  <div class="wrap ahero__grid">
    <div class="ahero__text">
      <p class="label label--dot" data-reveal data-hold>About · Hawaii · Filipino roots</p>
      <h1 class="display ahero__title" id="about-title" data-split data-hold>Hi there! <span class="it">I'm Mark.</span></h1>
      <p class="lead" data-reveal data-hold>Hawaii wedding videographer. Filipino warmth. A creative heart that's all in on your story — ${films.length} films and counting.</p>
      <div class="btns" data-reveal data-hold>${btn("contact.html", "Check your date")}${btn("films.html", "Watch the films", "btn--ghost")}</div>
    </div>
    <div class="ahero__media" aria-hidden="true">
      <figure class="hp hp--1" data-reveal data-hold><img src="assets/img/mark-lens.jpg" alt=""></figure>
      <figure class="hp hp--2" data-reveal data-hold style="--d:.1s"><img src="assets/img/mark-smile.jpg" alt=""></figure>
      <figure class="hp hp--3" data-reveal data-hold style="--d:.2s"><img src="assets/img/mark-crouch.jpg" alt=""></figure>
    </div>
  </div>
  <div class="wrap">${statsBento(base)}</div>
</section>

${filmStrip(base, [["oMNoO73MD5k", "-2"], ["z1kxigj8sno", "-1"], ["k77corBaJ34", "-1"], ["Us1xG-4j344", "-3"], ["fNSti-O84e4", "-3"], ["hQkW0HfhK3Y", "-3"], ["aLzFebTLplQ", "-1"], ["nymMeuzS7Lo", "-2"], ["3CtPkGaEfMU", "-1"], ["lPcMcX9jjmM", "-3"]], { dir: 1 })}

<section class="section" aria-labelledby="story-title">
  <div class="wrap story">
    <div class="story__media" data-reveal><figure class="media">${im(base, "z1kxigj8sno", "-3", { sizes: "(min-width:1024px) 40vw, 100vw" })}<figcaption class="label">Rafael + Jean · Iglesia Ni Cristo &amp; Kualoa Ranch</figcaption></figure></div>
    <div class="story__main">
      ${label(1, "The story")}
      <h2 class="statement" id="story-title" data-split>Entirely centered on you, your love, and the <span class="it">community</span> surrounding you.</h2>
      <div class="body" data-reveal>
        <p>I'm Mark Arista, your Hawaii wedding videographer. Infused with Filipino warmth and creative heart, my films are entirely centered on you, your love, and the community surrounding you on your biggest day.</p>
        <p>A wedding is never only about two people. It's the families who flew in, the elders who gave their blessing, and the friends who would do anything for you. That's who I film for — so years from now you can hear the laughter, see the tears and feel the whole day again.</p>
        <p>More than an artist, I consider myself a keen observer: a visual storyteller who loves listening to unique love stories. The result is simple — authentic, heartfelt and handmade.</p>
      </div>
      <div class="chips" data-reveal><span class="chip">One wedding per day</span><span class="chip">Multi-camera coverage</span><span class="chip">Drone footage</span><span class="chip">Cinematic · documentary · story-led</span></div>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="believe-title">
  <div class="wrap">
    <div class="shead">
      ${label(2, "What I believe")}
      <h2 class="display display--h2 shead__title" id="believe-title" data-split>Three things <span class="it">I never compromise.</span></h2>
    </div>
    <div class="icards">
      ${beliefs.map(([t, d, id, s], i) => `<article class="icard" data-reveal style="--d:${i * 0.08}s"><div class="icard__img">${im(base, id, s, { sizes: "(min-width:1024px) 33vw, 100vw" })}<span class="icard__n">${["i.", "ii.", "iii."][i]}</span></div><h3 class="h3">${t}</h3><p>${d}</p></article>`).join("")}
    </div>
  </div>
</section>

<section class="section venues" aria-labelledby="where-title">
  <div class="wrap venues__grid">
    <div class="venues__side"><div>
      ${label(3, "Where I film")}
      <h2 class="display display--h2" id="where-title" data-split>Based in Hawaii. <span class="it">Ready to travel.</span></h2>
      <p class="body" data-reveal>Oahu is home — from Kualoa Ranch to Ko Olina and the North Shore. Neighbor islands like Hawaii Island and Kauai, and mainland trips to Utah, Texas and Yosemite, are all part of the story.</p>
      <figure class="vpreview" data-reveal>${im(base, venues.paliku.img, "", { sizes: "(min-width:1024px) 30vw, 100vw" })}<figcaption><span class="label" data-vp-area>${venues.paliku.area}</span><b data-vp-name>${venues.paliku.name}</b></figcaption></figure>
    </div></div>
    ${venueRows(base)}
  </div>
</section>

${quoteCarousel(base)}
${ctaBlock({ base })}
</main>
${footer({})}`;
}

/* ============================== EXPERIENCE ============================== */
export function experience() {
  const base = "";
  const faqs = [
    ["Where are you based — and do you travel?", "I'm based on Oahu and film across the islands — Kualoa Ranch, Ko Olina, the North Shore and Honolulu — plus Kona on Hawaii Island and over to Kauai. I also travel for weddings on the mainland: recent films include Salt Lake City, Utah, Mansfield, Texas and a Yosemite elopement."],
    ["How far ahead should we book?", "As soon as you have a date and venue in mind. I film one wedding per day, so popular dates go first — it's always worth checking availability early."],
    ["What will our film feel like?", "Like you. Every film is edited around your story, your voices and your people. Watch a few films to get a feel for the style, then tell me what you want to feel when you press play."],
    ["Can you film our cultural traditions?", "Absolutely. Whether it's a Hawaiian blessing, a lei exchange, the veil, cord and arras, an Iglesia Ni Cristo ceremony or a money dance that takes over the reception, we'll plan around the moments that matter most to your families."],
    ["How many weddings do you film in a day?", "Just one. On your date, my full attention — and every camera — is on you and your people."],
    ["Do you film with drones and multiple cameras?", "Yes. Multi-camera coverage keeps vows and speeches covered from every angle, and drone footage shows off your venue from above wherever the location allows it."],
    ["What's the investment?", "Every collection is tailored to the day you're planning. Share your date and a few details, and I'll send current collections and availability."],
    ["What happens after we enquire?", "I read every message personally and will reply to set up a relaxed call — a chance to talk story and make sure we're the right fit for each other."],
  ];
  const steps = [
    ["Say hello", "Send your date, venue and a little about you two. The form takes about two minutes.", "ITdsnRT57i4", "-1"],
    ["Let's talk story", "A relaxed call to hear how you met, who matters most and what you want to feel when you watch your film.", "oMNoO73MD5k", "-2"],
    ["Make it official", "Once it feels right, we lock in your date and I'm officially part of your team.", "Ch_mROgi6YY", "-1"],
    ["Plan the moments", "Timeline, traditions, speeches and the people you can't miss — mapped out together so nothing is left to chance.", "4CJ1LGkKKEg", "-3"],
    ["The big day", "I stay close, calm and unobtrusive. You stay present with your people while the story unfolds.", "hzfBBlhqEzI", "-2"],
    ["Relive it", "Your film arrives, ready to share with family near and far — and to replay on every anniversary.", "itpNCKYn7B4", "-2"],
  ];
  const trad = [["CWCR__HvvXI", "-3"], ["0RURO9MIxn4", "-2"], ["z1kxigj8sno", ""], ["lPcMcX9jjmM", "-1"], ["OAF6KZrBGzk", "-1"], ["z1kxigj8sno", "-3"]];
  return `${head({
    title: "The Experience — Working with Mark Arista Films",
    description: "What it's like to work with Hawaii wedding videographer Mark Arista — from your first hello to the day you press play on your film.",
    path: "experience.html",
    image: frame("WGo_VWh5wRI"),
    jsonld: [orgLd, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }],
  })}
${header({ active: "experience.html" })}
<main id="main">
<section class="xhero" aria-labelledby="x-title">
  <div class="wrap xhero__grid">
    <div class="xhero__text">
      <p class="label label--dot" data-reveal data-hold>The experience</p>
      <h1 class="display xhero__title" id="x-title" data-split data-hold>Filmed with heart. <span class="it">Planned with care.</span></h1>
      <p class="lead" data-reveal data-hold>Calm, clear and personal from the first message — here's exactly what working together looks like.</p>
      <div class="btns" data-reveal data-hold>${btn("contact.html", "Check your date")}${btn("#faq", "Questions", "btn--ghost")}</div>
    </div>
    <div class="xhero__bento" aria-hidden="true">
      ${[["WGo_VWh5wRI", "-2"], ["EiA5wwhOABk", "-1"], ["uX9gSYDRctw", "-1"], ["k77corBaJ34", "-2"]].map(([id, s], k) => `<figure data-reveal data-hold style="--d:${k * 0.08}s">${im(base, id, s, { sizes: "(min-width:1024px) 25vw, 50vw", eager: k < 2 })}</figure>`).join("")}
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="shead">
      ${label(1, "The process")}
      <h2 class="display display--h2 shead__title" id="steps-title" data-split>Six steps. <span class="it">Zero stress.</span></h2>
    </div>
    <ol class="pcards pcards--6">
      ${steps.map(([t, d, id, s], i) => `<li class="pcard" data-reveal style="--d:${(i % 3) * 0.08}s">
        <div class="pcard__img">${im(base, id, s, { sizes: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" })}<span class="pcard__n">${pad(i + 1)}</span></div>
        <h3 class="h4">${t}</h3><p>${d}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>

<section class="section trad" aria-labelledby="trad-title">
  <div class="wrap trad__grid">
    <div class="trad__text">
      ${label(2, "Traditions")}
      <h2 class="display display--h2" id="trad-title" data-split>Traditions, <span class="it">understood.</span></h2>
      <p class="body" data-reveal>Hawaiian, Filipino, Indian, a blend of all three, or something entirely your own. Couples have trusted Mark with everything from Hawaiian blessings to an Iglesia Ni Cristo ceremony — the moments your families care about most get planned for, not stumbled upon.</p>
      <div class="traditions" data-reveal>
        <span class="tradition">Lei exchange</span><span class="tradition"><span class="it">Hawaiian</span> blessing</span><span class="tradition">Veil, cord <span class="it">&amp;</span> arras</span><span class="tradition">Money dance</span><span class="tradition"><span class="it">Family</span> speeches</span><span class="tradition">The send-off</span>
      </div>
    </div>
    <div class="trad__media" aria-hidden="true">${trad.map(([id, s], k) => `<figure data-reveal style="--d:${k * 0.06}s">${im(base, id, s, { sizes: "(min-width:1024px) 18vw, 33vw" })}</figure>`).join("")}</div>
  </div>
</section>

<section class="section--tight" aria-labelledby="invest-title">
  <div class="wrap">
    <div class="invest" data-reveal>
      <div class="invest__bg" aria-hidden="true">${im(base, "oMNoO73MD5k", "", { sizes: "100vw" })}</div>
      <h2 class="display invest__t" id="invest-title">Tailored to <span class="it">your day.</span></h2>
      <div class="invest__r">
        <p>Every collection is shaped around the day you're planning — your venue, your timeline and your people. Share a few details and I'll send current collections and availability.</p>
        ${btn("contact.html", "Request collections")}
      </div>
    </div>
  </div>
</section>

<section class="section" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-wrap">
    <div class="faq-side">
      ${label(3, "Questions")}
      <h2 class="display display--h2" id="faq-title" data-split>Good <span class="it">questions.</span></h2>
      <figure class="media faq-side__img" data-reveal>${im(base, "Ch_mROgi6YY", "-2", { sizes: "(min-width:1024px) 30vw, 100vw" })}</figure>
    </div>
    <div class="faq" data-reveal>
      ${faqs.map(([q, a], k) => `<details${k === 0 ? " open" : ""}><summary><span class="h4">${q}</span><span class="faq__ic" aria-hidden="true"></span></summary><p class="faq__a">${a}</p></details>`).join("")}
    </div>
  </div>
</section>

${quoteCarousel(base)}
${ctaBlock({ base })}
</main>
${footer({})}`;
}

/* ============================== CONTACT ============================== */
export function contact() {
  const base = "";
  return `${head({
    title: "Check Your Date — Contact Mark Arista Films",
    description: "Tell Mark Arista about your wedding. Check availability for Hawaii and destination wedding films.",
    path: "contact.html",
    image: frame("uX9gSYDRctw"),
    jsonld: [orgLd, { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Mark Arista Films", url: `${site.url}/contact.html` }],
  })}
${header({ active: "contact.html" })}
<main id="main">
<section class="contact">
  <div class="contact__bg" aria-hidden="true">${im(base, "uX9gSYDRctw", "", { sizes: "100vw", eager: true })}</div>
  <div class="wrap contact__grid">
    <div class="contact__side">
      <p class="label label--dot" data-reveal data-hold>Contact · Now booking</p>
      <h1 class="display contact__title" data-split data-hold>So what's <span class="it">your story?</span></h1>
      <p class="lead" data-reveal data-hold>Get in touch — let me help answer any questions you might have. I look forward to hearing from you.</p>
      <div class="contact__facts" data-reveal data-hold>
        <a href="mailto:${site.email}"><span class="label">Email</span><span>${site.email}</span></a>
        <a href="${site.instagram}" target="_blank" rel="noopener"><span class="label">Instagram</span><span>@markaristafilms ↗</span></a>
        <a href="${reviews.sourceUrl}" target="_blank" rel="noopener"><span class="label">Reviews</span><span>★ ${reviews.rating} · ${reviews.count} on ${reviews.source} ↗</span></a>
        <div><span class="label">Hawaii time</span><span data-clock>—</span></div>
      </div>
      <figure class="contact__quote" data-reveal data-hold><blockquote>“${reviews.items[5].q}”</blockquote><figcaption class="label">${reviews.items[5].n} · ${reviews.items[5].s}</figcaption></figure>
    </div>

    <div class="contact__main" data-reveal data-hold>
      <div class="form">
        <div class="form__top"><span class="label" data-step-label>Step 01 / 03</span><span class="label">≈ 2 minutes</span></div>
        <div class="form__prog"><i></i></div>
        <form data-inquiry novalidate>
          <fieldset class="fstep is-active">
            <legend>First, <span class="it">you two.</span></legend>
            <div class="row2">
              <div class="field"><label for="f-name">Your name *</label><input id="f-name" name="name" autocomplete="name" required placeholder="First and last"></div>
              <div class="field"><label for="f-partner">Partner's name</label><input id="f-partner" name="partner" placeholder="First and last"></div>
            </div>
            <div class="row2">
              <div class="field"><label for="f-email">Email *</label><input id="f-email" name="email" type="email" autocomplete="email" required placeholder="you@email.com"></div>
              <div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="Optional"></div>
            </div>
          </fieldset>
          <fieldset class="fstep">
            <legend>The <span class="it">big day.</span></legend>
            <div class="row2">
              <div class="field"><label for="f-date">Wedding date *</label><input id="f-date" name="date" type="date" required></div>
              <div class="field"><label for="f-guests">Guest count</label>
                <select id="f-guests" name="guests"><option value="">Select</option><option>Elopement (under 20)</option><option>20–75</option><option>75–150</option><option>150–250</option><option>250+</option></select></div>
            </div>
            <label class="opt" style="width:fit-content"><input type="checkbox" name="flexible" value="yes"><span>Our date is flexible</span></label>
            <div class="field"><span class="flabel">Where are you celebrating? *</span>
              <div class="opts" role="radiogroup">
                ${["Oahu", "Maui", "Hawaii Island", "Kauai", "Mainland / destination", "Not sure yet"].map((o, k) => `<label class="opt"><input type="radio" name="location" value="${o}"${k === 0 ? " required" : ""}><span>${o}</span></label>`).join("")}
              </div>
            </div>
            <div class="field"><label for="f-venue">Venue</label><input id="f-venue" name="venue" list="venue-list" placeholder="If you have one in mind"><datalist id="venue-list">${Object.values(venues).map((v) => `<option value="${v.name}">`).join("")}</datalist></div>
          </fieldset>
          <fieldset class="fstep">
            <legend>Your <span class="it">story.</span></legend>
            <div class="field"><label for="f-story">Tell me about you two *</label><textarea id="f-story" name="story" required placeholder="How you met, who'll be there, traditions you're including, what you want to feel when you watch your film…"></textarea></div>
            <div class="row2">
              <div class="field"><label for="f-film">A film you loved</label>
                <select id="f-film" name="film"><option value="">Choose a film</option>${films.map((f) => `<option value="${f.slug}">${f.couple} — ${venueOf(f).name}</option>`).join("")}</select></div>
              <div class="field"><label for="f-source">How did you find me?</label>
                <select id="f-source" name="source"><option value="">Select</option><option>Instagram</option><option>Google</option><option>YouTube</option><option>WeddingWire</option><option>Venue or planner</option><option>Friend or family</option><option>Other</option></select></div>
            </div>
          </fieldset>
          <div class="form__nav">
            <button type="button" class="form__back" hidden>${ic.back} Back</button>
            <span></span>
            <button type="button" class="btn btn--ink" data-next><span>Continue</span><span class="btn__ic">${ic.arrow}</span></button>
            <button type="submit" class="btn btn--ember" data-submit hidden><span>Send my inquiry</span><span class="btn__ic">${ic.arrow}</span></button>
          </div>
          <p class="form__note">Your details go straight to Mark and are never shared.</p>
        </form>
        <div class="form__done" role="status" aria-live="polite">
          <span class="label label--dot">Inquiry ready</span>
          <p class="display">Mahalo, <span class="it" data-done-name>friend</span>!</p>
          <p class="lead">Your inquiry is on its way to Mark. If your email app opened, just press send. While you wait, there are ${films.length} films to watch.</p>
          <div>${btn("films.html", "Watch the films", "btn--ink")}</div>
        </div>
      </div>
      <details class="hb">
        <summary><span>Prefer the classic booking form?</span><span>+</span></summary>
        <div class="hb__box"><div class="hb-p-6110b3b4a4c7471c210bcf08-2"></div></div>
      </details>
    </div>
  </div>
</section>
${filmStrip(base, films.slice(0, 12).map((f) => [f.video, f.cover]), { small: true })}
</main>
${footer({ mbar: false })}`;
}

/* ============================== 404 ============================== */
export function notFound() {
  const base = "";
  return `${head({ title: "Scene not found — Mark Arista Films", description: "This page doesn't exist.", path: "404.html" })}
${header({})}
<main id="main" class="nf">
  <div class="nf__bg" aria-hidden="true">${im(base, "46cY5x1gD50", "", { sizes: "100vw", eager: true })}</div>
  <div class="nf__in">
    <p class="label label--dot">Cut! · Scene missing</p>
    <h1 class="display">4<span class="it">0</span>4</h1>
    <p class="lead">This scene didn't make the final edit. Let's get you back to the story.</p>
    <div class="btns">${btn("index.html", "Back home")}${btn("films.html", "Watch films", "btn--ghost")}</div>
  </div>
</main>
${footer({ mbar: false })}`;
}
