/* MARK ARISTA FILMS — interactions
   Progressive: every section renders without JS; motion layers on top. */
(() => {
  "use strict";
  const d = document;
  const root = d.documentElement;
  const body = d.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const CFG = window.SITE_CONFIG || {};
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));

  if (gsap && ST) { gsap.registerPlugin(ST); root.classList.add("has-gsap"); if (!reduce) root.classList.add("has-scrub"); }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    if (gsap && ST) {
      lenis.on("scroll", ST.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const lockScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); root.style.overflow = on ? "hidden" : ""; };

  /* ---------- Split words ---------- */
  const splitWords = (el, cls) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = d.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(" ")); return; }
            if (cls === "sw") {
              const s = d.createElement("span"); s.className = "sw"; s.textContent = p; frag.appendChild(s);
            } else {
              const w = d.createElement("span"); w.className = "w";
              const wi = d.createElement("span"); wi.className = "wi"; wi.style.setProperty("--i", i++); wi.textContent = p;
              w.appendChild(wi); frag.appendChild(w);
            }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches("br, img, .pill, svg")) {
          if (cls !== "sw" && n.matches(".it")) {
            // keep italic phrases together as one word unit set
            walk(n);
          } else walk(n);
        } else if (n.nodeType === 1 && n.matches(".pill") && cls !== "sw") {
          const w = d.createElement("span"); w.className = "w";
          const wi = d.createElement("span"); wi.className = "wi"; wi.style.setProperty("--i", i++);
          n.replaceWith(w); wi.appendChild(n); w.appendChild(wi);
        }
      });
    };
    walk(el);
  };
  $$("[data-split]").forEach((el) => splitWords(el));
  $$("[data-scrub]").forEach((el) => splitWords(el, "sw"));

  /* ---------- Reveal observer ---------- */
  const revealEls = $$("[data-reveal], [data-split]:not([data-hold]), .step");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  const startReveals = () => revealEls.forEach((el) => io.observe(el));
  const releaseHeld = () => $$("[data-hold]").forEach((el, k) => setTimeout(() => el.classList.add("in"), k * 120));

  /* ---------- Curtain + loader ---------- */
  const curtain = $(".curtain");
  const loader = $(".loader");
  const ready = () => { releaseHeld(); startReveals(); d.dispatchEvent(new Event("app:ready")); };

  const hideCurtain = () => { if (curtain) { curtain.classList.remove("is-in", "is-cover"); curtain.classList.add("is-out"); } };

  if (loader) {
    let seen = false;
    try { seen = sessionStorage.getItem("ma-seen") === "1"; } catch (e) {}
    if (seen || reduce) {
      loader.classList.add("is-skip");
      hideCurtain(); setTimeout(ready, 250);
    } else {
      try { sessionStorage.setItem("ma-seen", "1"); } catch (e) {}
      if (curtain) curtain.style.display = "none";
      const tc = $(".loader__tc", loader), bar = $(".loader__bar i", loader);
      const total = 1700, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / total);
        const eased = 1 - Math.pow(1 - p, 3);
        const frames = Math.round(eased * 3 * 24);
        const s = Math.floor(frames / 24), f = frames % 24;
        tc.textContent = `00:00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
        bar.style.transform = `scaleX(${eased})`;
        if (p < 1) requestAnimationFrame(tick);
        else { loader.classList.add("is-done"); setTimeout(ready, 450); setTimeout(() => loader.remove(), 1200); }
      };
      requestAnimationFrame(tick);
    }
  } else {
    requestAnimationFrame(() => { hideCurtain(); setTimeout(ready, 380); });
  }

  // Page-leave transition
  d.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || !curtain || reduce) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel):/.test(href)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    curtain.style.display = "";
    curtain.classList.remove("is-out"); curtain.classList.add("is-in");
    void curtain.offsetWidth;
    curtain.classList.add("is-cover");
    setTimeout(() => { location.href = url.href; }, 650);
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted && curtain) { curtain.classList.remove("is-in", "is-cover"); curtain.classList.add("is-out"); } });

  /* ---------- Header ---------- */
  const header = $(".header");
  const mbar = $(".mbar");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      const goingDown = y > lastY && y > 320;
      if (!body.classList.contains("menu-open")) header.classList.toggle("is-hidden", goingDown);
    }
    if (mbar) mbar.classList.toggle("is-on", y > window.innerHeight * 0.7);
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  if (burger) {
    const menu = $("#menu");
    const setMenu = (open) => {
      body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", String(!open));
      header.classList.remove("is-hidden");
      lockScroll(open);
    };
    burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
    d.addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) setMenu(false); });
    matchMedia("(min-width: 1024px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });
  }

  /* ---------- Timecode / Clock ---------- */
  const tcs = $$("[data-timecode]");
  if (tcs.length) {
    const t0 = performance.now();
    const pad = (n) => String(n).padStart(2, "0");
    const run = () => {
      const fr = Math.floor(((performance.now() - t0) / 1000) * 24);
      const f = fr % 24, s = Math.floor(fr / 24) % 60, m = Math.floor(fr / 1440) % 60, h = Math.floor(fr / 86400);
      const txt = `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
      tcs.forEach((el) => (el.textContent = txt));
      requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "Pacific/Honolulu", hour: "numeric", minute: "2-digit" });
    const set = () => clocks.forEach((c) => (c.textContent = fmt.format(new Date())));
    set(); setInterval(set, 15000);
  }

  /* ---------- Video hero: YouTube background + still fallback ---------- */
  $$(".vhero").forEach((hero) => {
    const slides = $$(".vhero__slide", hero);
    let idx = 0, slideTimer = null;
    const nextSlide = () => {
      if (slides.length < 2) return;
      slides[idx].classList.remove("is-active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("is-active");
    };
    if (!reduce && slides.length > 1) slideTimer = setInterval(nextSlide, 5200);

    const id = hero.dataset.yt;
    const holder = $(".vhero__yt", hero);
    const conn = navigator.connection || {};
    const allowVideo = id && holder && !reduce && !conn.saveData && !/2g/.test(conn.effectiveType || "");
    if (!allowVideo) return;
    const start = parseInt(hero.dataset.start || "0", 10);
    const params = new URLSearchParams({ autoplay: 1, mute: 1, controls: 0, loop: 1, playlist: id, playsinline: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, disablekb: 1, fs: 0, start, enablejsapi: 1, origin: location.origin });
    const frame = d.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`;
    frame.title = "Background film reel";
    frame.allow = "autoplay; encrypted-media";
    frame.setAttribute("tabindex", "-1");
    frame.setAttribute("aria-hidden", "true");
    const post = (msg) => { try { frame.contentWindow.postMessage(JSON.stringify(msg), "*"); } catch (e) {} };
    frame.addEventListener("load", () => {
      post({ event: "listening", id: 1, channel: "widget" });
      post({ event: "command", func: "mute", args: [] });
    });
    window.addEventListener("message", (e) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      let data; try { data = JSON.parse(e.data); } catch (err) { return; }
      const state = data && data.info && data.info.playerState;
      if (state === 1) { hero.classList.add("is-playing"); clearInterval(slideTimer); }
    });
    // Start loading once the page is idle so the hero still paints instantly.
    const load = () => holder.appendChild(frame);
    ("requestIdleCallback" in window) ? requestIdleCallback(load, { timeout: 1500 }) : setTimeout(load, 600);
    // Pause the reel when it is off screen to save battery.
    new IntersectionObserver(([en]) => post({ event: "command", func: en.isIntersecting ? "playVideo" : "pauseVideo", args: [] }), { threshold: 0.05 }).observe(hero);
  });

  /* ---------- Marquees (velocity reactive) ---------- */
  const tracks = $$("[data-marquee]");
  if (tracks.length && !reduce) {
    const state = tracks.map((t) => {
      const inner = t.firstElementChild;
      // duplicate content for seamless loop
      t.appendChild(inner.cloneNode(true)).setAttribute("aria-hidden", "true");
      return { t, inner, x: 0, dir: Number(t.dataset.marquee) || -1 };
    });
    let vel = 0, prevY = window.scrollY;
    const loop = () => {
      const y = window.scrollY; const dv = y - prevY; prevY = y;
      vel += (Math.min(60, Math.abs(dv)) - vel) * 0.1;
      const scrollDir = dv < 0 ? -1 : 1;
      state.forEach((s) => {
        const w = s.inner.offsetWidth || 1;
        s.x += (0.6 + vel * 0.35) * s.dir * (dv !== 0 ? scrollDir : 1);
        if (s.x <= -w) s.x += w; if (s.x > 0) s.x -= w;
        s.t.style.transform = `translate3d(${s.x}px,0,0)`;
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Scroll-driven (GSAP) ---------- */
  if (gsap && ST && !reduce) {
    $$("[data-scrub]").forEach((el) => {
      gsap.to($$(".sw", el), { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true } });
    });
    const mm = gsap.matchMedia();
    // Pinned horizontal film reel
    mm.add("(min-width: 1024px)", () => {
      const reel = $(".reel");
      if (!reel) return;
      const pin = $(".reel__pin", reel), track = $(".reel__track", reel), prog = $(".reel__prog i", reel);
      reel.classList.add("is-pinned");
      const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: pin, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: (s) => { if (prog) prog.style.transform = `scaleX(${s.progress})`; } },
      });
      return () => reel.classList.remove("is-pinned");
    });
    // Footer wordmark rises in
    const fw = $(".footer__word");
    if (fw) gsap.fromTo(fw, { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: fw, start: "top bottom", end: "bottom bottom", scrub: true } });
    // Hero copy eases back as you scroll away
    $$(".vhero__body").forEach((hb) => gsap.to(hb, { yPercent: -10, opacity: 0.3, ease: "none", scrollTrigger: { trigger: hb.closest("section"), start: "top top", end: "bottom top", scrub: true } }));
    window.addEventListener("load", () => ST.refresh());
  }

  /* ---------- Scrub preview cards ---------- */
  $$(".scrub").forEach((card) => {
    const imgs = $$("img", card), bars = $$(".scrub__bar i", card);
    let cur = -1;
    const show = (n) => {
      if (n === cur) return;
      cur = n;
      imgs.forEach((im, k) => { if (k === n && im.loading === "lazy") im.loading = "eager"; im.classList.toggle("is-on", k === n); });
      bars.forEach((b, k) => b.classList.toggle("is-on", k <= n));
    };
    show(0);
    card.addEventListener("pointerenter", () => imgs.forEach((im) => { im.loading = "eager"; }));
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect();
      show(Math.min(imgs.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * imgs.length))));
    });
    card.addEventListener("pointerleave", () => show(0));
    card._show = show; card._n = imgs.length;
  });
  // Touch screens: cards in the middle of the screen flip through their frames.
  if (!fine && !reduce) {
    const timers = new Map();
    const io2 = new IntersectionObserver((entries) => entries.forEach((en) => {
      const c = en.target;
      if (en.isIntersecting) {
        let k = 0;
        timers.set(c, setInterval(() => { k = (k + 1) % c._n; c._show(k); }, 1100));
      } else { clearInterval(timers.get(c)); c._show && c._show(0); }
    }), { rootMargin: "-30% 0px -30% 0px" });
    $$(".scrub").forEach((c) => io2.observe(c));
  }

  /* ---------- Review carousel ---------- */
  $$("[data-carousel]").forEach((car) => {
    const slides = $$(".quote", car), dots = $$(".quotes__dots button", car), qi = $("[data-qi]", car);
    const DUR = 7000;
    let i = 0, t = null;
    car.style.setProperty("--qdur", DUR / 1000 + "s");
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle("is-on", k === i); s.setAttribute("aria-hidden", String(k !== i)); });
      dots.forEach((b, k) => { b.classList.toggle("is-done", k < i); b.classList.remove("is-on"); });
      void dots[i].offsetWidth; dots[i].classList.add("is-on");
      if (qi) qi.textContent = String(i + 1).padStart(2, "0");
      clearTimeout(t); if (!reduce) t = setTimeout(() => go(i + 1), DUR);
    };
    $("[data-prev]", car).addEventListener("click", () => go(i - 1));
    $("[data-next]", car).addEventListener("click", () => go(i + 1));
    dots.forEach((b, k) => b.addEventListener("click", () => go(k)));
    car.addEventListener("pointerenter", () => { car.classList.add("is-paused"); clearTimeout(t); });
    car.addEventListener("pointerleave", () => { car.classList.remove("is-paused"); go(i); });
    go(0);
  });

  /* ---------- Venue preview (sidebar image follows the hovered row) ---------- */
  $$(".venues").forEach((sec) => {
    const fig = $(".vpreview", sec);
    if (!fig) return;
    const img = $("img", fig), nm = $("[data-vp-name]", fig), ar = $("[data-vp-area]", fig);
    const rows = $$(".vrow", sec);
    let cur = rows[0], t = null;
    const set = (r) => {
      if (r === cur) return;
      cur = r;
      rows.forEach((x) => x.classList.toggle("is-on", x === r));
      fig.classList.add("is-swap");
      clearTimeout(t);
      t = setTimeout(() => {
        img.removeAttribute("srcset");
        img.src = r.dataset.vpImg; nm.textContent = r.dataset.vpName; ar.textContent = r.dataset.vpArea;
        const done = () => fig.classList.remove("is-swap");
        img.complete ? done() : img.addEventListener("load", done, { once: true });
      }, 140);
    };
    if (rows[0]) rows[0].classList.add("is-on");
    rows.forEach((r) => { r.addEventListener("pointerenter", () => set(r)); r.addEventListener("focus", () => set(r)); });
  });

  /* ---------- Hover image (venue rows) ---------- */
  const hov = $(".hoverimg");
  if (hov && fine && !reduce) {
    const himg = $("img", hov);
    let px = 0, py = 0, x = 0, y = 0, on = false;
    $$("[data-hover-img]").forEach((r) => {
      r.addEventListener("mouseenter", () => { himg.src = r.dataset.hoverImg; hov.classList.add("is-on"); on = true; });
      r.addEventListener("mouseleave", () => { hov.classList.remove("is-on"); on = false; });
    });
    window.addEventListener("pointermove", (e) => { x = e.clientX + 28; y = e.clientY - 120; }, { passive: true });
    const loop = () => { px += (x - px) * 0.16; py += (y - py) * 0.16; if (on) hov.style.translate = `${px}px ${py}px`; requestAnimationFrame(loop); };
    loop();
  }

  /* ---------- Magnetic ---------- */
  if (fine && !reduce) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength, y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "transform .8s cubic-bezier(.16,1,.3,1)"; el.style.transform = ""; setTimeout(() => (el.style.transition = ""), 800); });
    });
  }

  /* ---------- Cursor ---------- */
  const cursor = $(".cursor");
  if (cursor && fine && !reduce) {
    body.classList.add("has-cursor");
    let cx = -200, cy = -200, tx = -200, ty = -200;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cursor.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop); };
    loop();
    d.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { cursor.textContent = t.dataset.cursor; cursor.classList.add("is-on"); }
    });
    d.addEventListener("pointerout", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t && !t.contains(e.relatedTarget)) cursor.classList.remove("is-on");
    });
  }

  /* ---------- Lightbox video ---------- */
  const lb = $(".lightbox");
  if (lb) {
    const frame = $(".lightbox__frame", lb), cap = $(".lightbox__cap", lb), closeBtn = $(".lightbox__close", lb);
    let lastFocus = null;
    const open = (id, title) => {
      lastFocus = d.activeElement;
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${(title || "Wedding film").replace(/"/g, "&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      cap.textContent = title || "";
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      lockScroll(true); closeBtn.focus();
    };
    const close = () => {
      lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
      setTimeout(() => (frame.innerHTML = ""), 500);
      lockScroll(false); if (lastFocus) lastFocus.focus();
    };
    d.addEventListener("click", (e) => {
      const t = e.target.closest("[data-video]");
      if (t) { e.preventDefault(); open(t.dataset.video, t.dataset.title); }
    });
    $$("[data-close]", lb).forEach((b) => b.addEventListener("click", close));
    d.addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.classList.contains("is-open")) close(); });
  }

  /* ---------- Inline player facade ---------- */
  $$(".player[data-yt-inline]").forEach((p) => {
    const play = () => {
      if (p.querySelector("iframe")) return;
      const f = d.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.dataset.ytInline)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = p.dataset.title || "Wedding film";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      p.appendChild(f);
      p.removeAttribute("data-cursor");
      if (cursor) cursor.classList.remove("is-on");
    };
    p.addEventListener("click", play);
    p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  });

  /* ---------- Films archive: island + venue filters ---------- */
  const filmsEl = $("[data-films]");
  if (filmsEl) {
    const cards = $$(".fcard", filmsEl), count = $("[data-count]", filmsEl), empty = $(".fempty", filmsEl);
    const sel = $("[data-venue-filter]", filmsEl);
    const chips = $$("[data-filter]", filmsEl);
    const params = new URLSearchParams(location.search);
    let island = params.get("island") || "all";
    let venue = params.get("venue") || "";
    if (sel && venue && !sel.querySelector(`option[value="${CSS.escape(venue)}"]`)) venue = "";
    const apply = (scroll) => {
      let n = 0;
      cards.forEach((c) => {
        const show = (island === "all" || c.dataset.region === island) && (!venue || c.dataset.venue === venue);
        c.classList.toggle("is-hidden", !show);
        if (show) { n++; c.classList.add("in"); }
      });
      chips.forEach((x) => { const on = x.dataset.filter === island; x.classList.toggle("is-active", on); x.setAttribute("aria-pressed", String(on)); });
      if (sel) sel.value = venue;
      if (count) count.textContent = n;
      if (empty) empty.hidden = n > 0;
      const q = new URLSearchParams();
      if (island !== "all") q.set("island", island);
      if (venue) q.set("venue", venue);
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
      if (ST) ST.refresh();
      if (scroll) filmsEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };
    chips.forEach((b) => b.addEventListener("click", () => { island = b.dataset.filter; apply(); }));
    if (sel) sel.addEventListener("change", () => { venue = sel.value; apply(); });
    apply(Boolean(params.get("venue") || params.get("island")));
  }

  /* ---------- Inquiry form ---------- */
  const form = $("[data-inquiry]");
  if (form) {
    const wrap = form.closest(".form");
    const steps = $$(".fstep", form);
    const prog = $(".form__prog i", wrap), stepLbl = $("[data-step-label]", wrap);
    const back = $(".form__back", form), next = $("[data-next]", form), submit = $("[data-submit]", form);
    let cur = 0;
    const go = (n) => {
      cur = n;
      steps.forEach((s, k) => s.classList.toggle("is-active", k === n));
      prog.style.width = ((n + 1) / steps.length) * 100 + "%";
      stepLbl.textContent = `Step 0${n + 1} / 0${steps.length}`;
      back.hidden = n === 0;
      next.hidden = n === steps.length - 1;
      submit.hidden = n !== steps.length - 1;
      const first = steps[n].querySelector("input, select, textarea");
      if (first && n > 0) first.focus({ preventScroll: true });
    };
    const valid = () => {
      const fields = $$("input, select, textarea", steps[cur]);
      for (const f of fields) { if (!f.checkValidity()) { f.reportValidity(); return false; } }
      return true;
    };
    next.addEventListener("click", () => { if (valid()) go(cur + 1); });
    back.addEventListener("click", () => go(cur - 1));
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && cur < steps.length - 1) { e.preventDefault(); if (valid()) go(cur + 1); }
    });

    // Prefill from ?film=slug
    const params = new URLSearchParams(location.search);
    const film = params.get("film");
    if (film) {
      const sel = form.querySelector("[name=film]");
      if (sel && sel.querySelector(`option[value="${CSS.escape(film)}"]`)) sel.value = film;
    }
    const date = params.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { const di = form.querySelector("[name=date]"); if (di) di.value = date; }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!valid()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const filmSel = form.querySelector("[name=film]");
      const filmName = filmSel && filmSel.selectedOptions[0] ? filmSel.selectedOptions[0].textContent : "";
      const lines = [
        `Names: ${data.name || ""}${data.partner ? " & " + data.partner : ""}`,
        `Email: ${data.email || ""}`,
        `Phone: ${data.phone || "—"}`,
        `Wedding date: ${data.date || "—"}${data.flexible ? " (flexible)" : ""}`,
        `Location: ${data.location || "—"}`,
        `Venue: ${data.venue || "—"}`,
        `Guests: ${data.guests || "—"}`,
        `Film they loved: ${filmName || "—"}`,
        `Found Mark via: ${data.source || "—"}`,
        "",
        "Their story:",
        data.story || "",
      ];
      submit.disabled = true;
      let ok = false;
      if (CFG.formEndpoint) {
        try {
          const res = await fetch(CFG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ ...data, film: filmName, _subject: `New film inquiry — ${data.name}` }) });
          ok = res.ok;
        } catch (err) { ok = false; }
      }
      if (!ok) {
        const subject = `Wedding film inquiry — ${data.name}${data.partner ? " & " + data.partner : ""}${data.date ? " · " + data.date : ""}`;
        location.href = `mailto:${CFG.email || "mark@aristafilms.co"}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      }
      const nm = $("[data-done-name]", wrap); if (nm) nm.textContent = (data.name || "friend").split(" ")[0];
      wrap.classList.add("is-done");
      submit.disabled = false;
      if (ST) ST.refresh();
    });
    go(0);
  }

  /* ---------- HoneyBook (lazy) ---------- */
  const hb = $("details.hb");
  if (hb && CFG.honeybookPid) {
    hb.addEventListener("toggle", () => {
      if (!hb.open || hb.dataset.loaded) return;
      hb.dataset.loaded = "1";
      const pid = CFG.honeybookPid;
      window._HB_ = window._HB_ || {}; window._HB_.pid = pid;
      const s = d.createElement("script"); s.async = true;
      s.src = "https://widget.honeybook.com/assets_users_production/websiteplacements/placement-controller.min.js";
      d.body.appendChild(s);
      const img = new Image(); img.src = "https://www.honeybook.com/p.png?pid=" + pid;
    });
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
