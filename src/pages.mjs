import { site, films, regions, img } from "./data.mjs";
import { head, header, footer, btn, ic, ctaBlock } from "./layout.mjs";

const byVideo = (id) => films.find((f) => f.video === id);
const regionLabel = (id) => regions.find((r) => r.id === id)?.label || "";
const pad = (n) => String(n).padStart(2, "0");

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
  sameAs: [site.instagram, site.facebook],
};

/* ============================== HOME ============================== */
export function home() {
  const heroOrder = ["OAF6KZrBGzk", "uX9gSYDRctw", "hzfBBlhqEzI", "CWCR__HvvXI", "WGo_VWh5wRI", "itpNCKYn7B4"].map(byVideo);
  const first = heroOrder[0];
  const latest = films[0];
  const featured = films.slice(0, 4);
  const tape = ["Aloha", "<span class=\"it\">Mabuhay</span>", "Oahu", "Kona", "Kaneohe", "Ko Olina", "<span class=\"it\">& beyond</span>"];
  const tape2 = ["Your love", "<span class=\"it\">your people</span>", "your story", "<span class=\"it\">for a lifetime</span>"];
  const places = [
    { v: "uX9gSYDRctw", t: "The beach", d: "Mike + Victoria — sunset by the shore at Four Seasons Oahu." },
    { v: "hzfBBlhqEzI", t: "Mountains & gardens", d: "Spencer + Jenn — a garden aisle at Paliku Gardens, Kaneohe." },
    { v: "OAF6KZrBGzk", t: "Golden hour", d: "Michael + Adrienne — a Kona sunset at Hale Wailele." },
    { v: "itpNCKYn7B4", t: "Far from home", d: "Jillyan + Nick — the islands' heart, carried to Salt Lake City, Utah." },
  ];

  return `${head({
    title: "Mark Arista Films — Hawaii Wedding Videographer",
    description: "Mark Arista is a Hawaii wedding videographer. Story-led wedding films infused with Filipino warmth, filmed across Oahu, Hawaii Island and beyond.",
    path: "",
    jsonld: [orgLd],
  })}
${header({ active: "index.html" })}
<div class="loader" aria-hidden="true">
  <div class="loader__top"><span class="label rec">Rec</span><span class="label">Mark Arista — Films</span></div>
  <div>
    <div class="loader__tc">00:00:00:00</div>
    <div class="loader__bar"><i></i></div>
  </div>
  <div class="loader__bot"><span class="label">Take 01 · Hawaii</span><span class="label">Your love story is worth telling</span></div>
</div>
<main id="main">

<section class="hero" aria-label="Introduction">
  <div class="hero__slides" aria-hidden="true">
    ${heroOrder.map((f, i) => `<div class="hero__slide${i === 0 ? " is-active" : ""}" data-name="${f.couple}" data-loc="${f.venue} · ${f.location}" data-img="${img(f)}" data-video="${f.video}"><img src="${img(f)}" alt="" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}></div>`).join("\n    ")}
  </div>
  <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="hero__hud" aria-hidden="true">
    <div class="wrap">
      <span class="label rec">Rec <span class="tc" data-timecode>00:00:00:00</span></span>
      <span class="label hide-sm">4K · 24 fps · Hawaii</span>
    </div>
  </div>
  <aside class="now" aria-label="Featured film">
    <button class="now__thumb" type="button" data-now-video data-video="${first.video}" data-title="${first.couple}" data-cursor="Play" aria-label="Play ${first.couple} film">
      <img data-now-thumb src="${img(first)}" alt="">
      <span class="now__play">${ic.play}</span>
    </button>
    <div class="now__meta">
      <span class="label">Now showing</span>
      <strong data-now-name>${first.couple}</strong>
      <span data-now-loc>${first.venue} · ${first.location}</span>
    </div>
    <div class="segs">${heroOrder.map((f, i) => `<button type="button" aria-label="Show ${f.couple}"${i === 0 ? ' class="is-active"' : ""}><i></i></button>`).join("")}</div>
  </aside>
  <div class="hero__body">
    <div class="wrap">
      <p class="label label--dot hero__kicker" data-reveal data-hold>Hawaii wedding films · Filipino warmth</p>
      <h1 class="display display--mega hero__title" data-split data-hold>Your love story is worth <span class="it">telling.</span></h1>
      <div class="hero__foot" data-reveal data-hold>
        <p class="lead">Films centered entirely on you — your love, and the community surrounding you on your biggest day. From Hawaiian beaches and mountains to wherever you say yes.</p>
        <div class="btns">
          ${btn("contact.html", "Check your date")}
          <a class="btn btn--ghost btn--play" href="films.html" data-video="${latest.video}" data-title="${latest.couple} — ${latest.venue}"><span>Watch the latest film</span><span class="btn__ic">${ic.play}</span></a>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="tape" aria-label="Aloha. Mabuhay. Oahu, Kona, Kaneohe, Ko Olina and beyond.">
  <div class="tape__band tape__band--a"><div class="tape__track" data-marquee="-1"><div class="tape__track">${[...tape, ...tape].map((t) => `<span class="tape__item">${t}${ic.star}</span>`).join("")}</div></div></div>
  <div class="tape__band tape__band--b" aria-hidden="true"><div class="tape__track" data-marquee="1"><div class="tape__track">${[...tape2, ...tape2, ...tape2].map((t) => `<span class="tape__item">${t}${ic.star}</span>`).join("")}</div></div></div>
</div>

<section class="section" aria-labelledby="intro-title">
  <div class="wrap intro__grid">
    <p class="label scene intro__label" data-reveal><b>Sc. 01</b> Hello</p>
    <h2 class="statement intro__text" id="intro-title" data-scrub>Hi there! I'm Mark <span class="pill"><img src="assets/img/mark-smile.jpg" alt=""></span> — your Hawaii wedding videographer. Infused with <span class="it">Filipino warmth</span> and a creative heart, every film I make <span class="pill"><img src="assets/img/films/OAF6KZrBGzk.jpg" alt=""></span> is centered on you, your love, and the community <span class="pill"><img src="assets/img/films/hzfBBlhqEzI.jpg" alt=""></span> surrounding you on your biggest day.</h2>
    <div class="intro__aside" data-reveal>
      <p class="body">Whether your celebration takes you to a Hawaiian beach and mountains, a classic church, or beneath the stars, I'm there to capture the magic — transforming once-in-a-lifetime moments into a story you'll relive for a lifetime.</p>
      <a class="link" href="about.html">Meet Mark ${ic.arrow}</a>
    </div>
    <div class="intro__aside2" data-reveal style="--d:.15s">
      <figure class="media ar-169" data-cursor="Play">
        <a href="films/${latest.slug}.html" data-video="${latest.video}" data-title="${latest.couple} — ${latest.venue}" aria-label="Play ${latest.couple} film"><img src="${img(latest)}" alt="${latest.couple} celebrating at ${latest.venue}" loading="lazy"></a>
      </figure>
      <p class="label mt-1">Latest · ${latest.couple} · ${latest.venue}</p>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="heritage-title">
  <div class="wrap heritage__grid">
    <div class="heritage__media" data-reveal="clip">
      <figure class="media"><img src="assets/img/films/CWCR__HvvXI.jpg" alt="Steven and Sherrie-Mae wearing maile leis in the rainforest" loading="lazy" style="object-position:62% 50%"></figure>
      <div class="heritage__badge" aria-hidden="true">
        <svg viewBox="0 0 132 132"><defs><path id="c" d="M66 66m-50 0a50 50 0 1 1 100 0a50 50 0 1 1-100 0"/></defs><text font-family="JetBrains Mono, monospace" font-size="10.5" letter-spacing="3.6" fill="#fff"><textPath href="#c">ALOHA · MABUHAY · ALOHA · MABUHAY ·</textPath></text></svg>
        <span>Two<br>homes</span>
      </div>
    </div>
    <div class="heritage__content">
      <p class="label scene" data-reveal><b>Sc. 02</b> Heritage</p>
      <h2 class="display display--h2 mt-2" id="heritage-title" data-split>Hawaiian light. <span class="it">Filipino heart.</span></h2>
      <p class="lead" data-reveal>The islands give every film its setting. My Filipino roots give it its soul — the warmth, the family, and the loud, loving community that shows up for you.</p>
      <div class="pillars">
        <div class="pillar" data-reveal><span class="pillar__n">01</span><div><h3 class="h4">Island settings, honestly filmed</h3><p>Beaches, mountains, rainforest gardens and oceanfront ceremonies — captured in the light that makes Hawaii feel like Hawaii.</p></div></div>
        <div class="pillar" data-reveal><span class="pillar__n">02</span><div><h3 class="h4">Heritage, understood</h3><p>From the lei exchange to the veil, cord and arras, traditions are filmed with understanding — not just coverage.</p></div></div>
        <div class="pillar" data-reveal><span class="pillar__n">03</span><div><h3 class="h4">Your people, in frame</h3><p>Lolas, titos, best friends and the cousin who owns the dance floor. Your community is part of your story, so it's part of your film.</p></div></div>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="films-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 03</b> Recent films</p>
      <h2 class="display display--h2 shead__title" id="films-title" data-split>Real couples. <span class="it">Real islands.</span></h2>
      <div class="shead__end" data-reveal>${btn("films.html", "All films", "btn--ghost")}</div>
    </div>
    <div class="stack">
      ${featured.map((f, i) => `
      <article class="scard" style="--i:${i}">
        <div class="scard__bg"><img src="${img(f)}" alt="${f.couple} wedding film still" loading="lazy"></div>
        <div class="scard__top"><span class="label">${pad(i + 1)} / ${pad(films.length)}</span><span class="label">${regionLabel(f.region)}</span></div>
        <div class="scard__body">
          <div>
            <h3 class="display scard__title"><a href="films/${f.slug}.html">${f.couple}</a></h3>
            <div class="scard__meta"><span>${f.venue}</span><span>·</span><span>${f.location}</span></div>
            <div class="chips mt-2">${f.mood.map((m) => `<span class="chip">${m}</span>`).join("")}</div>
          </div>
          <div class="scard__actions">
            <button class="round-play" type="button" data-video="${f.video}" data-title="${f.couple} — ${f.venue}" aria-label="Play ${f.couple} film">${ic.play}<span>Play film</span></button>
            <a class="link" href="films/${f.slug}.html">The story ${ic.arrow}</a>
          </div>
        </div>
      </article>`).join("")}
    </div>
  </div>
</section>

<section class="section feel deep" aria-labelledby="feel-title">
  <div class="wrap">
    <p class="label scene" data-reveal><b>Sc. 04</b> The feeling</p>
    <h2 class="sr-only" id="feel-title">Dreamy, romantic, fun, moving, heartfelt, intentional.</h2>
  </div>
  <div class="feel__rows" aria-hidden="true">
    <div class="feel__row"><span class="display">Dreamy<span class="dot">.</span></span><span class="it">romantic</span><span class="display outline">Fun.</span><span class="display">Dreamy<span class="dot">.</span></span></div>
    <div class="feel__row"><span class="display outline">Moving.</span><span class="display">Heartfelt<span class="dot">.</span></span><span class="it">intentional</span><span class="display outline">Moving.</span></div>
  </div>
  <div class="wrap feel__foot">
    <p class="body" data-reveal>Six words, pulled straight from the titles of recent films. Every edit chases a feeling — never a template — so your film sounds and moves like the two of you.</p>
  </div>
</section>

<section class="section" aria-labelledby="places-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 05</b> Locations</p>
      <h2 class="display display--h2 shead__title" id="places-title" data-split>Wherever your story <span class="it">takes you.</span></h2>
    </div>
    <div class="places" data-reveal>
      ${places.map((p, i) => `<button type="button" class="place${i === 0 ? " is-active" : ""}" aria-expanded="${i === 0}">
        <img src="assets/img/films/${p.v}.jpg" alt="" loading="lazy">
        <span class="place__n label">${pad(i + 1)}</span>
        <span class="place__title">${p.t}</span>
        <span class="place__info"><p>${p.d}</p></span>
      </button>`).join("")}
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="process-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 06</b> How it works</p>
      <h2 class="display display--h2 shead__title" id="process-title" data-split>Four steps to <span class="it">your film.</span></h2>
      <div class="shead__end" data-reveal>${btn("experience.html", "The experience", "btn--ghost")}</div>
    </div>
    <ol class="steps">
      <li class="step" style="--d:0s"><div class="step__n">01</div><h3 class="h4">Say hello</h3><p>Share your date, your venue and a little about the two of you.</p></li>
      <li class="step" style="--d:.12s"><div class="step__n">02</div><h3 class="h4">Let's talk story</h3><p>A relaxed call to hear how you met, who matters most, and what you want to feel.</p></li>
      <li class="step" style="--d:.24s"><div class="step__n">03</div><h3 class="h4">Plan the moments</h3><p>Timeline, traditions and the moments not to miss — planned together so you can stay present.</p></li>
      <li class="step" style="--d:.36s"><div class="step__n">04</div><h3 class="h4">Relive it</h3><p>Your film arrives — a story you'll press play on every anniversary, for a lifetime.</p></li>
    </ol>
  </div>
</section>

${ctaBlock({})}
</main>
${footer({})}`;
}

