/* Code Bunny — site interactions (no dependencies) */
(function () {
  "use strict";
  var d = document, w = window;
  d.documentElement.classList.remove("no-js");
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = w.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* nav state */
  var nav = d.querySelector(".nav");
  function onScroll() { if (nav) nav.classList.toggle("is-scrolled", w.scrollY > 10); }
  w.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* drawer */
  var burger = d.querySelector(".burger"), drawer = d.getElementById("drawer");
  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    d.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { setDrawer(burger.getAttribute("aria-expanded") !== "true"); });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  if (drawer) drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setDrawer(false); }); });

  /* reveal on scroll */
  var rv = d.querySelectorAll(".rv");
  if ("IntersectionObserver" in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* count up */
  var nums = d.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in w && nums.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), sup = el.querySelector("sup");
        var supHTML = sup ? sup.outerHTML : "";
        if (reduce) return;
        var t0 = null;
        (function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1500, 1), v = Math.round(to * (1 - Math.pow(1 - p, 4)));
          el.innerHTML = v + supHTML;
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* cursor bubble over work cards */
  if (fine && !reduce) {
    var cur = d.createElement("div"); cur.className = "cursor"; cur.setAttribute("aria-hidden", "true"); cur.textContent = "Visit ↗";
    d.body.appendChild(cur);
    var x = 0, y = 0, cx = 0, cy = 0, raf;
    function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.translate = cx + "px " + cy + "px"; raf = requestAnimationFrame(loop); }
    d.addEventListener("mousemove", function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    d.querySelectorAll(".wcard .media").forEach(function (m) {
      m.addEventListener("mouseenter", function () { cur.classList.add("on"); if (!raf) loop(); });
      m.addEventListener("mouseleave", function () { cur.classList.remove("on"); });
    });
  }

  /* work filter */
  var chips = d.querySelectorAll(".chip[data-filter]"), cards = d.querySelectorAll(".grid-work .wcard");
  function applyFilter(f) {
    chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-filter") === f ? "true" : "false"); });
    cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); });
    var live = d.getElementById("filter-live");
    if (live) { var n = 0; cards.forEach(function (c) { if (!c.hidden) n++; }); live.textContent = n + " projects shown"; }
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var f = c.getAttribute("data-filter"); applyFilter(f);
      try { history.replaceState(null, "", f === "all" ? location.pathname : "#" + f); } catch (e) {}
    });
  });
  if (chips.length && location.hash) { var h = location.hash.slice(1); if (d.querySelector('.chip[data-filter="' + h + '"]')) applyFilter(h); }

  /* free-preview URL demo */
  var demo = d.querySelector("[data-url-demo]");
  if (demo) {
    var names = JSON.parse(demo.getAttribute("data-url-demo")), imgs = demo.querySelectorAll(".frame img"), typed = demo.querySelector(".typed"), i = 0;
    function typeName(s, cb) {
      if (reduce) { typed.textContent = s; return cb(); }
      var k = typed.textContent.length;
      (function del() {
        if (k > 0) { typed.textContent = typed.textContent.slice(0, --k); return setTimeout(del, 28); }
        var j = 0;
        (function add() { if (j <= s.length) { typed.textContent = s.slice(0, j++); setTimeout(add, 55); } else cb(); })();
      })();
    }
    function next() {
      imgs.forEach(function (im, idx) { im.classList.toggle("on", idx === i); });
      typeName(names[i], function () { i = (i + 1) % names.length; setTimeout(next, 2600); });
    }
    if (imgs.length) next();
  }

  /* forms */
  d.querySelectorAll("form[data-form]").forEach(function (form) {
    var params = new URLSearchParams(location.search);
    var modeInputs = form.querySelectorAll('input[name="request"]');
    function setMode() {
      var v = form.querySelector('input[name="request"]:checked');
      form.setAttribute("data-mode", v && v.value.indexOf("preview") > -1 ? "preview" : "project");
    }
    modeInputs.forEach(function (r) { r.addEventListener("change", setMode); });

    // pre-fill from links like /contact/?site=beauty.codebunny.net or ?interest=build
    var site = params.get("site"), interest = params.get("interest"), svc = form.querySelector('[name="service"]');
    if (site && modeInputs[1]) { modeInputs[1].checked = true; if (svc) svc.value = "Buy a ready-made site"; var msg = form.querySelector('[name="message"]'); if (msg && !msg.value) msg.value = "Hi! I'm interested in buying " + site + ". "; }
    if (interest === "build" && modeInputs[1]) { modeInputs[1].checked = true; }
    if (interest === "preview" && modeInputs[0]) { modeInputs[0].checked = true; }
    setMode();

    var status = form.querySelector(".form-status"), btn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.querySelector('[name="_honey"]').value) return;
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
          if (w.gtag) w.gtag("event", "generate_lead", { form: form.getAttribute("data-mode") });
        })
        .catch(function () {
          status.className = "form-status err";
          status.innerHTML = 'Something went wrong sending that. Please email <a href="mailto:bhavansh@codebunny.net">bhavansh@codebunny.net</a> or message us on WhatsApp.';
        })
        .finally(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });

  /* year */
  d.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
