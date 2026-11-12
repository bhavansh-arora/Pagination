/* Co-Allies — experience layer: intro, page transitions, living hero, pinned scenes. */
(function () {
  "use strict";

  var html = document.documentElement;
  var reduced = html.classList.contains("reduced") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var hasG = !!(gsap && ST);
  var lenis = window.__lenis || null;
  var curtain = document.querySelector(".curtain");

  html.classList.add("curtain-js");

  /* ---------- Intro sequence & page entry ---------- */
  function ready() { html.classList.add("is-ready"); }
  function reveal() {
    html.classList.add("is-revealed");
    if (lenis) lenis.start();
    setTimeout(ready, 220);
    if (hasG) setTimeout(function () { ST.refresh(); }, 1300);
  }

  if (html.classList.contains("is-intro")) {
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    var cnt = document.querySelector("[data-count-intro]");
    var t0 = performance.now(), dur = 1900;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      if (cnt) cnt.textContent = p >= 1 ? "100" : ("0" + Math.floor(e * 100)).slice(-2);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(reveal, 260);
    })(t0);
  } else if (html.classList.contains("is-enter")) {
    setTimeout(reveal, 260);
  } else {
    ready();
  }

  /* ---------- Page transitions ---------- */
  if (!reduced && curtain) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      try { sessionStorage.setItem("ca-nav", "1"); } catch (err) {}
      curtain.style.transition = "none";
      curtain.style.clipPath = "inset(100% 0 0 0)";
      curtain.style.visibility = "visible";
      void curtain.offsetWidth;
      curtain.style.transition = "";
      curtain.style.clipPath = "";
      curtain.style.visibility = "";
      html.classList.remove("is-revealed");
      html.classList.add("is-leaving");
      setTimeout(function () { location.href = url.href; }, 780);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) { html.classList.remove("is-leaving", "is-intro", "is-enter"); html.classList.add("is-ready"); }
    });
  }

  /* ---------- Living hero: ally orbs drawn toward the cursor ---------- */
  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var cv = hero.querySelector(".xhero__canvas");
    var ctx = cv && cv.getContext("2d");
    if (ctx) {
      var S = 0.5, W = 0, H = 0, visible = true;
      var orbs = [
        { c: "228,87,46", r: 0.46, x: 0.74, y: 0.36, sp: 1.1, ph: 0.0, a: 0.62, pull: 0.38 },
        { c: "238,182,90", r: 0.30, x: 0.88, y: 0.72, sp: 1.6, ph: 2.1, a: 0.34, pull: 0.2 },
        { c: "201,120,106", r: 0.38, x: 0.52, y: 0.86, sp: 0.9, ph: 4.2, a: 0.36, pull: 0.12 },
        { c: "27,74,59", r: 0.55, x: 0.14, y: 0.18, sp: 0.7, ph: 1.3, a: 0.7, pull: 0.05 }
      ];
      var mx = 0.66, my = 0.42, tmx = mx, tmy = my;
      var size = function () {
        var r = hero.getBoundingClientRect();
        W = cv.width = Math.max(1, Math.round(r.width * S));
        H = cv.height = Math.max(1, Math.round(r.height * S));
      };
      var draw = function (t) {
        mx += (tmx - mx) * 0.035; my += (tmy - my) * 0.035;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#0b1d17";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        var M = Math.max(W, H), s = t * 0.0001;
        for (var i = 0; i < orbs.length; i++) {
          var o = orbs[i];
          var ox = o.x + Math.sin(s * o.sp * 6 + o.ph) * 0.09;
          var oy = o.y + Math.cos(s * o.sp * 5 + o.ph) * 0.08;
          var x = (ox + (mx - ox) * o.pull) * W, y = (oy + (my - oy) * o.pull) * H;
          var rad = o.r * M * (1 + Math.sin(s * 8 + o.ph) * 0.06);
          var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, "rgba(" + o.c + "," + o.a + ")");
          g.addColorStop(0.55, "rgba(" + o.c + "," + (o.a * 0.35) + ")");
          g.addColorStop(1, "rgba(" + o.c + ",0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
      };
      size();
      window.addEventListener("resize", function () { size(); if (reduced) draw(0); });
      if (reduced) {
        draw(0);
      } else {
        hero.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          tmx = (e.clientX - r.left) / r.width; tmy = (e.clientY - r.top) / r.height;
        });
        hero.addEventListener("pointerleave", function () { tmx = 0.66; tmy = 0.42; });
        if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
        (function loop(t) { requestAnimationFrame(loop); if (visible) draw(t); })(0);
      }
    }
  }

  /* ---------- Footer spotlight ---------- */
  var fw = document.querySelector(".footer__word");
  var ft = document.querySelector(".site-footer");
  if (fw && ft && finePointer) {
    ft.addEventListener("pointermove", function (e) {
      var r = fw.getBoundingClientRect();
      fw.style.setProperty("--mx", (e.clientX - r.left) + "px");
      fw.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  }

  if (!hasG || reduced) return;

  /* ---------- Zoom reveal scene ---------- */
  var zoom = document.querySelector("[data-zoom]");
  if (zoom) {
    gsap.matchMedia().add("(min-width: 721px)", function () {
      var media = zoom.querySelector(".zoom__media");
      var zimg = media.querySelector("img");
      var pre = zoom.querySelector(".zoom__pre");
      var spans = pre.querySelectorAll("span");
      var post = zoom.querySelector(".zoom__post");
      var tl = gsap.timeline({ scrollTrigger: { trigger: zoom, start: "top top", end: "+=110%", pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.fromTo(media, { clipPath: "inset(12% 14% 12% 14% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(zimg, { scale: 1.4 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(pre, { opacity: 1, y: 0 }, { opacity: 0, y: -60, ease: "power1.in", duration: 0.32 }, 0.28)
        .fromTo(post, { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.35 }, 0.6);
      return function () { gsap.set([media, zimg, pre, post].concat(Array.prototype.slice.call(spans)), { clearProps: "all" }); };
    });
  }

  /* ---------- Horizontal paths ---------- */
  var hp = document.querySelector("[data-hpaths]");
  if (hp) {
    var mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", function () {
      hp.classList.add("is-h");
      var track = hp.querySelector(".hpaths__track");
      var bar = hp.querySelector(".hpaths__progress span");
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tw = gsap.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: hp, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (st) { bar.style.transform = "scaleX(" + st.progress + ")"; } }
      });
      hp.querySelectorAll(".hpanel__bg img").forEach(function (img) {
        gsap.fromTo(img, { xPercent: -7, scale: 1.18 }, { xPercent: 7, scale: 1.18, ease: "none", scrollTrigger: { trigger: img.closest(".hpanel"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
      hp.querySelectorAll(".hpanel__num").forEach(function (n) {
        gsap.fromTo(n, { xPercent: 40 }, { xPercent: -20, ease: "none", scrollTrigger: { trigger: n.closest(".hpanel"), containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
      return function () { hp.classList.remove("is-h"); };
    });
  }

  /* ---------- Path finder advances with scroll ---------- */
  var fsec = document.querySelector("[data-finder-scroll]");
  if (fsec && window.__finderSelect) {
    var fopts = fsec.querySelectorAll(".finder__opt");
    var N = fopts.length;
    var drive = function (st) {
      var seg = Math.min(N - 0.001, st.progress * N);
      var i = Math.floor(seg);
      window.__finderSelect(i);
      fopts.forEach(function (o, k) { o.style.setProperty("--fp", k < i ? 1 : (k === i ? (seg - i).toFixed(3) : 0)); });
    };
    gsap.matchMedia().add({ desk: "(min-width: 961px) and (min-height: 700px)", small: "(max-width: 960px), (max-height: 699px)" }, function (c) {
      if (c.conditions.desk) {
        ST.create({ trigger: fsec, start: function () { return fsec.offsetHeight > window.innerHeight ? "bottom bottom" : "top top"; }, end: "+=" + (N * 42) + "%", pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: -1, onUpdate: drive });
      } else {
        ST.create({ trigger: fsec.querySelector(".finder"), start: "top 65%", end: "bottom 45%", refreshPriority: -1, onUpdate: drive });
      }
    });
  }

  /* ---------- Inner hero media expands to full bleed ---------- */
  document.querySelectorAll(".page-hero__media").forEach(function (m) {
    var c = m.closest(".container");
    if (!c) return;
    var inset = function () { return (window.innerWidth - c.clientWidth) / 2 + parseFloat(getComputedStyle(c).paddingLeft || 0); };
    gsap.fromTo(m,
      { clipPath: function () { var i = inset(); return "inset(0px " + i + "px 0px " + i + "px round 32px)"; } },
      { clipPath: "inset(0px 0px 0px 0px round 0px)", ease: "none", scrollTrigger: { trigger: m, start: "top 82%", end: "center 42%", scrub: true, invalidateOnRefresh: true } });
  });

  /* ---------- Marquees react to scroll speed ---------- */
  var groups = document.querySelectorAll(".marquee__group");
  if (groups.length) {
    var setters = Array.prototype.map.call(groups, function (g) { return gsap.quickTo(g, "skewX", { duration: 0.6, ease: "power3" }); });
    var settle = null;
    ST.create({
      onUpdate: function (st) {
        var v = gsap.utils.clamp(-14, 14, st.getVelocity() / -220);
        setters.forEach(function (f) { f(v); });
        clearTimeout(settle);
        settle = setTimeout(function () { setters.forEach(function (f) { f(0); }); }, 140);
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