/* ============================== ABOUT ============================== */
export function about() {
  return `${head({
    title: "About Mark Arista — Hawaii Wedding Videographer",
    description: "Meet Mark Arista: a Hawaii wedding videographer whose films are infused with Filipino warmth and centered on you, your love and your community.",
    path: "about.html",
    image: "assets/img/mark-arista.jpg",
    jsonld: [orgLd, { "@context": "https://schema.org", "@type": "Person", name: site.person, jobTitle: "Wedding Videographer", worksFor: site.name, sameAs: [site.instagram] }],
  })}
${header({ active: "about.html" })}
<main id="main">
<section class="phero">
  <div class="wrap">
    <div class="phero__label"><p class="label label--dot" data-reveal>About</p><p class="label" data-reveal>Hawaii · Filipino roots · Story first</p></div>
    <h1 class="display phero__title" data-split>Hi there! <span class="it">I'm Mark.</span></h1>
    <div class="phero__foot" data-reveal>
      <p class="lead">Hawaii wedding videographer. Filipino warmth. A creative heart that's all in on your story.</p>
      <div class="phero__end">${btn("contact.html", "Check your date")}</div>
    </div>
  </div>
</section>

<section class="section--tight" aria-label="Portraits of Mark">
  <div class="wrap trip">
    <figure class="media" data-reveal="clip"><img src="assets/img/mark-lens.jpg" alt="Mark Arista behind his cinema camera" data-parallax="10"><figcaption class="label">Behind the lens</figcaption></figure>
    <figure class="media" data-reveal="clip" style="--d:.12s"><img src="assets/img/mark-smile.jpg" alt="Mark Arista smiling" data-parallax="10"><figcaption class="label">Mark Arista</figcaption></figure>
    <figure class="media" data-reveal="clip" style="--d:.24s"><img src="assets/img/mark-crouch.jpg" alt="Mark crouching with his camera" data-parallax="10" style="object-position:30% 50%"><figcaption class="label">Always close</figcaption></figure>
  </div>
</section>

<section class="section" aria-labelledby="story-title">
  <div class="wrap story">
    <div class="story__side"><div>
      <p class="label scene" data-reveal><b>Sc. 01</b> The story</p>
      <h2 class="display display--h2" id="story-title" data-split>Centered <span class="it">on you.</span></h2>
    </div></div>
    <div class="story__main">
      <p class="statement" data-scrub>I'm Mark Arista, your Hawaii wedding videographer. Infused with Filipino warmth and creative heart, my films are entirely centered on you, your love, and the community surrounding you on your biggest day.</p>
      <div class="body" data-reveal>
        <p>Whether your celebration takes you to a Hawaiian beach and mountains, a classic church, or beneath the stars, I'm there to capture the magic — transforming your once-in-a-lifetime moments into a story you'll relive for a lifetime.</p>
        <p>A wedding is never only about two people. It's the families who flew in, the elders who gave their blessing, and the friends who would do anything for you. That's who I film for — so years from now you can hear the laughter, see the tears and feel the whole day again.</p>
      </div>
    </div>
  </div>
</section>

<section class="section light" aria-labelledby="believe-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 02</b> What I believe</p>
      <h2 class="display display--h2 shead__title" id="believe-title" data-split>Three things <span class="it">I never compromise.</span></h2>
    </div>
    <div class="cards3">
      <article class="vcard" data-reveal><span class="vcard__n">i.</span><h3 class="h3">You're the story</h3><p>No two films look alike, because no two couples are alike. The edit is built around your voices, your vows and your people.</p></article>
      <article class="vcard" data-reveal style="--d:.1s"><span class="vcard__n">ii.</span><h3 class="h3">Presence over poses</h3><p>I'd rather you live your day than perform it. I stay close, calm and unobtrusive, so the real moments happen on their own.</p></article>
      <article class="vcard" data-reveal style="--d:.2s"><span class="vcard__n">iii.</span><h3 class="h3">Community matters</h3><p>The hug from your lola, the toast from your best friend, the whole family on the dance floor — they all belong in the film.</p></article>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="quote-title">
  <div class="wrap">
    <p class="label scene" data-reveal><b>Sc. 03</b> The promise</p>
    <h2 class="quote mt-3" id="quote-title" data-split>Once-in-a-lifetime moments, told as a story you'll relive <span class="it">for a lifetime.</span></h2>
    <p class="label quote-by" data-reveal>— Mark Arista</p>
  </div>
</section>

<section class="section deep" aria-labelledby="where-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 04</b> Where I film</p>
      <h2 class="display display--h2 shead__title" id="where-title" data-split>Based in Hawaii. <span class="it">Ready to travel.</span></h2>
    </div>
    <div class="where">
      <div class="where__item" data-reveal><span class="label">01</span><h3 class="h3">Oahu</h3><p>Kaneohe, Ko Olina and across the island — gardens, ballrooms and oceanfront ceremonies.</p></div>
      <div class="where__item" data-reveal style="--d:.1s"><span class="label">02</span><h3 class="h3">Hawaii Island</h3><p>Kona sunsets and coastal estates like Hale Wailele.</p></div>
      <div class="where__item" data-reveal style="--d:.2s"><span class="label">03</span><h3 class="h3">Destination</h3><p>From Salt Lake City, Utah to wherever you're saying yes. Ask about travel.</p></div>
    </div>
  </div>
</section>

${ctaBlock({ image: "assets/img/films/OAF6KZrBGzk.jpg" })}
</main>
${footer({})}`;
}

