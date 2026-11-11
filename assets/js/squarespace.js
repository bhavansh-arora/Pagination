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
  var COVER_SIZES = "(min-width: 980px) 880px, 100vw";
  function sqImg(u, w) { return u ? u.split("?")[0] + "?format=" + (w || 1500) + "w" : ""; }
  function coverSet(u) { return [750, 1000, 1500, 2000].map(function (w) { return sqImg(u, w) + " " + w + "w"; }).join(", "); }
  // A post's featured image, from the article data Squarespace puts on the page.
  // (Only the post's own image: without one, Squarespace names the site's logo or share image there instead.)
  // (Squarespace's post data names it by an address that can be resized; the page itself only by one that can't,
  // which sends the full-size original. The page's own is the fallback.)
  function postCover(data) {
    var own = data && data.item && data.item.assetUrl;
    if (own && !/\/\d+\/?(\?|$)/.test(own)) return String(own).split("?")[0];
    if (data && data.item) return "";
    var u = "", art = document.querySelector("article.h-entry, .blog-item-wrapper article");
    var id = art && (art.id || "").replace(/^article-/, "");
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (sc) {
      try { var j = JSON.parse(sc.textContent); if (/Article|BlogPosting/.test(j["@type"]) && j.image) u = typeof j.image === "object" ? (j.image.url || j.image[0]) : j.image; } catch (e) {}
    });
    u = u ? String(u).replace(/^\/\//, "https://").replace(/^http:/, "https:") : "";
    if (u && id && u.indexOf(id) < 0) u = "";
    // An image address with no file name is an upload that didn't finish: no cover rather than a broken one.
    if (u && /\/\d+\/?(\?|$)/.test(u)) u = "";
    return u;
  }
  // Squarespace's own Blog (the blog page and every post): one code in the Blog page's settings, no Code Block.
  // The site's design is shown in place of Squarespace's, filled with the posts Squarespace serves on the page.
  var BLOG = me && me.getAttribute("data-page") === "@blog";
  // Inside Squarespace's editor (the site shown in a frame), the blog stays Squarespace's own, so posts can be managed.
  var inFrame = false; try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  if (BLOG && inFrame) { document.documentElement.classList.remove("drx-blog", "drx-booting", "is-entering"); return; }
  // Squarespace's own version of the blog stays hidden by a style of its own (not only by the page's class list,
  // which other scripts on the page can rewrite), and comes back only if the design can't be loaded.
  var hideSq = null;
  if (BLOG) {
    hideSq = document.createElement("style");
    hideSq.textContent = "#siteWrapper{display:none!important}html,body{background:#14100d!important}";
    document.head.appendChild(hideSq);
    // (If the design hasn't appeared after 15 seconds, Squarespace's own version shows rather than nothing.)
    setTimeout(function () {
      if (root && root.querySelector("header, .site-header")) return;
      hideSq.remove(); if (root) root.remove(); unpark();
      document.documentElement.classList.remove("drx-blog", "drx-booting", "is-entering", "is-loading");
    }, 15000);
  }
  // Squarespace's hidden blog doesn't download its photos (its own script would fetch every one at full size).
  // A post's own photos are left alone: they're moved into the design. Put back if Squarespace's version shows.
  var parked = [];
  if (BLOG && window.MutationObserver) {
    var park = function (img) {
      if (!img.closest("#siteWrapper") || img.closest(".blog-item-content")) return;
      ["data-src", "data-image"].forEach(function (a) { if (img.hasAttribute(a)) { img.setAttribute(a + "-drx", img.getAttribute(a)); img.removeAttribute(a); } });
      parked.push(img);
    };
    var parkAll = function (n) {
      if (n.nodeType !== 1) return;
      if (n.tagName === "IMG" && (n.hasAttribute("data-src") || n.hasAttribute("data-image"))) park(n);
      else if (n.querySelectorAll) n.querySelectorAll("img[data-src], img[data-image]").forEach(park);
    };
    parkAll(document.documentElement);
    var parker = new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(parkAll); }); });
    parker.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", function () { setTimeout(function () { parker.disconnect(); }, 3000); });
  }
  function unpark() {
    parked.forEach(function (img) {
      ["data-src", "data-image"].forEach(function (a) { var v = img.getAttribute(a + "-drx"); if (v) img.setAttribute(a, v); });
      try { if (window.ImageLoader) window.ImageLoader.load(img, { load: true }); } catch (e) {}
    });
  }
  // The code can run at the top of the page, before Squarespace's page has arrived: the design goes in once it has.
  var domReady = new Promise(function (ok) {
    if (document.readyState !== "loading") ok(); else document.addEventListener("DOMContentLoaded", function () { ok(); }, { once: true });
  });
  if (BLOG && !root) {
    root = document.createElement("div"); root.id = "drx-live"; root.className = "drx-blog-root";
  }
  function placeRoot() { if (!root.parentNode) document.body.insertBefore(root, document.body.firstChild); }
  if (!root || root.getAttribute("data-ready")) return;
  root.setAttribute("data-ready", "1");
  var HOST = new URL("../../", me.src).href; // site root
  var PAGE = BLOG ? "@blog" : root.getAttribute("data-page") || "index.html";
  // Blog: a post (Squarespace's post page) uses the site's post design; the blog page uses the site's blog page.
  // (Before Squarespace's page has arrived, its address says which: /blog/<post> is a post. Checked again once it has.)
  function sqIsPost() { return !!document.querySelector(".blog-item-wrapper, article.h-entry"); }
  function urlIsPost() { var s = location.pathname.split("/").filter(Boolean); return s.length >= 2 && !/^(category|tag)$/i.test(s[1]); }
  var SQ_POST = BLOG && (document.readyState === "loading" ? urlIsPost() : sqIsPost());
  var sqJson = null, sqData = null;
  function blogList() {
    return fetch(location.pathname + (location.search ? location.search + "&" : "?") + "format=json", { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  if (BLOG) {
    PAGE = SQ_POST ? "post.html" : "blog.html";
    // The page's Squarespace data (the posts for the blog page; a post's own details for a post), alongside the design.
    sqJson = blogList();
  }
  // The old /post page (from before the blog moved to Squarespace's own Blog): its visitors go to the Blog.
  if (PAGE === "@post") { location.replace("/blog"); return; }
  // Links between pages go to the matching Squarespace page: "about.html" → "/about". Pages added later in the
  // editor follow the same rule, so a new page only needs a Squarespace page with that URL. Exceptions:
  var SLUGS = { "index.html": "/", "404.html": "/error-404" };
  // Pages and the editor's global styles: fresh within a minute of publishing.
  var V = "v=" + Math.floor(Date.now() / 60000);
  // The site's own styles and scripts: versioned by content (tools/version_assets.py fills this in), so
  // browsers keep them between visits and only download a file again after it changes.
  var HASH = {"assets/css/styles.css":"725735bc","assets/js/main.js":"263f2cec","assets/js/motion.js":"145fd986","assets/vendor/gsap.min.js":"2d26f4c0","assets/vendor/ScrollTrigger.min.js":"489bcf6d","assets/vendor/lenis.min.js":"3ae98b55","assets/css/squarespace.css":"191f4619"};
  function ver(p) { return HASH[p] ? "v=" + HASH[p] : V; }
  var d = document.documentElement;
  // The intro screen is for the first page of a visit only. (The pasted codes start it on every page load, so after
  // the first page it gives way to the short page-change curtain instead.)
  try {
    if (d.classList.contains("is-loading") && sessionStorage.getItem("dr-seen")) { d.classList.remove("is-loading"); d.classList.add("is-entering"); }
  } catch (e) {}

  // Snippets pasted before this fix hid the intro screen outright: show it while the page loads.
  var fix = document.createElement("style");
  fix.textContent = "@media (prefers-reduced-motion: no-preference){.is-loading .preloader,.is-loaded .preloader{display:grid!important}.curtain{display:grid!important}}";
  document.head.appendChild(fix);

  // Same start-up as the site's own pages: entry animation after a page transition, loader on a first visit.
  // (The pasted snippet normally does this itself, before the first frame is painted.)
  if (!window.__drBooted) try {
    if (sessionStorage.getItem("dr-nav")) { d.classList.add("is-entering"); sessionStorage.removeItem("dr-nav"); }
    else if (!sessionStorage.getItem("dr-seen") && !matchMedia("(prefers-reduced-motion: reduce)").matches) d.classList.add("is-loading");
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
  function metaOf(it) { return [(it.categories || [])[0], niceDate(it.publishOn || it.addedOn)].filter(Boolean).join(" · "); }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function fillBlog(c, data) {
    if (SQ_POST) return fillPost(c, data);
    var grid = c.querySelector("[data-blog-list]");
    if (!grid) return;
    var items = (data && data.items) || [];
    // (An image address with no file name is an upload that didn't finish: the card goes without a photo.)
    items.forEach(function (it) { if (it.assetUrl && /\/\d+\/?(\?|$)/.test(it.assetUrl)) it.assetUrl = ""; });
    grid.innerHTML = items.length ? items.map(function (it) {
      var img = !it.assetUrl ? "" : '<img src="' + esc(sqImg(it.assetUrl, 1000)) + '" srcset="' + esc(sqImg(it.assetUrl, 750)) + ' 750w, ' + esc(sqImg(it.assetUrl, 1500)) + ' 1500w" sizes="(min-width: 700px) 50vw, 100vw" data-fallback="' + esc(sqImg(it.assetUrl, 1000)) + '" alt="' + esc(it.title) + '" loading="lazy">';
      var ex = textOf(it.excerpt), words = textOf(it.body).split(" ");
      if (!ex) ex = words.slice(0, 32).join(" ") + (words.length > 32 ? "…" : "");
      return '<a class="blog-card reveal" href="' + esc(it.fullUrl) + '">' +
        '<div class="blog-card__img">' + img + "</div>" +
        '<div class="blog-card__body"><span class="label">' + esc(metaOf(it)) + '</span><h2 class="blog-card__title">' + esc(it.title) + "</h2>" +
        "<p>" + esc(ex) + '</p><span class="link">Read the post ' + ARROW + "</span></div></a>";
    }).join("") : '<p class="body">New stories are on the way. Check back soon.</p>';
    // Squarespace shows a set number of posts per page: links to the older and newer ones.
    var pg = data && data.pagination, more = [];
    if (pg && pg.prevPage && pg.prevPageUrl) more.push('<a class="btn btn--ghost" href="' + esc(pg.prevPageUrl) + '">← Newer posts</a>');
    if (pg && pg.nextPage && pg.nextPageUrl) more.push('<a class="btn btn--ghost" href="' + esc(pg.nextPageUrl) + '">Older posts →</a>');
    if (more.length) { var nav = c.createElement ? c.createElement("div") : document.createElement("div"); nav.className = "blog-more"; nav.innerHTML = more.join(""); grid.parentNode.insertBefore(nav, grid.nextSibling); }
  }
  // A post: everything comes from Squarespace's own post page (its article data and text), so nothing extra is fetched.
  function fillPost(c, data) {
    var art = document.querySelector("article.h-entry, .blog-item-wrapper article"), ld = {};
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (sc) {
      try { var j = JSON.parse(sc.textContent); if (/Article|BlogPosting/.test(j["@type"])) ld = j; } catch (e) {}
    });
    var title = String(((art && art.querySelector(".entry-title")) || {}).textContent || ld.headline || document.title).trim();
    var set = function (sel, fn) { var el = c.querySelector(sel); if (el) fn(el); };
    // (One inner line, like the site's other big titles, so its letters can rise as the page opens.)
    set("[data-post-title]", function (el) { el.innerHTML = "<span>" + esc(title) + "</span>"; el.setAttribute("aria-label", title); });
    set("[data-post-meta]", function (el) {
      var t = art && art.querySelector("time[datetime]"), when = t ? t.getAttribute("datetime") : (ld.datePublished || "");
      var date = when ? niceDate(new Date(when.length <= 10 ? when + "T12:00:00" : when)) : "";
      var cat = ((art && art.className.match(/\bcategory-([\w-]+)/)) || [])[1];
      cat = cat ? cat.replace(/-/g, " ").replace(/\b\w/g, function (x) { return x.toUpperCase(); }) : "";
      el.textContent = [cat, date].filter(Boolean).join(" · ");
    });
    set("[data-post-excerpt]", function (el) {
      var m = document.querySelector('meta[name="description"]'), ex = m ? m.getAttribute("content") : "";
      if (ex && ex.trim()) el.textContent = ex.trim(); else el.remove();
    });
    set("[data-post-cover]", function (el) {
      var u = postCover(data);
      if (!u) { el.remove(); c.querySelectorAll(".post-section").forEach(function (sec) { sec.classList.add("post-section--nocover"); }); return; }
      var img = el.querySelector("img"), media = el.querySelector(".media");
      img.setAttribute("src", sqImg(u, 1500)); img.setAttribute("srcset", coverSet(u)); img.setAttribute("sizes", COVER_SIZES);
      img.setAttribute("alt", title); img.removeAttribute("style"); img.setAttribute("fetchpriority", "high");
      img.setAttribute("data-fallback", sqImg(u, 1000));
      // A soft preview on its frame while it loads; the photo fades in over it. The frame isn't given the site's slow
      // zoom-on-scroll (so the photo lands exactly where its preview is, nothing shifts).
      if (media) { media.classList.remove("media"); media.classList.add("post-cover__media"); media.style.backgroundImage = "url(" + sqImg(u, 100) + ")"; }
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
        if (u && (!img.getAttribute("src") || /^data:/.test(img.getAttribute("src")))) img.setAttribute("src", sqImg(u, 1500));
        img.removeAttribute("style"); img.setAttribute("loading", "lazy"); img.setAttribute("decoding", "async");
        if (!img.getAttribute("alt")) img.setAttribute("alt", "");
      });
      el.querySelectorAll("noscript").forEach(function (n) { n.remove(); });
      var words = (el.textContent.match(/\S+/g) || []).length;
      set("[data-post-minutes]", function (m) { m.textContent = Math.max(1, Math.round(words / 220)) + " min read"; });
    });
    // Previous and next posts (Squarespace's own links on the page).
    set("[data-post-nav]", function (el) {
      var links = [];
      [["prev", "Previous post", ""], ["next", "Next post", " post-nav__link--next"]].forEach(function (k) {
        var a = document.querySelector(".item-pagination-link--" + k[0]);
        if (!a) return;
        var t = (a.querySelector(".item-pagination-title") || a).textContent.trim();
        links.push('<a class="post-nav__link' + k[2] + '" href="' + esc(a.getAttribute("href")) + '"><span class="label">' + k[1] + '</span><span class="post-nav__title">' + esc(t) + "</span></a>");
      });
      if (links.length) { el.innerHTML = links.join(""); el.removeAttribute("hidden"); }
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
  if (sqJson) html = Promise.all([html, sqJson]).then(function (r) { sqData = r[1]; return r[0]; });
  var tmpl = html;
  // (The blog page too waits for Squarespace's page: its photos, already downloading there, are reused for the cards.)
  if (BLOG) html = domReady.then(function () {
    placeRoot();
    if (!SQ_POST) return tmpl;
    // A post: Squarespace's post is now on the page. (If the address guessed wrong, the blog page's design instead.)
    if (!sqIsPost()) { SQ_POST = false; PAGE = "blog.html"; return Promise.all([fetch(HOST + PAGE + "?" + V, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }), tmpl]).then(function (r) { return r[0]; }); }
    return tmpl;
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
    if (BLOG) fillBlog(doc, sqData);
    while (doc.body.firstChild) frag.appendChild(document.adoptNode(doc.body.firstChild));
    root.innerHTML = "";   // (replaces the plain copy of the page that came with the pasted code)
    root.appendChild(frag);
    d.classList.remove("drx-booting");

    if (BLOG) {
      // The cover fades in over its soft preview once it has loaded; the preview then goes (so a transparent image
      // never shows it through). A photo that fails, or hasn't arrived after 8 seconds, is asked for once more.
      root.querySelectorAll(".post-cover img").forEach(function (img) {
        var frame = img.parentNode, retried = false;
        var done = function () { clearTimeout(slow); img.classList.add("is-loaded"); setTimeout(function () { if (frame) frame.style.backgroundImage = "none"; }, 850); };
        var retry = function () {
          if (retried) return done(); retried = true;
          img.removeAttribute("srcset"); img.setAttribute("src", img.getAttribute("data-fallback") + "&r=" + Date.now());
        };
        var slow = setTimeout(function () { if (!(img.complete && img.naturalWidth)) retry(); }, 8000);
        if (img.complete && img.naturalWidth) done();
        img.addEventListener("load", function () { if (img.naturalWidth) done(); });
        img.addEventListener("error", retry);
      });
      // Blog cards: a photo that fails is asked for once more, then the card shows without a photo (never a broken box).
      root.querySelectorAll(".blog-card__img img").forEach(function (img) {
        img.addEventListener("error", function () {
          if (!img.getAttribute("data-retried")) { img.setAttribute("data-retried", "1"); img.removeAttribute("srcset"); img.setAttribute("src", img.getAttribute("data-fallback") + "&r=" + Date.now()); }
          else img.remove();
        });
      });
      return Promise.all(SCRIPTS.map(function (s) { return load(HOST + s + "?" + ver(s)); }));
    }

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
    if (BLOG) { d.classList.remove("drx-blog", "drx-booting"); root.remove(); if (hideSq) hideSq.remove(); unpark(); return; }
    // The plain copy of the page in the pasted code stays readable; otherwise say what happened.
    d.classList.remove("drx-booting");
    if (!root.querySelector(".drx-seo")) root.innerHTML = '<div class="drx-loading">This page could not be loaded. Please refresh.</div>';
  });
})();
