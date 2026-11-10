/* Shows this site inside Squarespace pages, live.
   Each Squarespace page has one Code Block with:
     <div id="drx-live" data-page="about.html"></div>
     <script src="https://danreynoldsphotography.codebunny.net/assets/js/squarespace.js"></script>
   This script fetches the latest published version of that page (as saved by the site editor) and
   shows it, with the site's styles, scripts, animations and page transitions. Publishing in the
   editor updates Squarespace automatically: nothing to re-paste. */
(function () {
  "use strict";
  var me = document.currentScript, root = document.getElementById("drx-live");
  // Squarespace's own Blog (the blog page and every post): one code in the Blog page's settings, no Code Block.
  // The site's design is shown in place of Squarespace's, filled with the posts Squarespace serves on the page.
  var BLOG = me && me.getAttribute("data-page") === "@blog";
  // Inside Squarespace's editor (the site shown in a frame), the blog stays Squarespace's own, so posts can be managed.
  var inFrame = false; try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  if (BLOG && inFrame) { document.documentElement.classList.remove("drx-blog", "drx-booting", "is-entering"); return; }
  if (BLOG && !root) {
    root = document.createElement("div"); root.id = "drx-live"; root.className = "drx-blog-root";
    document.body.insertBefore(root, document.body.firstChild);
  }
  if (!root || root.getAttribute("data-ready")) return;
  root.setAttribute("data-ready", "1");
  var HOST = new URL("../../", me.src).href; // site root
  var PAGE = BLOG ? "@blog" : root.getAttribute("data-page") || "index.html";
  // Blog: a post (Squarespace's post page) uses the site's post design; the blog page uses the site's blog page.
  var SQ_POST = BLOG && document.querySelector(".blog-item-wrapper, article.h-entry");
  var sqJson = null;
  if (BLOG) {
    PAGE = SQ_POST ? "post.html" : "blog.html";
    sqJson = fetch(location.pathname + (location.search ? location.search + "&" : "?") + "format=json", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  // One Squarespace page (/post) shows every blog post: /post?p=<post> loads blog-<post>.html.
  if (PAGE === "@post") {
    var post = (new URLSearchParams(location.search).get("p") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
    PAGE = post ? "blog-" + post + ".html" : "blog.html";
  }
  // Links between pages go to the matching Squarespace page: "about.html" → "/about". Pages added later in the
  // editor follow the same rule, so a new page only needs a Squarespace page with that URL. Exceptions:
  var SLUGS = { "index.html": "/", "404.html": "/error-404" };
  // Pages and the editor's global styles: fresh within a minute of publishing.
  var V = "v=" + Math.floor(Date.now() / 60000);
  // The site's own styles and scripts: versioned by content (tools/version_assets.py fills this in), so
  // browsers keep them between visits and only download a file again after it changes.
  var HASH = {"assets/css/styles.css":"4d907a2e","assets/js/main.js":"263f2cec","assets/js/motion.js":"145fd986","assets/vendor/gsap.min.js":"2d26f4c0","assets/vendor/ScrollTrigger.min.js":"489bcf6d","assets/vendor/lenis.min.js":"3ae98b55","assets/css/squarespace.css":"05ede5e2"};
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

  /* ---------- Squarespace Blog in the site's design ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function niceDate(ms) { var t = new Date(ms); return isNaN(t) ? "" : t.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
  function textOf(html) {
    var x = document.createElement("div"); x.innerHTML = html || "";
    x.querySelectorAll("style, script, noscript, figcaption, .image-caption-wrapper").forEach(function (n) { n.remove(); });
    return (x.textContent || "").replace(/\s+/g, " ").trim();
  }
  function sqImg(u, w) { return u ? u.split("?")[0] + "?format=" + (w || 1500) + "w" : ""; }
  function metaOf(it) { return [(it.categories || [])[0], niceDate(it.publishOn || it.addedOn)].filter(Boolean).join(" · "); }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function fillBlog(data) {
    if (SQ_POST) return fillPost(data && data.item ? data : null);
    var grid = root.querySelector("[data-blog-list]");
    if (!grid) return;
    var items = (data && data.items) || [];
    grid.innerHTML = items.length ? items.map(function (it) {
      var ex = textOf(it.excerpt), words = textOf(it.body).split(" ");
      if (!ex) ex = words.slice(0, 32).join(" ") + (words.length > 32 ? "…" : "");
      return '<a class="blog-card reveal" href="' + esc(it.fullUrl) + '">' +
        '<div class="blog-card__img">' + (it.assetUrl ? '<img src="' + esc(sqImg(it.assetUrl, 1000)) + '" srcset="' + esc(sqImg(it.assetUrl, 750)) + ' 750w, ' + esc(sqImg(it.assetUrl, 1500)) + ' 1500w" sizes="(min-width: 700px) 50vw, 100vw" alt="' + esc(it.title) + '" loading="lazy" decoding="async">' : "") + "</div>" +
        '<div class="blog-card__body"><span class="label">' + esc(metaOf(it)) + '</span><h2 class="blog-card__title">' + esc(it.title) + "</h2>" +
        "<p>" + esc(ex) + '</p><span class="link">Read the post ' + ARROW + "</span></div></a>";
    }).join("") : '<p class="body">New stories are on the way. Check back soon.</p>';
    // Squarespace shows a set number of posts per page: links to the older and newer ones.
    var pg = data && data.pagination, more = [];
    if (pg && pg.prevPage && pg.prevPageUrl) more.push('<a class="btn btn--ghost" href="' + esc(pg.prevPageUrl) + '">← Newer posts</a>');
    if (pg && pg.nextPage && pg.nextPageUrl) more.push('<a class="btn btn--ghost" href="' + esc(pg.nextPageUrl) + '">Older posts →</a>');
    if (more.length) { var nav = document.createElement("div"); nav.className = "blog-more"; nav.innerHTML = more.join(""); grid.parentNode.insertBefore(nav, grid.nextSibling); }
  }
  function fillPost(data) {
    var it = (data && data.item) || {}, art = document.querySelector("article.h-entry, .blog-item-wrapper article");
    var title = it.title || ((art && art.querySelector(".entry-title")) || {}).textContent || document.title;
    var set = function (sel, fn) { var el = root.querySelector(sel); if (el) fn(el); };
    set("[data-post-title]", function (el) { el.textContent = String(title).trim(); });
    set("[data-post-meta]", function (el) { var m = metaOf(it); if (!m) { var t = art && art.querySelector("time[datetime]"); m = t ? niceDate(new Date(t.getAttribute("datetime") + "T12:00:00")) : ""; } el.textContent = m; });
    set("[data-post-excerpt]", function (el) { var ex = textOf(it.excerpt); if (ex) el.textContent = ex; else el.remove(); });
    set("[data-post-cover]", function (el) {
      if (!it.assetUrl) { el.remove(); return; }
      var img = el.querySelector("img");
      img.src = sqImg(it.assetUrl, 2500); img.srcset = sqImg(it.assetUrl, 1000) + " 1000w, " + sqImg(it.assetUrl, 1500) + " 1500w, " + sqImg(it.assetUrl, 2500) + " 2500w";
      img.sizes = "100vw"; img.alt = String(title).trim(); img.removeAttribute("style");
      if (it.mediaFocalPoint) img.style.objectPosition = Math.round(it.mediaFocalPoint.x * 100) + "% " + Math.round(it.mediaFocalPoint.y * 100) + "%";
    });
    // The post's text: Squarespace's own (served with the page, so search engines read it), moved into the design.
    var src = art && art.querySelector(".blog-item-content");
    set("[data-post-body]", function (el) {
      if (!src) return;
      el.innerHTML = "";
      while (src.firstChild) el.appendChild(src.firstChild);
      el.classList.add("post-body--sq");
      // Photos in the post: Squarespace sets their address only through its own scripts; set it here.
      el.querySelectorAll("img").forEach(function (img) {
        var u = img.getAttribute("data-src") || img.getAttribute("data-image");
        if (u && (!img.getAttribute("src") || /^data:/.test(img.getAttribute("src")))) img.src = sqImg(u, 1500);
        img.removeAttribute("style"); img.loading = "lazy"; img.decoding = "async";
        if (!img.getAttribute("alt")) img.setAttribute("alt", "");
      });
      el.querySelectorAll("noscript").forEach(function (n) { n.remove(); });
      var words = (el.textContent.match(/\S+/g) || []).length;
      set("[data-post-minutes]", function (m) { m.textContent = Math.max(1, Math.round(words / 220)) + " min read"; });
    });
    // Previous and next posts.
    var pg = data && data.pagination;
    set("[data-post-nav]", function (el) {
      var links = [];
      if (pg && pg.prevItem) links.push('<a class="post-nav__link" href="' + esc(pg.prevItem.fullUrl) + '"><span class="label">Previous post</span><span class="post-nav__title">' + esc(pg.prevItem.title) + "</span></a>");
      if (pg && pg.nextItem) links.push('<a class="post-nav__link post-nav__link--next" href="' + esc(pg.nextItem.fullUrl) + '"><span class="label">Next post</span><span class="post-nav__title">' + esc(pg.nextItem.title) + "</span></a>");
      if (links.length) { el.innerHTML = links.join(""); el.hidden = false; }
    });
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
    // (Not on the blog: there Squarespace's own, set for each post, stay.)
    if (!BLOG) {
      if (doc.title) document.title = doc.title;
      var desc = doc.querySelector('meta[name="description"]');
      if (desc) {
        var mine = document.querySelector('meta[name="description"]') || document.head.appendChild(document.createElement("meta"));
        mine.setAttribute("name", "description"); mine.setAttribute("content", desc.getAttribute("content"));
      }
      // (Skipped when the pasted code already carries the same structured data, so it isn't there twice.)
      var haveLd = Array.prototype.map.call(document.querySelectorAll('script[type="application/ld+json"]'), function (s) { return s.textContent.trim(); });
      doc.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { if (haveLd.indexOf(s.textContent.trim()) < 0) document.head.appendChild(s.cloneNode(true)); });
    }

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
    // A page with no Form block keeps what the site shows in that spot (for example a card that links to Contact).
    var form = doc.querySelector("form[data-inquiry], [data-sq-form]");
    if (form && document.querySelector(".sqs-block-form")) {
      var slot = doc.createElement("div"); slot.className = "sq-form-slot"; slot.id = "sq-form-slot";
      if (form.tagName === "FORM") form.replaceWith(slot);
      else { form.innerHTML = ""; form.appendChild(slot); } // a form spot keeps its panel; only what's inside is swapped
    }
    while (doc.body.firstChild) frag.appendChild(document.adoptNode(doc.body.firstChild));
    root.innerHTML = "";   // (replaces the plain copy of the page that came with the pasted code)
    root.appendChild(frag);
    d.classList.remove("drx-booting");

    if (BLOG) return sqJson.then(fillBlog).then(function () {
      return Promise.all(SCRIPTS.map(function (s) { return load(HOST + s + "?" + ver(s)); }));
    });

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
    if (BLOG) { d.classList.remove("drx-blog", "drx-booting"); root.remove(); return; }
    // The plain copy of the page in the pasted code stays readable; otherwise say what happened.
    d.classList.remove("drx-booting");
    if (!root.querySelector(".drx-seo")) root.innerHTML = '<div class="drx-loading">This page could not be loaded. Please refresh.</div>';
  });
})();