/* ============================== FILMS ============================== */
export function filmsPage() {
  const counts = Object.fromEntries(regions.map((r) => [r.id, films.filter((f) => f.region === r.id).length]));
  return `${head({
    title: "Wedding Films — Mark Arista Films, Hawaii",
    description: "Watch Hawaii wedding films by Mark Arista — Paliku Gardens, Four Seasons Oahu, Hale Wailele Kona, Ko'olau Ballrooms and beyond.",
    path: "films.html",
    image: "assets/img/films/hzfBBlhqEzI.jpg",
    jsonld: [orgLd],
  })}
${header({ active: "films.html" })}
<main id="main">
<section class="phero">
  <div class="wrap">
    <div class="phero__label"><p class="label label--dot" data-reveal>Wedding films</p><p class="label" data-reveal>Oahu · Hawaii Island · Destination</p></div>
    <h1 class="display phero__title" data-split>The films<span class="count">(${pad(films.length)})</span></h1>
    <div class="phero__foot" data-reveal>
      <p class="lead">Real couples, real islands. Press play on a few — then imagine your people in the frame.</p>
      <div class="phero__end">${btn("#all", "Browse films", "btn--ghost")}</div>
    </div>
  </div>
</section>

<section class="section--tight" id="all" data-films aria-label="All films">
  <div class="wrap">
    <div class="toolbar" data-reveal>
      <div class="filters" role="group" aria-label="Filter films by place">
        <button class="filter is-active" type="button" data-filter="all" aria-pressed="true">All<sup>${pad(films.length)}</sup></button>
        ${regions.map((r) => `<button class="filter" type="button" data-filter="${r.id}" aria-pressed="false">${r.label}<sup>${pad(counts[r.id])}</sup></button>`).join("")}
      </div>
      <div class="views" role="group" aria-label="Layout">
        <button type="button" class="is-active" data-view="grid" aria-pressed="true">Grid</button>
        <button type="button" data-view="list" aria-pressed="false">Index</button>
      </div>
    </div>
    <div class="fgrid">
      ${films.map((f, i) => `
      <article class="fcard" data-region="${f.region}" data-reveal>
        <a class="fcard__media" href="films/${f.slug}.html" data-cursor="View" aria-label="${f.couple} — view film">
          <img src="${img(f)}" alt="${f.couple} at ${f.venue}" loading="${i < 2 ? "eager" : "lazy"}">
          <span class="chip">${regionLabel(f.region)}</span>
          <span class="fcard__n label">${pad(i + 1)}</span>
        </a>
        <div class="fcard__row">
          <div>
            <h2 class="fcard__title"><a href="films/${f.slug}.html">${f.couple}</a></h2>
            <p class="fcard__sub">${f.venue} · ${f.location} — ${f.mood.join(", ")}</p>
          </div>
          <button class="fcard__play" type="button" data-video="${f.video}" data-title="${f.couple} — ${f.venue}" aria-label="Play ${f.couple} film">${ic.play}</button>
        </div>
      </article>`).join("")}
    </div>
    <div class="findex">
      ${films.map((f, i) => `<a class="irow" href="films/${f.slug}.html" data-region="${f.region}" data-img="${img(f)}">
        <span class="label">${pad(i + 1)}</span><span class="irow__t">${f.couple}</span><span class="irow__loc">${f.venue}</span><span class="irow__mood">${f.location}</span>${ic.arrowUR}
      </a>`).join("")}
    </div>
  </div>
  <div class="ipreview" aria-hidden="true"><img src="${img(films[0])}" alt=""></div>
</section>

${ctaBlock({ image: "assets/img/films/WGo_VWh5wRI.jpg" })}
</main>
${footer({})}`;
}

