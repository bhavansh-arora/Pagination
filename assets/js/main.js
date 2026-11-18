/* ==========================================================================
   ASB Media Group — interactions
   GSAP + ScrollTrigger + Lenis. Progressive: every section works without JS.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  if (!hasGSAP) { root.classList.remove("js"); return; }
  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;
  gsap.defaults({ ease: "expo.out", duration: 1.2 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4, ...opts });
    else {
      const el = typeof target === "number" ? null : (typeof target === "string" ? $(target) : target);
      window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY - 20 : target, behavior: reduce ? "auto" : "smooth" });
    }
  };

  /* ---------- Utilities ---------- */
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const fmtTC = (frames) => {
    const f = frames % 24, s = Math.floor(frames / 24) % 60, m = Math.floor(frames / 1440) % 60, h = Math.floor(frames / 86400);
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
  };

  /* ---------- Live timecode HUDs ---------- */
  const tcs = $$("[data-timecode]");
  if (tcs.length) {
    const start = performance.now();
    const tick = () => {
      const frames = Math.floor(((performance.now() - start) / 1000) * 24) + 24 * 3;
      tcs.forEach((el) => (el.textContent = fmtTC(frames)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Local time (Tampa) ---------- */
  const clocks = $$("[data-clock]");
  const setClock = () => {
    try {
      const t = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date());
      clocks.forEach((c) => (c.textContent = t));
    } catch (e) {}
  };
  if (clocks.length) { setClock(); setInterval(setClock, 30000); }

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Header ---------- */
  const header = $(".header");
  let lastY = 0;
  const onScroll = (y) => {
    if (!header) return;
    header.classList.toggle("is-scrolled", y > 40);
    if (!root.classList.contains("menu-open")) header.classList.toggle("is-hidden", y > lastY && y > 400);
    lastY = y;
    const mbar = $(".mbar");
    if (mbar) mbar.classList.toggle("is-on", y > window.innerHeight * 0.6);
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  /* ---------- Menu ---------- */
  const menuBtn = $(".menu-btn");
  const menu = $(".menu");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    menuBtn && menuBtn.setAttribute("aria-expanded", String(open));
    menu && menu.setAttribute("aria-hidden", String(!open));
    if (menu) menu.inert = !open;
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && header) header.classList.remove("is-hidden");
    $$(".menu__link").forEach((l, i) => (l.style.transitionDelay = open ? `${0.25 + i * 0.06}s` : "0s"));
  };
  if (menu) menu.inert = true;
  menuBtn && menuBtn.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); closeLB(); } });
  $$(".menu__link").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      const key = link.dataset.preview;
      $$(".menu__preview img").forEach((img) => img.classList.toggle("is-active", img.dataset.key === key));
    });
  });

  /* ---------- Page transitions ---------- */
  const wipe = $(".wipe");
  const panels = wipe ? $$(".wipe__panel", wipe) : [];
  const entering = root.classList.contains("is-entering");
  const isInternal = (a) => {
    if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.noWipe !== undefined) return false;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.hash) return false;
    return true;
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.getAttribute("href") && a.getAttribute("href").startsWith("#") && a.getAttribute("href").length > 1) {
      const t = $(a.getAttribute("href"));
      if (t) { e.preventDefault(); setMenu(false); scrollTo(t); }
      return;
    }
    if (!isInternal(a) || reduce || !panels.length) return;
    e.preventDefault();
    store.set("asb-wipe", "1");
    gsap.set(panels, { transformOrigin: "bottom" });
    gsap.to(panels, { scaleY: 1, duration: 0.7, ease: "expo.inOut", stagger: 0.08, onComplete: () => (location.href = a.href) });
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && panels.length) gsap.set(panels, { scaleY: 0 });
  });

  /* ---------- Split helpers ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = p; frag.appendChild(s); }
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
    return $$(".w", el);
  };

  /* ---------- Intro (hero) ---------- */
  const heroLines = $$("[data-split] .line > span");
  const introHero = () => {
    const tl = gsap.timeline();
    if (heroLines.length) tl.to(heroLines, { yPercent: 0, y: 0, duration: 1.4, stagger: 0.09, ease: "expo.out" }, 0);
    const heroFades = $$("[data-hero-fade]");
    if (heroFades.length) tl.fromTo(heroFades, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.35);
    return tl;
  };
  gsap.set(heroLines, { y: 0, yPercent: 110 });

  const startPage = () => {
    introHero();
    loadHeroVideo();
    ST.refresh();
  };

  /* ---------- Preloader ---------- */
  const loader = $(".loader");
  const runLoader = () => {
    if (!loader) return false;
    const seen = store.get("asb-seen");
    if (reduce) { loader.remove(); return false; }
    store.set("asb-seen", "1");
    const tc = $(".loader__tc-num", loader);
    const word = $$(".loader__word span", loader);
    const line = $(".loader__line i", loader);
    const total = seen ? 24 : 72; // frames
    const counter = { f: 0 };
    const tl = gsap.timeline({ onComplete: () => { loader.remove(); } });
    gsap.set(word, { yPercent: 110 });
    tl.to(word, { yPercent: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.1)
      .to(counter, { f: total, duration: seen ? 0.6 : 1.6, ease: "power2.inOut", onUpdate: () => tc && (tc.textContent = fmtTC(Math.round(counter.f))) }, 0.1)
      .to(line, { scaleX: 1, duration: seen ? 0.6 : 1.6, ease: "power2.inOut" }, 0.1)
      .to(word, { yPercent: -110, duration: 0.7, stagger: 0.04, ease: "expo.in" })
      .to([".loader__tc", ".loader__line", ".loader__frame"].map((s) => $(s, loader)).filter(Boolean), { autoAlpha: 0, duration: 0.4 }, "<")
      .to(".loader__bar--top", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
      .to(".loader__bar--bot", { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "<")
      .set(loader, { background: "transparent" }, "<")
      .add(startPage, "-=0.75");
    return true;
  };

  /* ---------- Hero background film (Vimeo, background mode) ---------- */
  function loadHeroVideo() {
    const holder = $(".vimeo-bg[data-vimeo]");
    if (!holder || reduce) return;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ""))) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://player.vimeo.com/video/${holder.dataset.vimeo}?background=1&autoplay=1&loop=1&muted=1&autopause=0&dnt=1`;
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.title = holder.dataset.title || "Background film";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    // Only reveal once Vimeo reports real playback, so the poster stays if the embed is blocked.
    const post = (m) => iframe.contentWindow && iframe.contentWindow.postMessage(JSON.stringify(m), "https://player.vimeo.com");
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://player.vimeo.com" || e.source !== iframe.contentWindow) return;
      let d = e.data; try { d = typeof d === "string" ? JSON.parse(d) : d; } catch (x) { return; }
      if (d && d.event === "ready") { post({ method: "addEventListener", value: "play" }); post({ method: "addEventListener", value: "timeupdate" }); }
      if (d && (d.event === "play" || d.event === "timeupdate")) holder.classList.add("is-ready");
    });
    holder.appendChild(iframe);
  }

  const enterFromWipe = () => {
    if (!panels.length) return;
    if (entering) {
      gsap.set(panels, { scaleY: 1, transformOrigin: "top" });
      root.classList.remove("is-entering");
      gsap.to(panels.slice().reverse(), { scaleY: 0, duration: 0.9, ease: "expo.inOut", stagger: 0.08, delay: 0.05 });
    }
    store.del("asb-wipe");
  };

  /* ---------- Scroll reveals ---------- */
  const setupReveals = () => {
    // line-split headings outside hero
    $$("[data-lines]").forEach((el) => {
      const spans = $$(".split-line > span", el);
      gsap.set(spans, { y: 0, yPercent: 110 });
      ST.create({ trigger: el, start: "top 88%", once: true, onEnter: () => gsap.to(spans, { yPercent: 0, y: 0, duration: 1.3, stagger: 0.08 }) });
    });

    ST.batch("[data-reveal]", {
      start: "top 90%",
      once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08, overwrite: true }),
    });

    $$("[data-clip]").forEach((el) => {
      const img = $("img", el);
      ST.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: () => {
          gsap.to(el, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "expo.inOut" });
          if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.9, ease: "expo.out" });
        },
      });
    });

    // Parallax
    $$("[data-speed]").forEach((el) => {
      const s = parseFloat(el.dataset.speed) || 0.15;
      gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Manifesto word scrub
    $$("[data-words]").forEach((el) => {
      const words = splitWords(el);
      gsap.to(words, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
    });

    // Counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      ST.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(obj, { v: end, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(obj.v)) }) });
    });

    // Footer mega
    const mega = $$(".footer__mega span");
    if (mega.length) {
      gsap.fromTo(mega, { yPercent: 100 }, { yPercent: 0, stagger: 0.04, ease: "expo.out", duration: 1.4, scrollTrigger: { trigger: ".footer__mega", start: "top 98%" } });
      gsap.to(".footer__mega", { color: "#232327", scrollTrigger: { trigger: ".footer__mega", start: "top bottom", end: "bottom bottom", scrub: true } });
    }

    // Hero media drift
    const hm = $(".hero__media");
    if (hm) gsap.to(hm, { yPercent: 18, scale: 1.06, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    const hb = $(".hero__body");
    if (hb) gsap.to(hb, { yPercent: -12, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

    // Process rail
    const rail = $(".process__rail i");
    if (rail) {
      gsap.to(rail, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".process__steps", start: "top 60%", end: "bottom 60%", scrub: true } });
      $$(".step").forEach((s) => ST.create({ trigger: s, start: "top 62%", onToggle: (self) => s.classList.toggle("is-on", self.isActive || self.progress === 1), end: "max" }));
    }

    // Collage drift
    $$(".collage figure").forEach((f, i) => {
      gsap.fromTo(f, { y: (i % 2 ? 1 : -1) * 80 }, { y: (i % 2 ? -1 : 1) * 80, ease: "none", scrollTrigger: { trigger: ".statement", start: "top bottom", end: "bottom top", scrub: true } });
    });
  };

  /* ---------- Marquees (velocity aware) ---------- */
  const setupMarquees = () => {
    $$("[data-marquee]").forEach((m) => {
      const track = $(".marquee__track", m);
      if (!track) return;
      const dir = m.dataset.marquee === "right" ? 1 : -1;
      const base = parseFloat(m.dataset.marqueeSpeed || 38);
      const tween = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: base, ease: "none", repeat: -1 });
      if (reduce) { tween.pause(); return; }
      let boost = 0, sign = 1;
      if (lenis) lenis.on("scroll", ({ velocity }) => {
        boost = Math.min(Math.abs(velocity) / 4, 5);
        if (Math.abs(velocity) > 0.5) sign = velocity < 0 ? -1 : 1;
      });
      gsap.ticker.add(() => {
        boost *= 0.92;
        const target = sign * (1 + boost);
        tween.timeScale(tween.timeScale() + (target - tween.timeScale()) * 0.1);
      });
    });
  };

  /* ---------- Horizontal reel ---------- */
  const setupReel = () => {
    const reel = $("[data-hscroll]");
    if (!reel) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const track = $(".reel__track", reel);
      const pinEl = $(".reel__pin", reel) || reel;
      const dist = () => track.scrollWidth - track.clientWidth;
      const st = { trigger: pinEl, start: "center 54%", end: () => "+=" + dist(), invalidateOnRefresh: true };
      const tw = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { ...st, pin: true, scrub: 0.8, anticipatePin: 1 } });
      const bar = $(".reel__progress i", reel);
      if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { ...st, scrub: true } });
      return () => tw.kill();
    });
  };

  /* ---------- Cursor ---------- */
  const setupCursor = () => {
    const c = $(".cursor");
    if (!c || !finePointer) return;
    const label = $(".cursor__label", c);
    const xTo = gsap.quickTo(c, "x", { duration: 0.18, ease: "power3" });
    const yTo = gsap.quickTo(c, "y", { duration: 0.18, ease: "power3" });
    const ring = $(".cursor__ring", c);
    let rx = 0, ry = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); tx = e.clientX; ty = e.clientY; c.classList.remove("is-hidden"); }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.add("is-hidden"));
    gsap.ticker.add(() => { rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16; ring.style.transform = `translate(${rx - tx}px, ${ry - ty}px)`; });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, input, textarea, select, label");
      c.classList.remove("is-hover", "is-label");
      if (!t) return;
      if (t.dataset.cursor) { c.classList.add("is-label"); label.textContent = t.dataset.cursor; }
      else c.classList.add("is-hover");
    });
  };

  /* ---------- Magnetic ---------- */
  const setupMagnetic = () => {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  };

  /* ---------- Services floating preview ---------- */
  const setupSvcFloat = () => {
    const float = $(".svc__float");
    if (!float || !finePointer) return;
    const xTo = gsap.quickTo(float, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(float, "y", { duration: 0.6, ease: "power3" });
    const imgs = $$("img", float);
    $$(".svc__row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        imgs.forEach((i) => i.classList.toggle("is-active", i.dataset.key === row.dataset.key));
        gsap.to(float, { autoAlpha: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.6, ease: "expo.out" });
      });
      row.addEventListener("pointerleave", () => gsap.to(float, { autoAlpha: 0, scale: 0.8, duration: 0.4 }));
      row.addEventListener("pointermove", (e) => { xTo(e.clientX - float.offsetWidth / 2); yTo(e.clientY - float.offsetHeight / 2); });
    });
  };

  /* ---------- Lightbox (video + images) ---------- */
  const lb = $(".lb");
  const lbFrame = lb ? $(".lb__frame", lb) : null;
  const lbCap = lb ? $(".lb__cap", lb) : null;
  let lbGroup = [], lbIndex = 0, lastFocus = null;
  const vimeoSrc = (id) => `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&color=ff3b1f&dnt=1`;
  const openLB = (html, cls) => {
    if (!lb) return;
    lastFocus = document.activeElement;
    lbFrame.className = "lb__frame" + (cls ? " " + cls : "");
    lbFrame.innerHTML = html;
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lb.inert = false;
    if (lenis) lenis.stop();
    setTimeout(() => $(".lb__close", lb).focus(), 50);
  };
  function closeLB() {
    if (!lb || !lb.classList.contains("is-open")) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    lb.inert = true;
    setTimeout(() => (lbFrame.innerHTML = ""), 500);
    if (lenis) lenis.start();
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  const showImg = (i) => {
    lbIndex = (i + lbGroup.length) % lbGroup.length;
    const it = lbGroup[lbIndex];
    openLB(`<img src="${it.src}" alt="${it.alt}">`, "lb__frame--img");
    if (lbCap) lbCap.textContent = `${pad(lbIndex + 1)} / ${pad(lbGroup.length)}`;
  };
  if (lb) {
    lb.inert = true;
    $(".lb__close", lb).addEventListener("click", closeLB);
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
    $(".lb__nav--prev", lb).addEventListener("click", () => showImg(lbIndex - 1));
    $(".lb__nav--next", lb).addEventListener("click", () => showImg(lbIndex + 1));
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open") || !lbGroup.length) return;
      if (e.key === "ArrowRight") showImg(lbIndex + 1);
      if (e.key === "ArrowLeft") showImg(lbIndex - 1);
    });
  }
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-video]");
    if (v) {
      e.preventDefault();
      lbGroup = [];
      lb.classList.remove("has-nav");
      $$(".lb__nav", lb).forEach((n) => (n.hidden = true));
      if (lbCap) lbCap.textContent = v.dataset.title || "";
      openLB(`<iframe src="${vimeoSrc(v.dataset.video)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${v.dataset.title || "Film"}"></iframe>`);
      return;
    }
    const g = e.target.closest("[data-lb]");
    if (g) {
      e.preventDefault();
      const scope = g.closest("[data-lb-scope]") || document;
      lbGroup = $$("[data-lb]", scope).filter((x) => !x.closest(".is-hidden")).map((x) => ({ src: x.dataset.lb, alt: ($("img", x) || {}).alt || "" }));
      $$(".lb__nav", lb).forEach((n) => (n.hidden = false));
      showImg(lbGroup.findIndex((x) => x.src === g.dataset.lb));
    }
  });

  /* ---------- Case study inline player ---------- */
  $$("[data-player]").forEach((p) => {
    p.addEventListener("click", () => {
      if (p.classList.contains("is-playing")) return;
      const f = document.createElement("iframe");
      f.src = vimeoSrc(p.dataset.player);
      f.allow = "autoplay; fullscreen; picture-in-picture";
      f.allowFullscreen = true;
      f.title = p.dataset.title || "Film";
      p.appendChild(f);
      p.classList.add("is-playing");
    });
  });

  $$("[data-player]").forEach((p) => p.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.click(); }
  }));

  /* ---------- Tabs / filters ---------- */
  $$("[data-filter-group]").forEach((group) => {
    const scope = $(group.dataset.filterGroup);
    const tabs = $$("[data-filter]", group);
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      tabs.forEach((t) => { t.classList.toggle("is-active", t === tab); t.setAttribute("aria-pressed", String(t === tab)); });
      const f = tab.dataset.filter;
      const items = $$("[data-cat]", scope);
      const shown = items.filter((it) => f === "all" || it.dataset.cat.split(" ").includes(f));
      items.forEach((it) => it.classList.toggle("is-hidden", !shown.includes(it)));
      gsap.fromTo(shown, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.03, overwrite: true });
      ST.refresh();
    }));
  });

  // Deep links like photography.html#sports pre-select that filter
  if (location.hash.length > 1) {
    const t = document.getElementById(location.hash.slice(1));
    if (t && t.hasAttribute("data-filter")) setTimeout(() => t.click(), 400);
  }

  /* ---------- Accordion ---------- */
  $$(".acc__q").forEach((q) => q.addEventListener("click", () => {
    const item = q.closest(".acc__item");
    const open = !item.classList.contains("is-open");
    item.classList.toggle("is-open", open);
    q.setAttribute("aria-expanded", String(open));
    setTimeout(() => ST.refresh(), 650);
  }));

  /* ---------- Film Finder ---------- */
  const finder = $("[data-finder]");
  if (finder) {
    const steps = $$(".finder__step", finder);
    const bars = $$(".finder__progress i", finder);
    const result = $(".finder__result", finder);
    const back = $("[data-finder-back]", finder);
    const restart = $("[data-finder-restart]", finder);
    const answers = {};
    let idx = 0;
    const RECS = {
      anthem: { name: "Brand Anthem <em>Film</em>", code: "anthem", runtime: "60–180 sec hero film", why: "You need people to feel what you stand for. An anthem film is the centrepiece of your website, pitch decks and launch moments — then we cut it down for social.", chips: ["Hero film", "Story-led interviews", "Cinematic B-roll", "3 social cut-downs"], ref: { t: "Mary Lee’s House", h: "film-mary-lees-house.html" } },
      product: { name: "Product <em>Showcase</em>", code: "showcase", runtime: "30–90 sec showcase", why: "Your product has to look as good on screen as it does in hand. Controlled lighting, macro detail and motion that makes the scroll stop.", chips: ["Studio or on-location", "Macro & detail shots", "Stills from set", "16:9 + 9:16 + 1:1"], ref: { t: "Fun Bike Center", h: "film-fun-bike-center.html" } },
      social: { name: "Social Ad <em>Campaign</em>", code: "social", runtime: "6 × 15–30 sec ads", why: "You need volume and hooks that test. One shoot day, many edits — vertical-first, built for paid acquisition and organic reach.", chips: ["Hook-first edits", "Vertical-native", "Captions burned in", "A/B variants"], ref: { t: "TECO Promotion", h: "film-teco-energy-audit.html" } },
      explainer: { name: "Field <em>Feature</em>", code: "feature", runtime: "60–120 sec explainer", why: "You have a process people don’t understand yet. We film the real work, on site, and make the technical feel human and clear.", chips: ["On-site field capture", "Interview-led", "Motion graphics", "Training & web use"], ref: { t: "TECO Energy Audit", h: "film-teco-energy-audit.html" } },
    };
    const decide = () => {
      const s = { anthem: 0, product: 0, social: 0, explainer: 0 };
      Object.values(answers).forEach((v) => v.split(",").forEach((k) => (s[k] += 1)));
      return Object.keys(s).sort((a, b) => s[b] - s[a])[0];
    };
    const show = (i) => {
      idx = i;
      steps.forEach((s, j) => s.classList.toggle("is-active", j === i));
      bars.forEach((b, j) => b.classList.toggle("is-done", j < i || (i >= steps.length)));
      result.classList.toggle("is-active", i >= steps.length);
      back.hidden = i === 0 || i >= steps.length;
      restart.hidden = i < steps.length;
      if (i >= steps.length) {
        const r = RECS[decide()];
        $("[data-r-name]", result).innerHTML = r.name;
        $("[data-r-run]", result).textContent = r.runtime;
        $("[data-r-why]", result).textContent = r.why;
        $("[data-r-chips]", result).innerHTML = r.chips.map((c) => `<span class="chip">${c}</span>`).join("");
        const ref = $("[data-r-ref]", result); ref.href = r.ref.h; $("span", ref).textContent = "See it in action: " + r.ref.t;
        $("[data-r-cta]", result).href = `contact.html?film=${r.code}`;
      }
    };
    $$(".opt", finder).forEach((o) => o.addEventListener("click", () => {
      const step = o.closest(".finder__step");
      $$(".opt", step).forEach((x) => x.classList.toggle("is-picked", x === o));
      answers[steps.indexOf(step)] = o.dataset.v;
      setTimeout(() => show(idx + 1), 260);
    }));
    back.addEventListener("click", () => show(Math.max(0, idx - 1)));
    restart.addEventListener("click", () => { $$(".opt", finder).forEach((x) => x.classList.remove("is-picked")); show(0); });
    show(0);
  }

  /* ---------- Brief builder (contact) ---------- */
  const brief = $("[data-brief]");
  if (brief) {
    const sets = $$(".fs", brief);
    const tabs = $$(".brief__steps button", brief);
    const prev = $("[data-prev]", brief);
    const next = $("[data-next]", brief);
    const submit = $("[data-submit]", brief);
    const err = $(".form-err", brief);
    const done = $(".brief__done");
    let cur = 0;
    // Preselect from ?film= (Film Finder hand-off)
    const pre = new URLSearchParams(location.search).get("film");
    if (pre) { const r = $(`input[name="type"][value="${pre}"]`, brief); if (r) r.checked = true; }
    const go = (i) => {
      cur = i;
      sets.forEach((s, j) => s.classList.toggle("is-active", j === i));
      tabs.forEach((t, j) => { t.classList.toggle("is-active", j === i); t.classList.toggle("is-done", j < i); });
      prev.hidden = i === 0;
      next.hidden = i === sets.length - 1;
      submit.hidden = i !== sets.length - 1;
      err.textContent = "";
    };
    const valid = (i) => {
      const s = sets[i];
      const radios = $$("input[type=radio][required]", s);
      const names = [...new Set(radios.map((r) => r.name))];
      for (const n of names) if (!$(`input[name="${n}"]:checked`, s)) { err.textContent = "Pick one option to continue."; return false; }
      for (const inp of $$("input[required]:not([type=radio]), textarea[required]", s)) {
        if (!inp.value.trim() || !inp.checkValidity()) { err.textContent = `Please add a valid ${inp.dataset.name || inp.name}.`; inp.focus(); return false; }
      }
      return true;
    };
    next.addEventListener("click", () => { if (valid(cur)) { go(cur + 1); scrollTo(brief); } });
    prev.addEventListener("click", () => { go(cur - 1); scrollTo(brief); });
    tabs.forEach((t, j) => t.addEventListener("click", () => { if (j <= cur || [...Array(j).keys()].every(valid)) go(j); }));
    const label = (n) => { const c = $(`input[name="${n}"]:checked`, brief); return c ? c.dataset.label || c.value : "—"; };
    const val = (n) => { const f = brief.elements[n]; return f && f.value.trim() ? f.value.trim() : "—"; };
    brief.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!valid(cur)) return;
      const text =
