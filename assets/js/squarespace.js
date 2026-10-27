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
  // (The pasted snippet normally does this itself, before the first frame is painted.)
  if (!window.__drBooted) try {
    if (sessionStorage.getItem("dr-nav")) { d.classList.add("is-entering"); sessionStorage.removeItem("dr-nav"); }
    else if (!matchMedia("(prefers-reduced-motion: reduce)").matches) d.classList.add("is-loading");
    setTimeout(function () { d.classList.remove("is-loading", "is-entering"); }, 20000);
  } catch (e) {}

  root.classList.add("drx");

  function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l; }
  css("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap");
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

  // Start downloading the site's scripts now, in parallel with the page; they run once it's in place.
  var SCRIPTS = ["assets/vendor/gsap.min.js", "assets/vendor/ScrollTrigger.min.js", "assets/js/main.js", "assets/js/motion.js"];
  SCRIPTS.forEach(function (src) { var l = document.createElement("link"); l.rel = "preload"; l.as = "script"; l.href = HOST + src + "?" + V; document.head.appendChild(l); });

  var html = fetch(HOST + PAGE + "?" + V, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.text();
  });

  Promise.all([html].concat(sheets)).then(function (res) {
    var doc = new DOMParser().parseFromString(res[0], "text/html");
    // The page's own stylesheets (<link data-page-css>, e.g. a colour theme for one page): wait for them
    // before showing the page, so it never flashes in the site-wide colours first.
    return Promise.all(Array.prototype.map.call(doc.querySelectorAll("head link[data-page-css][href]"), function (l) {
      // Added at the end of the page, after the pasted snippet's own intro styles, so the page's colours win.
      return new Promise(function (ok) {
        var x = document.createElement("link"); x.rel = "stylesheet"; x.href = abs(l.getAttribute("href")) + "?" + V;
        x.onload = x.onerror = ok; document.body.appendChild(x);
      });
    })).then(function () { return doc; });
  }).then(function (doc) {

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
    // Keep the intro screen and curtain the snippet already shows (so their animation doesn't restart).
    [".preloader", ".curtain"].forEach(function (sel) { if (document.querySelector(sel)) doc.body.querySelectorAll(sel).forEach(function (el) { el.remove(); }); });
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
    // async = false keeps them running in order while they download (or come from the preload) in parallel.
    return Promise.all(SCRIPTS.map(function (s) { return load(HOST + s + "?" + V); }));
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