/* ============================== FILM DETAIL ============================== */
export function filmPage(f, i) {
  const base = "../";
  const next = films[(i + 1) % films.length];
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: f.ytTitle,
    description: f.story,
    thumbnailUrl: [`${site.url}/${img(f)}`],
    embedUrl: `https://www.youtube.com/embed/${f.video}`,
    contentUrl: `https://www.youtube.com/watch?v=${f.video}`,
    creator: { "@type": "Person", name: site.person },
  };
  return `${head({
    title: `${f.couple} — ${f.venue} Wedding Film | Mark Arista Films`,
    description: `${f.couple}'s wedding film at ${f.venue}, ${f.location}. ${f.mood.join(", ")} — by Hawaii wedding videographer Mark Arista.`,
    base,
    path: `films/${f.slug}.html`,
    image: img(f),
    jsonld: [ld],
  })}
${header({ base, active: "films.html" })}
<main id="main">
<section class="fhero">
  <div class="fhero__bg"><img src="${base}${img(f)}" alt="" fetchpriority="high" data-parallax="10"></div>
  <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="wrap">
    <p class="label label--dot" data-reveal data-hold>Film ${pad(i + 1)} / ${pad(films.length)} · ${regionLabel(f.region)}</p>
    <div class="fhero__grid mt-2">
      <h1 class="display fhero__title" data-split data-hold>${f.couple.replace(" + ", ' <span class="amp">+</span> ')}</h1>
      <button class="round-play" type="button" data-video="${f.video}" data-title="${f.couple} — ${f.venue}" aria-label="Play ${f.couple} film" data-reveal data-hold>${ic.play}<span>Play film</span></button>
    </div>
    <dl class="meta" data-reveal data-hold>
      <div><dt class="label">Venue</dt><dd>${f.venue}</dd></div>
      <div><dt class="label">Location</dt><dd>${f.location}</dd></div>
      <div><dt class="label">Island</dt><dd>${regionLabel(f.region)}</dd></div>
      <div><dt class="label">Feeling</dt><dd>${f.mood.join(" · ")}</dd></div>
    </dl>
  </div>
