/* Visual site editor for danreynoldsphotography.com
   ------------------------------------------------------------------
   - Edits each page's <main> content, plus the shared header and footer.
   - Pages mark their editable regions with <!-- editor:main --> … <!-- /editor:main -->
     (likewise :header and :footer). Page-specific CSS lives in <style id="page-styles">,
     shared header/footer CSS in assets/css/editor-global.css.
   - Publish writes everything (including newly uploaded photos) to GitHub in ONE commit
     using the Git Data API, so every change is versioned and reversible. */
(function () {
  "use strict";

  var SITE = new URL("../", location.href).href; // site root, e.g. https://example.com/
  var CFG_KEY = "dr-site-editor";
  var EDITED = "<!-- editor:edited -->";
  var DEFAULT_GLOBAL_CSS = "/* Styles saved from the visual editor for the shared header and footer. */\n/* editor:header */\n/* /editor:header */\n/* editor:footer */\n/* /editor:footer */\n";
  var PAGE_NAMES = { "index.html": "Home", "about.html": "About", "portfolio.html": "Portfolio", "films.html": "Films",
    "investment.html": "Investment", "contact.html": "Contact", "404.html": "404 page" };
  var GLOBALS = [["@header", "Header & menu (all pages)"], ["@footer", "Footer (all pages)"]];

  var cfg = { owner: "bhavansh-arora", repo: "danreynoldsphotography", branch: "main", token: "" };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_KEY) || "{}")); } catch (e) {}
  // The GitHub token only ever comes from the signed-in session (admin/auth.js); it's never kept here.
  cfg.token = "";
  if (window.__editorAuth) Object.assign(cfg, { owner: window.__editorAuth.owner, repo: window.__editorAuth.repo, branch: window.__editorAuth.branch, token: window.__editorAuth.token });
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify({ owner: cfg.owner, repo: cfg.repo, branch: cfg.branch })); } catch (e) {} }
  saveCfg();

  var $ = function (s) { return document.querySelector(s); };
  var state = { target: "index.html", pages: Object.keys(PAGE_NAMES), dirty: false, loading: false, meta: null, metaChanged: false };

  /* ------------------------------------------------------------------ */
  /* GitHub                                                              */
  /* ------------------------------------------------------------------ */
  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (cfg.token) headers.Authorization = "Bearer " + cfg.token;
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo + path, {
      method: opts.method || "GET", headers: headers, body: opts.body, cache: "no-store"
    }).then(function (r) {
      if (r.ok) return r.status === 204 ? null : r.json();
      return r.json().catch(function () { return {}; }).then(function (j) {
        // Technical detail goes to the console; people see a plain explanation.
        if (window.console) console.warn("Editor connection error", r.status, path, j.message || r.statusText);
        var msg = "Something went wrong while saving (" + r.status + "). Please try again in a moment.";
        if (r.status === 401) { msg = "The editor's connection has expired. The site owner can renew it in ⚙ Account → Owner settings."; if (window.__auth) window.__auth.tokenRejected(); }
        else if (r.status === 403 || r.status === 404) msg = "The editor isn't allowed to save right now. Ask the site owner to check ⚙ Account → Owner settings.";
        else if (r.status === 409 || r.status === 422) msg = "Someone else just published a change. Reload the editor and try again.";
        throw new Error(msg);
      });
    });
  }
  function b64decode(s) {
    var bin = atob(s.replace(/\n/g, "")), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encPath(p) { return p.split("/").map(encodeURIComponent).join("/"); }
  function readFile(path) {
    if (cfg.token) {
      return api("/contents/" + encPath(path) + "?ref=" + encodeURIComponent(cfg.branch)).then(function (j) { return b64decode(j.content); });
    }
    return fetch(SITE + path + "?v=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Could not load " + path + " (" + r.status + ")");
      return r.text();
    });
  }
  function listPages() {
    if (!cfg.token) return Promise.resolve(state.pages);
    return api("/git/trees/" + encodeURIComponent(cfg.branch) + "?recursive=1").then(function (t) {
      var pages = t.tree.filter(function (x) { return x.type === "blob" && /^[^/]+\.html$/.test(x.path); }).map(function (x) { return x.path; });
      var order = Object.keys(PAGE_NAMES);
      pages.sort(function (a, b) {
        var ia = order.indexOf(a), ib = order.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
      });
      return pages;
    });
  }
  // One commit for any number of files (text or base64 binaries).
  function commitFiles(files, message) {
    var base;
    return api("/git/ref/heads/" + encodeURIComponent(cfg.branch)).then(function (ref) {
      base = ref.object.sha;
      return api("/git/commits/" + base);
    }).then(function (commit) {
      return files.reduce(function (p, f) {
        return p.then(function (tree) {
          if (f.remove) { tree.push({ path: f.path, mode: "100644", type: "blob", sha: null }); return tree; }
          var body = f.base64 != null ? { content: f.base64, encoding: "base64" } : { content: f.content, encoding: "utf-8" };
          return api("/git/blobs", { method: "POST", body: JSON.stringify(body) }).then(function (blob) {
            tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
            return tree;
          });
        });
      }, Promise.resolve([])).then(function (tree) {
        return api("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree: tree }) });
      });
    }).then(function (tree) {
      return api("/git/commits", { method: "POST", body: JSON.stringify({ message: message, tree: tree.sha, parents: [base] }) });
    }).then(function (c) {
      return api("/git/refs/heads/" + encodeURIComponent(cfg.branch), { method: "PATCH", body: JSON.stringify({ sha: c.sha }) }).then(function () { return c; });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Page source helpers                                                 */
  /* ------------------------------------------------------------------ */
  function region(html, key) {
    var a = "<!-- editor:" + key + " -->", b = "<!-- /editor:" + key + " -->";
    var i = html.indexOf(a), j = html.indexOf(b);
    return i < 0 || j < 0 ? null : html.slice(i + a.length, j);
  }
  function setRegion(html, key, content) {
    var a = "<!-- editor:" + key + " -->", b = "<!-- /editor:" + key + " -->";
    var i = html.indexOf(a), j = html.indexOf(b);
    if (i < 0 || j < 0) throw new Error("Missing editor markers for '" + key + "'");
    return html.slice(0, i + a.length) + "\n" + content.trim() + "\n" + html.slice(j);
  }
  function cssRegion(css, key) {
    var a = "/* editor:" + key + " */", b = "/* /editor:" + key + " */";
    var i = css.indexOf(a), j = css.indexOf(b);
    return i < 0 || j < 0 ? "" : css.slice(i + a.length, j).trim();
  }
  function setCssRegion(css, key, content) {
    var a = "/* editor:" + key + " */", b = "/* /editor:" + key + " */";
    var i = css.indexOf(a), j = css.indexOf(b);
    if (i < 0 || j < 0) return css + "\n" + a + "\n" + content + "\n" + b + "\n";
    return css.slice(0, i + a.length) + "\n" + content.trim() + "\n" + css.slice(j);
  }
  function pageStyles(html) { var m = html.match(/<style id="page-styles">([\s\S]*?)<\/style>/); return m ? m[1] : ""; }
  function setPageStyles(html, css) {
    var tag = '<style id="page-styles">' + css + "</style>";
    if (/<style id="page-styles">[\s\S]*?<\/style>/.test(html)) return html.replace(/<style id="page-styles">[\s\S]*?<\/style>/, function () { return tag; });
    return html.replace("</head>", function () { return tag + "\n</head>"; });
  }
  function markEdited(html) { return html.indexOf(EDITED) >= 0 ? html : html.replace(/<html[^>]*>/i, function (m) { return m + "\n" + EDITED; }); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  // Page SEO lives in <head>: title, description, social share image, canonical URL, indexing and structured data.
  function unesc(s) { var x = document.createElement("textarea"); x.innerHTML = s; return x.value; }
  function headOf(html) { var m = html.match(/<head>[\s\S]*?<\/head>/); return m ? m[0] : ""; }
  function getMeta(html) {
    var head = headOf(html);
    var pick = function (re) { var m = head.match(re); return m ? unesc(m[1]) : ""; };
    return {
      title: pick(/<title>([\s\S]*?)<\/title>/), desc: pick(/<meta name="description" content="([^"]*)"/),
      ogImage: pick(/<meta property="og:image" content="([^"]*)"/), canonical: pick(/<link rel="canonical" href="([^"]*)"/),
      noindex: /<meta name="robots" content="[^"]*noindex/.test(head),
      jsonld: (head.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).map(function (x) { return x.replace(/^<script[^>]*>|<\/script>$/g, ""); })
    };
  }
  function applyMeta(html, meta) {
    var head = headOf(html); if (!head) return html;
    var t = esc(meta.title), d = esc(meta.desc), h = head;
    var set = function (re, val) { h = h.replace(re, function () { return val; }); };
    set(/<title>[\s\S]*?<\/title>/, "<title>" + t + "</title>");
    set(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + d + '">');
    set(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + t + '">');
    set(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + d + '">');
    if (meta.ogImage) {
      set(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + esc(meta.ogImage) + '">');
      if (/<meta name="twitter:image"/.test(h)) set(/<meta name="twitter:image" content="[^"]*">/, '<meta name="twitter:image" content="' + esc(meta.ogImage) + '">');
    }
    if (meta.canonical) {
      set(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + esc(meta.canonical) + '">');
      set(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + esc(meta.canonical) + '">');
    }
    if ("noindex" in meta) {
      h = h.replace(/\n?<meta name="robots" content="[^"]*">/g, "");
      if (meta.noindex) h = h.replace(/(<meta name="description" content="[^"]*">)/, '$1\n<meta name="robots" content="noindex, follow">');
    }
    if (meta.jsonld) {
      h = h.replace(/\n?<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
      var ld = meta.jsonld.filter(Boolean).map(function (j) { return '<script type="application/ld+json">' + j.replace(/<\//g, "<\\/") + "</script>"; }).join("\n");
      if (ld) h = h.replace(/<\/head>$/, ld + "\n</head>");
    }
    return html.replace(head, function () { return h; });
  }
  // sitemap.xml lists every page Google should index.
  function sitemapWith(xml, loc, include, drop) {
    if (drop && drop !== loc) xml = xml.replace(new RegExp("\\s*<url><loc>" + drop.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "</loc></url>"), "");
    var has = xml.indexOf("<loc>" + loc + "</loc>") >= 0;
    if (include && !has) xml = xml.replace("</urlset>", "  <url><loc>" + loc + "</loc></url>\n</urlset>");
    if (!include && has) xml = xml.replace(new RegExp("\\s*<url><loc>" + loc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "</loc></url>"), "");
    return xml;
  }
  // Relative site URLs become absolute inside the editor canvas, and back on export.
  function toEditor(s) {
    return (s || "").replace(/(["'(\s,=])assets\//g, function (m, p) { return p + SITE + "assets/"; })
      // FAQ answers are opened while editing so they can be changed (closed again on publish).
      .replace(/<details(?![^>]*\sopen)([^>]*)>/g, '<details$1 open data-ed-closed="">');
  }
  // CSS first: loading components turns inline style="" attributes (photo focal points, inline
  // background photos) into rules, and setStyle afterwards would wipe them.
  function setContent(html, css) { editor.setStyle(css || ""); editor.setComponents(html); }
  function fromEditor(s) { return (s || "").split(SITE + "assets/").join("assets/"); }
  // Uploaded videos preview from a temporary blob: URL until GitHub Pages serves the real file.
  state.blobMap = {};
  function unblob(s) { Object.keys(state.blobMap).forEach(function (b) { s = s.split(b).join(state.blobMap[b]); }); return s; }
  function cleanHtml(html) {
    html = fromEditor(unblob(html.replace(/^\s*<body[^>]*>/i, "").replace(/<\/body>\s*$/i, "")));
    var doc = new DOMParser().parseFromString('<div id="ed-root">' + html + "</div>", "text/html");
    var root = doc.getElementById("ed-root");
    root.querySelectorAll("details[data-ed-closed]").forEach(function (d) { d.removeAttribute("open"); d.removeAttribute("data-ed-closed"); });
    // When a photo is swapped, drop its old responsive srcset so the new photo is what loads.
    root.querySelectorAll("img[srcset]").forEach(function (img) {
      var src = img.getAttribute("src") || "";
      var stem = src.split("/").pop().replace(/-(480|800|1600)\.webp$/, "");
      if (!stem || src.indexOf("data:") === 0 || img.getAttribute("srcset").indexOf(stem + "-") < 0) {
        img.removeAttribute("srcset"); img.removeAttribute("sizes");
      }
    });
    // Videos: drop editor-only attributes and any placeholder source that isn't a real file.
    root.querySelectorAll("video").forEach(function (v) {
      v.removeAttribute("allowfullscreen");
      var src = v.getAttribute("src") || "";
      if (!src || /^blob:/.test(src) || src.indexOf("/admin/") >= 0) v.removeAttribute("src");
    });
    return root.innerHTML;
  }
  // Uploaded photos live as data URLs while editing; on publish they become files in the same commit.
  function extractUploads(html, css) {
    var files = [], map = {}, n = 0, stamp = Date.now().toString(36);
    var re = /data:image\/(webp|png|jpe?g|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;
    function swap(s) {
      return s.replace(re, function (m, type, b64) {
        if (!map[m]) {
          var ext = type === "svg+xml" ? "svg" : type.replace("jpeg", "jpg");
          var path = "assets/uploads/" + stamp + "-" + (n++) + "." + ext;
          map[m] = path; files.push({ path: path, base64: b64 });
        }
        return map[m];
      });
    }
    return { html: swap(html), css: swap(css), files: files };
  }
  function labelFor(t) {
    for (var i = 0; i < GLOBALS.length; i++) if (GLOBALS[i][0] === t) return GLOBALS[i][1];
    return PAGE_NAMES[t] || t.replace(/\.html$/, "").replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ------------------------------------------------------------------ */
  /* Blocks: the site's own sections, ready to drag in                   */
  /* ------------------------------------------------------------------ */
  var IMG = function (name) { return SITE + "assets/img/" + name + "-1600.webp"; };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ARROW_UR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5v17l15-8.5z"/></svg>';
  var ico = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; };
  var media = function (name, alt, ratio) { return '<div class="media ' + (ratio || "") + '"><img src="' + IMG(name) + '" alt="' + alt + '" loading="lazy"></div>'; };
  var btn = function (text, href, kind) { return '<a class="btn ' + (kind || "btn--gold") + '" href="' + href + '">' + text + ' <span class="btn__icon">' + ARROW + "</span></a>"; };
  var head = function (num, label, title, lede) {
    return '<div class="head' + (lede ? " head--split" : "") + '"><div class="head__top"><span class="label">(' + num + ") — " + label + '</span><span class="label">Section</span></div>' +
      '<h2 class="h-xl">' + title + "</h2>" + (lede ? '<p class="lede">' + lede + "</p>" : "") + "</div>";
  };
  var wrap = function (inner, extra) { return '<section class="section' + (extra ? " " + extra : "") + '"><div class="container">' + inner + "</div></section>"; };

  var BLOCKS = [
    // ---- Sections
    ["sec-page-hero", "Sections", "Page header", ico('<path d="M4 6h16M4 11h10M4 16h7"/>'),
      '<section class="page-hero"><div class="container"><div class="page-hero__meta"><span class="label label--dot">Page label</span><span class="label">Right label</span></div>' +
      '<div class="page-hero__grid"><h1 class="h-xl page-hero__title">A bold headline,<br><em>beautifully said.</em></h1><p class="lede">A short introduction to this page. Click any text to edit it.</p></div></div></section>'],
    ["sec-heading", "Sections", "Section heading", ico('<path d="M5 6h14M5 11h9"/><path d="M5 17h6"/>'),
      wrap(head("01", "Section label", "Two lines of<br><em>headline.</em>", "A sentence that supports the headline."))],
    ["sec-statement", "Sections", "Statement with photos", ico('<path d="M4 8h9M4 13h16M4 18h11"/><rect x="15" y="6" width="5" height="4" rx="2"/>'),
      wrap('<div class="head__top"><span class="label">(01) — Label</span><span class="label">Right label</span></div><p class="statement mt-l">A big, confident sentence<span class="inline-img" style="background-image:url(' + IMG("golden-hour-portrait") + ')"></span> with little photos set right <em>inside the words.</em></p>')],
    ["sec-split", "Sections", "Image + text", ico('<rect x="3" y="5" width="8" height="14" rx="2"/><path d="M14 8h7M14 12h7M14 16h5"/>'),
      wrap('<div class="ed-cols ed-cols--2" style="align-items:center">' + media("dan-filming", "Describe this photo", "ratio-portrait") +
      '<div class="stack"><span class="label">Label</span><h2 class="h-lg">Headline with an <em>accent.</em></h2><p class="body">Write a paragraph here. Click to edit text, double-click the photo to replace it.</p>' + btn("Call to action", "contact.html") + "</div></div>")],
    ["sec-bento", "Sections", "Bento grid", ico('<rect x="3" y="3" width="10" height="10" rx="2"/><rect x="15" y="3" width="6" height="10" rx="2"/><rect x="3" y="15" width="6" height="6" rx="2"/><rect x="11" y="15" width="10" height="6" rx="2"/>'),
      wrap(head("02", "What we do", "Two crafts,<br><em>one story.</em>", "A supporting sentence.") +
      '<div class="bento"><a class="tile tile--media c-7 r-2 span-6" href="portfolio.html">' + media("ceremony-dip", "A wedding moment", "") +
      '<div class="tile__overlay"><div><span class="label">01 — Photography</span><p class="tile__title">Stills that feel <em>alive.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></div></a>" +
      '<a class="tile tile--media c-5 r-2 span-6" href="films.html">' + media("dan-filming", "Filming", "") +
      '<div class="tile__overlay"><div><span class="label">02 — Film</span><p class="tile__title">Cinematic <em>films.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></div></a>" +
      '<div class="tile c-4"><div class="tile__top"><span class="label">Label</span><span class="pill">Pill</span></div><div><div class="tile__num foil">100<sup>unit</sup></div><p class="mt-s">Describe the number.</p></div></div>' +
      '<div class="tile c-4"><span class="label">Label</span><div><p class="h-md">A short <em>highlight.</em></p><p class="mt-s">Supporting detail.</p></div></div>' +
      '<a class="tile tile--gold c-4" href="contact.html"><div class="tile__top"><span class="label">Call to action</span><span class="circle-btn">' + ARROW_UR + '</span></div><div><p class="h-md">Check your <em>date.</em></p><p class="mt-s">Dates go fast.</p></div></a></div>')],
    ["sec-cards", "Sections", "Three cards", ico('<rect x="3" y="5" width="5" height="14" rx="1.5"/><rect x="9.5" y="5" width="5" height="14" rx="1.5"/><rect x="16" y="5" width="5" height="14" rx="1.5"/>'),
      wrap(head("03", "Cards", "Three things<br><em>worth knowing.</em>") + '<div class="ed-cols ed-cols--3">' +
      ["quinn-charlotte-2", "kelly-adam-2", "manny-karina"].map(function (n, i) {
        return '<article class="qcard">' + media(n, "Photo", "") + '<div class="qcard__body"><div><span class="label">0' + (i + 1) + '</span><p class="h-md mt-s">Card title</p></div><p class="body">A short description for this card.</p></div></article>';
      }).join("") + "</div>")],
    ["sec-quotes", "Sections", "Testimonials", ico('<path d="M5 9h5v6H5zM14 9h5v6h-5z"/>'),
      wrap(head("04", "Kind words", "Loved by<br><em>our couples.</em>") + '<div class="quotes">' +
      ["roseleina-cameron-2", "julia-kirk", "manny-karina"].map(function (n) {
        return '<figure class="qcard">' + media(n, "Couple", "") + '<div class="qcard__body"><blockquote><p>“Paste a kind review from a couple here.”</p></blockquote><figcaption class="qcard__who"><strong>Couple name</strong></figcaption></div></figure>';
      }).join("") + "</div>")],
    ["sec-process", "Sections", "Stacking steps", ico('<rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="12" width="16" height="8" rx="2"/>'),
      wrap(head("05", "How it works", "Three simple<br><em>steps.</em>") + '<div class="stack-cards">' +
      [["01", "First step", "lexi-lucas-1"], ["02", "Second step", "dan-coffee"], ["03", "Third step", "golden-hour-portrait"]].map(function (s, i) {
        return '<article class="stack-card" style="--i:' + i + '"><div class="stack-card__text"><span class="stack-card__num">Step ' + s[0] + ' / 03</span><div class="stack"><h3>' + s[1] + '</h3><p>Describe this step.</p></div></div>' + media(s[2], "Step photo", "") + "</article>";
      }).join("") + "</div>")],
    ["sec-pricing", "Sections", "Pricing cards", ico('<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/><path d="M6 9h2M16 9h2"/>'),
      wrap(head("06", "Collections", "Choose your<br><em>story.</em>") + '<div class="pricing" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">' +
      ["lexi-lucas-9", "dan-bts"].map(function (n, i) {
        return '<article class="price-card' + (i ? " price-card--feature" : "") + '">' + media(n, "Package photo", "") + '<div class="price-card__body"><div class="price-card__head"><span class="label">Package name</span><span class="pill">6 hours</span></div>' +
          '<div class="price"><small>From</small><strong>$3,500</strong></div><ul class="checklist"><li>Included item</li><li>Included item</li><li>Included item</li></ul>' + btn("Enquire", "contact.html", i ? "btn--gold btn--block" : "btn--ghost btn--block") + "</div></article>";
      }).join("") + "</div>")],
    ["sec-faq", "Sections", "FAQ", ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/>'),
      wrap('<div class="faq-layout"><div class="faq-layout__aside stack"><span class="label">(07) — FAQ</span><h2 class="h-xl">Questions,<br><em>answered.</em></h2></div><div class="faq">' +
      [1, 2, 3].map(function () { return '<details><summary>A common question?<span class="faq__icon" aria-hidden="true"></span></summary><div class="faq__body"><div><p>The answer goes here.</p></div></div></details>'; }).join("") + "</div></div>")],
    ["sec-film", "Sections", "Featured film", ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'),
      wrap('<div class="head__top"><span class="label">(08) — Featured film</span><a class="link" href="films.html">All films ' + ARROW + "</a></div>" +
      '<div class="mt-l"><button class="yt yt--feature" type="button" data-id="Gpq9IPxnIhE" aria-label="Play film"><img src="https://i.ytimg.com/vi/Gpq9IPxnIhE/maxresdefault.jpg" alt=""><span class="yt__play">' + PLAY + '</span><span class="yt__over"><span class="h-lg">Film <em>title</em></span></span></button></div>')],
    ["sec-gallery", "Sections", "Photo grid", ico('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
      wrap('<div class="gallery-grid">' + ["colin-amanda-2", "lexi-lucas-6", "ethan-gwyn-3", "roseleina-cameron-1", "quinn-charlotte-1", "brian-tori"].map(function (n) { return media(n, "Wedding photo", ""); }).join("") + "</div>")],
    ["sec-banner", "Sections", "Full-width photo", ico('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 15l6-5 5 4 3-2 6 4"/>'),
      '<div class="frame">' + media("chicago-skyline-couple", "Describe this photo", "ratio-cinema") + "</div>"],
    ["sec-cta", "Sections", "Call to action", ico('<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M9 12h6"/>'),
      wrap('<a class="tile tile--gold" href="contact.html" style="min-height:0;flex-direction:row;flex-wrap:wrap;align-items:center"><div><span class="label">Limited dates</span><p class="h-lg mt-s">Let\'s tell <em>your story.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></a>")],
    ["sec-marquee", "Sections", "Scrolling words", ico('<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>'),
      '<div class="marquee marquee--words" aria-hidden="true"><div class="marquee__track"><span>Authentic</span><span>Cinematic</span><span>Timeless</span><span>Authentic</span><span>Cinematic</span><span>Timeless</span></div></div>'],
    // ---- Layout
    ["lay-2", "Layout", "2 columns", ico('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>'),
      '<div class="ed-cols ed-cols--2"><div class="stack"><p class="body">Column one. Drag elements in here.</p></div><div class="stack"><p class="body">Column two.</p></div></div>'],
    ["lay-3", "Layout", "3 columns", ico('<rect x="2" y="4" width="6" height="16" rx="1.5"/><rect x="9" y="4" width="6" height="16" rx="1.5"/><rect x="16" y="4" width="6" height="16" rx="1.5"/>'),
      '<div class="ed-cols ed-cols--3"><div class="stack"><p class="body">Column one.</p></div><div class="stack"><p class="body">Column two.</p></div><div class="stack"><p class="body">Column three.</p></div></div>'],
    ["lay-section", "Layout", "Section", ico('<rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3"/>'),
      '<section class="section"><div class="container"><p class="body">New section. Drag headings, text, photos and buttons in here.</p></div></section>'],
    ["lay-section-h", "Layout", "Section with heading", ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>'),
      '<section class="section"><div class="container stack"><span class="label label--dot">Small label</span><h2 class="h-xl">Section title</h2><p class="lede">A sentence or two introducing this section.</p></div></section>'],
    ["lay-html", "Layout", "Custom HTML", ico('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>'),
      '<div class="custom-html"><p class="body">Custom HTML: select this block and paste your code in the panel on the left.</p></div>'],
    ["lay-spacer", "Layout", "Spacer", ico('<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>'), '<div class="spacer"></div>'],
    ["lay-divider", "Layout", "Divider", ico('<path d="M3 12h18"/>'), '<hr class="divider">'],
    // ---- Elements
    ["el-heading", "Elements", "Heading", ico('<path d="M6 5v14M18 5v14M6 12h12"/>'), '<h2 class="h-lg">A heading with an <em>accent</em></h2>'],
    ["el-text", "Elements", "Paragraph", ico('<path d="M4 7h16M4 12h16M4 17h10"/>'), '<p class="body">Write something here. Select text to make it bold, italic or a link.</p>'],
    ["el-label", "Elements", "Small label", ico('<path d="M4 12h3M10 12h10"/>'), '<span class="label label--dot">Small label</span>'],
    ["el-button", "Elements", "Gold button", ico('<rect x="3" y="8" width="18" height="8" rx="4"/>'), btn("Check your date", "contact.html")],
    ["el-button2", "Elements", "Outline button", ico('<rect x="3" y="8" width="18" height="8" rx="4" stroke-dasharray="2 2"/>'), btn("See the work", "portfolio.html", "btn--ghost")],
    ["el-link", "Elements", "Text link", ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), '<a class="link" href="about.html">Read more ' + ARROW + "</a>"],
    ["el-image", "Elements", "Photo", ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-4 4 3 3-2 6 4"/>'), media("golden-hour-portrait", "Describe this photo", "ratio-land")],
    ["el-video", "Elements", "YouTube film", ico('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9.5l4.5 2.5-4.5 2.5z"/>'),
      '<button class="yt" type="button" data-id="k7mlTdWmj0o" aria-label="Play film"><img src="https://i.ytimg.com/vi/k7mlTdWmj0o/maxresdefault.jpg" alt=""><span class="yt__play">' + PLAY + "</span></button>"],
    ["el-videofile", "Elements", "Video file", ico('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
      { tagName: "div", classes: ["media", "ratio-wide"], components: [{ type: "video", src: "", autoplay: true, loop: true, controls: false, attributes: { muted: "", playsinline: "", preload: "metadata" } }] }],
    ["el-quote", "Elements", "Quote", ico('<path d="M6 9h4v5H6zM14 9h4v5h-4z"/>'), '<blockquote class="statement" style="font-size:clamp(1.4rem,1rem + 2vw,2.6rem)">“A memorable quote goes here.”</blockquote>'],
    ["el-stat", "Elements", "Stat tile", ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), '<div class="tile"><span class="label">Label</span><div><div class="tile__num foil">18<sup>months</sup></div><p class="mt-s">Explain the number.</p></div></div>'],
    ["el-pill", "Elements", "Pill", ico('<rect x="4" y="9" width="16" height="6" rx="3"/>'), '<span class="pill">Pill text</span>'],
    ["el-list", "Elements", "Checklist", ico('<path d="M4 7l2 2 3-3M4 14l2 2 3-3M12 8h8M12 15h8"/>'), '<ul class="checklist"><li>First item</li><li>Second item</li><li>Third item</li></ul>']
  ];

  /* ------------------------------------------------------------------ */
  /* Editor                                                              */
  /* ------------------------------------------------------------------ */
  var FONTS = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap";
  var editor = grapesjs.init({
    container: "#gjs",
    height: "100%",
    fromElement: false,
    storageManager: false,
    showOffsets: true,
    selectorManager: { componentFirst: true },
    // Only real changes are undoable; selecting things isn't.
    undoManager: { trackSelection: false },
    // Headings and paragraphs that contain styled words (em, strong, span…) are still plain text to edit.
    parser: { textTags: ["br", "b", "i", "u", "a", "ul", "ol", "em", "strong", "span", "small", "sup", "sub", "mark", "s", "code"] },
    canvas: { styles: [FONTS, SITE + "assets/css/styles.css", SITE + "assets/css/editor-global.css"] },
    deviceManager: { devices: [
      { id: "Desktop", name: "Desktop", width: "" },
      { id: "Tablet", name: "Tablet", width: "820px", widthMedia: "1023px" },
      { id: "Mobile", name: "Mobile", width: "390px", widthMedia: "759px" }
    ] },
    assetManager: {
      upload: false, multiUpload: true, autoAdd: false,
      uploadText: "Drop photos here or click to upload — they're resized for the web automatically",
      uploadFile: function (e) {
        var files = (e.dataTransfer || e.target).files;
        Array.prototype.forEach.call(files, function (file) {
          prepareImage(file).then(function (src) { editor.AssetManager.add({ type: "image", src: src, name: file.name }); });
        });
      }
    },
    // Building blocks first (like Elementor's Basic widgets), then the ready-made sections.
    blockManager: { blocks: ["Layout", "Elements", "Sections"].reduce(function (all, cat) { return all.concat(BLOCKS.filter(function (b) { return b[1] === cat; })); }, []).map(function (b) {
      return { id: b[0], category: b[1] === "Sections" ? "Ready-made sections" : b[1] === "Layout" ? "Layout & sections" : b[1], label: b[2], media: b[3], content: b[4], select: true, activate: b[0] === "el-image" };
    }) }
  });
  window.siteEditor = editor;

  // Downscale uploads to max 2200px and convert to WebP so the live site stays fast.
  function prepareImage(file) {
    return new Promise(function (resolve, reject) {
      if (file.type === "image/svg+xml" || file.type === "image/gif") {
        var r = new FileReader(); r.onload = function () { resolve(r.result); }; r.onerror = reject; r.readAsDataURL(file); return;
      }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 2200, s = Math.min(1, max / Math.max(im.width, im.height));
        var c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var out = c.toDataURL("image/webp", 0.82);
        resolve(out.indexOf("data:image/webp") === 0 ? out : c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = function () { reject(new Error("Could not read " + file.name)); };
      im.src = url;
    });
  }

  // YouTube embeds: edit the video by pasting its link or ID.
  editor.DomComponents.addType("yt-film", {
    isComponent: function (el) { return el.tagName === "BUTTON" && el.classList && el.classList.contains("yt"); },
    model: {
      defaults: { name: "YouTube film", droppable: false, traits: [{ type: "text", name: "data-id", label: "YouTube link or ID" }, { type: "text", name: "aria-label", label: "Label" }] },
      init: function () { this.on("change:attributes:data-id", this.syncThumb); },
      syncThumb: function () {
        var v = String(this.getAttributes()["data-id"] || "").trim();
        var m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        var id = m ? m[1] : v;
        if (id !== v) { this.addAttributes({ "data-id": id }); return; }
        var img = this.find("img")[0], cur = img ? img.get("src") || "" : "";
        // Follow the new video's thumbnail unless a custom thumbnail was chosen.
        if (img && (!cur || cur.indexOf("i.ytimg.com") >= 0)) img.set("src", "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg");
      }
    }
  });

  // Custom HTML block: edited as code from the panel (Content → Custom HTML), not piece by piece.
  function lockInside(c) { c.components().forEach(function (k) { k.set({ selectable: false, hoverable: false, editable: false, draggable: false, droppable: false, layerable: false, copyable: false, removable: false }); lockInside(k); }); }
  editor.DomComponents.addType("custom-html", {
    isComponent: function (el) { return el.classList && el.classList.contains("custom-html"); },
    model: {
      defaults: { name: "Custom HTML", droppable: false },
      init: function () { lockInside(this); this.listenTo(this.components(), "add reset", function () { lockInside(this); }); }
    }
  });

  // Swapping any photo: drop its old responsive srcset so the new photo shows immediately.
  editor.on("component:update:src", function (c) {
    var a = c.getAttributes();
    if (a.srcset || a.sizes) c.removeAttributes(["srcset", "sizes"]);
  });

  function pickPhoto(onPick) {
    editor.AssetManager.open({
      select: function (asset, complete) { onPick(asset.getSrc()); editor.AssetManager.close(); }
    });
  }

  /* ---------------- Photo panel: every photo in the selection, with Change + focus point ---------------- */
  // A "photo" is an <img> or any element showing a background-image (e.g. the inline photos in headlines).
  function bgUrl(c) {
    var v = (c.getStyle && c.getStyle()["background-image"]) || "";
    var m = v.match(/url\((['"]?)(.*?)\1\)/);
    return m ? m[2] : "";
  }
  function isImg(c) { return c.get("type") === "image" || c.get("tagName") === "img"; }
  function photoOf(c) {
    if (!c || !c.get) return null;
    if (c.closest && c.closest(".yt")) return null; // film thumbnails follow the YouTube video (Media → Change video)
    if (isImg(c) && c.get("src")) return { comp: c, kind: "img", src: c.get("src") };
    var u = bgUrl(c);
    return u ? { comp: c, kind: "bg", src: u } : null;
  }
  function photosIn(c, out) {
    out = out || [];
    var p = photoOf(c); if (p) out.push(p);
    if (out.length < 24) c.components().forEach(function (k) { photosIn(k, out); });
    return out;
  }
  // The selection's own photos; failing that, photos it sits on top of (e.g. a caption laid over a photo).
  function overlaps(a, b) {
    if (!a || !b) return false;
    var r = a.getBoundingClientRect(), q = b.getBoundingClientRect();
    var w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
    return w > 0 && h > 0 && w * h > 0.3 * r.width * r.height;
  }
  function photosFor(c) {
    var list = photosIn(c), up = c, hops = 0;
    if (list.length) return { list: list, from: c };
    while (hops < 3 && up.parent() && up.parent().get("type") !== "wrapper") {
      up = up.parent(); hops++;
      list = photosIn(up).filter(function (p) { return overlaps(c.getEl(), p.comp.getEl()); });
      if (list.length) return { list: list, from: up };
    }
    return { list: [], from: c };
  }
  function setPhoto(c, src) {
    if (isImg(c)) c.set("src", src);
    else c.addStyle({ "background-image": "url(" + src + ")" });
  }
  function focusOf(p) {
    var st = p.comp.getStyle()[p.kind === "img" ? "object-position" : "background-position"];
    var el = p.comp.getEl();
    if (!st && el) { var cs = el.ownerDocument.defaultView.getComputedStyle(el); st = p.kind === "img" ? cs.objectPosition : cs.backgroundPosition; }
    var m = String(st || "").match(/(-?[\d.]+)%\s+(-?[\d.]+)%/);
    return m ? [+m[1], +m[2]] : [50, 50];
  }
  function photoName(src) {
    if (/^data:/.test(src)) return "New upload (not published yet)";
    if (/^blob:/.test(src)) return "New upload";
    return decodeURIComponent(src.split("?")[0].split("/").pop()).replace(/-(480|800|1600)\.webp$/, "");
  }
  function photoLabel(p, i, n) {
    var el = p.comp.getEl();
    if (el && el.closest && el.closest(".hero__slides")) return "Slideshow photo " + (i + 1) + (i === 0 ? " (shows first)" : "");
    return n > 1 ? "Photo " + (i + 1) : "Photo";
  }
  // The editor window itself never scrolls (scrolling into the canvas can nudge it and hide the top bar).
  document.addEventListener("scroll", function (e) {
    var t = e.target === document ? document.scrollingElement : e.target;
    if (t === document.body || t === document.documentElement) { if (t.scrollTop || t.scrollLeft) { t.scrollTop = 0; t.scrollLeft = 0; } }
  }, true);

  // Hero slideshow: clicking the hero photo selects the whole slideshow so all four photos are listed.
  editor.DomComponents.addType("hero-slideshow", {
    isComponent: function (el) { return el.classList && el.classList.contains("hero__slides"); },
    model: { defaults: { name: "Slideshow photos", droppable: false } }
  });
  editor.on("component:selected", function (c) {
    var show = c && c.closest && c.closest(".hero__slides");
    if (show && show !== c) { editor.select(show); return; }
    if (c && c.get("type") === "hero-slideshow") toast("This is the hero slideshow: change each of its photos in the panel on the right.");
  });

  /* ---------------- Style panel shows what is actually applied ---------------- */
  var FONT_OPTIONS = [
    { id: '"Inter Tight", "Helvetica Neue", Arial, sans-serif', label: "Inter Tight (site sans)" },
    { id: '"Instrument Serif", "Times New Roman", serif', label: "Instrument Serif (site italic)" },
    { id: '"Geist Mono", ui-monospace, monospace', label: "Geist Mono (site labels)" },
    { id: "Arial, Helvetica, sans-serif", label: "Arial" }, { id: "Georgia, serif", label: "Georgia" },
    { id: '"Times New Roman", Times, serif', label: "Times New Roman" }, { id: "Verdana, Geneva, sans-serif", label: "Verdana" }
  ];
  editor.on("load", function () {
    try {
      var ff = editor.StyleManager.getProperty("typography", "font-family");
      if (ff) { if (ff.setOptions) ff.setOptions(FONT_OPTIONS); else ff.set("options", FONT_OPTIONS); }
    } catch (e) {}
  });
  function toHex(c) {
    var m = String(c).match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/);
    if (!m) return c;
    if (m[4] !== undefined && parseFloat(m[4]) < 1) return parseFloat(m[4]) === 0 ? "transparent" : c;
    return "#" + [m[1], m[2], m[3]].map(function (n) { return ("0" + (+n).toString(16)).slice(-2); }).join("");
  }
  function selEl() { var c = editor.getSelected(); return c && c.getEl ? c.getEl() : null; }
  function cstyle(el) { return el ? el.ownerDocument.defaultView.getComputedStyle(el) : null; }
  function effectiveBg(el) {
    while (el && el.nodeType === 1) {
      var b = toHex(cstyle(el).backgroundColor);
      if (b && b !== "transparent") return { color: b, own: el === selEl() };
      el = el.parentElement;
    }
    return { color: "#0d0b09", own: false };
  }
  function ownStyle() {
    var t = editor.StyleManager.getSelected && editor.StyleManager.getSelected();
    try { return (t && t.getStyle && t.getStyle()) || {}; } catch (e) { return {}; }
  }
  var WEIGHTS = { 100: "Thin", 200: "Extra-Light", 300: "Light", 400: "Normal", 500: "Medium", 600: "Semi-Bold", 700: "Bold", 800: "Extra-Bold", 900: "Ultra-Bold" };
  var filling = false;
  function fillComputed() {
    var el = selEl(), cs = cstyle(el);
    if (!cs || filling) return;
    filling = true;
    var own = ownStyle();
    document.querySelectorAll(".gjs-sm-property").forEach(function (prop) {
      if (prop.querySelector(".gjs-sm-property")) return; // composite wrapper: handled by its children
      var m = (prop.className.match(/gjs-sm-property__([a-z-]+)/) || [])[1];
      if (!m || own[m]) { prop.classList.remove("ed-has-computed"); return; }
      var v = cs.getPropertyValue(m);
      if (!v) return;
      if (/color/.test(m)) v = toHex(v);
      else v = v.replace(/(-?\d+\.\d+)px/g, function (x, n) { return (Math.round(parseFloat(n) * 10) / 10) + "px"; });
      var input = prop.querySelector(".gjs-field input:not([type=radio])"), select = prop.querySelector(".gjs-field select");
      if (input && !input.value) { input.placeholder = v; prop.classList.add("ed-has-computed"); }
      if (m === "color" || m === "background-color") {
        var sw = prop.querySelector(".gjs-field-color-picker");
        if (sw) sw.style.backgroundColor = v === "transparent" ? "" : v;
      }
      if (select && (m === "font-family" || m === "font-weight")) {
        var label = m === "font-family" ? v.split(",")[0].replace(/["']/g, "").trim() : (WEIGHTS[v] || v);
        var opt = select.querySelector("option[data-ed-cur]");
        if (!opt) { opt = document.createElement("option"); opt.setAttribute("data-ed-cur", ""); opt.value = ""; opt.className = "ed-current-opt"; select.insertBefore(opt, select.firstChild); }
        opt.textContent = label + " (current)";
        select.selectedIndex = 0; prop.classList.add("ed-has-computed");
      }
      if (m === "text-align") {
        var r = prop.querySelector("input[type=radio][value='" + v + "']");
        if (r && !prop.querySelector("input[type=radio]:checked")) r.checked = true;
      }
    });
    filling = false;
  }
  var smObs = new MutationObserver(function () { clearTimeout(smObs.t); smObs.t = setTimeout(fillComputed, 40); });
  editor.on("load", function () {
    var c = document.querySelector(".gjs-sm-sectors") || document.querySelector(".gjs-pn-views-container");
    if (c) smObs.observe(c, { childList: true, subtree: true });
  });
  editor.on("component:styleUpdate style:property:update", function () { setTimeout(function () { fillComputed(); updateColorDots(); }, 60); });

  // Show the selected element's current colours on the Colours button (and in its popover).
  function updateColorDots() {
    var el = selEl(), t = $("#cd-text"), b = $("#cd-bg"), cur = $("#pc-current");
    if (!el) { t.style.background = b.style.background = ""; cur.innerHTML = ""; document.querySelectorAll(".ed-sw.is-current").forEach(function (x) { x.classList.remove("is-current"); }); return; }
    var tc = toHex(cstyle(el).color), bg = effectiveBg(el);
    t.style.background = tc; b.style.background = bg.color;
    cur.innerHTML = "<span><i style='background:" + tc + "'></i>Text " + tc + "</span><span><i style='background:" + bg.color + "'></i>Background " + bg.color + (bg.own ? "" : " (from section)") + "</span>";
    document.querySelectorAll("#p-colors .ed-swatches").forEach(function (box) {
      var want = box.getAttribute("data-prop") === "color" ? tc : (bg.own ? bg.color : "");
      box.querySelectorAll(".ed-sw[data-hex]").forEach(function (sw) { sw.classList.toggle("is-current", sw.getAttribute("data-hex").toLowerCase() === String(want).toLowerCase()); });
    });
  }

  // Elementor-style: a single click on text starts typing, with the cursor where you clicked.
  function isTextComp(c) { return c && c.get("editable") && /^(text|link)$/.test(c.get("type")); }
  function caretAt(doc, x, y) {
    try {
      var r = doc.caretRangeFromPoint ? doc.caretRangeFromPoint(x, y) : null;
      if (!r && doc.caretPositionFromPoint) { var pos = doc.caretPositionFromPoint(x, y); if (pos) { r = doc.createRange(); r.setStart(pos.offsetNode, pos.offset); } }
      if (r) { var sel = doc.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    } catch (e) {}
  }
  function compFromEl(node) {
    var all = editor.getWrapper().find("*"), byEl = new Map();
    all.forEach(function (c) { var el = c.getEl(); if (el) byEl.set(el, c); });
    for (var n = node; n && n.nodeType === 1; n = n.parentNode) {
      var c = byEl.get(n);
      if (c && c.get("selectable") !== false) return c;
    }
    return null;
  }
  function startTyping(e, tries) {
    var c = editor.getSelected(), cel = c && c.getEl();
    // A click that only closed the previous text leaves it selected: select what was clicked instead.
    if (!cel || !cel.contains(e.target)) {
      var hit = compFromEl(e.target);
      if (!hit || !isTextComp(hit)) return;
      editor.select(hit); c = hit;
    }
    if (!isTextComp(c)) return;
    // Moving straight from one text to another: wait for the first to finish closing.
    if (editor.getEditing()) { if (editor.getEditing() !== c && (tries || 0) < 12) setTimeout(function () { startTyping(e, (tries || 0) + 1); }, 25); return; }
    var view = c.getView(), el = c.getEl();
    if (!view || !el || !el.contains(e.target) || !view.onActive) return;
    Promise.resolve(view.onActive(e)).then(function () { caretAt(el.ownerDocument, e.clientX, e.clientY); });
  }
  /* While dragging a block from the Add panel the mouse wheel doesn't work, so the page scrolls
     by itself when the pointer nears the top or bottom edge (faster the closer it gets). */
  var asSpeed = 0, asTimer = null;
  function autoscrollAt(y, height) {
    var edge = 110;
    asSpeed = y < edge ? -Math.ceil((edge - Math.max(y, -40)) / 5) : y > height - edge ? Math.ceil((y - (height - edge)) / 5) : 0;
    if (asSpeed && !asTimer) asTimer = setInterval(function () {
      if (!asSpeed) { clearInterval(asTimer); asTimer = null; return; }
      var w = editor.Canvas.getWindow(); if (w) w.scrollBy(0, asSpeed * 2);
    }, 16);
  }
  function stopAutoscroll() { asSpeed = 0; }
  editor.on("load", function () {
    var cdoc = editor.Canvas.getDocument(), cwin = editor.Canvas.getWindow();
    if (cdoc) {
      cdoc.addEventListener("dragover", function (e) { autoscrollAt(e.clientY, cwin.innerHeight); });
      ["drop", "dragend"].forEach(function (t) { cdoc.addEventListener(t, stopAutoscroll); });
    }
    // Just above the page preview (over the small toolbar) also scrolls up.
    document.addEventListener("dragover", function (e) {
      var fr = document.querySelector(".gjs-frame"); if (!fr) return;
      var r = fr.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY < r.top && e.clientY > r.top - 60) autoscrollAt(e.clientY - r.top, r.height);
      else if (e.clientY < r.top - 60 || e.clientX < r.left) stopAutoscroll();
    });
    ["drop", "dragend"].forEach(function (t) { document.addEventListener(t, stopAutoscroll); });
  });
  // After dropping a block, bring it into view.
  editor.on("block:drag:stop", function (c) {
    stopAutoscroll();
    var comp = Array.isArray(c) ? c[0] : c;
    if (comp && comp.getEl) setTimeout(function () { try { editor.Canvas.scrollTo(comp, { behavior: "smooth", block: "nearest" }); } catch (e) {} }, 120);
  });

  editor.on("load", function () {
    var doc = editor.Canvas.getDocument();
    // Typing counts as a change straight away, so Publish lights up while you type.
    if (doc) doc.addEventListener("input", function () { if (!state.loading && !state.dirty) { state.dirty = true; updateUI(); } }, true);
    // Capture phase: the editor stops click events from bubbling up to the document.
    if (doc) doc.addEventListener("click", function (e) {
      if (e.detail > 1 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var ev = { target: e.target, clientX: e.clientX, clientY: e.clientY, stopPropagation: function () {} };
      setTimeout(function () { startTyping(ev); }, 0);
    }, true);
  });

  // Clicking an element opens its styles (not right after dropping a new block from the panel).
  var lastDrop = 0;
  editor.on("block:drag:stop", function () { lastDrop = Date.now(); });
  editor.on("component:selected", function (c) {
    setTimeout(function () { updateColorDots(); fillComputed(); }, 80);
    if (!c || Date.now() - lastDrop < 800) return;
    // The element inspector (Content / Style / Advanced) opens on its Content tab; without it, open styles.
    if (window.__inspector) window.__inspector.show();
    else openStyle();
  });
  function openStyle() {
    var b = editor.Panels.getButton("views", "open-sm");
    if (b && !b.get("active")) b.set("active", true);
    ["typography", "decorations"].forEach(function (id) { try { var sec = editor.StyleManager.getSector(id); if (sec) (sec.setOpen ? sec.setOpen(true) : sec.set("open", true)); } catch (e) {} });
    setTimeout(fillComputed, 150);
  }
  editor.on("component:deselected", function () { setTimeout(updateColorDots, 50); });

  // Image library: every site photo plus anything uploaded this session.
  fetch("assets.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (list) {
    editor.AssetManager.add(list.map(function (a) { return { type: "image", src: SITE + a.src, name: a.name }; }));
  }).catch(function () {});

  editor.on("load", function () {
    var b = editor.Panels.getButton("views", "open-blocks");
    if (b) b.set("active", true);
    init();
  });

  // Edit mode: everything the live site animates or hides is shown, so every word and photo can be edited.
  var EDIT_MODE_CSS = [
    ".rotator{display:inline-flex!important;flex-wrap:wrap;gap:0 .22em;width:auto!important;overflow:visible!important;padding:0!important;margin:0!important}",
    ".rotator__word{transform:none!important;opacity:1!important;grid-area:auto!important}",
    ".rotator__word+.rotator__word::before{content:'/';opacity:.35;margin-right:.18em;font-style:normal}",
    ".hero__slide{animation:none!important;clip-path:none!important}.hero__slide img{transform:none!important}",
    ".hero__media{z-index:0!important}.hero__frame::before{z-index:1!important;pointer-events:none}.hero__content{z-index:3}.hero__card{z-index:4}",
    ".hscroll__intro{display:flex!important;flex-direction:column;justify-content:space-between;gap:24px;flex:none;width:340px;padding-right:24px}",
    ".masonry__tag,.index-row__cta{opacity:1!important;transform:none!important}",
    ".marquee__track{animation:none!important}",
    ".form-success{display:grid!important;gap:16px;margin-top:24px;padding:20px;border:1px dashed #c6a46a;border-radius:16px}",
    ".form-success::before{content:'Shown after the inquiry form is sent';font:12px ui-monospace,monospace;color:#c6a46a}",
    ".is-in,.reveal,.reveal-img{opacity:1!important;transform:none!important;clip-path:none!important}",
    ".custom-html{min-height:48px;outline:1px dashed rgba(198,164,106,.6);outline-offset:4px}",
    // Elementor-style drop zones (editor only): columns and new sections get padding and a minimum height,
    // so there's room to drop things inside them rather than next to them.
    ".ed-cols>*{min-height:110px;padding:16px;border-radius:12px;outline:1px dashed rgba(198,164,106,.45);outline-offset:-1px}",
    ".ed-cols>*:empty::before,.section>.container:empty::before{content:'Drop elements here';display:grid;place-items:center;min-height:78px;font:12px ui-monospace,monospace;color:rgba(198,164,106,.8)}",
    ".section>.container{min-height:96px;padding-block:16px}",
    ".stack:empty,.container:empty{min-height:96px}",
    // Elements hidden on a device stay selectable while editing: faded and outlined instead.
    "@media (max-width:759px){.hide-mobile{opacity:.35;outline:2px dashed #c6a46a;outline-offset:-2px}}",
    "@media (min-width:760px) and (max-width:1023px){.hide-tablet{opacity:.35;outline:2px dashed #c6a46a;outline-offset:-2px}}",
    "@media (min-width:1024px){.hide-desktop{opacity:.35;outline:2px dashed #c6a46a;outline-offset:-2px}}"
  ].join("");

  // Canvas helpers: make the header and mobile menu editable in place.
  function applyOverrides(target) {
    var doc = editor.Canvas.getDocument();
    if (!doc) return;
    var el = doc.getElementById("ed-overrides");
    if (!el) { el = doc.createElement("style"); el.id = "ed-overrides"; doc.head.appendChild(el); }
    doc.documentElement.classList.add("ed-edit");
    var css = "html body{background:var(--paper,#0d0b09)!important}" + EDIT_MODE_CSS + themeCss() + (state.siteCss || "");
    // Photos keep loading lazily (only near what's on screen), except inside sideways-scrolling strips,
    // which the browser can't see coming.
    Array.prototype.forEach.call(doc.querySelectorAll(".hscroll img[loading=lazy], .marquee img[loading=lazy]"), function (i) { i.loading = "eager"; });
    if (target === "@header") css += ".site-header{position:relative!important;transform:none!important;padding-bottom:12px}.mobile-menu{position:relative!important;inset:auto!important;clip-path:none!important;visibility:visible!important;min-height:620px}.mobile-menu__list a{opacity:1!important;transform:none!important}.skip-link{position:static!important;display:inline-block;margin:8px}";
    el.textContent = css;
  }

  /* ------------------------------------------------------------------ */
  /* Loading, drafts, publishing                                         */
  /* ------------------------------------------------------------------ */
  function draftKey(t) { return "dr-draft:" + cfg.owner + "/" + cfg.repo + ":" + t; }
  var draftTimer = null;
  function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      try { localStorage.setItem(draftKey(state.target), JSON.stringify({ t: Date.now(), html: unblob(editor.getHtml()), css: editor.getCss({ avoidProtected: true }), meta: state.metaChanged ? state.meta : null })); } catch (e) {}
    }, 600);
  }
  // "Dirty" means the content really differs from what was loaded (late load events are ignored).
  function snapshot() { return editor.getHtml() + "\n/*css*/\n" + editor.getCss({ avoidProtected: true }); }
  var checkTimer = null;
  editor.on("update", function () {
    if (state.loading) return;
    clearTimeout(checkTimer);
    checkTimer = setTimeout(function () {
      if (state.loading) return;
      var changed = state.metaChanged || snapshot() !== state.baseline;
      if (changed !== state.dirty) { state.dirty = changed; updateUI(); }
      if (changed) saveDraft(); else { try { localStorage.removeItem(draftKey(state.target)); } catch (e) {} }
    }, 350);
  });

  /* ---------------- Publishing status (always visible, top right) ---------------- */
  state.pub = null; // { phase: 'saved'|'live'|'slow'|'error', sha, url, time, file, version, message }
  function ago(t) {
    var s = Math.round((Date.now() - t) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    return new Date(t).toLocaleDateString();
  }
  function setStatus(text, kind) {
    var b = $("#ed-status"), label, s;
    if (text != null) { label = text; s = kind || "busy"; }
    else if (!cfg.token) { label = "Preview mode: sign in to publish"; s = "off"; }
    else if (state.dirty || state.themeChanged) { label = "Unpublished changes"; s = "dirty"; }
    else if (state.pub && state.pub.phase === "error") { label = "Publish failed: click for details"; s = "error"; }
    else if (state.pub && state.pub.phase === "saved") { label = "Saved ✓ · going live…"; s = "deploying"; }
    else if (state.pub && state.pub.phase === "slow") { label = "Saved ✓ · live site still updating"; s = "deploying"; }
    else if (state.pub && state.pub.phase === "live") { label = "Live on the website ✓ · " + ago(state.pub.time); s = "live"; }
    else { label = "Connected · everything is published"; s = "ok"; }
    b.setAttribute("data-s", s);
    b.querySelector(".ed-status__text").textContent = label;
  }
  setInterval(function () { if (!state.loading && !state.busy) setStatus(); }, 30000);

  // After a publish, poll the live site until it serves the new version.
  function versionTag(v) { return '<meta name="site-version" content="' + v + '">'; }
  function setVersion(html, v) {
    if (/<meta name="site-version" content="[^"]*">/.test(html)) return html.replace(/<meta name="site-version" content="[^"]*">/, function () { return versionTag(v); });
    return html.replace(/<meta charset="utf-8">/i, function (m) { return m + "\n" + versionTag(v); });
  }
  var liveTimer = null;
  function watchLive(path, version) {
    clearTimeout(liveTimer);
    var started = Date.now();
    (function poll() {
      fetch(SITE + path + "?check=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (txt) {
        if (!state.pub || state.pub.version !== version) return;
        if (txt.indexOf(version) >= 0) { state.pub.phase = "live"; setStatus(); toast("Live ✓ Your changes are now on the website.", false, "success"); return; }
        if (Date.now() - started > 6 * 60000) { state.pub.phase = "slow"; setStatus(); return; }
        liveTimer = setTimeout(poll, 6000);
      }).catch(function () { liveTimer = setTimeout(poll, 8000); });
    })();
  }

  /* ---------------- History: every saved version, with restore ---------------- */
  function historyFile() { return state.target.charAt(0) === "@" ? "index.html" : state.target; }
  function openHistory() {
    var box = $("#h-status"), list = $("#h-list");
    var lines = [];
    if (!cfg.token) lines.push("<strong>Not signed in</strong><span class='ed-muted'>You're in preview mode. Sign in (⚙) to publish.</span>");
    else if (state.pub) {
      var ph = { saved: "Saved ✓, waiting for the live site to update…", slow: "Saved ✓. The live site is taking longer than usual; it normally updates within a few minutes.",
        live: "Live on the website ✓", error: "Publish failed" }[state.pub.phase];
      lines.push("<strong>" + ph + "</strong>");
      if (state.pub.phase === "error") lines.push("<span class='ed-muted'>" + esc(state.pub.message || "") + "</span>");
      else lines.push("<span class='ed-muted'>" + esc(labelFor(state.pub.target)) + " · " + new Date(state.pub.time).toLocaleString() + "</span>");
    } else lines.push("<strong>" + (state.dirty || state.themeChanged ? "You have unpublished changes" : "Everything you see is published") + "</strong><span class='ed-muted'>Signed in as " + esc((window.__auth && window.__auth.user) || "editor") + "</span>");
    box.innerHTML = lines.join("");
    $("#h-title").textContent = "Saved versions of " + labelFor(state.target);
    list.innerHTML = cfg.token ? "<li class='ed-muted'>Loading history…</li>" : "";
    openModal("#m-history");
    if (!cfg.token) return;
    api("/commits?path=" + encodeURIComponent(historyFile()) + "&sha=" + encodeURIComponent(cfg.branch) + "&per_page=25").then(function (commits) {
      list.innerHTML = "";
      if (!commits.length) { list.innerHTML = "<li class='ed-muted'>No saved versions yet.</li>"; return; }
      commits.forEach(function (c, i) {
        var li = document.createElement("li"), when = new Date(c.commit.author.date);
        li.innerHTML = "<span class='h-msg'>" + esc(c.commit.message.split("\n")[0]) + (i === 0 ? "<span class='h-latest'>● current</span>" : "") + "</span>" +
          "<span class='h-meta'>" + when.toLocaleString() + "</span>" +
          "<span class='h-actions'>" +
          (i === 0 ? "" : "<button class='ed-btn' type='button' data-restore='" + c.sha + "'>Restore</button>") + "</span>";
        list.appendChild(li);
      });
    }).catch(function (e) { list.innerHTML = "<li class='ed-muted'>" + esc(e.message) + "</li>"; });
  }
  $("#h-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-restore]");
    if (!b) return;
    var sha = b.getAttribute("data-restore"), t = state.target, key = t.charAt(0) === "@" ? t.slice(1) : "main";
    b.disabled = true; b.textContent = "Loading…";
    api("/contents/" + encPath(historyFile()) + "?ref=" + sha).then(function (j) {
      var src = b64decode(j.content), html = region(src, key);
      if (html == null) throw new Error("That version has no editable " + key + " region.");
      state.loading = true;
      if (key === "main") setContent(toEditor(html), toEditor(pageStyles(src))); else editor.setComponents(toEditor(html));
      setTimeout(function () { state.loading = false; state.dirty = true; updateUI(); saveDraft(); applyOverrides(state.target); }, 250);
      closeModals();
      toast("Older version loaded into the editor. Review it, then click Publish to make it live again.");
    }).catch(function (err) { b.disabled = false; b.textContent = "Restore"; toast(err.message, true); });
  });
  $("#ed-status").addEventListener("click", function () { if (!cfg.token && !state.pub) openSettings(); else openHistory(); });

  /* ---------------- Colours ---------------- */
  var BRAND = [["Gold", "var(--accent)", "#c6a46a"], ["Light gold", "var(--gold-hi)", "#e2c999"], ["Ivory", "var(--ivory)", "#efe7da"],
    ["Soft text", "var(--ink-2)", "#c3b9a9"], ["Muted", "var(--muted)", "#8d8373"], ["Dark", "var(--paper)", "#0d0b09"],
    ["Surface", "var(--paper-2)", "#15120f"], ["White", "#ffffff", "#ffffff"]];
  function swatchHTML(withNone) {
    return BRAND.map(function (b) { return "<button class='ed-sw' type='button' title='" + b[0] + "' data-v='" + b[1] + "' data-hex='" + b[2] + "' style='background:" + b[2] + "'></button>"; }).join("") +
      "<label class='ed-sw ed-sw--custom' title='Any colour'><input type='color' value='#c6a46a'></label>" +
      (withNone ? "<button class='ed-sw ed-sw--none' type='button' title='Remove' data-v=''></button>" : "");
  }
  document.querySelectorAll("#p-colors .ed-swatches").forEach(function (box) {
    var prop = box.getAttribute("data-prop");
    box.innerHTML = swatchHTML(true);
    function apply(v) {
      var sel = editor.getSelected();
      if (!sel) { toast("Click something on the page first, then pick a colour.", true); return; }
      var st = {}; st[prop] = v;
      if (v) sel.addStyle(st); else sel.removeStyle(prop);
      // Text colour must also reach headings/links inside the element, which set their own colour.
      if (prop === "color") {
        var rule = editor.CssComposer.setRule("#" + sel.getId() + " :is(h1,h2,h3,p,a,li,span,em,strong,blockquote)", {});
        if (v) rule.setStyle({ color: "inherit" }); else editor.CssComposer.remove(rule);
      }
      editor.trigger("update");
      setTimeout(function () { updateColorDots(); fillComputed(); }, 60);
    }
    box.addEventListener("click", function (e) { var b = e.target.closest("button.ed-sw"); if (b) apply(b.getAttribute("data-v")); });
    box.querySelector("input[type=color]").addEventListener("input", function (e) { apply(e.target.value); });
  });
  function positionPop(pop, anchor) { var r = anchor.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(window.innerWidth - 330, r.left - 120)) + "px"; }
  $("#ed-colors").addEventListener("click", function (e) {
    var pop = $("#p-colors");
    if (!pop.hidden) { pop.hidden = true; return; }
    var sel = editor.getSelected();
    $("#pc-target").textContent = sel ? "(" + (sel.getName() || sel.get("tagName")) + ")" : "(nothing selected: click an element first)";
    positionPop(pop, e.currentTarget); pop.hidden = false; updateColorDots();
  });
  editor.on("component:selected", function () {
    var sel = editor.getSelected(); if (!$("#p-colors").hidden) $("#pc-target").textContent = sel ? "(" + (sel.getName() || sel.get("tagName")) + ")" : "";
  });
  document.addEventListener("mousedown", function (e) {
    var pop = $("#p-colors");
    if (!pop.hidden && !pop.contains(e.target) && e.target !== $("#ed-colors")) pop.hidden = true;
  });

  // Text colour inside the typing toolbar (for a few selected words).
  var rtePop = document.createElement("div"); rtePop.className = "ed-rte-pop"; rtePop.hidden = true; rtePop.innerHTML = swatchHTML(false);
  document.body.appendChild(rtePop);
  var rteRange = null, rteRef = null;
  editor.RichTextEditor.add("ed-color", {
    icon: '<b style="font-family:serif;font-size:15px;border-bottom:3px solid #c6a46a;line-height:1">A</b>',
    attributes: { title: "Text colour for the selected words" },
    result: function (rte) {
      var win = editor.Canvas.getWindow(), sel = win.getSelection();
      rteRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null; rteRef = rte;
      // Live inside GrapesJS's own text toolbar so picking a colour doesn't end text editing.
      var tb = editor.RichTextEditor.getToolbarEl ? editor.RichTextEditor.getToolbarEl() : document.querySelector(".gjs-rte-toolbar");
      if (tb && rtePop.parentNode !== tb) tb.appendChild(rtePop);
      rtePop.hidden = !rtePop.hidden;
    }
  });
  function rteColor(hex) {
    rtePop.hidden = true;
    if (!rteRef || !rteRange) return;
    var win = editor.Canvas.getWindow(), doc = win.document, sel = win.getSelection();
    win.focus(); sel.removeAllRanges(); sel.addRange(rteRange);
    try { doc.execCommand("styleWithCSS", false, true); } catch (e) {}
    rteRef.exec("foreColor", hex);
    // Prefer <span style="color"> over legacy <font> tags.
    doc.querySelectorAll("font[color]").forEach(function (f) { var sp = doc.createElement("span"); sp.style.color = f.getAttribute("color"); while (f.firstChild) sp.appendChild(f.firstChild); f.parentNode.replaceChild(sp, f); });
    editor.trigger("update");
  }
  rtePop.addEventListener("mousedown", function (e) { if (e.target.tagName !== "INPUT") e.preventDefault(); e.stopPropagation(); });
  rtePop.addEventListener("click", function (e) { var b = e.target.closest("button.ed-sw"); if (b) rteColor(b.getAttribute("data-hex")); });
  rtePop.querySelector("input[type=color]").addEventListener("change", function (e) { rteColor(e.target.value); });
  document.addEventListener("mousedown", function (e) { if (!rtePop.hidden && !rtePop.contains(e.target)) rtePop.hidden = true; });

  /* ---------------- Site theme (brand colours on every page) ---------------- */
  var THEME_VARS = [["--accent", "Gold accent (buttons, highlights)", "#c6a46a"], ["--gold-hi", "Light gold (headline accents)", "#e2c999"],
    ["--paper", "Page background", "#0d0b09"], ["--paper-2", "Card background", "#15120f"], ["--paper-3", "Raised areas", "#1e1a16"], ["--ink", "Main text", "#efe7da"],
    ["--ink-2", "Body text", "#c3b9a9"], ["--muted", "Small labels", "#8d8373"], ["--ivory", "Light buttons & text on photos", "#efe7da"]];
  state.theme = {}; state.themeChanged = false;
  function themeCss() {
    var keys = Object.keys(state.theme || {}); if (!keys.length) return "";
    return ":root{" + keys.map(function (k) { return k + ":" + state.theme[k]; }).join(";") + "}" + (state.theme["--accent"] ? ".btn--gold,.tile--gold{border-color:" + state.theme["--accent"] + "}" : "");
  }
  function parseTheme(g) {
    var t = {}, css = cssRegion(g, "theme"), re = /(--[a-z0-9-]+)\s*:\s*([^;}]+)/g, m;
    while ((m = re.exec(css))) t[m[1]] = m[2].trim();
    return t;
  }
  state.siteCss = "";
  function loadTheme() { return readFile("assets/css/editor-global.css").then(function (g) { state.theme = parseTheme(g); state.siteCss = cssRegion(g, "custom"); }).catch(function () {}); }
  function renderTheme() {
    $("#theme-fields").innerHTML = THEME_VARS.map(function (v) {
      var val = state.theme[v[0]] || v[2];
      return "<label><input type='color' data-var='" + v[0] + "' value='" + (/^#[0-9a-f]{6}$/i.test(val) ? val : v[2]) + "'><span>" + v[1] + "</span><code>" + v[0] + "</code></label>";
    }).join("");
  }
  $("#pc-theme").addEventListener("click", function () {
    $("#p-colors").hidden = true;
    if (window.__inspector && window.__inspector.openSite) window.__inspector.openSite(); else { renderTheme(); openModal("#m-theme"); }
  });
  $("#theme-fields").addEventListener("input", function (e) {
    var v = e.target.getAttribute("data-var"); if (!v) return;
    state.theme[v] = e.target.value; applyOverrides(state.target);
  });
  $("#theme-reset").addEventListener("click", function () { state.theme = {}; state.themeChanged = true; renderTheme(); applyOverrides(state.target); updateUI(); });
  $("#f-theme").addEventListener("submit", function (e) { e.preventDefault(); state.themeChanged = true; closeModals(); updateUI(); toast("Theme updated. Click Publish to put it live on every page."); });
  function updateUI() {
    setStatus();
    var pending = state.dirty || state.themeChanged, pb = $("#ed-publish");
    // Publish shows the real state: changes to publish, publishing, or everything already live.
    pb.disabled = !!state.busy || (!pending && !!cfg.token);
    pb.classList.toggle("is-busy", !!state.busy);
    pb.classList.toggle("is-done", !state.busy && !pending && !!cfg.token);
    pb.textContent = state.busy ? "Publishing…" : (!pending && cfg.token) ? "Published ✓" : "Publish";
    pb.title = state.busy ? "Saving your changes" : (!pending && cfg.token) ? "Everything you see is published" : "Put your changes live on the website";
    $("#ed-discard").disabled = !pending || !!state.busy;
    $("#ed-live").href = SITE + (state.target.charAt(0) === "@" ? "index.html" : state.target);
    $("#ed-page-settings").disabled = state.target.charAt(0) === "@";
  }
  function fillTargets() {
    var sel = $("#ed-target");
    sel.innerHTML = "";
    var g1 = document.createElement("optgroup"); g1.label = "Pages";
    state.pages.forEach(function (p) { var o = document.createElement("option"); o.value = p; o.textContent = labelFor(p); g1.appendChild(o); });
    var g2 = document.createElement("optgroup"); g2.label = "Shared on every page";
    GLOBALS.forEach(function (g) { var o = document.createElement("option"); o.value = g[0]; o.textContent = g[1]; g2.appendChild(o); });
    sel.appendChild(g1); sel.appendChild(g2);
    sel.value = state.target;
  }

  function load(target) {
    state.loading = true; setStatus("Loading " + labelFor(target) + "…");
    var p;
    if (target.charAt(0) === "@") {
      var key = target.slice(1);
      p = Promise.all([readFile("index.html"), readFile("assets/css/editor-global.css").catch(function () { return DEFAULT_GLOBAL_CSS; })]).then(function (r) {
        var html = region(r[0], key);
        if (html == null) throw new Error("The home page has no editable " + key + " region.");
        return { html: html, css: cssRegion(r[1], key), meta: null };
      });
    } else {
      p = readFile(target).then(function (src) {
        var html = region(src, "main");
        if (html == null) throw new Error(target + " has no editable region markers.");
        return { html: html, css: pageStyles(src), meta: getMeta(src) };
      });
    }
    return p.then(function (d) {
      setContent(toEditor(d.html), toEditor(d.css));
      editor.UndoManager.clear();
      editor.select(null);
      state.target = target; state.meta = d.meta; state.metaChanged = false;
      if (state.meta) state.meta.origCanonical = state.meta.canonical;
      applyOverrides(target);
      setTimeout(function () { applyOverrides(target); }, 300);
      var draft = null;
      try { draft = JSON.parse(localStorage.getItem(draftKey(target)) || "null"); } catch (e) {}
      setTimeout(function () {
        state.loading = false; state.dirty = false; state.baseline = snapshot();
        if (draft && confirm("You have unpublished changes to " + labelFor(target) + " from " + new Date(draft.t).toLocaleString() + ". Restore them?")) {
          state.loading = true;
          setContent(draft.html, draft.css);
          if (draft.meta) { state.meta = draft.meta; state.metaChanged = true; }
          setTimeout(function () { state.loading = false; state.dirty = true; updateUI(); }, 200);
        } else if (draft) {
          localStorage.removeItem(draftKey(target));
        }
        updateUI();
      }, 250);
      $("#ed-target").value = target;
      try { history.replaceState(null, "", "#" + target); } catch (e) {}
    }).catch(function (e) {
      state.loading = false; toast(e.message, true); updateUI();
    });
  }

  function currentExport() {
    var html = cleanHtml(editor.getHtml());
    var css = fromEditor(editor.getCss({ avoidProtected: true }) || "");
    return extractUploads(html, css);
  }

  function setBusy(on, text) {
    state.busy = on;
    ["#ed-target", "#ed-new-page"].forEach(function (s) { $(s).disabled = on; });
    updateUI();
    if (on) setStatus(text);
  }
  // Text being typed is only saved into the page when editing stops; finish it before publishing.
  function flushEditing() {
    var ed = editor.getEditing(), v = ed && ed.getView();
    if (!v || !v.disableEditing) return Promise.resolve();
    return Promise.resolve(v.disableEditing()).catch(function () {}).then(function () {
      if (!state.loading) state.dirty = state.metaChanged || snapshot() !== state.baseline;
    });
  }

  function publish() {
    if (!cfg.token) { openSettings("Sign in to publish your changes."); return; }
    if (state.busy) return;
    flushEditing().then(doPublish);
  }
  function doPublish() {
    if (!state.dirty && !state.themeChanged) { updateUI(); toast("Everything is already published ✓"); return; }
    var t = state.target, out = currentExport(), files = out.files.slice();
    var version = "v" + Date.now().toString(36), globalCss = null, checkPath = t.charAt(0) === "@" ? "index.html" : t;
    setBusy(true, "Publishing…");
    var job;
    if (t.charAt(0) === "@") {
      var key = t.slice(1);
      job = listPages().then(function (pages) {
        return pages.reduce(function (p, page) {
          return p.then(function () {
            return readFile(page).then(function (src) {
              if (region(src, key) == null) return;
              var html = out.html;
              if (key === "header") { // keep the "you are here" highlight correct on each page
                html = html.replace(/\s*aria-current="page"/g, "").split('href="' + page + '"').join('href="' + page + '" aria-current="page"');
              }
              files.push({ path: page, content: setVersion(markEdited(setRegion(src, key, html)), version) });
            });
          });
        }, Promise.resolve());
      }).then(function () { globalCss = { key: key, css: out.css }; });
    } else {
      job = readFile(t).then(function (src) {
        src = setPageStyles(setRegion(src, "main", out.html), out.css);
        if (state.metaChanged && state.meta) src = applyMeta(src, state.meta);
        files.push({ path: t, content: setVersion(markEdited(src), version) });
        if (!(state.metaChanged && state.meta)) return;
        if (state.meta.ogUpload) files.push(state.meta.ogUpload);
        if (!state.meta.canonical) return;
        return readFile("sitemap.xml").then(function (xml) {
          var nx = sitemapWith(xml, state.meta.canonical, !state.meta.noindex && t !== "404.html", state.meta.origCanonical);
          if (nx !== xml) files.push({ path: "sitemap.xml", content: nx });
        }).catch(function () {});
      });
    }
    var themeOnly = !state.dirty && state.themeChanged;
    job.then(function () {
      if (!globalCss && !state.themeChanged) return;
      return readFile("assets/css/editor-global.css").catch(function () { return DEFAULT_GLOBAL_CSS; }).then(function (g) {
        if (globalCss) g = setCssRegion(g, globalCss.key, globalCss.css);
        if (state.themeChanged) {
          g = setCssRegion(g, "theme", themeCss() ? themeCss().replace(/\.btn--gold[\s\S]*$/, "") : "");
          g = setCssRegion(g, "custom", state.siteCss || "");
        }
        g = g.replace(/^\/\* site-version: [^*]*\*\/\n?/, "");
        files.push({ path: "assets/css/editor-global.css", content: "/* site-version: " + version + " */\n" + g });
        if (themeOnly) checkPath = "assets/css/editor-global.css";
      });
    }).then(function () {
      if (themeOnly) files = files.filter(function (f) { return f.path === "assets/css/editor-global.css"; });
      return commitFiles(files, (themeOnly ? "Update site theme colours" : "Update " + labelFor(t) + (state.themeChanged ? " and site theme" : "")) + " via site editor");
    }).then(function (c) {
      state.themeChanged = false;
      state.pub = { phase: "saved", sha: c.sha, url: c.html_url || ("https://github.com/" + cfg.owner + "/" + cfg.repo + "/commit/" + c.sha), time: Date.now(), target: t, version: version };
      watchLive(checkPath, version);
      try { localStorage.removeItem(draftKey(t)); } catch (e) {}
      state.dirty = false; state.metaChanged = false; state.baseline = snapshot();
      if (state.meta) { delete state.meta.ogUpload; state.meta.origCanonical = state.meta.canonical; }
      // Swap uploaded data URLs for their new file paths so further edits stay light.
      if (out.files.length) { state.loading = true; setContent(toEditor(out.html), toEditor(out.css)); setTimeout(function () { state.loading = false; state.baseline = snapshot(); }, 250); }
      toast("Published ✓ Your changes go live on the website in about a minute.", false, "success");
    }).catch(function (e) {
      state.pub = { phase: "error", message: e.message, time: Date.now(), target: t };
      toast("Publish failed: " + e.message, true);
    }).then(function () { setBusy(false); });
  }

  function createPage(name) {
    var slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return Promise.reject(new Error("Please enter a page name."));
    var file = slug + ".html";
    if (state.pages.indexOf(file) >= 0) return Promise.reject(new Error(file + " already exists."));
    var starter = '<section class="page-hero"><div class="container"><div class="page-hero__meta"><span class="label label--dot">' + esc(name) + '</span><span class="label">Dan Reynolds</span></div>' +
      '<div class="page-hero__grid"><h1 class="h-xl page-hero__title">' + esc(name) + '</h1><p class="lede">Introduce this page here. Drag sections in from the Blocks panel.</p></div></div></section>';
    return readFile("contact.html").then(function (src) {
      var html = setPageStyles(setRegion(src, "main", starter), "");
      html = applyMeta(html, { title: name + " — Dan Reynolds Photography", desc: name + " — Dan Reynolds Photography" });
      html = html.replace(/<link rel="canonical" href="[^"]*">/, function (m) { return m.replace(/[^/"]+">$/, slug + '">'); })
                 .replace(/<meta property="og:url" content="[^"]*">/, function (m) { return m.replace(/[^/"]+">$/, slug + '">'); })
                 .replace(/\s*aria-current="page"/g, "");
      var loc = getMeta(html).canonical;
      return readFile("sitemap.xml").then(function (xml) { return sitemapWith(xml, loc, true); }).catch(function () { return null; }).then(function (xml) {
        var files = [{ path: file, content: markEdited(html) }];
        if (xml) files.push({ path: "sitemap.xml", content: xml });
        return commitFiles(files, "Add page " + file + " via site editor");
      });
    }).then(function () {
      state.pages.push(file); fillTargets(); return file;
    });
  }

  /* ------------------------------------------------------------------ */
  /* UI wiring                                                           */
  /* ------------------------------------------------------------------ */
  var toastTimer = null;
  function toast(msg, isError, link) {
    var t = $("#ed-toast");
    t.innerHTML = ""; t.appendChild(document.createTextNode(msg));
    t.classList.toggle("is-error", !!isError); t.classList.toggle("is-success", link === "success"); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 9000 : 6000);
  }
  function openModal(id) { $(id).hidden = false; var f = $(id).querySelector("input, textarea"); if (f) setTimeout(function () { f.focus(); }, 30); }
  function closeModals() { document.querySelectorAll(".ed-modal").forEach(function (m) { m.hidden = true; }); }
  document.querySelectorAll(".ed-modal").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m || (e.target.closest && e.target.closest("[data-close]"))) closeModals(); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModals();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); toast("Draft saved on this computer. Click Publish to put it live."); }
  });

  // ⚙ opens the account panel (sign-in, team, GitHub token), provided by auth.js.
  function openSettings(note) { if (window.__auth) window.__auth.openAccount(note); }
  $("#ed-settings").addEventListener("click", function () { openSettings(); });

  $("#ed-target").addEventListener("change", function (e) {
    var t = e.target.value;
    if (state.dirty && !confirm("You have unpublished changes to " + labelFor(state.target) + ". They're kept as a draft on this computer. Switch anyway?")) { e.target.value = state.target; return; }
    load(t);
  });
  $("#ed-page-settings").addEventListener("click", function () { if (window.__seo) window.__seo.open(); });
  $("#ed-new-page").addEventListener("click", function () {
    if (!cfg.token) { openSettings("Sign in to add pages."); return; }
    $("#f-new").reset(); openModal("#m-new");
  });
  $("#f-new").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = e.target.name.value;
    closeModals(); setBusy(true, "Creating page…");
    createPage(name).then(function (file) { setBusy(false); toast("Page created. It's live at " + file + " in about a minute."); return load(file); })
      .catch(function (err) { setBusy(false); toast(err.message, true); });
  });
  $("#ed-code").addEventListener("click", function () {
    var f = $("#f-code");
    f.html.value = cleanHtml(editor.getHtml()); f.css.value = fromEditor(editor.getCss({ avoidProtected: true }) || "");
    openModal("#m-code");
  });
  $("#f-code").addEventListener("submit", function (e) {
    e.preventDefault();
    setContent(toEditor(e.target.html.value), toEditor(e.target.css.value));
    state.dirty = true; updateUI(); saveDraft(); closeModals();
  });
  document.querySelectorAll("[data-device]").forEach(function (b) {
    b.addEventListener("click", function () {
      editor.setDevice(b.getAttribute("data-device"));
      document.querySelectorAll("[data-device]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    });
  });
  $("#ed-undo").addEventListener("click", function () { editor.UndoManager.undo(); updateUndo(); });
  $("#ed-redo").addEventListener("click", function () { editor.UndoManager.redo(); updateUndo(); });
  // Undo / Redo are greyed out when there's nothing to undo or redo.
  function updateUndo() {
    var um = editor.UndoManager;
    $("#ed-undo").disabled = !um.hasUndo();
    $("#ed-redo").disabled = !um.hasRedo();
  }
  var undoTimer;
  editor.on("update undo redo change:changesCount component:update component:add component:remove", function () { clearTimeout(undoTimer); undoTimer = setTimeout(updateUndo, 60); });
  setInterval(updateUndo, 1500);
  updateUndo();
  $("#ed-preview").addEventListener("click", function () {
    if (editor.Commands.isActive("preview")) editor.stopCommand("preview"); else editor.runCommand("preview");
  });
  $("#ed-publish").addEventListener("click", publish);
  /* ---------------- Discard unpublished edits ---------------- */
  $("#ed-discard").addEventListener("click", function () {
    if (!(state.dirty || state.themeChanged)) return;
    if (!confirm("Discard all unpublished changes to " + labelFor(state.target) + (state.themeChanged ? " and the theme colours" : "") + "?\n\nThe page goes back to what is currently published. This can't be undone.")) return;
    try { localStorage.removeItem(draftKey(state.target)); } catch (e) {}
    state.dirty = false; state.metaChanged = false;
    var reTheme = state.themeChanged ? loadTheme() : Promise.resolve();
    state.themeChanged = false;
    reTheme.then(function () { return load(state.target); }).then(function () { toast("Changes discarded. You're looking at the published version again."); });
  });

  window.addEventListener("beforeunload", function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  function init() {
    var hash = decodeURIComponent(location.hash.slice(1));
    loadTheme().then(function () { applyOverrides(state.target); });
    // Open the page straight away; the page list (for the dropdown) loads alongside it.
    var start = hash && (/^[\w.-]+\.html$/.test(hash) || hash.charAt(0) === "@") ? hash : "index.html";
    fillTargets();
    load(start).catch(function () { if (start !== "index.html") load("index.html"); });
    listPages().catch(function () { return state.pages; }).then(function (p) { state.pages = p; fillTargets(); });
    if (!cfg.token) setTimeout(function () { toast("Preview mode: you can try everything, but sign in to publish."); }, 1200);
  }

  // Exposed for automated checks.
  window.__siteEditor = { region: region, setRegion: setRegion, cleanHtml: cleanHtml, extractUploads: extractUploads, currentExport: currentExport, publish: publish, load: load, state: state, cfg: cfg,
    api: api, readFile: readFile, listPages: listPages, commitFiles: commitFiles, toast: toast, openModal: openModal, closeModals: closeModals,
    setVersion: setVersion, markEdited: markEdited, labelFor: labelFor, updateUI: updateUI, prepareImage: prepareImage, pickPhoto: pickPhoto, photoOf: photoOf, setPhoto: setPhoto, photosFor: photosFor, focusOf: focusOf, photoName: photoName, photoLabel: photoLabel,
    toEditor: toEditor, fromEditor: fromEditor, getMeta: getMeta, applyMeta: applyMeta, saveDraft: saveDraft, PAGE_NAMES: PAGE_NAMES, openStyle: openStyle, fillComputed: fillComputed, updateColorDots: updateColorDots, applyOverrides: applyOverrides,
    openSettings: openSettings, encPath: encPath, SITE: SITE, editor: editor };
})();
