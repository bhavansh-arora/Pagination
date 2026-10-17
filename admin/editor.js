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
  function saveCfg() { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {} }

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
        var msg = j.message || r.statusText;
        if (r.status === 401) msg = "The token was rejected. Check it in Settings.";
        if (r.status === 403 || r.status === 404) msg += " (check the token has Contents: Read and write access to " + cfg.owner + "/" + cfg.repo + ")";
        throw new Error("GitHub " + r.status + ": " + msg);
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
  function getMeta(html) {
    var t = html.match(/<title>([\s\S]*?)<\/title>/), d = html.match(/<meta name="description" content="([^"]*)"/);
    var un = function (s) { var x = document.createElement("textarea"); x.innerHTML = s; return x.value; };
    return { title: t ? un(t[1]) : "", desc: d ? un(d[1]) : "" };
  }
  function applyMeta(html, meta) {
    var t = esc(meta.title), d = esc(meta.desc);
    return html
      .replace(/<title>[\s\S]*?<\/title>/, function () { return "<title>" + t + "</title>"; })
      .replace(/<meta name="description" content="[^"]*">/, function () { return '<meta name="description" content="' + d + '">'; })
      .replace(/<meta property="og:title" content="[^"]*">/, function () { return '<meta property="og:title" content="' + t + '">'; })
      .replace(/<meta property="og:description" content="[^"]*">/, function () { return '<meta property="og:description" content="' + d + '">'; });
  }
  // Relative site URLs become absolute inside the editor canvas, and back on export.
  function toEditor(s) { return (s || "").replace(/(["'(\s,=])assets\//g, function (m, p) { return p + SITE + "assets/"; }); }
  function fromEditor(s) { return (s || "").split(SITE + "assets/").join("assets/"); }
  function cleanHtml(html) {
    html = fromEditor(html.replace(/^\s*<body[^>]*>/i, "").replace(/<\/body>\s*$/i, ""));
    var doc = new DOMParser().parseFromString('<div id="ed-root">' + html + "</div>", "text/html");
    var root = doc.getElementById("ed-root");
    // When a photo is swapped, drop its old responsive srcset so the new photo is what loads.
    root.querySelectorAll("img[srcset]").forEach(function (img) {
      var src = img.getAttribute("src") || "";
      var stem = src.split("/").pop().replace(/-(480|800|1600)\.webp$/, "");
      if (!stem || src.indexOf("data:") === 0 || img.getAttribute("srcset").indexOf(stem + "-") < 0) {
        img.removeAttribute("srcset"); img.removeAttribute("sizes");
      }
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
    ["lay-section", "Layout", "Empty section", ico('<rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3"/>'),
      '<section class="section"><div class="container"><p class="body">Empty section. Drag elements in here.</p></div></section>'],
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
    blockManager: { blocks: BLOCKS.map(function (b) { return { id: b[0], category: b[1], label: b[2], media: b[3], content: b[4], select: true, activate: b[0] === "el-image" }; }) }
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
        var img = this.find("img")[0];
        if (img) img.set("src", "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg");
      }
    }
  });

  // Image library: every site photo plus anything uploaded this session.
  fetch("assets.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (list) {
    editor.AssetManager.add(list.map(function (a) { return { type: "image", src: SITE + a.src, name: a.name }; }));
  }).catch(function () {});

  editor.on("load", function () {
    var b = editor.Panels.getButton("views", "open-blocks");
    if (b) b.set("active", true);
    init();
  });

  // Canvas helpers: make the header and mobile menu editable in place.
  function applyOverrides(target) {
    var doc = editor.Canvas.getDocument();
    if (!doc) return;
    var el = doc.getElementById("ed-overrides");
    if (!el) { el = doc.createElement("style"); el.id = "ed-overrides"; doc.head.appendChild(el); }
    var css = "body{background:#0d0b09}";
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
      try { localStorage.setItem(draftKey(state.target), JSON.stringify({ t: Date.now(), html: editor.getHtml(), css: editor.getCss({ avoidProtected: true }), meta: state.metaChanged ? state.meta : null })); } catch (e) {}
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

  function setStatus(text) {
    var s = $("#ed-status");
    s.textContent = text != null ? text : (state.dirty ? "Unpublished changes" : (cfg.token ? "Connected to GitHub" : "Preview mode: connect GitHub to publish"));
    s.classList.toggle("is-dirty", !!state.dirty && text == null);
  }
  function updateUI() {
    setStatus();
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
      editor.setComponents(toEditor(d.html));
      editor.setStyle(toEditor(d.css));
      editor.UndoManager.clear();
      editor.select(null);
      state.target = target; state.meta = d.meta; state.metaChanged = false;
      applyOverrides(target);
      var draft = null;
      try { draft = JSON.parse(localStorage.getItem(draftKey(target)) || "null"); } catch (e) {}
      setTimeout(function () {
        state.loading = false; state.dirty = false; state.baseline = snapshot();
        if (draft && confirm("You have unpublished changes to " + labelFor(target) + " from " + new Date(draft.t).toLocaleString() + ". Restore them?")) {
          state.loading = true;
          editor.setComponents(draft.html); editor.setStyle(draft.css);
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
    ["#ed-publish", "#ed-target", "#ed-new-page"].forEach(function (s) { $(s).disabled = on; });
    if (on) setStatus(text); else updateUI();
  }

  function publish() {
    if (!cfg.token) { openSettings("Connect to GitHub to publish your changes."); return; }
    var t = state.target, out = currentExport(), files = out.files.slice();
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
              files.push({ path: page, content: markEdited(setRegion(src, key, html)) });
            });
          });
        }, Promise.resolve());
      }).then(function () {
        return readFile("assets/css/editor-global.css").catch(function () { return DEFAULT_GLOBAL_CSS; });
      }).then(function (g) {
        files.push({ path: "assets/css/editor-global.css", content: setCssRegion(g, key, out.css) });
      });
    } else {
      job = readFile(t).then(function (src) {
        src = setPageStyles(setRegion(src, "main", out.html), out.css);
        if (state.metaChanged && state.meta) src = applyMeta(src, state.meta);
        files.push({ path: t, content: markEdited(src) });
      });
    }
    job.then(function () {
      return commitFiles(files, "Update " + labelFor(t) + " via site editor");
    }).then(function (c) {
      try { localStorage.removeItem(draftKey(t)); } catch (e) {}
      state.dirty = false; state.metaChanged = false; state.baseline = snapshot();
      // Swap uploaded data URLs for their new file paths so further edits stay light.
      if (out.files.length) { state.loading = true; editor.setComponents(toEditor(out.html)); editor.setStyle(toEditor(out.css)); setTimeout(function () { state.loading = false; state.baseline = snapshot(); }, 250); }
      toast("Published! The live site updates in about a minute.", false, c.html_url);
    }).catch(function (e) {
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
      return commitFiles([{ path: file, content: markEdited(html) }], "Add page " + file + " via site editor");
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
    if (link) { var a = document.createElement("a"); a.href = link; a.target = "_blank"; a.rel = "noopener"; a.textContent = "View change"; t.appendChild(a); }
    t.classList.toggle("is-error", !!isError); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 9000 : 6000);
  }
  function openModal(id) { $(id).hidden = false; var f = $(id).querySelector("input, textarea"); if (f) setTimeout(function () { f.focus(); }, 30); }
  function closeModals() { document.querySelectorAll(".ed-modal").forEach(function (m) { m.hidden = true; }); }
  document.querySelectorAll(".ed-modal").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m || e.target.hasAttribute("data-close")) closeModals(); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModals();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); toast("Draft saved on this computer. Click Publish to put it live."); }
  });

  function openSettings(note) {
    var f = $("#f-settings");
    f.owner.value = cfg.owner; f.repo.value = cfg.repo; f.branch.value = cfg.branch; f.token.value = cfg.token;
    $("#settings-msg").textContent = note || ""; $("#settings-msg").classList.remove("is-ok");
    openModal("#m-settings");
  }
  $("#ed-settings").addEventListener("click", function () { openSettings(); });
  $("#ed-forget").addEventListener("click", function () { cfg.token = ""; saveCfg(); $("#f-settings").token.value = ""; $("#settings-msg").textContent = "Token removed from this browser."; updateUI(); });
  $("#f-settings").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, msg = $("#settings-msg");
    cfg.owner = f.owner.value.trim(); cfg.repo = f.repo.value.trim(); cfg.branch = f.branch.value.trim() || "main"; cfg.token = f.token.value.trim();
    saveCfg(); msg.classList.remove("is-ok"); msg.textContent = "Checking…";
    api("").then(function (repo) {
      if (cfg.token && repo.permissions && !repo.permissions.push) throw new Error("This token can read the repository but cannot publish to it.");
      msg.classList.add("is-ok"); msg.textContent = "Connected to " + repo.full_name + ".";
      return listPages().then(function (p) { state.pages = p; fillTargets(); updateUI(); setTimeout(closeModals, 700); });
    }).catch(function (err) { msg.textContent = err.message; });
  });

  $("#ed-target").addEventListener("change", function (e) {
    var t = e.target.value;
    if (state.dirty && !confirm("You have unpublished changes to " + labelFor(state.target) + ". They're kept as a draft on this computer. Switch anyway?")) { e.target.value = state.target; return; }
    load(t);
  });
  $("#ed-page-settings").addEventListener("click", function () {
    if (!state.meta) return;
    var f = $("#f-page"); f.title.value = state.meta.title; f.desc.value = state.meta.desc; openModal("#m-page");
  });
  $("#f-page").addEventListener("submit", function (e) {
    e.preventDefault();
    state.meta = { title: e.target.title.value.trim(), desc: e.target.desc.value.trim() };
    state.metaChanged = true; state.dirty = true; updateUI(); saveDraft(); closeModals();
  });
  $("#ed-new-page").addEventListener("click", function () {
    if (!cfg.token) { openSettings("Connect to GitHub to add pages."); return; }
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
    editor.setComponents(toEditor(e.target.html.value)); editor.setStyle(toEditor(e.target.css.value));
    state.dirty = true; updateUI(); saveDraft(); closeModals();
  });
  document.querySelectorAll("[data-device]").forEach(function (b) {
    b.addEventListener("click", function () {
      editor.setDevice(b.getAttribute("data-device"));
      document.querySelectorAll("[data-device]").forEach(function (x) { x.classList.toggle("is-active", x === b); });
    });
  });
  $("#ed-undo").addEventListener("click", function () { editor.UndoManager.undo(); });
  $("#ed-redo").addEventListener("click", function () { editor.UndoManager.redo(); });
  $("#ed-preview").addEventListener("click", function () {
    if (editor.Commands.isActive("preview")) editor.stopCommand("preview"); else editor.runCommand("preview");
  });
  $("#ed-publish").addEventListener("click", publish);
  window.addEventListener("beforeunload", function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });

  function init() {
    var hash = decodeURIComponent(location.hash.slice(1));
    listPages().catch(function () { return state.pages; }).then(function (p) {
      state.pages = p; fillTargets();
      var start = (hash && (p.indexOf(hash) >= 0 || hash.charAt(0) === "@")) ? hash : "index.html";
      load(start);
      if (!cfg.token) setTimeout(function () { toast("Preview mode: you can try everything, but connect GitHub (⚙ Settings) to publish."); }, 1200);
    });
  }

  // Exposed for automated checks.
  window.__siteEditor = { region: region, setRegion: setRegion, cleanHtml: cleanHtml, extractUploads: extractUploads, currentExport: currentExport, publish: publish, load: load, state: state, cfg: cfg };
})();
