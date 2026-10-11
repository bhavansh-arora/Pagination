/* =========================================================
   AURELIA — interactions
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Preloader ---------- */
  const pre = $(".preloader");
  if (pre) {
    const bar = $(".preloader-bar i", pre);
    const count = $(".preloader-count", pre);
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(p + Math.random() * 18, 96);
      if (bar) bar.style.width = p + "%";
      if (count) count.textContent = Math.floor(p) + "%";
    }, 120);
    const finish = () => {
      clearInterval(tick);
      if (bar) bar.style.width = "100%";
      if (count) count.textContent = "100%";
      setTimeout(() => {
        pre.classList.add("done");
        document.body.classList.add("loaded");
        revealHeroNow();
      }, 300);
    };
    if (document.readyState === "complete") setTimeout(finish, 600);
    else window.addEventListener("load", () => setTimeout(finish, 400));
    setTimeout(finish, 3200); // never block longer than this
  } else {
    document.body.classList.add("loaded");
  }

  /* ---------- Split text into words ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.style.setProperty("--i", i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          // wrap whole inline element (e.g. <em>) as one word
          if (n.tagName === "BR") return;
          const w = document.createElement("span");
          w.className = "w";
          const inner = document.createElement("span");
          inner.style.setProperty("--i", i++);
          n.replaceWith(w);
          inner.appendChild(n);
          w.appendChild(inner);
        }
      });
    };
    walk(el);
    el.classList.add("split");
  });

  /* ---------- Reveal on scroll ---------- */
  // A fully clipped element (.img-reveal starts at clip-path inset 100%) never
  // reports as intersecting, so those are observed through their parent.
  const targets = new Map();
  $$("[data-reveal], .img-reveal, .split, .meter, [data-count]").forEach((el) => {
    const t = el.classList.contains("img-reveal") ? el.parentElement : el;
    if (!targets.has(t)) targets.set(t, []);
    targets.get(t).push(el);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.closest(".hero") && !document.body.classList.contains("loaded")) return;
      targets.get(e.target).forEach((el) => {
        el.classList.add("in");
        if (el.hasAttribute("data-count")) countUp(el);
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  targets.forEach((_, t) => io.observe(t));

  function revealHeroNow() {
    $$(".hero [data-reveal], .hero .split, .page-hero [data-reveal], .page-hero .split").forEach((el) => el.classList.add("in"));
  }
  if (!pre) setTimeout(revealHeroNow, 100);

  /* ---------- Counters ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const dur = reduced ? 0 : 2000;
    const start = performance.now();
    const fmt = (v) => v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const step = (t) => {
      const k = dur ? Math.min((t - start) / dur, 1) : 1;
      const eased = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(target * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Header / menu / progress ---------- */
  const header = $(".header");
  const progress = $(".progress");
  const pageHeroImg = $(".page-hero > img");
  const processWrap = $(".process");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    if (pageHeroImg && !reduced) pageHeroImg.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
    if (processWrap) {
      const r = processWrap.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.75 - r.top) / (r.height + 200), 0), 1);
      processWrap.style.setProperty("--p", p.toFixed(3));
      $$(".step", processWrap).forEach((s, i, arr) => s.classList.toggle("lit", p >= (i + 0.2) / arr.length || s.getBoundingClientRect().top < window.innerHeight * 0.6));
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.documentElement.classList.toggle("menu-open");
      document.body.classList.toggle("locked", open);
      burger.setAttribute("aria-expanded", open);
    });
    $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => {
      document.documentElement.classList.remove("menu-open");
      document.body.classList.remove("locked");
    }));
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduced) {
    const c = $(".cursor"), d = $(".cursor-dot");
    if (c && d) {
      let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
      addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; d.style.transform = `translate(${mx - 3}px, ${my - 3}px)`; });
      const loop = () => {
        cx += (mx - cx) * 0.16; cy += (my - cy) * 0.16;
        const s = c.offsetWidth / 2;
        c.style.transform = `translate(${cx - s}px, ${cy - s}px)`;
        requestAnimationFrame(loop);
      };
      loop();
      document.addEventListener("mouseover", (e) => {
        c.classList.toggle("hover", !!e.target.closest("a, button, .chip, .tilt, .g-item, .flip, input, select, textarea, summary"));
      });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$("[data-magnetic]").forEach((b) => {
      b.addEventListener("mousemove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- 3D tilt cards ---------- */
  if (finePointer && !reduced) {
    $$(".tilt").forEach((card) => {
      const max = parseFloat(card.dataset.tilt || 10);
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add("tilting");
        card.style.transform = `perspective(1000px) rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg) scale(1.02)`;
        card.style.setProperty("--gx", px * 100 + "%");
        card.style.setProperty("--gy", py * 100 + "%");
      });
      card.addEventListener("mouseleave", () => { card.classList.remove("tilting"); card.style.transform = ""; });
    });
  }

  /* ---------- Hero image stack parallax ---------- */
  const stack = $(".hero-stack");
  if (stack && !reduced) {
    const move = (nx, ny) => { stack.style.transform = `rotateY(${nx * 8}deg) rotateX(${-ny * 8}deg)`; };
    stack.style.transition = "transform .8s cubic-bezier(.2,.8,.2,1)";
    stack.style.transformStyle = "preserve-3d";
    if (finePointer) {
      addEventListener("mousemove", (e) => move(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
    } else {
      addEventListener("scroll", () => move(0, Math.min(scrollY / innerHeight, 1) * -0.6), { passive: true });
    }
  }

  /* ---------- 3D carousel ---------- */
  $$(".c3d").forEach((stage) => {
    const ring = $(".c3d-ring", stage);
    const items = $$(".c3d-item", ring);
    const n = items.length;
    const step = 360 / n;
    let radius = 0, rot = 0, vel = reduced ? 0 : -0.12, dragging = false, lastX = 0, autoplay = !reduced;
    const layout = () => {
      const w = items[0].offsetWidth;
      radius = Math.round((w / 2) / Math.tan(Math.PI / n)) + (innerWidth < 680 ? 30 : 70);
      items.forEach((it, i) => { it.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`; });
    };
    layout();
    addEventListener("resize", layout);
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
    const tick = () => {
      if (visible) {
        if (!dragging) {
          if (autoplay) vel += (-0.12 - vel) * 0.02;
          else vel *= 0.95;
          rot += vel;
        }
        ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${rot}deg)`;
      }
      requestAnimationFrame(tick);
    };
    tick();
    stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      rot += dx * 0.25; vel = dx * 0.25;
    });
    const end = () => { dragging = false; autoplay = !reduced; };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  });

  /* ---------- Budget estimator ---------- */
  const est = $(".estimator");
  if (est) {
    const state = { base: 120, tier: 1 };
    const guests = $("#guests", est), guestsOut = $("#guestsOut", est);
    const price = $("#estPrice", est), incl = $("#estIncl", est);
    const tiers = [
      { m: 0.75, inc: ["Dedicated planner", "Vendor sourcing & management", "Day-of coordination"] },
      { m: 1, inc: ["Senior creative director", "Custom décor & stage design", "Full production & AV", "Guest experience team"] },
      { m: 1.6, inc: ["Award-winning creative team", "Bespoke scenography & 3D mapping", "Celebrity / artist booking", "Concierge for VIP guests", "Cinematic film & photo"] },
    ];
    const fmt = (v) => "$" + (v >= 1000 ? (v / 1000).toFixed(v >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k" : v);
    const render = () => {
      const g = +guests.value;
      guestsOut.textContent = g >= 1000 ? "1,000+" : g;
      guests.style.setProperty("--fill", ((g - guests.min) / (guests.max - guests.min)) * 100 + "%");
      const t = tiers[state.tier];
      const low = Math.round((state.base * g * t.m + 4000) / 500) * 500;
      const high = Math.round((low * 1.45) / 500) * 500;
      price.textContent = `${fmt(low)} – ${fmt(high)}`;
      incl.innerHTML = t.inc.map((x) => `<li>${x}</li>`).join("");
    };
    $$("[data-group]", est).forEach((group) => {
      $$(".chip", group).forEach((chip) => chip.addEventListener("click", () => {
        $$(".chip", group).forEach((c) => c.classList.remove("on"));
        chip.classList.add("on");
        if (group.dataset.group === "type") state.base = +chip.dataset.v;
        else state.tier = +chip.dataset.v;
        price.animate([{ opacity: 0.2, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" });
        render();
      }));
    });
    guests.addEventListener("input", render);
    render();
  }

  /* ---------- Testimonials ---------- */
  $$(".testi-wrap").forEach((wrap) => {
    const slides = $$(".testi", wrap);
    const dotsWrap = $(".dots", wrap);
    let idx = 0, timer;
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Show testimonial " + (i + 1));
      b.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(b);
    });
    const dots = $$("button", dotsWrap);
    const go = (i, user) => {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("on", k === idx));
      dots.forEach((d, k) => d.classList.toggle("on", k === idx));
      if (user) restart();
    };
    const restart = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => go(idx + 1), 7000); };
    $(".prev", wrap).addEventListener("click", () => go(idx - 1, true));
    $(".next", wrap).addEventListener("click", () => go(idx + 1, true));
    let sx = 0;
    wrap.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1), true); });
    go(0); restart();
  });

  /* ---------- Gallery filters + lightbox ---------- */
  const gallery = $(".gallery");
  if (gallery) {
    const items = $$(".g-item", gallery);
    $$(".filters .chip").forEach((chip) => chip.addEventListener("click", () => {
      $$(".filters .chip").forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      const f = chip.dataset.filter;
      items.forEach((it) => {
        const show = f === "all" || it.dataset.cat === f;
        it.classList.toggle("hide", !show);
        if (show && !reduced) it.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    }));
    const lb = $(".lightbox"), lbImg = $("img", lb), lbCap = $(".lb-cap", lb);
    let cur = 0;
    const visibleItems = () => items.filter((i) => !i.classList.contains("hide"));
    const open = (it) => {
      const vis = visibleItems(); cur = vis.indexOf(it);
      const img = $("img", it);
      lbImg.src = img.dataset.full || img.src; lbImg.alt = img.alt;
      lbCap.textContent = $(".g-cap b", it).textContent + " — " + $(".g-cap span", it).textContent;
      lb.classList.add("on"); document.body.classList.add("locked");
    };
    const close = () => { lb.classList.remove("on"); document.body.classList.remove("locked"); };
    const nav = (d) => { const vis = visibleItems(); open(vis[(cur + d + vis.length) % vis.length]); };
    items.forEach((it) => it.addEventListener("click", () => open(it)));
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", (e) => { e.stopPropagation(); nav(-1); });
    $(".lb-next", lb).addEventListener("click", (e) => { e.stopPropagation(); nav(1); });
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    });
  }

  /* ---------- Team flip on tap ---------- */
  $$(".flip").forEach((f) => {
    f.addEventListener("click", () => f.classList.toggle("flipped"));
    f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f.classList.toggle("flipped"); } });
  });

  /* ---------- Forms (demo handling — connect to your backend / Formspree) ---------- */
  $$("form[data-demo]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = $(".form-success", form.closest(".form-card") || form.parentElement);
      const btn = $("button[type=submit]", form);
      if (btn) { btn.disabled = true; btn.firstChild.textContent = "Sending… "; }
      setTimeout(() => {
        if (ok) ok.classList.add("on");
        else { const b = $("button", form); if (b) b.textContent = "You're in ✓"; }
        form.reset();
      }, 900);
    });
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
