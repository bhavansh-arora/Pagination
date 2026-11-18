/* ==========================================================================
   Love to Cook: motion
   Preloader, page transitions, smooth scroll, split text, reveals,
   marquee, pinned gallery, magnetic buttons, cursor, hero cycle.
   Built by Code Bunny
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const html = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- Hero image cycle (works without GSAP) ---------- */
  (function heroCycle() {
    const stage = $("[data-hero-cycle]");
    if (!stage) return;
    const imgs = $$("img", stage);
    const cap = $("[data-hero-cap]");
    const idx = $("[data-hero-idx]");
    const bars = $$(".hero__progress i");
    const D = 4200;
    stage.style.setProperty("--cycle", D + "ms");
    let i = 0;
    const show = (n) => {
      imgs.forEach((im, k) => im.classList.toggle("is-active", k === n));
      bars.forEach((b, k) => { b.classList.toggle("is-done", k < n); b.classList.remove("is-active"); });
      if (bars[n]) { void bars[n].offsetWidth; bars[n].classList.add("is-active"); }
      if (cap) cap.textContent = imgs[n].dataset.cap || "";
      if (idx) idx.textContent = String(n + 1).padStart(2, "0") + " / " + String(imgs.length).padStart(2, "0");
    };
    show(0);
    if (!reduce) setInterval(() => { i = (i + 1) % imgs.length; show(i); }, D);
  })();

  if (!hasGSAP || reduce) {
    html.classList.add("no-motion");
    if (reduce) html.classList.add("reduce-motion");
    const l = $(".loader"); if (l) l.classList.add("is-done");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  html.classList.add("motion-ok");
  const ease = "expo.out";

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && finePointer) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = $(id);
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -90, duration: 1.4 }); }
    }));
  }

  /* ---------- Split text ---------- */
  function splitLines(el) {
    // Wrap words (preserving inline elements), then group words into lines by offsetTop.
    // Tokenise into words. Pieces with no whitespace between them (e.g. <em>best</em>.)
    // share one inline-block group, so punctuation never wraps away from its word.
    const walk = (node) => {
      const out = [];
      let grp = null;
      const close = () => { grp = null; };
      const ensure = () => {
        if (!grp) { grp = document.createElement("span"); grp.className = "w"; grp.style.display = "inline-block"; out.push(grp); }
        return grp;
      };
      const space = () => { close(); out.push(document.createTextNode(" ")); };
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) space(); else ensure().appendChild(document.createTextNode(part));
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") { close(); out.push(n.cloneNode()); return; }
          const txt = n.textContent;
          if (!n.children.length && /\S\s+\S/.test(txt)) {
            txt.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) space();
              else { const c = n.cloneNode(false); c.textContent = part; ensure().appendChild(c); }
            });
          } else ensure().appendChild(n.cloneNode(true));
        }
      });
      return out;
    };
    const parts = walk(el);
    el.innerHTML = "";
    parts.forEach((p) => el.appendChild(p));
    // group nodes into visual lines by vertical centre (robust to inline images)
    const lines = [];
    let line = null, cy0 = null, half = 0;
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 1 && n.tagName === "BR") { cy0 = null; return; }
      if (n.nodeType === 3) { if (line) line.push(n); return; }
      const cy = n.offsetTop + n.offsetHeight / 2;
      if (cy0 === null || Math.abs(cy - cy0) > half) { line = []; lines.push(line); cy0 = cy; half = Math.max(8, n.offsetHeight * 0.45); }
      line.push(n);
    });
    el.innerHTML = "";
    lines.forEach((ns) => {
      const l = document.createElement("span"); l.className = "split-line";
      const inner = document.createElement("span");
      ns.forEach((n) => inner.appendChild(n));
      l.appendChild(inner); el.appendChild(l);
    });
    el.classList.add("is-split");
    return $$(".split-line > span", el);
  }

  /* ---------- Intro / preloader ---------- */
  const loader = $(".loader");
  const firstVisit = (() => { try { return !sessionStorage.getItem("ltc:seen"); } catch (e) { return true; } })();
  const curtain = $(".curtain");

  function heroIn() {
    const tl = gsap.timeline({ defaults: { ease } });
    $$("[data-hero-split]").forEach((el, k) => {
      const lines = splitLines(el);
      tl.from(lines, { yPercent: 110, rotate: 2, duration: 1.4, stagger: 0.09 }, k * 0.08);
    });
    const has = (s) => document.querySelector(s);
    if (has("[data-hero-fade]")) tl.from("[data-hero-fade]", { y: 30, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.35);
    if (has("[data-hero-media]")) tl.from("[data-hero-media]", { clipPath: "inset(18% 12% 18% 12% round 32px)", scale: 1.04, duration: 1.8, ease: "expo.inOut", stagger: 0.08, clearProps: "clipPath,scale" }, 0.1);
    if (has("[data-hero-pop]")) tl.from("[data-hero-pop]", { scale: 0, rotate: -40, duration: 1.2, stagger: 0.1, ease: "back.out(1.6)" }, 0.9);
    return tl;
  }

  function runIntro() {
    if (loader && firstVisit) {
      try { sessionStorage.setItem("ltc:seen", "1"); } catch (e) { /* ignore */ }
      const count = $(".loader__count", loader);
      const o = { v: 0 };
      const tl = gsap.timeline();
      tl.to(".loader__logo", { opacity: 1, y: 0, duration: 1, ease })
        .to(o, { v: 100, duration: 1.6, ease: "power2.inOut", onUpdate: () => (count.textContent = String(Math.round(o.v)).padStart(3, "0")) }, 0.1)
        .to(".loader__bar span", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0.1)
        .to(".loader__inner", { opacity: 0, y: -20, duration: 0.6, ease: "power2.in" }, "+=0.1")
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.2")
        .add(() => { loader.classList.add("is-done"); }, ">")
        .add(heroIn(), "-=0.75");
    } else {
      if (loader) loader.classList.add("is-done");
      if (curtain) gsap.fromTo(curtain, { yPercent: 0, visibility: "visible" }, { yPercent: -100, duration: 1, ease: "expo.inOut", onComplete: () => gsap.set(curtain, { visibility: "hidden" }) });
      heroIn().delay(curtain ? 0.25 : 0);
    }
  }

  /* ---------- Page transitions ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || !curtain) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    e.preventDefault();
    gsap.set(curtain, { yPercent: 100, visibility: "visible" });
    gsap.to(curtain, { yPercent: 0, duration: 0.7, ease: "expo.inOut", onComplete: () => (location.href = url.href) });
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted && curtain) gsap.set(curtain, { yPercent: 100, visibility: "hidden" }); });

  /* ---------- Generic reveals ---------- */
  function reveals() {
    $$("[data-split]").forEach((el) => {
      const lines = splitLines(el);
      gsap.from(lines, { yPercent: 110, rotate: 1.5, duration: 1.3, ease, stagger: 0.08, scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease, stagger: 0.08, overwrite: true }),
    });
    $$("[data-reveal-img]").forEach((el) => {
      const img = $("img", el);
      gsap.fromTo(el, { clipPath: "inset(14% 8% 14% 8% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" }, clearProps: "clipPath" });
      if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: () => (el.textContent = Math.round(o.v) + (el.dataset.suffix || "")) });
    });
    $$("[data-float]").forEach((el, k) => {
      gsap.to(el, { y: k % 2 ? -60 : 60, rotate: k % 2 ? 6 : -6, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* Word-by-word scrub highlight */
  function scrubWords() {
    $$("[data-scrub-words]").forEach((el) => {
      const walk = (node) => {
        $$(":scope > *", node).length;
        Array.from(node.childNodes).forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((p) => {
              if (!p) return;
              if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
              else { const s = document.createElement("span"); s.className = "w"; s.textContent = p; frag.appendChild(s); }
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && !n.classList.contains("pill-img")) walk(n);
          else if (n.nodeType === 1) n.classList.add("w");
        });
      };
      walk(el);
      gsap.to($$(".w", el), { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
  }

  /* ---------- Marquee with scroll velocity ---------- */
  function marquees() {
    $$("[data-marquee]").forEach((m) => {
      const track = $(".marquee__track", m);
      const group = $(".marquee__group", track);
      track.appendChild(group.cloneNode(true)).setAttribute("aria-hidden", "true");
      const dir = m.dataset.marquee === "right" ? 1 : -1;
      let x = 0, speed = 1, w = group.offsetWidth;
      window.addEventListener("resize", () => (w = group.offsetWidth));
      ScrollTrigger.create({ trigger: m, start: "top bottom", end: "bottom top", onUpdate: (self) => { speed = 1 + Math.min(6, Math.abs(self.getVelocity() / 300)); } });
      gsap.ticker.add((t, dt) => {
        x += dir * 0.06 * speed * dt;
        speed += (1 - speed) * 0.05;
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });
  }

  /* ---------- Pinned horizontal gallery ---------- */
  function hgallery() {
    const sec = $("[data-hscroll]");
    if (!sec) return;
    const track = $(".hgal__track", sec);
    const bar = $(".hgal__progress span", sec);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1001px) and (hover: hover)", () => {
      const dist = () => track.scrollWidth - window.innerWidth;
      const tw = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (s) => bar && gsap.set(bar, { scaleX: s.progress }) },
      });
      $$(".hgal__item .media img", sec).forEach((img) => {
        gsap.fromTo(img, { scale: 1.2, xPercent: -6 }, { scale: 1.2, xPercent: 6, ease: "none", scrollTrigger: { trigger: img.closest(".hgal__item"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
      return () => gsap.set(track, { clearProps: "transform" });
    });
    mm.add("(max-width: 1000px), (hover: none)", () => {
      const onS = () => bar && gsap.set(bar, { scaleX: track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth) });
      track.addEventListener("scroll", onS, { passive: true });
      return () => track.removeEventListener("scroll", onS);
    });
  }

  /* ---------- Steps progress ---------- */
  function steps() {
    const list = $("[data-steps]");
    if (!list) return;
    const line = $(".steps-line span", list);
    gsap.to(line, { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: true } });
    $$(".step", list).forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 62%", toggleClass: { targets: s, className: "is-active" }, onLeave: () => s.classList.add("is-active") }));
  }

  /* ---------- Magnetic ---------- */
  function magnetic() {
    if (!finePointer) return;
    $$("[data-magnetic], .btn:not(.btn--block), .icon-btn, .bag-btn, .next-card__go").forEach((el) => {
      const s = el.matches(".btn") ? 0.25 : 0.4;
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * s); yTo((e.clientY - r.top - r.height / 2) * s); });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Cursor ---------- */
  function cursor() {
    const c = $(".cursor");
    if (!c || !finePointer) return;
    html.classList.add("has-cursor");
    const label = $(".cursor__label", c);
    const xTo = gsap.quickTo(c, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(c, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("mousemove", (e) => { xTo(e.clientX); yTo(e.clientY); c.classList.add("is-live"); });
    document.addEventListener("mouseleave", () => c.classList.remove("is-live"));
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { label.textContent = t.dataset.cursor; c.classList.add("has-label"); } else c.classList.remove("has-label");
    });
  }

  /* ---------- Tilt (voucher) ---------- */
  function tilt() {
    if (!finePointer) return;
    $$("[data-tilt]").forEach((el) => {
      const wrap = el.parentElement;
      wrap.addEventListener("mousemove", (e) => {
        const r = wrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 16, rotateX: -py * 16, duration: 0.6, ease: "power3" });
        el.style.setProperty("--shine", `${(1 - (px + 0.5)) * 100}%`);
      });
      wrap.addEventListener("mouseleave", () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: "elastic.out(1,0.5)" }));
    });
  }

  /* ---------- Footer mega type ---------- */
  function footerMega() {
    const m = $(".footer__mega");
    if (!m) return;
    gsap.from(m, { yPercent: 40, opacity: 0, duration: 1.6, ease, scrollTrigger: { trigger: m, start: "top 98%" } });
  }

  /* ---------- Boot ---------- */
  const boot = () => {
    reveals();
    scrubWords();
    marquees();
    hgallery();
    steps();
    magnetic();
    cursor();
    tilt();
    footerMega();
    runIntro();
    ScrollTrigger.refresh();
  };
  if (document.fonts && document.fonts.ready) {
    let done = false;
    const go = () => { if (!done) { done = true; boot(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 1500);
  } else boot();
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