</section>

<section class="section" aria-labelledby="watch-title">
  <div class="wrap">
    <div class="shead">
      <p class="label scene shead__label" data-reveal><b>Sc. 01</b> Watch</p>
      <h2 class="display display--h2 shead__title" id="watch-title" data-split>${f.line}</h2>
    </div>
    <div class="player" data-yt="${f.video}" data-title="${f.ytTitle.replace(/"/g, "&quot;")}" data-cursor="Play" role="button" tabindex="0" aria-label="Play ${f.couple} film" data-reveal="clip">
      <img src="${base}${img(f)}" alt="${f.couple} — film still" loading="lazy">
      <div class="vf" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <span class="player__btn">${ic.play}<span>Play</span></span>
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="story-title">
  <div class="wrap fstory">
    <p class="label scene fstory__label" data-reveal><b>Sc. 02</b> The story</p>
    <div class="fstory__text">
      <h2 class="sr-only" id="story-title">The story</h2>
      <p class="statement" data-scrub>${f.story}</p>
      <div class="btns" data-reveal>
        ${btn(`${base}contact.html?film=${f.slug}`, "I want a film like this")}
        ${btn(`${base}films.html`, "All films", "btn--ghost")}
      </div>
    </div>
  </div>
</section>

<a class="next" href="${base}films/${next.slug}.html" aria-label="Next film: ${next.couple}" data-cursor="Next">
  <div class="next__bg"><img src="${base}${img(next)}" alt="" loading="lazy"></div>
  <div class="wrap">
    <p class="label">Next film →</p>
    <p class="display next__t">${next.couple.replace(" + ", ' <span class="amp">+</span> ')}</p>
    <p class="label mt-2">${next.venue} · ${next.location}</p>
  </div>
