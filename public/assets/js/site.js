/* Code Bunny — site experience layer.
   Progressive enhancement: every page is fully readable without this file.
   Uses (self-hosted) GSAP + ScrollTrigger + SplitText + Flip and Lenis when present. */
(function () {
  "use strict";
  var d = document, w = window, html = d.documentElement;
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var G = w.gsap, ST = w.ScrollTrigger, Split = w.SplitText, Flip = w.Flip;
  var fx = !!(G && ST) && !reduce;
  if (fx) G.registerPlugin(ST, Split || {}, Flip || {});
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- smooth scroll */
  var lenis = null;
  if (fx && w.Lenis) {
    lenis = new w.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, anchors: { offset: -80 }, autoRaf: false });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }

  /* ---------------------------------------------------------------- nav + progress */
  var nav = $(".nav"), prog = d.createElement("div");
  prog.className = "progress"; prog.setAttribute("aria-hidden", "true"); d.body.appendChild(prog);
  function onScroll() {
    var y = w.scrollY, max = d.documentElement.scrollHeight - innerHeight;
    if (nav) nav.classList.toggle("is-scrolled", y > 10);
    prog.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  }
  w.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var burger = $(".burger"), drawer = $("#drawer");
  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (lenis) open ? lenis.stop() : lenis.start(); else d.body.style.overflow = open ? "hidden" : "";
    if (open && fx) G.from($$("#drawer a.big"), { yPercent: 60, opacity: 0, stagger: 0.05, duration: 0.7, ease: "expo.out" });
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(burger.getAttribute("aria-expanded") !== "true"); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  if (drawer) $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* ---------------------------------------------------------------- reveal (IO) */
  var rv = $$(".rv");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ---------------------------------------------------------------- preloader */
  var loader = $(".loader");
  function intro() {
    if (!fx) return;
    var h1 = $(".hero h1");
    if (h1 && Split) {
      $$(".line > span", h1).forEach(function (s) { s.style.animation = "none"; s.style.transform = "none"; });
      var sp = new Split(h1, { type: "chars", charsClass: "char" });
      G.from(sp.chars, { yPercent: 110, rotateX: -80, opacity: 0, transformOrigin: "50% 100%", stagger: 0.022, duration: 1.1, ease: "expo.out", delay: 0.05 });
    }
    var aside = $(".hero-aside");
    if (aside) setTimeout(function () { aside.classList.add("drawn"); }, 900);
  }
  if (loader && html.classList.contains("is-loading") && fx) {
    var bar = $(".loader-bar i", loader), cnt = $(".loader-count span", loader), o = { v: 0 };
    G.timeline()
      .to(o, { v: 100, duration: 1.25, ease: "power2.inOut", onUpdate: function () { cnt.textContent = Math.round(o.v); bar.style.transform = "scaleX(" + o.v / 100 + ")"; } })
      .to(".loader-in", { y: -30, opacity: 0, duration: 0.45, ease: "power2.in" })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.15")
      .add(function () { html.classList.remove("is-loading"); try { sessionStorage.setItem("cbv", "1"); } catch (e) {} intro(); }, "-=0.55");
  } else {
    html.classList.remove("is-loading");
    try { sessionStorage.setItem("cbv", "1"); } catch (e) {}
    if ($(".hero")) intro();
  }

  /* ---------------------------------------------------------------- WebGL hero */
  (function heroGL() {
    var c = $(".gl"); if (!c || reduce) return;
    var gl = c.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); if (!gl) return;
    var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fs = "precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 cI,cO,cH;" +
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}" +
      "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}" +
      "void main(){vec2 uv=gl_FragCoord.xy/r;float k=r.x/r.y;vec2 p=uv;p.x*=k;vec2 mm=m;mm.x*=k;float tt=t*.05;" +
      "vec2 q=vec2(fbm(p*1.5+tt),fbm(p*1.5-tt+5.2));vec2 w=vec2(fbm(p*1.5+3.*q+vec2(1.7,9.2)+tt*1.4),fbm(p*1.5+3.*q+vec2(8.3,2.8)-tt));" +
      "float f=fbm(p*1.3+2.6*w);float dd=distance(p,mm);float glow=smoothstep(.85,0.,dd);" +
      "vec3 ink=cI;vec3 org=cO;vec3 hi=cH;" +
      "float band=smoothstep(.56,1.08,f+glow*.3);vec3 col=mix(ink,org*.42,band*.85);col=mix(col,hi*.7,pow(band,5.)*.55);col+=org*glow*.08;" +
      "col*=mix(.35,1.,smoothstep(.05,1.,uv.x*.85+uv.y*.35));col*=smoothstep(0.,.35,uv.y)*.6+.4;" +
      "col+=(h(gl_FragCoord.xy+fract(t))-.5)*.03;gl_FragColor=vec4(col,1.);}";
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uM = gl.getUniformLocation(pr, "m");
    // palette comes from the CSS theme tokens (--gl-base / --gl-a / --gl-b)
    var cs = getComputedStyle(html);
    function v3(name, fb) { var a = (cs.getPropertyValue(name) || "").split(",").map(parseFloat); return a.length === 3 && !a.some(isNaN) ? a : fb; }
    gl.uniform3fv(gl.getUniformLocation(pr, "cI"), v3("--gl-base", [0.043, 0.086, 0.157]));
    gl.uniform3fv(gl.getUniformLocation(pr, "cO"), v3("--gl-a", [0.79, 0.62, 0.33]));
    gl.uniform3fv(gl.getUniformLocation(pr, "cH"), v3("--gl-b", [0.95, 0.86, 0.64]));
    var mx = 0.72, my = 0.62, tx = mx, ty = my, vis = true, t0 = performance.now();
    function size() { var s = Math.min(devicePixelRatio || 1, 1.5) * 0.5; c.width = c.clientWidth * s; c.height = c.clientHeight * s; gl.viewport(0, 0, c.width, c.height); }
    size(); w.addEventListener("resize", size);
    c.parentElement.addEventListener("mousemove", function (e) { var r = c.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; });
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) loop(); }).observe(c);
    function loop() {
      if (!vis) return;
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      gl.uniform2f(uR, c.width, c.height); gl.uniform1f(uT, (performance.now() - t0) / 1000); gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(loop);
    }
    loop(); c.classList.add("on");
  })();

  /* ---------------------------------------------------------------- GSAP scroll effects */
  if (fx) {
    // split-line heading reveals
    if (Split) {
      $$(".h2, .phero .h1, .cta .h1, .chat-quote").forEach(function (el) {
        Split.create(el, {
          type: "lines", mask: "lines", linesClass: "ln", autoSplit: true,
          onSplit: function (self) {
            return G.from(self.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
          }
        });
      });
    }

    // image reveals + parallax
    $$(".wcard .media, .tpl-media, .founder-photo, .ind").forEach(function (m) {
      var img = $("img", m);
      G.fromTo(m, { clipPath: "inset(14% 8% 14% 8% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 90%", once: true } });
      if (img) G.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 90%", once: true } });
    });

    // hero wall: flattens + zooms as you scroll
    var plane = $(".wall-plane");
    if (plane) {
      G.to(plane, { rotateX: 8, rotateZ: -2, scale: 1.12, yPercent: -6, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      if (fine) $(".hero").addEventListener("mousemove", function (e) {
        G.to(".wall", { x: (e.clientX / innerWidth - 0.5) * -30, y: (e.clientY / innerHeight - 0.5) * -14, duration: 1.2, ease: "power3.out" });
      });
    }
    G.to(".hero-copy", { yPercent: -18, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // marquee skew with scroll velocity
    var strip = $(".strip-track");
    if (strip) {
      var skewTo = G.quickTo(strip, "skewX", { duration: 0.5, ease: "power3" });
      ST.create({ onUpdate: function (s) { skewTo(G.utils.clamp(-12, 12, s.getVelocity() / -250)); } });
    }

    // horizontal work gallery (desktop)
    var mm = G.matchMedia();
    mm.add("(min-width: 900px)", function () {
      var hs = $(".hs"); if (!hs) return;
      var track = $(".hs-track", hs), pin = $(".hs-pin", hs), barI = $(".hs-bar i", hs), counter = $(".hs-counter", hs);
      var panels = $$(".hs-panel", track);
      hs.classList.add("hs-on");
      var dist = function () { return track.scrollWidth - innerWidth; };
      var tween = G.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) {
            barI.style.transform = "scaleX(" + s.progress + ")";
            counter.textContent = String(Math.min(panels.length, Math.floor(s.progress * panels.length) + 1)).padStart(2, "0") + " / " + String(panels.length).padStart(2, "0");
          }
        }
      });
      panels.forEach(function (p) {
        var img = $(".media img.desk", p);
        if (img) G.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: p, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        var ph = $(".phone", p);
        if (ph) G.fromTo(ph, { yPercent: 30 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: p, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      return function () { hs.classList.remove("hs-on"); };
    });

    // process steps light up in sequence
    $$(".steps").forEach(function (list) {
      ST.create({ trigger: list, start: "top 75%", once: true, onEnter: function () {
        $$(".step", list).forEach(function (s, i) { setTimeout(function () { s.classList.add("lit"); }, i * 260); });
      } });
    });

    // footer word fills with orange
    var fb = $(".foot-big");
    if (fb) G.to(fb, { "--p": "100%", ease: "none", scrollTrigger: { trigger: fb, start: "top bottom", end: "bottom 85%", scrub: true } });

    // CTA glow breathes with scroll
    $$(".cta").forEach(function (c) { G.fromTo(c, { "--s": 0.6 }, { "--s": 1, scrollTrigger: { trigger: c, start: "top bottom", end: "center center", scrub: true } }); });

    w.addEventListener("load", function () { ST.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }

  /* ---------------------------------------------------------------- pointer toys */
  if (fine && !reduce) {
    var cur = d.createElement("div"); cur.className = "cursor"; cur.setAttribute("aria-hidden", "true"); cur.textContent = "Visit ↗";
    d.body.appendChild(cur);
    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    (function loop() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; cur.style.translate = cx + "px " + cy + "px"; requestAnimationFrame(loop); })();
    d.addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; cur.classList.add("live"); }, { passive: true });
    d.addEventListener("mouseleave", function () { cur.classList.remove("live"); });
    d.addEventListener("mousedown", function () { cur.classList.add("down"); });
    d.addEventListener("mouseup", function () { cur.classList.remove("down"); });
    d.addEventListener("mouseover", function (e) {
      var t = e.target;
      var media = t.closest && t.closest(".wcard .media, .hs-panel .media, .tpl-media");
      cur.classList.toggle("on", !!media);
      cur.classList.toggle("link", !media && !!(t.closest && t.closest("a, button, summary, label, input, select, textarea")));
    });

    // magnetic buttons
    $$(".btn, .svc .go, .burger, .wa").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect(), mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        b.style.translate = mx * 0.22 + "px " + my * 0.32 + "px";
      });
      b.addEventListener("mouseleave", function () { b.style.transition = "translate .6s cubic-bezier(.3,1.6,.5,1),transform .35s,box-shadow .35s,background .25s"; b.style.translate = "0 0"; setTimeout(function () { b.style.transition = ""; }, 600); });
    });

    // 3D tilt + glare on project media
    $$(".wcard .media, .tpl-media").forEach(function (m) {
      m.addEventListener("mousemove", function (e) {
        var r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        m.style.setProperty("--mx", px * 100 + "%"); m.style.setProperty("--my", py * 100 + "%");
        m.style.transform = "perspective(1200px) rotateY(" + (px - 0.5) * 6 + "deg) rotateX(" + (0.5 - py) * 6 + "deg)";
      });
      m.addEventListener("mouseleave", function () { m.style.transform = ""; });
    });

    // services: floating preview follows cursor
    var svcs = $$(".svc[data-img]");
    if (svcs.length) {
      var fl = d.createElement("div"); fl.className = "svc-float"; fl.setAttribute("aria-hidden", "true");
      svcs.forEach(function (s) { var im = d.createElement("img"); im.src = s.getAttribute("data-img"); im.alt = ""; im.loading = "lazy"; fl.appendChild(im); });
      d.body.appendChild(fl);
      var imgs = $$("img", fl), fx2 = 0, fy2 = 0, tx2 = 0, ty2 = 0;
      (function l() { fx2 += (tx2 - fx2) * 0.12; fy2 += (ty2 - fy2) * 0.12; fl.style.translate = fx2 + "px " + fy2 + "px"; requestAnimationFrame(l); })();
      svcs.forEach(function (s, i) {
        s.addEventListener("mouseenter", function () { fl.classList.add("on"); imgs.forEach(function (im, j) { im.classList.toggle("on", i === j); }); });
        s.addEventListener("mouseleave", function () { fl.classList.remove("on"); });
        s.addEventListener("mousemove", function (e) { tx2 = e.clientX + 30; ty2 = e.clientY - 110; });
      });
    }

    // nav link text scramble
    var glyphs = "!<>-_\\/[]{}=+*^?#01";
    $$(".nav-links a").forEach(function (a) {
      var orig = a.textContent, busy = false;
      a.addEventListener("mouseenter", function () {
        if (busy) return; busy = true; var f = 0;
        (function s() {
          a.textContent = orig.split("").map(function (ch, i) { return i < f / 2 ? orig[i] : glyphs[Math.floor(Math.random() * glyphs.length)]; }).join("");
          if (f++ < orig.length * 2) requestAnimationFrame(s); else { a.textContent = orig; busy = false; }
        })();
      });
    });
  }

  /* ---------------------------------------------------------------- count up */
  var nums = $$("[data-count]");
  if ("IntersectionObserver" in w && nums.length && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), sup = $("sup", el), supHTML = sup ? sup.outerHTML : "", t0 = null;
        (function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1600, 1); el.innerHTML = Math.round(to * (1 - Math.pow(1 - p, 4))) + supHTML; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* ---------------------------------------------------------------- WhatsApp chat playback */
  $$("[data-chat]").forEach(function (chat) {
    var items = $$(".msg", chat), typing = $(".typing-b", chat), status = $(".status", chat.closest(".phone-x"));
    if (reduce || !("IntersectionObserver" in w)) { items.forEach(function (m) { m.classList.add("show"); }); return; }
    chat.classList.add("armed");
    var played = false;
    function scrollEnd() { chat.scrollTop = chat.scrollHeight; }
    function play() {
      var i = 0;
      (function next() {
        if (i >= items.length) return;
        var m = items[i++], inc = m.classList.contains("in"), wait = +(m.getAttribute("data-wait") || (inc ? 1100 : 650));
        if (inc) { typing.classList.add("on"); if (status) { status.textContent = "typing…"; status.classList.add("typing"); } chat.appendChild(typing); scrollEnd(); }
        setTimeout(function () {
          typing.classList.remove("on"); if (status) { status.textContent = "online"; status.classList.remove("typing"); }
          chat.insertBefore(m, typing); m.classList.add("show"); scrollEnd();
          if (inc) $$(".msg.out .ticks", chat).forEach(function (t) { t.classList.add("read"); });
          var r = m.getAttribute("data-react-on");
          if (r) { var tgt = $("#" + r); var re = tgt && $(".react", tgt); if (re) { re.classList.add("pop"); hearts(); } }
          if (m.classList.contains("star")) hearts(6);
          next();
        }, wait);
      })();
    }
    function hearts(n) {
      var box = $(".burst", chat.closest(".phone-x")); if (!box) return;
      for (var k = 0; k < (n || 3); k++) (function (k) {
        setTimeout(function () {
          var h = d.createElement("span"); h.className = "float-heart"; h.textContent = ["❤️", "🧡", "✨"][k % 3];
          h.style.left = 55 + Math.random() * 30 + "%"; h.style.top = "70%"; h.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
          box.appendChild(h); setTimeout(function () { h.remove(); }, 1700);
        }, k * 140);
      })(k);
    }
    // remove from flow so they appear one by one
    items.forEach(function (m) { m.remove(); });
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting && !played) { played = true; ob.disconnect(); play(); }
    }, { threshold: 0.45 }).observe(chat.closest(".phone-x"));
  });

  /* ---------------------------------------------------------------- work filter (+Flip) */
  var chips = $$(".chip[data-filter]"), cards = $$(".grid-work .wcard");
  function applyFilter(f) {
    var state = fx && Flip ? Flip.getState(cards) : null;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === f ? "true" : "false"); });
    cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); });
    if (state) Flip.from(state, { duration: 0.7, ease: "expo.out", scale: true, absolute: true, onEnter: function (els) { return G.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6 }); }, onLeave: function (els) { return G.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }); }, onComplete: function () { ST && ST.refresh(); } });
    var live = $("#filter-live"); if (live) live.textContent = cards.filter(function (c) { return !c.hidden; }).length + " projects shown";
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-filter"); applyFilter(f);
      try { history.replaceState(null, "", f === "all" ? location.pathname : "#" + f); } catch (e) {}
    });
  });
  if (chips.length && location.hash) { var h = location.hash.slice(1); if ($('.chip[data-filter="' + h + '"]')) applyFilter(h); }

  /* ---------------------------------------------------------------- free-preview URL demo */
  $$("[data-url-demo]").forEach(function (demo) {
    var names = JSON.parse(demo.getAttribute("data-url-demo")), imgs = $$(".frame img", demo), typed = $(".typed", demo), i = 0, started = false;
    function typeName(s, cb) {
      if (reduce) { typed.textContent = s; return cb(); }
      var k = typed.textContent.length;
      (function del() {
        if (k > 0) { typed.textContent = typed.textContent.slice(0, --k); return setTimeout(del, 26); }
        var j = 0; (function add() { if (j <= s.length) { typed.textContent = s.slice(0, j++); setTimeout(add, 55); } else cb(); })();
      })();
    }
    function next() {
      imgs.forEach(function (im) { im.classList.remove("on"); });
      demo.classList.add("building");
      typeName(names[i], function () {
        setTimeout(function () {
          demo.classList.remove("building"); imgs[i].classList.add("on");
          i = (i + 1) % names.length; setTimeout(next, 3000);
        }, reduce ? 0 : 700);
      });
    }
    if (!imgs.length) return;
    if (reduce) { imgs[0].classList.add("on"); return; }
    new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting && !started) { started = true; ob.disconnect(); next(); } }, { threshold: 0.3 }).observe(demo);
  });

  /* ---------------------------------------------------------------- bunny easter egg */
  $$(".cta-bunny, .brand .bunny").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (b.closest("a")) e.preventDefault();
      var r = b.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
      if (G) G.fromTo(b, { y: 0 }, { y: -40, duration: 0.3, ease: "power2.out", yoyo: true, repeat: 1 });
      for (var k = 0; k < 16; k++) {
        var p = d.createElement("span"); p.className = "particle"; p.textContent = ["🥕", "✦", "🐇", "✨"][k % 4];
        p.style.left = ox + "px"; p.style.top = oy + "px"; d.body.appendChild(p);
        var a = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 160;
        if (G) G.to(p, { x: Math.cos(a) * dist, y: Math.sin(a) * dist - 60, rotation: Math.random() * 360, opacity: 0, duration: 1.2 + Math.random() * 0.6, ease: "power3.out", onComplete: (function (p) { return function () { p.remove(); }; })(p) });
        else setTimeout((function (p) { return function () { p.remove(); }; })(p), 50);
      }
      if (b.closest("a") && b.closest(".brand")) setTimeout(function () { location.href = "/"; }, 500);
    });
  });

  /* ---------------------------------------------------------------- forms */
  $$("form[data-form]").forEach(function (form) {
    var params = new URLSearchParams(location.search), modeInputs = $$('input[name="request"]', form);
    function setMode() { var v = $('input[name="request"]:checked', form); form.setAttribute("data-mode", v && v.value.indexOf("preview") > -1 ? "preview" : "project"); }
    modeInputs.forEach(function (r) { r.addEventListener("change", setMode); });
    var site = params.get("site"), interest = params.get("interest"), svc = $('[name="service"]', form), msg = $('[name="message"]', form);
    if (site && modeInputs[1]) { modeInputs[1].checked = true; if (svc) svc.value = "Buy a ready-made site"; if (msg && !msg.value) msg.value = "Hi! I'm interested in buying " + site + ". "; }
    if ((interest === "build" || interest === "audit") && modeInputs[1]) { modeInputs[1].checked = true; if (interest === "audit" && svc) svc.value = "Free website & SEO audit"; }
    if (interest === "preview" && modeInputs[0]) modeInputs[0].checked = true;
    var src = $('[name="source"]', form); if (src) src.value = location.pathname;
    setMode();
    var status = $(".form-status", form), btn = $('button[type="submit"]', form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if ($('[name="_honey"]', form).value) return;
      var data = Object.fromEntries(new FormData(form));
      data._subject = (form.getAttribute("data-mode") === "preview" ? "🐇 Free preview request — " : "🐇 New project enquiry — ") + (data.business || data.name || "");
      data._template = "table"; data._captcha = "false"; data.page = location.href;
      var label = btn.innerHTML; btn.disabled = true; btn.innerHTML = "Sending…";
      status.className = "form-status"; status.textContent = "";
      fetch(form.getAttribute("action"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function () {
          status.className = "form-status ok";
          status.textContent = form.getAttribute("data-mode") === "preview"
            ? "Got it, thank you! We'll start on your free preview and email you a private link as soon as it's ready."
            : "Thanks, your message is in. You'll hear back from us personally, usually within one business day.";
          form.reset(); setMode();
          if (w.gtag) w.gtag("event", "generate_lead", { form: form.getAttribute("data-mode"), page: location.pathname });
        })
        .catch(function () {
          status.className = "form-status err";
          status.innerHTML = 'Something went wrong sending that. Please email <a href="mailto:bhavansh@codebunny.net">bhavansh@codebunny.net</a> or message us on WhatsApp.';
        })
        .finally(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  /* ---------------------------------------------------------------- article: TOC scroll-spy + sticky CTA */
  var toc = $$(".toc a");
  if (toc.length && "IntersectionObserver" in w) {
    var map = {}; toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { toc.forEach(function (a) { a.classList.remove("on"); }); var a = map[e.target.id]; if (a) a.classList.add("on"); } });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { var h = d.getElementById(id); if (h) tio.observe(h); });
  }
  var sticky = $(".sticky-cta");
  if (sticky) {
    var dismissed = false; try { dismissed = sessionStorage.getItem("cb-sticky") === "x"; } catch (e) {}
    var x1 = $(".sticky-cta .x", sticky);
    if (x1) x1.addEventListener("click", function () { sticky.classList.remove("on"); dismissed = true; try { sessionStorage.setItem("cb-sticky", "x"); } catch (e) {} });
    w.addEventListener("scroll", function () {
      if (dismissed) return;
      var max = d.documentElement.scrollHeight - innerHeight, p = w.scrollY / max;
      var nearForm = $(".article-end") && $(".article-end").getBoundingClientRect().top < innerHeight;
      sticky.classList.toggle("on", p > 0.25 && !nearForm);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- blog search */
  var bs = $("[data-blog-search]");
  if (bs) {
    var bcards = $$("[data-blog-grid] .bcard"), blive = $("#bsearch-live");
    bs.addEventListener("input", function () {
      var q = bs.value.trim().toLowerCase(), n = 0;
      bcards.forEach(function (c) { var hit = !q || c.getAttribute("data-title").indexOf(q) > -1 || c.textContent.toLowerCase().indexOf(q) > -1; c.hidden = !hit; if (hit) { n++; c.classList.add("in"); } });
      if (blive) blive.textContent = n + " articles found";
      if (ST) ST.refresh();
    });
  }

  /* ---------------------------------------------------------------- misc */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  html.classList.add("ready");
  if (w.console && console.log) console.log("%c🐇 Code Bunny", "font:600 20px Georgia;color:#c99e54", "\nLike what you see? Let's build yours → https://www.codebunny.net/free-website-preview/");
})();
