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
  // One Squarespace page (/post) shows every blog post: /post?p=<post> loads blog-<post>.html.
  if (PAGE === "@post") {
    var post = (new URLSearchParams(location.search).get("p") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    PAGE = post ? "blog-" + post + ".html" : "blog.html";
  }
  // Links between pages go to the matching Squarespace page: "about.html" → "/about". Pages added later in the
  // editor follow the same rule, so a new page only needs a Squarespace page with that URL. Exceptions:
  var SLUGS = { "index.html": "/", "404.html": "/page-not-found" };
  // Pages and the editor's global styles: fresh within a minute of publishing.
  var V = "v=" + Math.floor(Date.now() / 60000);
  // The site's own styles and scripts: versioned by content (tools/version_assets.py fills this in), so
  // browsers keep them between visits and only download a file again after it changes.
  var HASH = {"assets/css/styles.css":"01f27f40","assets/js/main.js":"0e205e9c","assets/js/motion.js":"145fd986","assets/vendor/gsap.min.js":"2d26f4c0","assets/vendor/ScrollTrigger.min.js":"489bcf6d","assets/vendor/lenis.min.js":"3ae98b55","assets/css/squarespace.css":"427834de"};
  function ver(p) { return HASH[p] ? "v=" + HASH[p] : V; }
  var d = document.documentElement;

  // Snippets pasted before this fix hid the intro screen outright: show it while the page loads.
  var fix = document.createElement("style");
  fix.textContent = "@media (prefers-reduced-motion: no-preference){.is-loading .preloader,.is-loaded .preloader{display:grid!important}.curtain{display:grid!important}}";
  document.head.appendChild(fix);

  // Same start-up as the site's own pages: entry animation after a page transition, loader on a first visit.
  // (The pasted snippet normally does this itself, before the first frame is painted.)
  if (!window.__drBooted) try {
    if (sessionStorage.getItem("dr-nav")) { d.classList.add("is-entering"); sessionStorage.removeItem("dr-nav"); }
    else if (!matchMedia("(prefers-reduced-motion: reduce)").matches) d.classList.add("is-loading");
    setTimeout(function () { d.classList.remove("is-loading", "is-entering"); }, 20000);
  } catch (e) {}

  root.classList.add("drx");

  // Intro screen: count up while the page downloads; motion.js takes over and finishes it once it runs.
  (function () {
    var count = document.querySelector("[data-count-loader]"), bar = document.querySelector(".preloader__bar");
    if (!count && !bar) return;
    (function tick() {
      if (window.__drMotion || !d.classList.contains("is-loading")) return;
      var n = Math.round(85 * (1 - Math.exp(-performance.now() / 2600)));
      if (count) count.textContent = ("00" + n).slice(-3);
      if (bar) bar.style.setProperty("--p", (n / 100).toFixed(3));
      requestAnimationFrame(tick);
    })();
  })();

  function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); return l; }
  css("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap");
  var sheets = ["assets/css/styles.css", "assets/css/editor-global.css", "assets/css/squarespace.css"].map(function (p) {
    return new Promise(function (ok) { var l = css(HOST + p + "?" + ver(p)); l.onload = l.onerror = ok; });
  });

  function abs(u) {
    if (!u || /^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/.test(u)) return u;
    var bp = u.match(/^blog-([a-z0-9-]+)\.html(#.*)?$/i);
    if (bp) return "/post?p=" + bp[1].toLowerCase() + (bp[2] || "");
    var m = u.match(/^([a-z0-9-]+)\.html(#.*)?$/i);
    if (m) return (SLUGS[m[1] + ".html"] || "/" + m[1].toLowerCase()) + (m[2] || "");
    return HOST + u.replace(/^\.\//, "");
  }
  function absUrls(text) { return text.replace(/url\((["']?)(?!https?:|data:|#)([^)"']+)\1\)/g, function (_, q, u) { return "url(" + q + HOST + u + q + ")"; }); }

  // The Squarespace form, dressed like the site's own form: placeholders, and "(optional)" on fields that
  // aren't required. Only the look changes; field names, settings and where submissions go stay Dan's.
  function dressForm(slot) {
    var HINTS = [[/first/i, "First name"], [/last/i, "Last name"], [/email/i, "you@example.com"], [/phone/i, "(000) 000-0000"],
      [/location|venue/i, "Venue, city"], [/special day|tell me more|your day/i, "Your story, your vision, the moments that matter most…"],
      [/restaurant/i, "Your favorite place to eat"], [/subject/i, "What's the project?"], [/message/i, "Tell us about the property, place or event…"]];
    function apply() {
      slot.querySelectorAll("input[type=text], input[type=email], input[type=tel], input:not([type]), textarea").forEach(function (el) {
        if (el.getAttribute("placeholder")) return;
        var own = el.closest(".field"), label = own ? own.textContent.trim() : "";
        if (!label) { var group = el.closest(".form-item"); label = group ? group.textContent : ""; }
        for (var i = 0; i < HINTS.length; i++) if (HINTS[i][0].test(label)) { el.setAttribute("placeholder", HINTS[i][1]); break; }
      });
      slot.querySelectorAll(".field-list > .form-item").forEach(function (item) {
        if (item.classList.contains("required") || item.querySelector(".opt")) return;
        if (item.querySelector(".description.required")) return;
        var t = item.querySelector(".title span, legend span");
        if (t) { var o = document.createElement("span"); o.className = "opt"; o.textContent = "(optional)"; t.parentNode.insertBefore(o, t.nextSibling); }
      });
      // The form goes on to the thank-you page: Squarespace's own success message would only flash, faintly,
      // over the form for a moment before that page opens, so it stays hidden.
      if (slot.querySelector("form[data-success-redirect]")) slot.classList.add("sq-redirects");
      var first = slot.querySelector("select.show-placeholder option");
      if (first && /select an option/i.test(first.textContent)) first.textContent = "Select…";
    }
    apply();
    // Date: a click anywhere in the box opens the calendar (browsers otherwise open it only from their own icon).
    slot.addEventListener("click", function (e) {
      var el = e.target;
      if (el && el.matches && el.matches('input[type="date"]') && el.showPicker) try { el.showPicker(); } catch (err) {}
    });
    // Squarespace's form re-renders itself at times (validation, sending): put the hints back.
    if (window.MutationObserver) new MutationObserver(function () { clearTimeout(slot._t); slot._t = setTimeout(apply, 60); }).observe(slot, { childList: true, subtree: true });
  }
  function load(src) {
    return new Promise(function (ok, fail) { var s = document.createElement("script"); s.src = src; s.async = false; s.onload = ok; s.onerror = fail; document.body.appendChild(s); });
  }

  // Start downloading the site's scripts now, in parallel with the page; they run once it's in place.
  var SCRIPTS = ["assets/vendor/gsap.min.js", "assets/vendor/ScrollTrigger.min.js", "assets/vendor/lenis.min.js", "assets/js/main.js", "assets/js/motion.js"];
  SCRIPTS.forEach(function (src) { var l = document.createElement("link"); l.rel = "preload"; l.as = "script"; l.href = HOST + src + "?" + ver(src); document.head.appendChild(l); });

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
    // (Skipped when the pasted code already carries the same structured data, so it isn't there twice.)
    var haveLd = Array.prototype.map.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) { return s.textContent.trim(); });
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { if (haveLd.indexOf(s.textContent.trim()) < 0) document.head.appendChild(s.cloneNode(true)); });

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
    // Contact page (or any page with a form spot, [data-sq-form]): the Form block added on the Squarespace page,
    // with its own fields, integrations and where submissions go, takes the place of the site's form.
    var form = doc.querySelector("form[data-inquiry], [data-sq-form]");
    if (form) {
      var slot = doc.createElement("div"); slot.className = "sq-form-slot"; slot.id = "sq-form-slot";
      if (form.tagName === "FORM") form.replaceWith(slot);
      else { form.innerHTML = ""; form.appendChild(slot); } // a form spot keeps its panel; only what's inside is swapped
    }
    while (doc.body.firstChild) frag.appendChild(document.adoptNode(doc.body.firstChild));
    root.innerHTML = "";   // (replaces the plain copy of the page that came with the pasted code)
    root.appendChild(frag);
    d.classList.remove("drx-booting");

    var sqForm = document.querySelector(".sqs-block-form"), slotEl = document.getElementById("sq-form-slot");
    if (sqForm && slotEl) { var holder = sqForm.closest(".fe-block"); slotEl.appendChild(sqForm); if (holder) holder.style.display = "none"; dressForm(slotEl); }

    // The site's scripts, in order (animations, menus, lightbox, page transitions).
    // async = false keeps them running in order while they download (or come from the preload) in parallel.
    return Promise.all(SCRIPTS.map(function (s) { return load(HOST + s + "?" + ver(s)); }));
  }).then(function () {
    // Re-measure scroll effects once photos have loaded (the window "load" event has already passed).
    var refresh = function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
    root.querySelectorAll("img").forEach(function (img) { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
    setTimeout(refresh, 1200);
  }).catch(function () {
    d.classList.remove("is-loading", "is-entering");
    // The plain copy of the page in the pasted code stays readable; otherwise say what happened.
    d.classList.remove("drx-booting");
    if (!root.querySelector(".drx-seo")) root.innerHTML = '<div class="drx-loading">This page could not be loaded. Please refresh.</div>';
  });
})();