</a>
</main>
${footer({ base })}`;
}

/* ============================== EXPERIENCE ============================== */
export function experience() {
  const faqs = [
    ["Where are you based — and do you travel?", "I'm based in Hawaii and film across the islands, from Kaneohe and Ko Olina on Oahu to Kona on Hawaii Island. I also travel for weddings on the mainland and beyond — recent films include a wedding in Salt Lake City, Utah."],
    ["How far ahead should we book?", "As soon as you have a date and venue in mind. Popular dates go first, so it's always worth checking availability early — even if the rest of your planning is still coming together."],
    ["What will our film feel like?", "Like you. Every film is edited around your story, your voices and your people. Watch a few films to get a feel for the style, then tell me what you want to feel when you press play."],
    ["Can you film our cultural traditions?", "Absolutely. Whether it's a Hawaiian blessing, a lei exchange, the veil, cord and arras, or a money dance that takes over the reception, we'll plan around the moments that matter most to your families."],
    ["What's the investment?", "Every collection is tailored to the day you're planning. Share your date and a few details, and I'll send current collections and availability."],
    ["What happens after we enquire?", "I read every message personally and will reply to set up a relaxed call — a chance to talk story and make sure we're the right fit for each other."],
  ];
  return `${head({
    title: "The Experience — Working with Mark Arista Films",
    description: "What it's like to work with Hawaii wedding videographer Mark Arista — from your first hello to the day you press play on your film.",
    path: "experience.html",
    image: "assets/img/films/WGo_VWh5wRI.jpg",
    jsonld: [orgLd, { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }],
  })}
