/* Shows this site inside Squarespace pages, live.
   Each Squarespace page has one Code Block with:
     <div id="drx-live" data-page="about.html"></div>
     <script src="https://danreynoldsphotography.codebunny.net/assets/js/squarespace.js"></script>
   This script fetches the latest published version of that page (as saved by the site editor) and
   shows it, with the site's styles, scripts, animations and page transitions. Publishing in the
   editor updates Squarespace automatically: nothing to re-paste. */
(function () {
  "use strict";
  var root = document.getElementById("drx-live");
  if (!root || root.getAttribute("data-ready")) return;
  root.setAttribute("data-ready", "1");
  var HOST = new URL("../../", document.currentScript.src).href; // site root
  var PAGE = root.getAttribute("data-page") || "index.html";
  var SLUGS = { "index.html": "/", "about.html": "/about", "portfolio.html": "/portfolio", "films.html": "/films",
    "investment.html": "/investment", "contact.html": "/contact", "404.html": "/page-not-found" };
  // Fresh within a minute of publishing, while still letting browsers reuse files briefly.
  var V = "v=" + Math.floor(Date.now() / 60000);
  var d = document.documentElement;

  // Same start-up as the site's own pages: entry animation after a page transition, loader on a first visit.
  try {
    if (sessionStorage.getItem("dr-nav")) { d.classList.add("is-entering"); sessionStorage.removeItem("dr-nav"); }
    else if (!sessionStorage.getItem("dr-seen") && !matchMedia("(prefers-reduced-motion: reduce)").matches) d.classList.add("is-loading");
    setTimeout(function () { d.classList.remove("is-loading", "is-entering"); }, 6000);
  } catch (e) {}

  root.classList.add("drx");
  root.innerHTML = '<div class="drx-loading">Loading…</div>';

  function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l; }
  css("https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap");
  var sheets = ["assets/css/styles.css", "assets/css/editor-global.css", "assets/css/squarespace.css"].map(function (p) {
    return new Promise(function (ok) { var l = css(HOST + p + "?" + V); l.onload = l.onerror = ok; });
  });

  function abs(u) {
    if (!u || /^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/.test(u)) return u;
    var m = u.match(/^([a-z0-9-]+\.html)(#.*)?$/i);
    if (m && SLUGS[m[1]]) return SLUGS[m[1]] + (m[2] || "");
    return HOST + u.replace(/^\.\//, "");
  }
  function absUrls(text) { return text.replace(/url\((["']?)(?!https?:|data:|#)([^)"']+)\1\)/g, function (_, q, u) { return "url(" + q + HOST + u + q + ")"; }); }
  function load(src) {
    return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.async = false; s.onload = ok; s.onerror = fail; document.body.appendChild(s); });
  }

  var html = fetch(HOST + PAGE + "?" + V, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.text();
  });

  Promise.all([html].concat(sheets)).then(function (res) {
    var doc = new DOMParser().parseFromString(res[0], "text/html");

    // Title, description and structured data come from the editor's SEO settings.
    if (doc.title) document.title = doc.title;
    var desc = doc.querySelector('meta[name="description"]');
    if (desc) {
      var mine = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement("meta"));
      mine.setAttribute("name", "description"); mine.setAttribute("content", desc.getAttribute("content"));
    }
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { document.head.appendChild(s.cloneNode(true)); });

    // The page itself: per-page styles plus everything in <body> except the site's own scripts.
    var frag = document.createDocumentFragment();
    var ps = doc.getElementById("page-styles");
    if (ps) { var st = document.createElement("style"); st.textContent = absUrls(ps.textContent); frag.appendChild(st); }
    doc.body.querySelectorAll("script").forEach(function (s) { s.remove(); });
    doc.body.querySelectorAll("[src],[href],[srcset],[data-full],[data-preview],[poster],[style]").forEach(function (el) {
      ["src", "href", "data-full", "data-preview", "poster"].forEach(function (a) { if (el.hasAttribute(a)) el.setAttribute(a, abs(el.getAttribute(a))); });
      if (el.hasAttribute("srcset")) el.setAttribute("srcset", el.getAttribute("srcset").split(",").map(function (part) {
        var bits = part.trim().split(/\s+/); bits[0] = abs(bits[0]); return bits.join(" ");
      }).join(", "));
      if (el.hasAttribute("style")) el.setAttribute("style", absUrls(el.getAttribute("style")));
    });
    // Contact page: the Squarespace Form block (with its integrations) takes the place of the site's form.
    var form = doc.querySelector("form[data-inquiry]");
    if (form) { var slot = doc.createElement("div"); slot.className = "sq-form-slot"; slot.id = "sq-form-slot"; form.replaceWith(slot); }
    while (doc.body.firstChild) frag.appendChild(document.adoptNode(doc.body.firstChild));
    root.innerHTML = "";
    root.appendChild(frag);

    var sqForm = document.querySelector(".sqs-block-form"), slotEl = document.getElementById("sq-form-slot");
    if (sqForm && slotEl) { var holder = sqForm.closest(".fe-block"); slotEl.appendChild(sqForm); if (holder) holder.style.display = "none"; }

    // The site's scripts, in order (animations, menus, lightbox, page transitions).
    return ["assets/vendor/gsap.min.js", "assets/vendor/ScrollTrigger.min.js", "assets/js/main.js", "assets/js/motion.js"]
      .reduce(function (p, s) { return p.then(function () { return load(HOST + s + "?" + V); }); }, Promise.resolve());
  }).then(function () {
    // Re-measure scroll effects once photos have loaded (the window "load" event has already passed).
    var refresh = function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
    root.querySelectorAll("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
    setTimeout(refresh, 1200);
  }).catch(function () {
    d.classList.remove("is-loading", "is-entering");
    root.innerHTML = '<div class="drx-loading">This page could not be loaded. Please refresh.</div>';
  });
})();
