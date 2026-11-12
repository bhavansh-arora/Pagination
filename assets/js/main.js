/* Co-Allies — interactions & motion. Progressive: every feature degrades to static content. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  window.__lenis = lenis;
  if (hasGSAP) window.gsap.registerPlugin(window.ScrollTrigger);

  // In-page anchors through Lenis
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Header ---------- */
  var header = $(".site-header");
  var progress = $(".progress");
  var mobileCta = $(".mobile-cta");
  var lastY = window.scrollY;
  var ctaEnd = $(".cta");
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var hide = y > 320 && y > lastY + 2 && !body.classList.contains("menu-open");
      var show = y < lastY - 2 || y < 320;
      if (hide) header.classList.add("is-hidden");
      else if (show) header.classList.remove("is-hidden");
      body.classList.toggle("header-shown", !header.classList.contains("is-hidden"));
    }
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (mobileCta) {
      var past = y > window.innerHeight * 0.6;
      var nearEnd = ctaEnd ? ctaEnd.getBoundingClientRect().top < window.innerHeight * 0.85 : false;
      mobileCta.classList.toggle("is-on", past && !nearEnd);
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu ---------- */
  var toggle = $(".menu-toggle");
  var menu = $(".menu");
  function openMenu() {
    body.classList.add("menu-open");
    toggle && toggle.setAttribute("aria-expanded", "true");
    toggle && (toggle.querySelector(".menu-toggle__text").textContent = "Close");
    menu && menu.removeAttribute("inert");
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!body.classList.contains("menu-open")) return;
    body.classList.remove("menu-open");
    toggle && toggle.setAttribute("aria-expanded", "false");
    toggle && (toggle.querySelector(".menu-toggle__text").textContent = "Menu");
    menu && menu.setAttribute("inert", "");
    if (lenis) lenis.start();
  }
  if (toggle && menu) {
    menu.setAttribute("inert", "");
    toggle.addEventListener("click", function () { body.classList.contains("menu-open") ? closeMenu() : openMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1080) closeMenu(); });
  }

  /* ---------- Cursor ---------- */
  if (finePointer && !reduced) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<span class="cursor__label"></span>';
    body.appendChild(cursor);
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; cursor.classList.add("is-visible"); }, { passive: true });
    document.addEventListener("pointerleave", function () { cursor.classList.remove("is-visible"); });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var labelled = e.target.closest("[data-cursor]");
      var interactive = e.target.closest("a, button, summary, [role=tab], input, textarea, select, label");
      if (labelled) {
        cursor.classList.add("is-label"); cursor.classList.remove("is-hover");
        cursor.querySelector(".cursor__label").textContent = labelled.getAttribute("data-cursor");
      } else if (interactive) {
        cursor.classList.add("is-hover"); cursor.classList.remove("is-label");
      } else {
        cursor.classList.remove("is-hover", "is-label");
      }
    });
  }

  /* ---------- Magnetic ---------- */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.28;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
        setTimeout(function () { el.style.transition = ""; }, 700);
      });
    });
  }

  /* ---------- Split text into masked words ---------- */
  function splitWords(el) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var outer = document.createElement("span");
            outer.className = "split-line";
            var inner = document.createElement("span");
            inner.textContent = p;
            inner.style.setProperty("--i", Math.min(i++, 18));
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("pill-img") && !child.classList.contains("rotator")) {
          walk(child);
        }
      });
    }
    walk(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  }
  $$("[data-split]").forEach(function (el) { if (!reduced) splitWords(el); else el.classList.add("is-in"); });

  /* ---------- Reveal on view ---------- */
  var revealEls = $$("[data-reveal], [data-split]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Stagger children helper
    $$("[data-stagger]").forEach(function (group) {
      var step = parseFloat(group.getAttribute("data-stagger")) || 0.08;
      $$("[data-reveal]", group).forEach(function (el, idx) { el.style.setProperty("--d", (idx * step).toFixed(2) + "s"); });
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Hero rotator ---------- */
  $$(".rotator").forEach(function (rot) {
    var items = $$(".rotator__item", rot);
    if (items.length < 2) return;
    // size container to widest item
    var size = function () { var w = 0; items.forEach(function (it) { w = Math.max(w, it.getBoundingClientRect().width); }); rot.style.minWidth = Math.ceil(w) + 8 + "px"; };
    size();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    window.addEventListener("resize", size);
    var idx = 0;
    items[0].classList.add("is-active");
    if (reduced) return;
    setInterval(function () {
      var cur = items[idx];
      cur.classList.remove("is-active"); cur.classList.add("is-out");
      idx = (idx + 1) % items.length;
      var next = items[idx];
      next.classList.remove("is-out");
      void next.offsetWidth;
      next.classList.add("is-active");
      setTimeout(function () { cur.classList.remove("is-out"); }, 900);
    }, 2600);
  });

  /* ---------- Manifesto scroll fill ---------- */
  $$(".manifesto").forEach(function (m) {
    if (reduced) return;
    var words = [];
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span");
            s.className = "w" + (node.tagName === "EM" ? " em" : "");
            s.textContent = p;
            words.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("pill-img")) wrap(child);
      });
    })(m);
    function update() {
      var r = m.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.92 - r.top) / (r.height + vh * 0.3);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.round(p * words.length);
      for (var k = 0; k < words.length; k++) words[k].classList.toggle("is-lit", k < lit);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    if (reduced || !("IntersectionObserver" in window)) { el.textContent = end; return; }
    el.textContent = "0";
    var obs = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      var start = performance.now(), dur = 1800;
      (function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(end * e);
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }, { threshold: 0.5 });
    obs.observe(el);
  });

  /* ---------- GSAP scroll motion ---------- */
  if (hasGSAP && !reduced) {
    var gsap = window.gsap;
    $$(".media--parallax img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".steps").forEach(function (s) {
      var line = $(".steps__line span", s);
      if (!line) return;
      var vertical = window.matchMedia("(max-width: 860px)").matches;
      gsap.fromTo(line, vertical ? { scaleY: 0 } : { scaleX: 0 }, Object.assign(vertical ? { scaleY: 1 } : { scaleX: 1 }, { ease: "none", scrollTrigger: { trigger: s, start: "top 75%", end: "bottom 60%", scrub: true } }));
    });
    $$("[data-speed]").forEach(function (el) {
      var sp = parseFloat(el.getAttribute("data-speed"));
      gsap.to(el, { yPercent: sp * 100, ease: "none", scrollTrigger: { trigger: el.closest("section") || el, start: "top top", end: "bottom top", scrub: true } });
    });
    $$(".footer__word").forEach(function (w) {
      gsap.fromTo(w, { yPercent: 30, opacity: 0.3 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom bottom", scrub: true } });
    });
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }

  /* ---------- Path finder ---------- */
  var finder = $("[data-finder]");
  if (finder) {
    var data = {
      ttc: { kicker: "Suggested path · 01", title: "Fertility <em>coaching</em>", text: "When every month feels like a verdict, you deserve a space that is only about you: your hopes, your fears, your relationship, your resilience.", href: "fertility.html#stages", img: "assets/img/poppies-sm.webp", cta: "Explore fertility coaching" },
      ivf: { kicker: "Suggested path · 01", title: "Support through <em>IVF</em>", text: "Appointments, injections, the two-week wait. We build steadiness for the days that feel out of your hands, and clarity for the decisions that aren't.", href: "fertility.html#stages", img: "assets/img/sprout-sm.webp", cta: "See how I support IVF" },
      loss: { kicker: "Suggested path · 01", title: "Room for <em>grief</em>", text: "Loss on the path to motherhood is often invisible to others. Here it's held, named and honoured, at your pace, without pressure to “move on”.", href: "fertility.html#stages", img: "assets/img/dusk-sm.webp", cta: "Fertility & grief support" },
      fit: { kicker: "Suggested path · 02", title: "Transition <em>coaching</em>", text: "For when the dissonance between who you are and what you do gets too loud. Find the clarity and courage to align your work with your values.", href: "coaching.html#transition", img: "assets/img/horizon-sm.webp", cta: "Explore transition coaching" },
      lead: { kicker: "Suggested path · 03", title: "Founders <em>&amp; CEOs</em>", text: "Unconditional support and real accountability from someone who has run a 450-person organisation. A thinking partner for the decisions only you can make.", href: "coaching.html#founders", img: "assets/img/founder-sm.webp", cta: "Explore executive coaching" },
      impact: { kicker: "Suggested path · 04", title: "Conscious <em>leadership</em>", text: "Grounded in the Inner Development Goals: grow how you are, think, relate, collaborate and act, so your impact matches your intentions.", href: "coaching.html#conscious", img: "assets/img/tree-sm.webp", cta: "Explore conscious leadership" }
    };
    var opts = $$(".finder__opt", finder);
    var panel = $(".finder__panel", finder);
    var bgImg = $(".finder__result-bg img", finder);
    function choose(key, btn) {
      var d = data[key]; if (!d) return;
      opts.forEach(function (o) { o.setAttribute("aria-pressed", o === btn ? "true" : "false"); });
      panel.classList.add("is-swapping");
      setTimeout(function () {
        $(".finder__kicker", panel).textContent = d.kicker;
        $(".finder__title", panel).innerHTML = d.title;
        $(".finder__text", panel).textContent = d.text;
        var link = $(".finder__link", panel);
        link.setAttribute("href", d.href);
        $(".finder__link-text", panel).textContent = d.cta;
        bgImg.src = d.img;
        panel.classList.remove("is-swapping");
      }, reduced ? 0 : 320);
    }
    opts.forEach(function (o) { o.addEventListener("click", function () { choose(o.getAttribute("data-key"), o); }); });
  }

  /* ---------- Tabs ---------- */
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        var p = document.getElementById(t.getAttribute("aria-controls"));
        if (p) {
          if (on) { p.hidden = false; p.classList.remove("is-entering"); void p.offsetWidth; p.classList.add("is-entering"); }
          else p.hidden = true;
        }
      });
      if (focus) tab.focus();
      if (window.matchMedia("(max-width: 960px)").matches) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); activate(n, true); }
      });
    });
  });

  /* ---------- Breathing pause ---------- */
  var breath = $("[data-breath]");
  if (breath) {
    var orb = $(".breath__orb", breath);
    var word = $(".breath__word", breath);
    var count = $(".breath__count", breath);
    var btn = $("[data-breath-toggle]");
    var ring = $(".breath__progress circle", breath);
    var C = 2 * Math.PI * 49;
    if (ring) { ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C; }
    var phases = [{ w: "Breathe in", s: 4, scale: 2.1 }, { w: "Hold", s: 4, scale: 2.1 }, { w: "Breathe out", s: 6, scale: 1 }];
    var running = false, timer = null, startAt = 0, total = 56;
    function setPhase(i, left) {
      var ph = phases[i % 3];
      word.textContent = ph.w;
      orb.style.transitionDuration = (reduced ? 0 : ph.s) + "s";
      orb.style.transform = "scale(" + ph.scale + ")";
      var sec = ph.s;
      count.textContent = sec;
      var it = setInterval(function () { sec--; if (sec > 0) count.textContent = sec; else clearInterval(it); }, 1000);
      timer = setTimeout(function () {
        if (!running) return;
        var elapsed = (performance.now() - startAt) / 1000;
        if (elapsed >= total - 0.5) { finish(); return; }
        setPhase(i + 1);
      }, ph.s * 1000);
    }
    function tickRing() {
      if (!running) return;
      var p = Math.min(1, (performance.now() - startAt) / (total * 1000));
      if (ring) ring.style.strokeDashoffset = C * (1 - p);
      requestAnimationFrame(tickRing);
    }
    function finish() {
      running = false; clearTimeout(timer);
      orb.style.transitionDuration = "2s"; orb.style.transform = "scale(1)";
      word.textContent = "Welcome back"; count.textContent = "Notice how you feel";
      btn.querySelector(".btn__label").textContent = "Breathe again";
      if (ring) ring.style.strokeDashoffset = 0;
    }
    function stop() {
      running = false; clearTimeout(timer);
      orb.style.transitionDuration = "1.2s"; orb.style.transform = "scale(1)";
      word.textContent = "Ready?"; count.textContent = "One minute";
      btn.querySelector(".btn__label").textContent = "Start one minute";
      if (ring) ring.style.strokeDashoffset = C;
    }
    if (btn) btn.addEventListener("click", function () {
      if (running) { stop(); return; }
      running = true; startAt = performance.now();
      btn.querySelector(".btn__label").textContent = "Stop";
      setPhase(0); tickRing();
    });
  }

  /* ---------- Drag rails ---------- */
  $$(".rail").forEach(function (rail) {
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; rail.classList.add("is-dragging"); }
      rail.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false;
      setTimeout(function () { rail.classList.remove("is-dragging"); }, 0);
    });
    var ctrl = document.querySelector('[data-rail-ctrl="' + rail.id + '"]');
    if (ctrl) {
      var bs = $$("button", ctrl);
      var stepBy = function () { var c = rail.querySelector(".voice"); return c ? c.getBoundingClientRect().width + 20 : 320; };
      bs[0].addEventListener("click", function () { rail.scrollBy({ left: -stepBy(), behavior: reduced ? "auto" : "smooth" }); });
      bs[1].addEventListener("click", function () { rail.scrollBy({ left: stepBy(), behavior: reduced ? "auto" : "smooth" }); });
    }
  });

  /* ---------- Sub-navigation active state ---------- */
  var subLinks = $$(".subnav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          subLinks.forEach(function (a) { a.classList.remove("is-active"); });
          var l = map[en.target.id]; if (l) l.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  /* ---------- Calendly lazy embed ---------- */
  $$("[data-calendly]").forEach(function (btnC) {
    btnC.addEventListener("click", function () {
      var frame = document.getElementById(btnC.getAttribute("data-calendly"));
      if (!frame) return;
      var url = btnC.getAttribute("data-url");
      frame.innerHTML = '<iframe title="Book a free 30-minute session with Nathalia" loading="lazy" src="' + url + '?hide_gdpr_banner=1&background_color=faf6f0&primary_color=e4572e"></iframe>';
      frame.hidden = false;
      btnC.closest("[data-calendly-wrap]") && btnC.closest("[data-calendly-wrap]").setAttribute("data-loaded", "true");
      btnC.remove();
      if (lenis) setTimeout(function () { lenis.resize(); }, 300);
      if (hasGSAP) setTimeout(function () { window.ScrollTrigger.refresh(); }, 400);
    });
  });

  /* ---------- Contact form → composed email ---------- */
  var form = $("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = $(".form__status", form);
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var f = new FormData(form);
      var subject = "Co-Allies, " + (f.get("topic") || "a first conversation") + " (" + f.get("name") + ")";
      var bodyTxt = "Hi Nathalia,\n\n" + f.get("message") + "\n\n" + f.get("name") + "\n" + f.get("email") + (f.get("phone") ? "\n" + f.get("phone") : "");
      window.location.href = "mailto:" + form.getAttribute("data-to") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyTxt);
      status.textContent = "Thank you. Your email app should open with your message ready to send.";
    });
  }

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