${header({ active: "experience.html" })}
<main id="main">
<section class="phero">
  <div class="wrap">
    <div class="phero__label"><p class="label label--dot" data-reveal>The experience</p><p class="label" data-reveal>From hello to happily ever after</p></div>
    <h1 class="display phero__title" data-split>Filmed with heart. <span class="it">Planned with care.</span></h1>
    <div class="phero__foot" data-reveal>
      <p class="lead">Calm, clear and personal from the first message. Here's exactly what working together looks like.</p>
      <div class="phero__end">${btn("contact.html", "Check your date")}</div>
    </div>
  </div>
</section>

<section class="section--tight" aria-hidden="true">
  <div class="wrap"><figure class="media ar-21" data-reveal="clip"><img src="assets/img/films/WGo_VWh5wRI.jpg" alt="" data-parallax="12" loading="lazy"><div class="vf"><i></i><i></i><i></i><i></i></div></figure></div>
</section>

<section class="section light" aria-labelledby="steps-title">
  <div class="wrap xsteps">
    <div class="xsteps__side"><div>
      <p class="label scene" data-reveal><b>Sc. 01</b> The process</p>
      <h2 class="display display--h2" id="steps-title" data-split>Six steps. <span class="it">Zero stress.</span></h2>
      <p class="lead" data-reveal>You focus on each other. I'll take care of the story.</p>
      <div data-reveal>${btn("contact.html", "Start with hello", "btn--ink")}</div>
    </div></div>
    <ol class="xsteps__list">
      <li class="xstep" data-reveal><span class="xstep__n">01</span><div><h3 class="h3">Say hello</h3><p>Send your date, venue and a little about the two of you. The form takes about two minutes.</p></div></li>
      <li class="xstep" data-reveal><span class="xstep__n">02</span><div><h3 class="h3">Let's talk story</h3><p>A relaxed call to hear how you met, who matters most and what you want to feel when you watch your film.</p></div></li>
      <li class="xstep" data-reveal><span class="xstep__n">03</span><div><h3 class="h3">Make it official</h3><p>Once it feels right, we lock in your date and I'm officially part of your team.</p></div></li>
      <li class="xstep" data-reveal><span class="xstep__n">04</span><div><h3 class="h3">Plan the moments</h3><p>Timeline, traditions, speeches and the people you can't miss — mapped out together so nothing is left to chance.</p></div></li>
      <li class="xstep" data-reveal><span class="xstep__n">05</span><div><h3 class="h3">The big day</h3><p>I stay close, calm and unobtrusive. You stay present with your people while the story unfolds.</p></div></li>
      <li class="xstep" data-reveal><span class="xstep__n">06</span><div><h3 class="h3">Relive it</h3><p>Your film arrives, ready to share with the family near and far — and to replay on every anniversary.</p></div></li>
    </ol>
  </div>
</section>

<section class="section" aria-labelledby="trad-title">
  <div class="wrap">
    <div class="shead shead--wide">
      <p class="label scene shead__label" data-reveal><b>Sc. 02</b> Traditions</p>
      <h2 class="display display--h2 shead__title" id="trad-title" data-split>Traditions, <span class="it">understood.</span></h2>
    </div>
    <div class="intro__grid">
      <p class="body intro__text" data-reveal style="grid-column:4 / span 6">Hawaiian, Filipino, both or something entirely your own — the moments your families care about most get planned for, not stumbled upon.</p>
    </div>
    <div class="traditions" data-reveal>
      <span class="tradition">Lei exchange</span>
      <span class="tradition"><span class="it">Hawaiian</span> blessing</span>
      <span class="tradition">Veil, cord <span class="it">&amp;</span> arras</span>
      <span class="tradition">Money dance</span>
      <span class="tradition"><span class="it">Family</span> speeches</span>
      <span class="tradition">First dance</span>
      <span class="tradition">Sunset <span class="it">portraits</span></span>
      <span class="tradition">The send-off</span>
    </div>
  </div>
</section>