`PROJECT BRIEF — ASB Media Group
---------------------------------
Name:        ${val("name")}
Company:     ${val("company")}
Email:       ${val("email")}
Phone:       ${val("phone")}

Film type:   ${label("type")}
Goal:        ${label("goal")}
Timeline:    ${label("timeline")}
Investment:  ${label("budget")}

Details:
${val("details")}`;
      $(".brief__summary").textContent = text;
      const subject = encodeURIComponent(`New film enquiry — ${val("company") !== "—" ? val("company") : val("name")}`);
      const mail = `mailto:aramisbooker@asbmediagroup.com?subject=${subject}&body=${encodeURIComponent(text)}`;
      $("[data-mailto]").href = mail;
      const endpoint = brief.dataset.endpoint;
      if (endpoint) {
        try { await fetch(endpoint, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(brief) }); } catch (x) {}
      }
      brief.hidden = true;
      done.classList.add("is-active");
      scrollTo(done);
      if (!endpoint) setTimeout(() => (location.href = mail), 700);
    });
    const copy = $("[data-copy]");
    copy && copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText($(".brief__summary").textContent); copy.querySelector("span").textContent = "Copied"; } catch (x) {}
    });
    go(0);
  }

  /* ---------- Back to top ---------- */
  $$("[data-top]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); scrollTo(0, { offset: 0 }); }));

  /* ---------- Boot ---------- */
  const boot = () => {
    setupReveals();
    setupMarquees();
    setupReel();
    setupCursor();
    setupMagnetic();
    setupSvcFloat();
    enterFromWipe();
    const usedLoader = runLoader();
    if (!usedLoader) setTimeout(startPage, entering ? 350 : 60);
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(boot);
  } else boot();
  window.addEventListener("load", () => ST.refresh());
})();
