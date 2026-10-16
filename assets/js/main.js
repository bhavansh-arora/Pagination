/* Dan Reynolds — site interactions. No dependencies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled / hide on scroll down ---------- */
  var header = document.querySelector(".site-header");
  var sticky = document.querySelector(".sticky-cta");
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var hide = y > 480 && y > lastY + 4 && !document.body.classList.contains("menu-open");
      if (hide) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 480) header.classList.remove("is-hidden");
    }
    if (sticky) {
      var nearBottom = window.innerHeight + y > document.body.scrollHeight - 520;
      sticky.classList.toggle("is-visible", y > window.innerHeight * 0.7 && !nearBottom);
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) { header.classList.remove("is-hidden"); var first = menu.querySelector("a"); if (first) setTimeout(function () { first.focus(); }, 300); }
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setMenu(false); });
  }

  /* ---------- Split headline into lines ---------- */
  // Each <br>-separated line becomes a row; every word is masked and rises in on reveal.
  var wordIndex = 0;
  function splitWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "word";
          var inner = document.createElement("span");
          inner.textContent = part;
          inner.style.setProperty("--i", wordIndex++);
          w.appendChild(inner);
          frag.appendChild(w);
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1 && !child.hasAttribute("data-nosplit")) {
        splitWords(child);
      } else if (child.nodeType === 1) {
        child.classList.add("word-block");
        child.style.setProperty("--i", wordIndex++);
      }
    });
  }
  document.querySelectorAll("[data-lines]").forEach(function (el) {
    wordIndex = 0;
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) { return '<span class="line">' + p.trim() + "</span>"; }).join("");
    el.querySelectorAll(".line").forEach(splitWords);
    el.classList.add("lines");
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-img, .lines");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Subtle parallax for CTA backgrounds (fallback when GSAP is absent) ---------- */
  var parallax = document.querySelectorAll("[data-parallax]");
  if (parallax.length && !reduceMotion && !window.gsap) {
    var updateParallax = function () {
      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = "translate3d(0," + (p * -8).toFixed(2) + "%,0)";
      });
    };
    window.addEventListener("scroll", function () { window.requestAnimationFrame(updateParallax); }, { passive: true });
    updateParallax();
  }

  /* ---------- Lite YouTube embeds ---------- */
  document.querySelectorAll(".yt[data-id]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (el.classList.contains("is-playing")) return;
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + el.dataset.id + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
      iframe.title = el.getAttribute("aria-label") || "Film";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      el.appendChild(iframe);
      el.classList.add("is-playing");
    });
  });

  /* ---------- Testimonials slider ---------- */
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector(".t-track");
    var slides = Array.prototype.slice.call(track.children);
    var dots = root.querySelectorAll(".t-dot");
    var idx = 0;
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[idx].offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    }
    function sync() {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      idx = i;
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === i ? "true" : "false"); });
    }
    track.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
    dots.forEach(function (d, n) { d.addEventListener("click", function () { go(n); }); });
    var prev = root.querySelector("[data-prev]"), next = root.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });
    sync();
  });

  /* ---------- Portfolio filters ---------- */
  var filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    var items = document.querySelectorAll(".masonry__item");
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var f = btn.dataset.filter;
      filterBar.querySelectorAll("[data-filter]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      items.forEach(function (it) { it.hidden = !(f === "all" || it.dataset.story === f); });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCount = lb.querySelector("[data-count]");
    var lbCap = lb.querySelector("[data-caption]");
    var current = 0, list = [], lastFocus = null;
    function visibleItems() {
      return Array.prototype.filter.call(document.querySelectorAll(".masonry__item"), function (i) { return !i.hidden; });
    }
    function show(i) {
      current = (i + list.length) % list.length;
      var it = list[current];
      lbImg.style.opacity = "0";
      var src = it.dataset.full;
      var pre = new Image();
      pre.onload = function () { lbImg.src = src; lbImg.alt = it.querySelector("img").alt; lbImg.style.opacity = "1"; };
      pre.src = src;
      lbCount.textContent = String(current + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
      lbCap.textContent = it.dataset.caption || "";
    }
    function open(item) {
      list = visibleItems();
      lastFocus = document.activeElement;
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      show(list.indexOf(item));
      lb.querySelector("[data-close]").focus();
    }
    function close() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll(".masonry__item").forEach(function (it) {
      it.addEventListener("click", function (e) { e.preventDefault(); open(it); });
    });
    lb.querySelector("[data-close]").addEventListener("click", close);
    lb.querySelector("[data-prev]").addEventListener("click", function () { show(current - 1); });
    lb.querySelector("[data-next]").addEventListener("click", function () { show(current + 1); });
    lb.querySelector(".lightbox__stage").addEventListener("click", function (e) { if (e.target === e.currentTarget) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "Tab") {
        var f = lb.querySelectorAll("button");
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var sx = 0, sy = 0;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    }, { passive: true });
  }

  /* ---------- FAQ: smooth open/close ---------- */
  document.querySelectorAll(".faq details").forEach(function (d) {
    var summary = d.querySelector("summary");
    var body = d.querySelector(".faq__body");
    summary.addEventListener("click", function (e) {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        body.style.height = body.scrollHeight + "px";
        requestAnimationFrame(function () {
          body.style.transition = "height .45s cubic-bezier(.16,1,.3,1)";
          body.style.height = "0px";
        });
        body.addEventListener("transitionend", function te() { d.open = false; body.style.cssText = ""; body.removeEventListener("transitionend", te); });
      } else {
        d.open = true;
        var h = body.scrollHeight;
        body.style.height = "0px";
        requestAnimationFrame(function () {
          body.style.transition = "height .55s cubic-bezier(.16,1,.3,1)";
          body.style.height = h + "px";
        });
        body.addEventListener("transitionend", function te() { body.style.cssText = ""; body.removeEventListener("transitionend", te); });
      }
    });
  });

  /* ---------- Inquiry form ---------- */
  var form = document.querySelector("[data-inquiry]");
  if (form) {
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
    function validate(field) {
      var input = field.querySelector(".input");
      if (!input) return true;
      var ok = input.checkValidity();
      field.classList.toggle("is-invalid", !ok);
      return ok;
    }
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector(".input");
      if (input) input.addEventListener("blur", function () { if (input.value) validate(field); });
      if (input) input.addEventListener("input", function () { if (field.classList.contains("is-invalid")) validate(field); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true, firstBad = null;
      form.querySelectorAll(".field").forEach(function (f) { if (!validate(f)) { valid = false; firstBad = firstBad || f; } });
      if (!valid) { firstBad.querySelector(".input").focus(); return; }
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      btn.firstChild.textContent = "Sending… ";
      var action = form.getAttribute("action") || "";
      var done = function () {
        form.classList.add("is-sent");
        var s = form.nextElementSibling;
        if (s) { s.setAttribute("tabindex", "-1"); s.focus(); s.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
      };
      // Demo mode until a real endpoint (e.g. Formspree) is configured — see README.
      if (!action || action.indexOf("YOUR_FORM_ID") !== -1) { setTimeout(done, 700); return; }
      fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(); done(); })
        .catch(function () {
          btn.disabled = false;
          btn.firstChild.textContent = "Send inquiry ";
          alert("Sorry, something went wrong. Please message us on Instagram @danreynoldsphotography.");
        });
    });
  }

  /* ---------- Year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