<section class="section--tight" aria-labelledby="invest-title">
  <div class="wrap">
    <div class="invest" data-reveal>
      <h2 class="display invest__t" id="invest-title">Tailored to <span class="it">your day.</span></h2>
      <div class="invest__r">
        <p>Every collection is shaped around the day you're planning — your venue, your timeline and your people. Share a few details and I'll send current collections and availability.</p>
        <a class="btn btn--ink" href="contact.html"><span>Request collections</span><span class="btn__ic">${ic.arrow}</span></a>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="faq-title">
  <div class="wrap faq-wrap">
    <div class="shead__label">
      <p class="label scene" data-reveal><b>Sc. 03</b> Questions</p>
      <h2 class="display display--h2 mt-2" id="faq-title" data-split>Good <span class="it">questions.</span></h2>
    </div>
    <div class="faq" data-reveal>
      ${faqs.map(([q, a], k) => `<details${k === 0 ? " open" : ""}><summary><span class="h3">${q}</span><span class="faq__ic" aria-hidden="true"></span></summary><p class="faq__a">${a}</p></details>`).join("")}
    </div>
  </div>
</section>

${ctaBlock({ image: "assets/img/films/CWCR__HvvXI.jpg" })}
</main>
${footer({})}`;
}

/* ============================== CONTACT ============================== */
export function contact() {
  const ldContact = { "@context": "https://schema.org", "@type": "ContactPage", name: "Contact Mark Arista Films", url: `${site.url}/contact.html` };
  return `${head({
    title: "Check Your Date — Contact Mark Arista Films",
    description: "Tell Mark Arista about your wedding. Check availability for Hawaii and destination wedding films.",
    path: "contact.html",
    image: "assets/img/films/uX9gSYDRctw.jpg",
    jsonld: [orgLd, ldContact],
  })}
${header({ active: "contact.html" })}
<main id="main">
<section class="wrap contact">
  <div class="contact__side"><div>
    <p class="label label--dot" data-reveal data-hold>Contact · Now booking</p>
    <h1 class="display contact__title" data-split data-hold>So what's <span class="it">your story?</span></h1>
    <p class="lead" data-reveal data-hold>Get in touch — let me help answer any questions you might have. I look forward to hearing from you.</p>
    <div class="contact__facts" data-reveal data-hold>
      <a href="mailto:${site.email}"><span class="label">Email</span><span>${site.email}</span></a>
      <a href="${site.instagram}" target="_blank" rel="noopener"><span class="label">Instagram</span><span>@markaristafilms ↗</span></a>
      <div><span class="label">Hawaii time</span><span data-clock>—</span></div>
      <div><span class="label">Based in</span><span>Hawaii · travels worldwide</span></div>
    </div>
  </div></div>

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
          <div class="field"><label for="f-venue">Venue</label><input id="f-venue" name="venue" placeholder="If you have one in mind"></div>
        </fieldset>

        <fieldset class="fstep">
          <legend>Your <span class="it">story.</span></legend>
          <div class="field"><label for="f-story">Tell me about you two *</label><textarea id="f-story" name="story" required placeholder="How you met, who'll be there, traditions you're including, what you want to feel when you watch your film…"></textarea></div>
          <div class="row2">
            <div class="field"><label for="f-film">A film you loved</label>
              <select id="f-film" name="film"><option value="">Choose a film</option>${films.map((f) => `<option value="${f.slug}">${f.couple} — ${f.venue}</option>`).join("")}</select></div>
            <div class="field"><label for="f-source">How did you find me?</label>
              <select id="f-source" name="source"><option value="">Select</option><option>Instagram</option><option>Google</option><option>YouTube</option><option>Venue or planner</option><option>Friend or family</option><option>Other</option></select></div>
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
        <p class="lead" style="color:var(--ink-muted)">Your inquiry is on its way to Mark. If your email app opened, just press send. While you wait, there are a few more films to watch.</p>
        <div>${btn("films.html", "Watch the films", "btn--ink")}</div>
      </div>
    </div>
    <details class="hb">
      <summary><span>Prefer the classic booking form?</span><span>+</span></summary>
      <div class="hb__box"><div class="hb-p-6110b3b4a4c7471c210bcf08-2"></div></div>
    </details>
  </div>
</section>
</main>
${footer({ mbar: false })}`;
}

/* ============================== 404 ============================== */
export function notFound() {
  return `${head({ title: "Scene not found — Mark Arista Films", description: "This page doesn't exist.", path: "404.html" })}
${header({})}
<main id="main" class="nf">
  <div>
    <p class="label label--dot" style="justify-content:center">Cut! · Scene missing</p>
    <h1 class="display mt-2">4<span class="it">0</span>4</h1>
    <p class="lead mt-2" style="margin-inline:auto">This scene didn't make the final edit. Let's get you back to the story.</p>
    <div class="btns mt-3" style="justify-content:center">${btn("index.html", "Back home")}${btn("films.html", "Watch films", "btn--ghost")}</div>
  </div>
</main>
${footer({ mbar: false })}`;
}
