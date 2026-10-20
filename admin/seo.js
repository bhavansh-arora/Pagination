/* SEO for the site editor: per-page Google title/description with a live preview, social share
   image, canonical URL, indexing and structured data; alt text for every image; a scored checklist;
   and site-wide settings (favicon, site name, social handle, theme colour, Search Console, Analytics). */
(function () {
  "use strict";
  var E = window.__siteEditor;
  if (!E) return;
  var editor = E.editor, state = E.state, SITE = E.SITE, C = E.config || {};
  var BRAND = C.brandDir || "assets/brand/", SITE_NAME = C.siteName || C.name || "";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var tab = "page";

  function origin() {
    try { return new URL(state.meta && state.meta.canonical || "").origin; } catch (e) { return C.origin || SITE.replace(/\/$/, ""); }
  }
  // Production URLs (canonical domain) shown through whatever domain the editor runs on.
  function viewable(url) { return url && url.indexOf(origin()) === 0 ? SITE + url.slice(origin().length + 1) : url; }
  function isPage() { return state.target && state.target.charAt(0) !== "@"; }

  /* ------------------------------ Image helpers ------------------------------ */
  function srcName(src) {
    if (!src) return "";
    if (/i\.ytimg\.com\/vi\//.test(src)) return "YouTube thumbnail";
    if (/^data:/.test(src)) {
      var a = editor.AssetManager.getAll().find(function (x) { return x.get("src") === src; });
      return a ? String(a.get("name") || "").replace(/\.[a-z0-9]+$/i, "") : "new-photo";
    }
    return decodeURIComponent(src.split("?")[0].split("/").pop()).replace(/-(480|800|1600)\.webp$/, "").replace(/\.[a-z0-9]+$/i, "");
  }
  function humanize(name) {
    var words = name.split(/[-_\s]+/).filter(function (w) { return w && !/^\d+$/.test(w) && !/^(img|dsc|photo|image|final|edit)$/i.test(w); });
    if (!words.length) return C.altDefault || "Photo";
    var cap = words.map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
    if (C.altText) { var custom = C.altText(cap, name); if (custom) return custom; }
    return cap.join(" ") + (C.altSuffix || "");
  }
  function suggestAlt(p) {
    var el = p.comp.getEl(), yt = el && el.closest && el.closest(".yt");
    if (yt) return String(yt.getAttribute("aria-label") || "").replace(/^Play film:\s*/, "") + (C.videoAltSuffix || " (video thumbnail)");
    return humanize(srcName(p.src));
  }
  function allImages() {
    var out = [];
    (function walk(c) {
      var tag = c.get("tagName"), type = c.get("type");
      if (type === "image" || tag === "img") out.push({ comp: c, kind: "img", src: c.get("src") || c.getAttributes().src || "" });
      else if (E.photoOf(c) && E.photoOf(c).kind === "bg") out.push({ comp: c, kind: "bg", src: E.photoOf(c).src });
      c.components().forEach(walk);
    })(editor.getWrapper());
    return out;
  }
  function altState(p) {
    var a = p.comp.getAttributes();
    // Background photos are decorative to browsers and Google unless given a label, so they're optional.
    if (p.kind === "bg") return a["aria-label"] ? "ok" : "decorative";
    if (!("alt" in a) || a.alt == null) return "missing";
    if (String(a.alt).trim() === "") return a.role === "presentation" ? "decorative" : "missing";
    return "ok";
  }
  function setAlt(p, text) {
    if (p.kind === "bg") {
      if (text) p.comp.addAttributes({ role: "img", "aria-label": text }); else p.comp.removeAttributes(["role", "aria-label"]);
    } else {
      p.comp.removeAttributes(["role"]);
      p.comp.addAttributes({ alt: text });
    }
  }
  function setDecorative(p, on) {
    if (p.kind === "bg") {
      if (on) p.comp.removeAttributes(["role", "aria-label"]);
    } else if (on) p.comp.addAttributes({ alt: "", role: "presentation" });
    else p.comp.removeAttributes(["role"]);
  }
  function changed() { editor.trigger("update"); queueScore(); }

  /* ------------------------------ Checks & score ------------------------------ */
  function checks() {
    var m = state.meta || {}, doc = editor.Canvas.getDocument(), list = [];
    var add = function (id, w, status, title, detail, fix) { list.push({ id: id, w: w, status: status, title: title, detail: detail, fix: fix }); };
    if (isPage()) {
      var tl = (m.title || "").length, dl = (m.desc || "").length;
      add("title", 15, !tl ? "fail" : tl < 30 || tl > 60 ? "warn" : "pass", "Page title", tl ? tl + " characters (best: 30–60, so Google shows it in full)" : "Missing", "page");
      add("desc", 15, !dl ? "fail" : dl < 70 || dl > 160 ? "warn" : "pass", "Meta description", dl ? dl + " characters (best: 70–160)" : "Missing: Google will pick random text from the page", "page");
    }
    var hs = doc ? Array.prototype.slice.call(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")) : [];
    var h1 = hs.filter(function (x) { return x.tagName === "H1"; }).length;
    if (isPage()) add("h1", 10, h1 === 1 ? "pass" : h1 ? "warn" : "fail", "One main heading (H1)", h1 === 1 ? "Found" : h1 ? h1 + " H1s: keep one, make the rest H2" : "None: make the page's main title an H1 (Content → Text → HTML tag)");
    var jumps = 0, prev = 0;
    hs.forEach(function (x) { var l = +x.tagName.charAt(1); if (prev && l > prev + 1) jumps++; prev = l; });
    add("order", 5, jumps ? "warn" : "pass", "Heading order", jumps ? jumps + " skipped level(s), e.g. H2 straight to H4" : "Headings go in order");
    var imgs = allImages(), missing = imgs.filter(function (p) { return altState(p) === "missing"; }).length;
    add("alt", 20, missing ? "fail" : "pass", "Alt text on images", missing ? missing + " of " + imgs.length + " images have no alt text" : "All " + imgs.length + " images described", "images");
    if (isPage()) {
      add("og", 5, m.ogImage ? "pass" : "warn", "Social share image", m.ogImage ? "Set" : "Not set: links shared on Facebook, iMessage etc. show no photo", "page");
      add("index", 10, state.target === "404.html" ? "pass" : m.noindex ? "warn" : "pass", "Visible to Google", m.noindex ? "Hidden (noindex): this page won't appear in search" : "Indexable and in the sitemap", "page");
      add("canonical", 5, m.canonical ? "pass" : "warn", "Canonical URL", m.canonical || "Missing", "page");
    }
    var words = doc && doc.body ? (doc.body.innerText || "").split(/\s+/).filter(Boolean).length : 0;
    if (isPage() && state.target !== "404.html") add("words", 5, words >= 300 ? "pass" : words >= 150 ? "warn" : "fail", "Amount of text", words + " words (aim for 300+ so Google understands the page)");
    var emptyLinks = doc ? Array.prototype.filter.call(doc.querySelectorAll("a"), function (a) {
      return !(a.textContent.trim() || a.getAttribute("aria-label") || Array.prototype.some.call(a.querySelectorAll("img"), function (i) { return i.alt; }));
    }).length : 0;
    add("links", 5, emptyLinks ? "warn" : "pass", "Link text", emptyLinks ? emptyLinks + " link(s) with no text or label" : "Every link has readable text");
    if (isPage()) add("schema", 5, (m.jsonld || []).length ? "pass" : "warn", "Structured data", (m.jsonld || []).length ? (m.jsonld.length + " block(s): helps Google show rich results") : "None on this page (optional)", "page");
    return list;
  }
  function score(list) {
    var tot = 0, got = 0;
    list.forEach(function (c) { tot += c.w; got += c.w * (c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0); });
    return tot ? Math.round(got / tot * 100) : 100;
  }
  function paintScore() {
    var s = score(checks()), b = $("#seo-score"), mb = $("#seo-modal-score");
    var cls = s >= 85 ? "is-good" : s >= 60 ? "is-ok" : "is-bad";
    [b, mb].forEach(function (x) { if (!x) return; x.hidden = false; x.textContent = s; x.className = "seo-score " + cls; x.title = "SEO score for this page: " + s + "/100"; });
  }
  var scoreTimer;
  function queueScore() { clearTimeout(scoreTimer); scoreTimer = setTimeout(paintScore, 500); }
  editor.on("update component:add component:remove", queueScore);
  editor.on("load", function () { setTimeout(paintScore, 1500); });
  // Re-score when another page loads.
  var lastTarget = null;
  setInterval(function () { if (state.target !== lastTarget && !state.loading) { lastTarget = state.target; paintScore(); } }, 1000);

  /* ------------------------------ Modal ------------------------------ */
  function open(t) {
    tab = t || tab;
    E.openModal("#m-page");
    render();
  }
  document.querySelectorAll("#seo-tabs [data-seo]").forEach(function (b) {
    b.addEventListener("click", function () { tab = b.getAttribute("data-seo"); render(); });
  });
  function render() {
    document.querySelectorAll("#seo-tabs [data-seo]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-seo") === tab); });
    var body = $("#seo-body");
    body.innerHTML = "";
    ({ page: renderPage, images: renderImages, check: renderCheck, site: renderSite })[tab](body);
    paintScore();
  }

  /* ---------- This page ---------- */
  function counter(n, lo, hi) { return "<span class='seo-count " + (!n ? "is-bad" : n < lo || n > hi ? "is-ok" : "is-good") + "'>" + n + " / " + hi + "</span>"; }
  function renderPage(body) {
    if (!isPage() || !state.meta) { body.innerHTML = "<p class='ed-muted'>Choose a page (not the shared header or footer) from the dropdown to edit its Google listing.</p>"; return; }
    var m = Object.assign({}, state.meta);
    var slug = state.target === "index.html" ? "" : state.target.replace(/\.html$/, "");
    body.innerHTML =
      "<div class='seo-grid'><div class='seo-col'>" +
      "<label class='seo-f'>Title shown on Google <span id='sc-title'></span><input id='s-title' value='" + esc(m.title) + "'></label>" +
      "<label class='seo-f'>Description shown under it <span id='sc-desc'></span><textarea id='s-desc' rows='3'>" + esc(m.desc) + "</textarea></label>" +
      "<p class='seo-label'>Google preview</p><div class='serp'><div class='serp__site'><img src='" + SITE + BRAND + "favicon-48.png' alt=''><div><b>" + esc(SITE_NAME) + "</b><span id='serp-url'></span></div></div><div class='serp__title' id='serp-title'></div><div class='serp__desc' id='serp-desc'></div></div>" +
      "<label class='seo-f'>Canonical URL (the page's one true address)<input id='s-canon' value='" + esc(m.canonical) + "' placeholder='" + esc(origin() + "/" + slug) + "'></label>" +
      "<label class='ed-check'><input type='checkbox' id='s-noindex'" + (m.noindex ? " checked" : "") + "><span>Hide this page from Google (noindex, removed from the sitemap)</span></label>" +
      "</div><div class='seo-col'>" +
      "<p class='seo-label'>Social share image <span class='ed-muted'>(Facebook, iMessage, WhatsApp, LinkedIn…)</span></p>" +
      "<div class='share-card'><div class='share-card__img' id='share-img'></div><div class='share-card__meta'><small>" + esc(origin().replace(/^https?:\/\//, "").toUpperCase()) + "</small><strong id='share-title'></strong><span id='share-desc'></span></div></div>" +
      "<div class='ed-row'><button class='ed-btn ed-btn--gold' type='button' id='s-ogpick'>Choose photo…</button><span class='ed-muted ed-small'>Cropped to 1200×630 automatically</span></div>" +
      "<label class='seo-f'>Structured data (JSON-LD) <span id='sc-json'></span><textarea id='s-json' rows='9' spellcheck='false' class='ed-codebox' placeholder='{ \"@context\": \"https://schema.org\", \"@type\": \"…\" }'></textarea></label>" +
      "<small class='ed-muted ed-small'>Tells Google facts like your business, reviews or FAQs. Several blocks can be written as a JSON array. Leave empty for none.</small>" +
      "</div></div>" +
      "<div class='ed-actions'><span class='ed-muted ed-small' id='s-msg'></span><button class='ed-btn ed-btn--gold' type='button' id='s-apply'>Apply to page</button></div>";
    var ld = m.jsonld || [];
    $("#s-json").value = ld.length === 0 ? "" : ld.length === 1 ? pretty(ld[0]) : pretty("[" + ld.join(",") + "]");
    function preview() {
      var t = $("#s-title").value, d = $("#s-desc").value, canon = $("#s-canon").value || origin() + "/" + slug;
      $("#sc-title").innerHTML = counter(t.length, 30, 60); $("#sc-desc").innerHTML = counter(d.length, 70, 160);
      $("#serp-title").textContent = t.length > 62 ? t.slice(0, 60) + "…" : t || "(no title)";
      $("#serp-desc").textContent = d.length > 162 ? d.slice(0, 158) + "…" : d || "Google will choose text from the page.";
      $("#serp-url").textContent = canon.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/").join(" › ");
      $("#share-title").textContent = t; $("#share-desc").textContent = d;
      var img = m.ogPreview || viewable(m.ogImage);
      $("#share-img").style.backgroundImage = img ? "url(" + JSON.stringify(img) + ")" : "";
      $("#share-img").textContent = img ? "" : "No share image";
      var j = $("#s-json").value.trim(), ok = true; if (j) { try { JSON.parse(j); } catch (e) { ok = false; } }
      $("#sc-json").innerHTML = j ? (ok ? "<span class='seo-count is-good'>valid ✓</span>" : "<span class='seo-count is-bad'>not valid JSON</span>") : "";
    }
    ["#s-title", "#s-desc", "#s-canon", "#s-json"].forEach(function (s) { $(s).addEventListener("input", preview); });
    preview();
    $("#s-ogpick").addEventListener("click", function () {
      E.pickPhoto(function (src) {
        shareImage(src).then(function (d) {
          var path = "assets/img/og/" + (slug || "home") + "-" + Date.now().toString(36) + ".jpg";
          m.ogUpload = { path: path, base64: d.split(",")[1] }; m.ogImage = origin() + "/" + path; m.ogPreview = d;
          preview(); $("#s-msg").textContent = "New share image ready. Apply, then Publish.";
        }).catch(function (e) { E.toast(e.message, true); });
      });
    });
    $("#s-apply").addEventListener("click", function () {
      var j = $("#s-json").value.trim(), blocks = [];
      if (j) {
        var parsed; try { parsed = JSON.parse(j); } catch (e) { $("#s-msg").textContent = "Structured data isn't valid JSON: " + e.message; return; }
        blocks = (Array.isArray(parsed) ? parsed : [parsed]).map(function (o) { return JSON.stringify(o); });
      }
      var canon = $("#s-canon").value.trim();
      if (canon && !/^https?:\/\//.test(canon)) { $("#s-msg").textContent = "The canonical URL must start with https://"; return; }
      state.meta = Object.assign(m, { title: $("#s-title").value.trim(), desc: $("#s-desc").value.trim(), canonical: canon || m.canonical, noindex: $("#s-noindex").checked, jsonld: blocks });
      state.metaChanged = true; state.dirty = true; E.updateUI(); E.saveDraft(); paintScore();
      $("#s-msg").textContent = "Applied ✓ Click Publish to put it live.";
    });
  }
  function pretty(j) { try { return JSON.stringify(JSON.parse(j), null, 2); } catch (e) { return j; } }
  // 1200×630 JPEG, cropped around the photo's centre: the size every social network expects.
  function shareImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.crossOrigin = "anonymous";
      im.onload = function () {
        var W = 1200, H = 630, c = document.createElement("canvas"); c.width = W; c.height = H;
        var s = Math.max(W / im.width, H / im.height), w = im.width * s, h = im.height * s;
        var g = c.getContext("2d"); g.drawImage(im, (W - w) / 2, (H - h) * 0.35, w, h);
        try { res(c.toDataURL("image/jpeg", 0.86)); } catch (e) { rej(new Error("That image can't be used as a share image (it's hosted elsewhere).")); }
      };
      im.onerror = function () { rej(new Error("Couldn't load that image.")); };
      im.src = src;
    });
  }

  /* ---------- Images & alt text ---------- */
  var onlyMissing = false;
  function renderImages(body) {
    var imgs = allImages(), missing = imgs.filter(function (p) { return altState(p) === "missing"; });
    body.innerHTML = "<div class='seo-imgbar'><p class='ed-muted ed-small'>Alt text describes each photo to Google Images and to people using screen readers. Mark purely decorative images as decorative.</p>" +
      "<label class='ed-check'><input type='checkbox' id='a-only'" + (onlyMissing ? " checked" : "") + "><span>Only show missing (" + missing.length + ")</span></label>" +
      (missing.length ? "<button class='ed-btn ed-btn--gold' type='button' id='a-fill'>Fill " + missing.length + " missing from file names</button>" : "<span class='seo-count is-good'>All images described ✓</span>") + "</div>" +
      "<div class='alt-list' id='a-list'></div>";
    var listEl = $("#a-list");
    var shown = imgs.filter(function (p) { return !onlyMissing || altState(p) === "missing"; });
    if (!shown.length) listEl.innerHTML = "<p class='ed-muted'>" + (imgs.length ? "Nothing missing." : "No images on this page.") + "</p>";
    shown.forEach(function (p) {
      var st = altState(p), a = p.comp.getAttributes();
      var val = p.kind === "bg" ? a["aria-label"] || "" : a.alt || "";
      var row = document.createElement("div");
      row.className = "alt-row is-" + st;
      row.innerHTML = "<div class='alt-row__img'><img alt='' src='" + esc(p.src) + "'></div><div class='alt-row__main'>" +
        "<div class='alt-row__top'><span class='alt-row__name' title='" + esc(srcName(p.src)) + "'>" + esc(srcName(p.src)) + (p.kind === "bg" ? " <em>(background photo)</em>" : "") + "</span>" +
        "<span class='alt-badge'>" + (st === "ok" ? "Described" : st === "decorative" ? (p.kind === "bg" ? "Optional" : "Decorative") : "Missing") + "</span></div>" +
        "<input class='alt-input' placeholder='Describe what is in the photo' value='" + esc(val) + "'" + (st === "decorative" && p.kind !== "bg" ? " disabled" : "") + ">" +
        "<div class='ed-row'><button class='ed-btn' type='button' data-a='suggest'>Suggest</button><label class='ed-check'><input type='checkbox' data-a='deco'" + (st === "decorative" ? " checked" : "") + "><span>Decorative</span></label><button class='ed-btn ed-btn--ghost' type='button' data-a='show'>Show on page</button></div></div>";
      var input = row.querySelector(".alt-input");
      function refreshRow() {
        var s2 = altState(p); row.className = "alt-row is-" + s2;
        row.querySelector(".alt-badge").textContent = s2 === "ok" ? "Described" : s2 === "decorative" ? (p.kind === "bg" ? "Optional" : "Decorative") : "Missing";
        input.disabled = s2 === "decorative" && p.kind !== "bg";
      }
      input.addEventListener("input", function () { setAlt(p, input.value.trim()); refreshRow(); });
      input.addEventListener("change", changed);
      row.querySelector("[data-a=suggest]").addEventListener("click", function () { input.value = suggestAlt(p); setDecorative(p, false); row.querySelector("[data-a=deco]").checked = false; setAlt(p, input.value); refreshRow(); changed(); });
      row.querySelector("[data-a=deco]").addEventListener("change", function (e) { setDecorative(p, e.target.checked); if (e.target.checked) input.value = ""; refreshRow(); changed(); });
      row.querySelector("[data-a=show]").addEventListener("click", function () { E.closeModals(); editor.select(p.comp); try { editor.Canvas.scrollTo(p.comp, { behavior: "smooth", block: "center" }); } catch (e) {} });
      listEl.appendChild(row);
    });
    $("#a-only").addEventListener("change", function (e) { onlyMissing = e.target.checked; render(); });
    var fill = $("#a-fill");
    if (fill) fill.addEventListener("click", function () { missing.forEach(function (p) { setAlt(p, suggestAlt(p)); }); changed(); render(); E.toast("Filled " + missing.length + " alt texts. Check they describe each photo, then Publish."); });
  }

  /* ---------- Checklist ---------- */
  function renderCheck(body) {
    var list = checks(), s = score(list);
    body.innerHTML = "<div class='seo-summary'><div class='seo-dial " + (s >= 85 ? "is-good" : s >= 60 ? "is-ok" : "is-bad") + "'><b>" + s + "</b><span>/ 100</span></div><div><strong>" + esc(E.labelFor(state.target)) + "</strong><p class='ed-muted ed-small'>" +
      (s >= 85 ? "Great: this page is in good shape for Google." : s >= 60 ? "Good, with a few things to improve." : "Needs attention: fix the red items first.") + "</p></div></div>" +
      "<ul class='seo-checks'>" + list.map(function (c) {
        return "<li class='is-" + c.status + "'><i></i><div><strong>" + esc(c.title) + "</strong><span>" + esc(c.detail) + "</span></div>" + (c.fix && c.status !== "pass" ? "<button class='ed-btn' type='button' data-fix='" + c.fix + "'>Fix</button>" : "") + "</li>";
      }).join("") + "</ul>" +
      "<div class='seo-all'><div class='ed-row'><button class='ed-btn' type='button' id='c-all'>Check every page</button><span class='ed-muted ed-small'>Titles, descriptions, duplicates and alt text across the site</span></div><div id='c-all-out'></div></div>";
    body.querySelectorAll("[data-fix]").forEach(function (b) { b.addEventListener("click", function () { tab = b.getAttribute("data-fix"); render(); }); });
    $("#c-all").addEventListener("click", checkAll);
  }
  function checkAll() {
    var out = $("#c-all-out"); out.innerHTML = "<p class='ed-muted ed-small'>Reading every page…</p>";
    E.listPages().then(function (pages) {
      return Promise.all(pages.map(function (p) { return E.readFile(p).then(function (src) { return { page: p, src: src }; }).catch(function () { return null; }); }));
    }).then(function (rows) {
      rows = rows.filter(Boolean);
      var titles = {};
      rows.forEach(function (r) { r.meta = E.getMeta(r.src); titles[r.meta.title] = (titles[r.meta.title] || 0) + 1; });
      out.innerHTML = "<table class='seo-table'><thead><tr><th>Page</th><th>Title</th><th>Description</th><th>Images without alt</th><th>Google</th><th></th></tr></thead><tbody>" + rows.map(function (r) {
        var m = r.meta, tl = m.title.length, dl = m.desc.length;
        var imgs = r.src.match(/<img\b[^>]*>/g) || [];
        var miss = imgs.filter(function (i) { return !/\salt="[^"]+"/.test(i) && !/role="presentation"/.test(i); }).length;
        var cls = function (ok, warn) { return ok ? "is-good" : warn ? "is-ok" : "is-bad"; };
        return "<tr><td>" + esc(E.labelFor(r.page)) + "</td>" +
          "<td><span class='seo-count " + cls(tl >= 30 && tl <= 60 && titles[m.title] === 1, tl > 0) + "'>" + tl + (titles[m.title] > 1 ? " · duplicate" : "") + "</span></td>" +
          "<td><span class='seo-count " + cls(dl >= 70 && dl <= 160, dl > 0) + "'>" + dl + "</span></td>" +
          "<td><span class='seo-count " + cls(!miss, false) + "'>" + miss + " of " + imgs.length + "</span></td>" +
          "<td>" + (m.noindex ? "<span class='seo-count is-ok'>hidden</span>" : "<span class='seo-count is-good'>indexed</span>") + "</td>" +
          "<td>" + (r.page === state.target ? "<em class='ed-muted'>open</em>" : "<button class='ed-btn' type='button' data-open='" + esc(r.page) + "'>Open</button>") + "</td></tr>";
      }).join("") + "</tbody></table>";
      out.querySelectorAll("[data-open]").forEach(function (b) {
        b.addEventListener("click", function () {
          var t = b.getAttribute("data-open");
          if (state.dirty && !confirm("You have unpublished changes to " + E.labelFor(state.target) + ". They're kept as a draft on this computer. Switch anyway?")) return;
          E.closeModals(); $("#ed-target").value = t; E.load(t).then(function () { setTimeout(function () { open("check"); }, 600); });
        });
      });
    }).catch(function (e) { out.innerHTML = "<p class='ed-msg'>" + esc(e.message) + "</p>"; });
  }

  /* ---------- Site & favicon ---------- */
  var BG = [["", "Transparent"], ["#0d0b09", "Dark"], ["#c6a46a", "Gold"], ["#ffffff", "White"]];
  var fav = { file: null, img: null, svgText: null, bg: "", round: true, pad: 0 };
  function readSite() {
    return E.readFile("index.html").then(function (src) {
      var head = (src.match(/<head>[\s\S]*?<\/head>/) || [""])[0];
      var pick = function (re) { var m = head.match(re); return m ? m[1] : ""; };
      return {
        siteName: pick(/<meta property="og:site_name" content="([^"]*)"/), twitter: pick(/<meta name="twitter:site" content="([^"]*)"/),
        theme: pick(/<meta name="theme-color" content="([^"]*)"/), gsc: pick(/<meta name="google-site-verification" content="([^"]*)"/),
        ga: pick(/googletagmanager\.com\/gtag\/js\?id=([A-Z0-9-]+)/)
      };
    });
  }
  function renderSite(body) {
    var v = Date.now();
    body.innerHTML = "<div class='seo-grid'><div class='seo-col'>" +
      "<p class='seo-label'>Favicon <span class='ed-muted'>(browser tab, bookmarks, Google results, phone home screen)</span></p>" +
      "<div class='fav-row'><div class='fav-prev' id='fav-prev'><figure><img id='fp-16' src='" + SITE + BRAND + "favicon-48.png?v=" + v + "' width='16' height='16' alt=''><figcaption>16</figcaption></figure>" +
      "<figure><img id='fp-32' src='" + SITE + BRAND + "favicon-48.png?v=" + v + "' width='32' height='32' alt=''><figcaption>32</figcaption></figure>" +
      "<figure><img id='fp-180' src='" + SITE + BRAND + "apple-touch-icon.png?v=" + v + "' width='72' height='72' alt=''><figcaption>Phone</figcaption></figure></div>" +
      "<div class='fav-tab'><img id='fp-tab' src='" + SITE + BRAND + "favicon-48.png?v=" + v + "' alt=''><span>" + esc(SITE_NAME || "Your site") + "</span></div></div>" +
      "<div class='ed-row'><button class='ed-btn' type='button' id='fav-up'>Upload new icon…</button><span class='ed-muted ed-small'>Square PNG, JPG or SVG, 512×512 or larger</span></div>" +
      "<div class='fav-opts' id='fav-opts' hidden><label class='seo-f'>Background<select id='fav-bg'>" + BG.map(function (b) { return "<option value='" + b[0] + "'>" + b[1] + "</option>"; }).join("") + "</select></label>" +
      "<label class='ed-check'><input type='checkbox' id='fav-round' checked><span>Rounded corners</span></label>" +
      "<label class='seo-f'>Padding<input type='range' id='fav-pad' min='0' max='24' value='0'></label>" +
      "<button class='ed-btn ed-btn--gold' type='button' id='fav-save'>Save favicon to the site</button></div>" +
      "</div><div class='seo-col'>" +
      "<p class='seo-label'>Site-wide settings <span class='ed-muted'>(applied to every page)</span></p>" +
      "<label class='seo-f'>Site name (shown on shared links)<input id='st-name'></label>" +
      "<label class='seo-f'>X / Twitter handle<input id='st-tw' placeholder='@yourhandle'></label>" +
      "<label class='seo-f'>Browser theme colour (phone address bar)<span class='ed-row'><input type='color' id='st-theme'><code id='st-theme-v'></code></span></label>" +
      "<label class='seo-f'>Google Search Console verification code<input id='st-gsc' placeholder='Paste the content=\"…\" value'></label>" +
      "<label class='seo-f'>Google Analytics 4 measurement ID<input id='st-ga' placeholder='G-XXXXXXXXXX'></label>" +
      "<div class='ed-row'><button class='ed-btn ed-btn--gold' type='button' id='st-save'>Save site settings</button><span class='ed-muted ed-small' id='st-msg'>Loading…</span></div>" +
      "<p class='seo-label'>Sitemap &amp; robots</p><div class='ed-row'><a class='ed-btn ed-btn--ghost' target='_blank' rel='noopener' href='" + SITE + "sitemap.xml'>sitemap.xml ↗</a><a class='ed-btn ed-btn--ghost' target='_blank' rel='noopener' href='" + SITE + "robots.txt'>robots.txt ↗</a></div>" +
      "<p class='ed-muted ed-small'>The sitemap updates automatically when you add a page or hide one from Google. Submit it once in Google Search Console.</p>" +
      "</div></div>";
    readSite().then(function (s) {
      $("#st-name").value = s.siteName; $("#st-tw").value = s.twitter; $("#st-theme").value = /^#[0-9a-f]{6}$/i.test(s.theme) ? s.theme : "#080706";
      $("#st-theme-v").textContent = $("#st-theme").value; $("#st-gsc").value = s.gsc; $("#st-ga").value = s.ga; $("#st-msg").textContent = "";
    }).catch(function (e) { $("#st-msg").textContent = e.message; });
    $("#st-theme").addEventListener("input", function (e) { $("#st-theme-v").textContent = e.target.value; });
    $("#st-save").addEventListener("click", saveSite);
    $("#fav-up").addEventListener("click", pickFavicon);
    ["#fav-bg", "#fav-round", "#fav-pad"].forEach(function (s) { $(s).addEventListener("input", favPreview); $(s).addEventListener("change", favPreview); });
    $("#fav-save").addEventListener("click", saveFavicon);
  }
  function needToken(what) { if (E.cfg.token) return false; E.openSettings("Sign in to " + what + "."); return true; }
  function committed(c, msg) {
    state.pub = { phase: "saved", sha: c.sha, url: c.html_url || ("https://github.com/" + E.cfg.owner + "/" + E.cfg.repo + "/commit/" + c.sha), time: Date.now(), target: state.target, version: "site" };
    E.updateUI(); E.toast(msg, false, state.pub.url);
    setTimeout(function () { if (state.pub && state.pub.version === "site") { state.pub.phase = "live"; E.updateUI(); } }, 75000);
  }

  function siteHead(html, s, isHome) {
    var m = html.match(/<head>[\s\S]*?<\/head>/); if (!m) return html;
    var h = m[0];
    var setAttr = function (re, tag) { if (re.test(h)) h = h.replace(re, function () { return tag; }); };
    if (s.siteName) setAttr(/<meta property="og:site_name" content="[^"]*">/, '<meta property="og:site_name" content="' + esc(s.siteName) + '">');
    if (s.twitter) setAttr(/<meta name="twitter:site" content="[^"]*">/, '<meta name="twitter:site" content="' + esc(s.twitter) + '">');
    if (s.theme) setAttr(/<meta name="theme-color" content="[^"]*">/, '<meta name="theme-color" content="' + esc(s.theme) + '">');
    h = h.replace(/\n?<meta name="google-site-verification" content="[^"]*">/g, "");
    if (s.gsc && isHome) h = h.replace(/(<meta name="theme-color" content="[^"]*">)/, '$1\n<meta name="google-site-verification" content="' + esc(s.gsc) + '">');
    h = h.replace(/\n?<!-- analytics -->[\s\S]*?<!-- \/analytics -->/g, "");
    if (s.ga) h = h.replace(/<\/head>$/, '<!-- analytics --><script async src="https://www.googletagmanager.com/gtag/js?id=' + s.ga + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + s.ga + '");</script><!-- /analytics -->\n</head>');
    return html.replace(m[0], function () { return h; });
  }
  function saveSite() {
    if (needToken("save site settings")) return;
    var s = { siteName: $("#st-name").value.trim(), twitter: $("#st-tw").value.trim(), theme: $("#st-theme").value, gsc: $("#st-gsc").value.trim().replace(/^.*content="([^"]+)".*$/, "$1"), ga: $("#st-ga").value.trim().toUpperCase() };
    if (s.twitter && s.twitter.charAt(0) !== "@") s.twitter = "@" + s.twitter;
    if (s.ga && !/^G-[A-Z0-9]{4,}$/.test(s.ga)) { $("#st-msg").textContent = "Analytics IDs look like G-XXXXXXXXXX."; return; }
    $("#st-msg").textContent = "Updating every page…";
    var version = "v" + Date.now().toString(36);
    E.listPages().then(function (pages) {
      return Promise.all(pages.map(function (p) { return E.readFile(p).then(function (src) { return { path: p, content: E.setVersion(E.markEdited(siteHead(src, s, p === "index.html")), version) }; }); }));
    }).then(function (files) {
      return E.readFile("site.webmanifest").then(function (mf) {
        try { var j = JSON.parse(mf); if (s.siteName) j.name = s.siteName; if (s.theme) j.theme_color = s.theme; files.push({ path: "site.webmanifest", content: JSON.stringify(j, null, 2) + "\n" }); } catch (e) {}
        return files;
      }).catch(function () { return files; });
    }).then(function (files) {
      return E.commitFiles(files, "Update site-wide SEO settings via site editor");
    }).then(function (c) {
      $("#st-msg").textContent = "Saved ✓ Live in about a minute.";
      committed(c, "Site settings saved to every page ✓");
    }).catch(function (e) { $("#st-msg").textContent = "Couldn't save: " + e.message; });
  }

  function pickFavicon() {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      var url = URL.createObjectURL(f), im = new Image();
      fav.file = f; fav.svgText = null;
      if (f.type === "image/svg+xml") f.text().then(function (t) { fav.svgText = t; });
      im.onload = function () { fav.img = im; $("#fav-opts").hidden = false; favPreview(); };
      im.onerror = function () { E.toast("Couldn't read that image.", true); };
      im.src = url;
    };
    inp.click();
  }
  function drawIcon(size, opaque) {
    var c = document.createElement("canvas"); c.width = c.height = size;
    var g = c.getContext("2d"), r = fav.round ? size * 0.2 : 0, bg = fav.bg || (opaque ? "#0d0b09" : "");
    if (r) { g.beginPath(); g.moveTo(r, 0); g.arcTo(size, 0, size, size, r); g.arcTo(size, size, 0, size, r); g.arcTo(0, size, 0, 0, r); g.arcTo(0, 0, size, 0, r); g.closePath(); g.clip(); }
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
    var pad = size * fav.pad / 100, box = size - pad * 2, im = fav.img;
    var s = Math.min(box / (im.naturalWidth || im.width), box / (im.naturalHeight || im.height));
    var w = (im.naturalWidth || im.width) * s, h = (im.naturalHeight || im.height) * s;
    g.imageSmoothingQuality = "high";
    g.drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
    return c;
  }
  function favPreview() {
    if (!fav.img) return;
    fav.bg = $("#fav-bg").value; fav.round = $("#fav-round").checked; fav.pad = +$("#fav-pad").value;
    var small = drawIcon(48).toDataURL("image/png");
    $("#fp-16").src = small; $("#fp-32").src = small; $("#fp-tab").src = small; $("#fp-180").src = drawIcon(180, true).toDataURL("image/png");
  }
  function b64(c) { return c.toDataURL("image/png").split(",")[1]; }
  function ico(canvases) {
    var pngs = canvases.map(function (c) { var bin = atob(b64(c)), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return { size: c.width, data: u }; });
    var total = 6 + 16 * pngs.length + pngs.reduce(function (a, p) { return a + p.data.length; }, 0);
    var buf = new Uint8Array(total), dv = new DataView(buf.buffer), off = 6 + 16 * pngs.length;
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, pngs.length, true);
    pngs.forEach(function (p, i) {
      var e = 6 + i * 16;
      buf[e] = p.size >= 256 ? 0 : p.size; buf[e + 1] = p.size >= 256 ? 0 : p.size; buf[e + 2] = 0; buf[e + 3] = 0;
      dv.setUint16(e + 4, 1, true); dv.setUint16(e + 6, 32, true); dv.setUint32(e + 8, p.data.length, true); dv.setUint32(e + 12, off, true);
      buf.set(p.data, off); off += p.data.length;
    });
    var s = ""; for (var i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return btoa(s);
  }
  function saveFavicon() {
    if (!fav.img || needToken("change the favicon")) return;
    var plainSvg = fav.svgText && !fav.bg && !fav.pad && !fav.round;
    var svg = plainSvg ? fav.svgText : "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><image width='128' height='128' href='" + drawIcon(128).toDataURL("image/png") + "'/></svg>";
    var files = [
      { path: BRAND + "favicon-48.png", base64: b64(drawIcon(48)) },
      { path: BRAND + "apple-touch-icon.png", base64: b64(drawIcon(180, true)) },
      { path: BRAND + "icon-512.png", base64: b64(drawIcon(512, true)) },
      { path: BRAND + "favicon.svg", content: svg },
      { path: "favicon.ico", base64: ico([drawIcon(16), drawIcon(32), drawIcon(48)]) }
    ];
    E.toast("Saving favicon…");
    E.commitFiles(files, "Update favicon via site editor").then(function (c) {
      committed(c, "Favicon saved ✓ Browsers can take a while to show a new favicon; Google updates it on its next visit.");
    }).catch(function (e) { E.toast("Couldn't save the favicon: " + e.message, true); });
  }

  // Swapping in a photo that has no alt text gets a starting description from its file name.
  editor.on("component:update:src", function (c) {
    if (state.loading || !c || !(c.get("type") === "image" || c.get("tagName") === "img")) return;
    var p = { comp: c, kind: "img", src: c.get("src") };
    if (altState(p) === "missing") setAlt(p, suggestAlt(p));
  });

  window.__seo = { open: open, checks: checks, score: score, paintScore: paintScore, allImages: allImages, altState: altState, ico: ico };
})();
