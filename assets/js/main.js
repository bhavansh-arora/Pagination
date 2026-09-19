/* =========================================================
   Code Bunny — global interactions
   Nav, reveal-on-scroll, 3D tilt, canvas particles,
   counters, testimonials carousel, back-to-top.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Nav scroll state + mobile menu ---------- */
  var nav = document.querySelector(".site-nav");
  var menu = document.querySelector(".mobile-menu");
  var burger = document.querySelector(".hamburger");

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");

    var backTop = document.querySelector(".back-top");
    if (backTop) {
      if (window.scrollY > 600) backTop.classList.add("show");
      else backTop.classList.remove("show");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && menu) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("open");
      menu.classList.toggle("open");
      document.body.style.overflow = menu.classList.contains("open") ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.classList.remove("open");
        menu.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  var backTopBtn = document.querySelector(".back-top");
  if (backTopBtn) {
    backTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countIO.unobserve(entry.target);
          var el = entry.target;
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
          if (reduceMotion) {
            el.textContent = target.toFixed(decimals) + suffix;
            return;
          }
          var duration = 1400;
          var start = null;
          function step(ts) {
            if (start === null) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = target * eased;
            el.textContent = val.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target.toFixed(decimals) + suffix;
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- 3D tilt (cards + hero visual) ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".tilt-card, .product-card").forEach(function (card) {
      var bounds;
      card.addEventListener("mouseenter", function () {
        bounds = card.getBoundingClientRect();
      });
      card.addEventListener("mousemove", function (e) {
        if (!bounds) bounds = card.getBoundingClientRect();
        var x = (e.clientX - bounds.left) / bounds.width - 0.5;
        var y = (e.clientY - bounds.top) / bounds.height - 0.5;
        var rotateY = x * 14;
        var rotateX = y * -14;
        card.style.transform = "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Hero particle canvas ---------- */
  var canvas = document.getElementById("hero-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      var count = window.innerWidth < 640 ? 28 : 60;
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.6,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          hueMix: Math.random()
        });
      }
    }

    function colorFor(mix) {
      var stops = [
        [138, 106, 44],
        [184, 134, 11],
        [232, 211, 160]
      ];
      var idx = mix * (stops.length - 1);
      var i0 = Math.floor(idx);
      var i1 = Math.min(i0 + 1, stops.length - 1);
      var t = idx - i0;
      var c0 = stops[i0], c1 = stops[i1];
      var r = Math.round(c0[0] + (c1[0] - c0[0]) * t);
      var g = Math.round(c0[1] + (c1[1] - c0[1]) * t);
      var b = Math.round(c0[2] + (c1[2] - c0[2]) * t);
      return "rgb(" + r + "," + g + "," + b + ")";
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.fillStyle = colorFor(p.hueMix);
        ctx.globalAlpha = 0.55;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = "#b8860b";
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    resize();
    initParticles();
    requestAnimationFrame(tick);
    window.addEventListener("resize", function () {
      resize();
      initParticles();
    });
  }

  /* ---------- Testimonial carousel ---------- */
  var slides = document.querySelectorAll(".testi-slide");
  var dotsWrap = document.querySelector(".testi-dots");
  if (slides.length) {
    var active = 0;
    var timer;
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        if (i === 0) b.classList.add("active");
        b.addEventListener("click", function () { goTo(i); restart(); });
        dotsWrap.appendChild(b);
      });
    }
    function goTo(i) {
      slides[active].classList.remove("active");
      dotsWrap && dotsWrap.children[active].classList.remove("active");
      active = i;
      slides[active].classList.add("active");
      dotsWrap && dotsWrap.children[active].classList.add("active");
    }
    function restart() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { goTo((active + 1) % slides.length); }, 5200);
    }
    restart();
    var testiWrap = document.querySelector(".testi-wrap");
    if (testiWrap) {
      testiWrap.addEventListener("mouseenter", function () { clearInterval(timer); });
      testiWrap.addEventListener("mouseleave", restart);
    }
  }

  /* ---------- Contact form (static demo submit) ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var CONTACT_EMAIL = "bhavansharora21@gmail.com";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var original = btn.textContent;
      btn.textContent = "Sending…";
      btn.disabled = true;

      fetch("https://formsubmit.co/ajax/" + CONTACT_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
        .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
        .then(function () {
          btn.textContent = "Message sent ✓";
          form.reset();
        })
        .catch(function () {
          btn.textContent = "Couldn't send — email us directly";
        })
        .finally(function () {
          setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 3200);
        });
    });
  }
})();
