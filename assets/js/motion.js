/* Dan Reynolds — motion layer.
   GSAP + ScrollTrigger drive the cinematic effects; every effect
   degrades gracefully (content stays visible) if a library fails to load. */
(function () {
  "use strict";
  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var hasGsap = !!(gsap && ST) && !reduce;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function finishLoading() {
    html.classList.remove("is-loading");
    try { sessionStorage.setItem("dr-seen", "1"); } catch (e) {}
  }
  if (reduce) { finishLoading(); html.classList.remove("is-entering"); return; }

  if (hasGsap) {
    gsap.registerPlugin(ST); html.classList.add("has-gsap");
    // Computers (mouse or trackpad): smooth, weighted scrolling, so every scroll effect glides instead of stepping
    // with each wheel notch. Touch screens keep their own native scrolling. Overlays scroll natively inside.
    if (window.Lenis && fine && !window.__lenis) {
      var lenis = new window.Lenis({
        lerp: 0.09, wheelMultiplier: 1, allowNestedScroll: true,
        prevent: function (node) { return !!(node && node.closest && node.closest(".mobile-menu, .lightbox, [data-lenis-prevent]")); }
      });
      window.__lenis = lenis;
      lenis.on("scroll", ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      // In-page links (#section) glide there too, landing just below the floating header.
      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
        var id = a.getAttribute("href").slice(1), target = id && document.getElementById(id);
        if (!target || a.closest(".mobile-menu")) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -96, duration: 1.4 });
      });
    }
    // Phones: the address bar showing/hiding must not re-measure the page (that made it jump while scrolling).
    ST.config({ ignoreMobileResize: true });
  }

  /* Native scrolling is used on purpose: no scroll hijacking, so wheel,
     trackpad, touch, keyboard and scrollbar all behave exactly as expected. */

  /* ---------- Scroll progress ---------- */
  var bar = $(".scroll-progress");
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  }
  window.addEventListener("scroll", progress, { passive: true });
  progress();

  /* ---------- Preloader / page entry ---------- */
  var introStarted = false;
  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    startHero();
    if (hasGsap) { thankYouIntro(); droneIntro(); charsIntro(); }
    if (hasGsap) ST.refresh();
  }

  if (html.classList.contains("is-loading")) {
    window.__drMotion = 1;
    var count = $("[data-count-loader]");
    var loaderBar = $(".preloader__bar");
    var heroImg = $(".hero img, .page-hero--image img, main img");
    var loaded = !heroImg || heroImg.complete;
    if (heroImg && !loaded) {
      heroImg.addEventListener("load", function () { loaded = true; });
      heroImg.addEventListener("error", function () { loaded = true; });
    }
    var fontsReady = false;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { fontsReady = true; });
    // Inside Squarespace the intro screen has been up since the page opened (this script arrives late),
    // so count from then and carry on from the number already shown, rather than starting over.
    var inSq = !!document.getElementById("drx-live");
    var start = performance.now(), t0 = inSq ? 0 : start, MIN = 1600, MAX = 3500;
    var shown = inSq && count ? (parseInt(count.textContent, 10) || 0) : 0;
    (function tick(now) {
      var elapsed = now - t0;
      var ready = (loaded && fontsReady) || now - start > MAX;
      var target = ready ? 100 : Math.min(90, (elapsed / MIN) * 90);
      var timeCap = Math.min(100, (elapsed / MIN) * 100);
      shown += (Math.min(target, timeCap) - shown) * 0.12;
      if (ready && timeCap >= 100 && shown > 99.4) shown = 100;
      var n = Math.round(shown);
      if (count) count.textContent = ("00" + n).slice(-3);
      if (loaderBar) loaderBar.style.setProperty("--p", (shown / 100).toFixed(3));
      if (n < 100) { requestAnimationFrame(tick); return; }
      setTimeout(function () {
        html.classList.add("is-loaded");
        finishLoading();
        startIntro();
        setTimeout(function () { html.classList.remove("is-loaded"); }, 1300);
      }, 180);
    })(t0);
  } else if (html.classList.contains("is-entering")) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        html.classList.add("is-entered");
        startIntro();
        setTimeout(function () { html.classList.remove("is-entering", "is-entered"); }, 1200);
      });
    });
  } else {
    startIntro();
  }

  /* ---------- Page transitions ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    var url = new URL(a.href); // resolved like the browser does (respects <base>)
    if (url.origin !== location.origin || !/(\.html|\/|\/[^.\/]+)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    try { sessionStorage.setItem("dr-nav", "1"); } catch (err) {}
    html.classList.add("is-leaving");
    setTimeout(function () { location.href = url.href; }, 720);
  });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) html.classList.remove("is-leaving", "is-entering", "is-entered");
  });

  // Big titles marked data-chars: each word stays together and each letter rises from behind its own mask.
  function splitChars(title) {
    if (!title) return [];
    if (!title.getAttribute("data-split")) {
      title.setAttribute("data-split", "1");
      Array.prototype.forEach.call(title.children, function (line) {
        line.innerHTML = line.textContent.split(/(\s+)/).map(function (w) {
          if (!w || /^\s+$/.test(w)) return w;
          return '<span class="tw" aria-hidden="true">' + w.split("").map(function (c) { return '<span class="tc"><span>' + c + "</span></span>"; }).join("") + "</span>";
        }).join("");
      });
    }
    return $$(".tc > span", title);
  }

  // Any other big title marked data-chars rises letter by letter as the page opens.
  function charsIntro() {
    $$("[data-chars]").forEach(function (el) {
      if (el.closest("[data-ty-hero], [data-ascend]")) return;
      gsap.fromTo(splitChars(el), { yPercent: 118, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.03, ease: "expo.out", delay: 0.2 });
    });
  }

  /* ---------- Drone page: the camera overlay and the title arrive ---------- */
  function droneIntro() {
    var hero = $("[data-ascend]");
    if (!hero) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo($(".dr-hero__media", hero), { scale: 1.12, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 2.2, ease: "power3.out" }, 0)
      .fromTo($$(".dr-hud__c", hero), { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, stagger: 0.08 }, 0.3)
      .fromTo($$(".dr-hud__cross, .dr-hud__rec, .dr-hud__lic, .dr-hud__alt, .dr-hud__ladder", hero), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.08, ease: "power2.out" }, 0.6)
      .fromTo(splitChars($("[data-chars]", hero)), { yPercent: 118, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.035 }, 0.5);
  }

  /* ---------- Thank-you page: the photo opens up, "Thank you" rises letter by letter ---------- */
  function thankYouIntro() {
    var hero = $("[data-ty-hero]");
    if (!hero) return;
    var chars = splitChars($("[data-chars]", hero));
    var frame = $(".ty-hero__frame", hero), img = $(".ty-hero__img", hero), small = window.innerWidth < 700;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.fromTo(frame, { clipPath: small ? "inset(14% 10% 14% 10% round 28px)" : "inset(10% 32% 10% 32% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" }, 0)
      .fromTo(img, { scale: 1.32 }, { scale: 1.04, duration: 2.6, ease: "power3.out" }, 0)
      .fromTo(chars, { yPercent: 118, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 1.25, stagger: 0.035 }, 0.75);
  }

  /* ---------- Hero slideshow + rotating word ---------- */
  function startHero() {
    // One timer drives both: each new word arrives with a new photo.
    var STEP = 2800;
    var rot = $(".rotator"), words = rot ? $$(".rotator__word", rot) : [], wi = words.length - 1;
    if (rot) { words[wi].classList.add("is-current"); rot.classList.add("is-live"); }
    var wrap = $("[data-hero-slides]");
    var slides = wrap ? $$(".hero__slide", wrap) : [];
    var idx = 0, current = $("[data-hero-current]"), index = $(".hero__index");
    slides.forEach(function (s, i) {
      if (i > 0) { var im = s.querySelector("img"); if (im) im.loading = "eager"; }
    });
    if (index) index.style.setProperty("--hero-step", STEP + "ms");
    function runBar() {
      if (!index) return;
      index.classList.remove("is-running");
      void index.offsetWidth;
      index.classList.add("is-running");
    }
    runBar();
    setInterval(function () {
      if (document.hidden || window.scrollY > window.innerHeight) return;
      if (words.length) {
        var pw = words[wi];
        wi = (wi + 1) % words.length;
        pw.classList.remove("is-current"); pw.classList.add("is-out");
        words[wi].classList.remove("is-out"); words[wi].classList.add("is-current");
        setTimeout(function () { pw.classList.remove("is-out"); }, 950);
      }
      if (slides.length > 1) {
        var prev = slides[idx];
        idx = (idx + 1) % slides.length;
        slides.forEach(function (s) { s.classList.remove("is-prev"); });
        prev.classList.remove("is-active");
        prev.classList.add("is-prev");
        slides[idx].classList.add("is-active");
        if (current) current.textContent = ("0" + (idx + 1)).slice(-2);
        runBar();
      }
    }, STEP);
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target, end = parseFloat(el.dataset.count), t0 = performance.now(), dur = parseFloat(el.dataset.countDur) || 1800;
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur);
          var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = Math.round(end * eased);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = "0"; cio.observe(c); });
  }

  /* ---------- Velocity marquee ---------- */
  var lastY = window.scrollY, velocity = 0, direction = 1;
  (function sample() {
    var y = window.scrollY, d = y - lastY;
    velocity += (d - velocity) * 0.2;
    if (Math.abs(d) > 0.5) direction = d > 0 ? 1 : -1;
    lastY = y;
    requestAnimationFrame(sample);
  })();
  $$(".marquee__track").forEach(function (track) {
    var x = 0;
    function loop() {
      x -= (0.55 + Math.min(Math.abs(velocity) * 0.25, 14)) * direction;
      var half = track.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      requestAnimationFrame(loop);
    }
    if (hasGsap) requestAnimationFrame(loop);
  });

  /* ---------- Photo previews that follow the mouse (the cursor itself stays standard) ---------- */
  if (fine) {
    html.classList.add("has-hover");
    var preview = $(".hover-preview"), pInner = $(".hover-preview__inner");
    var mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my, lastPx = mx, seen = false;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { px = lastPx = mx; py = my; seen = true; }
    }, { passive: true });
    if (preview) (function follow() {
      px += (mx - px) * 0.12; py += (my - py) * 0.12;
      var vx = Math.max(-14, Math.min(14, (px - lastPx) * 0.6));
      preview.style.transform = "translate3d(" + px + "px," + py + "px,0) rotate(" + vx.toFixed(2) + "deg)";
      lastPx = px;
      requestAnimationFrame(follow);
    })();
    if (preview) document.addEventListener("mouseover", function (e) {
      var pv = e.target.closest("[data-preview]");
      if (pv) {
        pInner.style.backgroundImage = "url('" + pv.dataset.preview + "')";
        preview.classList.add("is-active");
      } else {
        preview.classList.remove("is-active");
      }
    });

  }

  /* ---------- Lists with a photo stage: the photo follows the row being read or hovered ---------- */
  $$("[data-stage]").forEach(function (wrap) {
    var rows = $$(".index-row", wrap), imgs = $$(".dr-stage__img", wrap), cap = $(".dr-stage__count", wrap), hovering = false, cur = -1, ticking = false;
    function set(i) {
      if (i === cur || i < 0) return;
      cur = i;
      rows.forEach(function (r, k) { r.classList.toggle("is-current", k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle("is-active", k === i); });
      if (cap) cap.textContent = ("0" + (i + 1)).slice(-2) + " / " + ("0" + rows.length).slice(-2);
    }
    rows.forEach(function (r, k) {
      r.addEventListener("mouseenter", function () { hovering = true; set(k); });
      r.addEventListener("mouseleave", function () { hovering = false; });
    });
    function onScroll() {
      ticking = false;
      if (hovering) return;
      var mid = window.innerHeight * 0.5, best = 0, dist = Infinity;
      rows.forEach(function (r, k) { var b = r.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < dist) { dist = d; best = k; } });
      set(best);
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    set(0);
  });

  /* ---------- "On this page" lists: highlight the section being read ---------- */
  $$("[data-toc]").forEach(function (toc) {
    var links = $$('a[href^="#"]', toc);
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var body = secs[0] && secs[0].parentElement;
    var ticking = false;
    function spy() {
      ticking = false;
      var line = window.innerHeight * 0.32, cur = 0;
      secs.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top < line) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle("is-active", i === cur); });
      if (body) {
        var r = body.getBoundingClientRect(), p = (line - r.top) / Math.max(1, r.height);
        toc.style.setProperty("--rp", Math.max(0, Math.min(1, p)).toFixed(3));
      }
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  });

  if (!hasGsap) return;

  /* ====================== GSAP scroll choreography ====================== */

  // Hero: the framed image eases back and the copy lifts away as you scroll.
  $$(".hero").forEach(function (hero) {
    var frame = hero.querySelector(".hero__frame");
    var mediaEl = hero.querySelector(".hero__media");
    var content = hero.querySelector(".hero__content");
    var trig = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    if (frame) gsap.to(frame, { scale: 0.92, yPercent: 6, ease: "none", transformOrigin: "50% 0%", scrollTrigger: trig });
    if (mediaEl) gsap.to(mediaEl, { yPercent: 14, scale: 1.06, ease: "none", scrollTrigger: trig });
    if (content) gsap.to(content, { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom 20%", scrub: true } });
  });

  // Parallax inside image frames, pivoting around the faces.
  $$(".media").forEach(function (m) {
    if (!fine) return; // keep photos still on touch screens
    if (m.closest(".masonry, .index-row, .hero, .hcard, .yt, .marquee, .stack-card")) return;
    var im = m.querySelector("img");
    if (!im) return;
    im.classList.add("parallax-img");
    im.style.transformOrigin = getComputedStyle(im).objectPosition;
    gsap.fromTo(im, { yPercent: -6, scale: 1.16 }, {
      yPercent: 6, scale: 1.16, ease: "none",
      scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  $$("[data-parallax]").forEach(function (bg) {
    gsap.fromTo(bg, { yPercent: -9 }, { yPercent: 9, ease: "none", scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // Quote that lights up word by word.
  $$("[data-scrub-words]").forEach(function (el) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span"); s.className = "sw"; s.textContent = w; f.appendChild(s);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1) wrap(c);
      });
    })(el);
    gsap.to($$(".sw, .inline-img", el), {
      opacity: 1, stagger: 0.12, ease: "none",
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 42%", scrub: 0.6 }
    });
  });

  // Portfolio grid: staggered rise as rows enter.
  var items = $$(".masonry__item");
  if (items.length) {
    gsap.set(items, { opacity: 0, y: 70 });
    // Phones: the photos already on screen when the page opens fade in in place (no rise as the page appears).
    if (window.innerWidth < 700) gsap.set(items.filter(function (i) { return i.getBoundingClientRect().top < window.innerHeight; }), { y: 0 });
    ST.batch(items, {
      start: "top 92%",
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.09, overwrite: true }); }
    });
    $$("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        gsap.fromTo(items.filter(function (i) { return !i.hidden; }), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.04 });
        setTimeout(function () { ST.refresh(); }, 60);
      });
    });
  }

  // Pinned horizontal love stories (desktop).
  var mm = gsap.matchMedia();
  // (Set up before the gallery below it: pinned sections must be created top to bottom, or the later one
  //  is measured without the earlier one's extra scroll and the page jumps.)
  // Drone page: scrolling "climbs" - the straight-down view pulls back while the altitude counts up to 400 ft.
  var ascend = $("[data-ascend]");
  if (ascend) {
    var altNum = $("[data-alt]", ascend), dimg = $(".dr-hero__img", ascend), dframe = $(".dr-hero__frame", ascend);
    var setAlt = function (p) {
      if (altNum) altNum.textContent = ("00" + Math.round(p * 400)).slice(-3);
      dframe.style.setProperty("--alt", p.toFixed(3));
    };
    setAlt(0);
    mm.add("(min-width: 900px)", function () {
      // Desktop: the hero holds still while the camera climbs, then the page carries on.
      gsap.fromTo(dimg, { scale: 1.75 }, { scale: 1, ease: "none", force3D: true, scrollTrigger: { trigger: ascend, start: "top top", end: "+=70%", pin: true, scrub: 1, anticipatePin: 1, onUpdate: function (self) { setAlt(self.progress); } } });
      gsap.to($(".dr-hero__content", ascend), { yPercent: -16, opacity: 0.55, ease: "none", scrollTrigger: { trigger: ascend, start: "top top", end: "+=70%", scrub: 1 } });
    });
    mm.add("(max-width: 899px)", function () {
      gsap.fromTo(dimg, { scale: 1.5 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ascend, start: "top top", end: "bottom top", scrub: 0.5, onUpdate: function (self) { setAlt(self.progress); } } });
    });
  }

  mm.add("(min-width: 1024px)", function () {
    var section = $("[data-hscroll]");
    if (!section) return;
    var track = $(".hscroll__track", section);
    var prog = $(".hscroll__progress", section);
    section.classList.add("is-pinned");
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: {
        trigger: section, start: "top top", end: function () { return "+=" + dist(); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) { if (prog) prog.style.setProperty("--hp", self.progress.toFixed(4)); }
      }
    });
    $$(".hcard__media img", section).forEach(function (im) {
      im.style.transformOrigin = getComputedStyle(im).objectPosition;
      gsap.fromTo(im, { xPercent: -7, scale: 1.18 }, {
        xPercent: 7, scale: 1.18, ease: "none",
        scrollTrigger: { trigger: im.closest(".hcard"), containerAnimation: tween, start: "left right", end: "right left", scrub: true }
      });
    });
    return function () { section.classList.remove("is-pinned"); gsap.set(track, { x: 0 }); };
  });

  // Thank-you page: the photo eases back into a frame as you scroll, the words drift up faster than the photo.
  var tyHero = $("[data-ty-hero]");
  if (tyHero) {
    var tyTrig = { trigger: tyHero, start: "top top", end: "bottom top", scrub: true };
    gsap.to($(".ty-hero__frame", tyHero), { scale: 0.9, ease: "none", scrollTrigger: tyTrig });
    gsap.to($(".ty-hero__media", tyHero), { yPercent: 16, ease: "none", scrollTrigger: tyTrig });
    gsap.to($(".ty-hero__bottom", tyHero), { yPercent: -22, opacity: 0.2, ease: "none", scrollTrigger: tyTrig });
  }
  // Timelines: the line draws as you scroll and each step lights up as it's reached.
  $$("[data-timeline]").forEach(function (tlEl) {
    var steps = $$(".ty-tstep", tlEl);
    var light = function (p) {
      tlEl.style.setProperty("--tp", p.toFixed(4));
      steps.forEach(function (st) {
        var on = p >= parseFloat(st.getAttribute("data-at") || 0) - 0.001;
        if (on) st.classList.add("is-lit", "is-on");
        else st.classList.remove("is-lit");
      });
    };
    light(0);
    ST.create({ trigger: tlEl, start: "top 78%", end: "bottom 62%", scrub: 0.5, onUpdate: function (self) { light(self.progress); } });
  });

  // Process cards stack: each covered card eases back and dims.
  var cards = window.innerWidth >= 900 ? $$("[data-stack] .stack-card") : [];
  cards.forEach(function (card, i) {
    var next = cards[i + 1];
    if (!next) return;
    gsap.to(card, { scale: 0.93, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top " + (96 + (i + 1) * 22) + "px", scrub: true }
    });
    gsap.to(card.querySelector(".stack-card__shade"), {
      opacity: 0.6, ease: "none",
      scrollTrigger: { trigger: next, start: "top bottom", end: "top " + (96 + (i + 1) * 22) + "px", scrub: true }
    });
  });

  // Footer: giant wordmark letters rise into place.
  var wm = $(".footer-wordmark");
  if (wm) {
    wm.innerHTML = wm.textContent.split("").map(function (ch) {
      return ch === " " ? " " : '<span class="fw-char">' + ch + "</span>";
    }).join("");
    gsap.from($$(".fw-char", wm), { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.04, scrollTrigger: { trigger: wm, start: "top 98%" } });
  }

  // Section headings get a gentle drift for depth.
  mm.add("(min-width: 900px)", function () {
    $$(".head--split h2, .page-hero__title").forEach(function (h) {
      gsap.fromTo(h, { y: 18 }, { y: -18, ease: "none", scrollTrigger: { trigger: h, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });

  window.addEventListener("load", function () { ST.refresh(); });
  if (document.fonts) document.fonts.ready.then(function () { ST.refresh(); });
})();
