/* Blog panel for the site editor.
   Posts are written in a simple form (title, date, category, summary, cover photo, text). Saving creates the post's
   page (blog-<slug>.html, with the site's header and footer) and updates the blog page's list and the sitemap, all in
   one commit. A post's text and photos are then edited in the visual editor like any page; its details (title, date,
   cover…) are changed here, which refreshes its header and its card on the blog page without touching the text.
   Post details live in config.blog.data (JSON). The markup comes from config.blog (site-config.js). */
(function () {
  "use strict";
  var E = window.__siteEditor, C = E && E.config, B = C && C.blog;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var btn = $("#ed-blog");
  if (!B) { if (btn) btn.hidden = true; return; }

  var PREFIX = B.prefix || "blog-", INDEX = B.index || "blog.html", DATA = B.data || "assets/data/blog.json";
  var posts = [], loaded = null, editing = null, cover = null;

  /* ------------------------------ helpers ------------------------------ */
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function slugify(s) { return String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, ""); }
  function fileOf(p) { return PREFIX + p.slug + ".html"; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function niceDate(iso) {
    var d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  function rel(src) { return src && src.indexOf(E.SITE) === 0 ? src.slice(E.SITE.length) : src; }
  function sorted(list) { return list.slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title); }); }
  function words(html) { return (html.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length; }

  // A few plain-text conventions for the post's text: blank line = new paragraph, "## " heading, "- " list,
  // "> " quote, ![alt](photo) photo, **bold**, *italic*, [link text](https://…).
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|[\w.-]+\.html)[^)\s]*)\)/g, function (m, t, u) {
        var ext = /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : "";
        return '<a href="' + u.replace(/"/g, "%22") + '"' + ext + ">" + t + "</a>";
      });
  }
  function toHtml(text) {
    var out = [], blocks = String(text || "").replace(/\r/g, "").split(/\n{2,}/);
    blocks.forEach(function (b) {
      b = b.trim(); if (!b) return;
      var lines = b.split("\n"), m;
      if ((m = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { out.push(B.photo ? B.photo(m[2], m[1], H) : '<img src="' + esc(m[2]) + '" alt="' + esc(m[1]) + '">'); return; }
      if (/^###\s/.test(b)) { out.push("<h3>" + inline(b.replace(/^###\s+/, "")) + "</h3>"); return; }
      if (/^##?\s/.test(b)) { out.push("<h2>" + inline(b.replace(/^##?\s+/, "")) + "</h2>"); return; }
      if (lines.every(function (l) { return /^[-*]\s/.test(l); })) { out.push("<ul>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^[-*]\s+/, "")) + "</li>"; }).join("") + "</ul>"); return; }
      if (lines.every(function (l) { return /^\d+[.)]\s/.test(l); })) { out.push("<ol>" + lines.map(function (l) { return "<li>" + inline(l.replace(/^\d+[.)]\s+/, "")) + "</li>"; }).join("") + "</ol>"); return; }
      if (lines.every(function (l) { return /^>\s?/.test(l); })) { out.push("<blockquote><p>" + inline(lines.map(function (l) { return l.replace(/^>\s?/, ""); }).join(" ")) + "</p></blockquote>"); return; }
      out.push("<p>" + lines.map(inline).join("<br>") + "</p>");
    });
    return out.join("\n");
  }

  // Helpers handed to the site's markup functions in config.blog.
  var H = {
    esc: esc, niceDate: niceDate, fileOf: fileOf,
    img: function (src, alt, sizes, extra) {
      src = rel(src) || "";
      var m = src.match(/^(.*)-(800|1600|2400)\.webp(\?.*)?$/), set = "";
      if (m) set = ' srcset="' + m[1] + "-800.webp 800w, " + m[1] + '-1600.webp 1600w"';
      return '<img src="' + esc(src) + '"' + set + ' sizes="' + (sizes || "100vw") + '" alt="' + esc(alt || "") + '"' + (extra || ' loading="lazy" decoding="async"') + ">";
    }
  };

  /* ------------------------------ data ------------------------------ */
  function loadPosts() {
    if (loaded) return loaded;
    loaded = E.readFile(DATA).then(function (t) { posts = JSON.parse(t).posts || []; }, function () { posts = []; }).then(function () {
      posts.forEach(function (p) { E.PAGE_NAMES[fileOf(p)] = p.title; });
      if (E.fillTargets) E.fillTargets();
      return posts;
    });
    return loaded;
  }
  function dataJson(list) { return JSON.stringify({ about: "Blog posts, managed in the site editor's Blog panel.", posts: sorted(list) }, null, 2) + "\n"; }

  // Replace the elements marked data-* in a page's editable area with fresh markup (the rest stays as edited).
  function swapParts(main, parts) {
    var doc = new DOMParser().parseFromString("<!doctype html><html><body>" + main + "</body></html>", "text/html");
    Object.keys(parts).forEach(function (attr) {
      var el = doc.body.querySelector("[" + attr + "]");
      if (!el) return;
      var t = doc.createElement("template"); t.innerHTML = parts[attr].trim();
      el.replaceWith(t.content);
    });
    return doc.body.innerHTML;
  }
  function listHtml(list) {
    var live = sorted(list).filter(function (p) { return !p.draft; });
    return live.length ? live.map(function (p, i) { return B.card(p, H, i); }).join("\n") : (B.empty || "<p>New posts are on the way.</p>");
  }
  function indexWith(src, list) {
    var main = E.region(src, "main");
    if (main == null) throw new Error(INDEX + " has no editable area.");
    var doc = new DOMParser().parseFromString("<!doctype html><html><body>" + main + "</body></html>", "text/html");
    var box = doc.body.querySelector("[data-blog-list]");
    if (!box) throw new Error(INDEX + " has no list of posts (an element marked data-blog-list).");
    box.innerHTML = listHtml(list);
    return E.setRegion(src, "main", doc.body.innerHTML);
  }
  function metaFor(p, coverUrl) {
    var origin = (C.origin || "").replace(/\/$/, "");
    return { title: p.title + (C.titleSuffix || ""), desc: p.excerpt || p.title, ogImage: coverUrl ? origin + "/" + coverUrl.replace(/^\//, "") : "",
      canonical: origin + (B.publicUrl ? B.publicUrl(p.slug) : "/" + PREFIX + p.slug), noindex: !!p.draft,
      jsonld: [JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.excerpt || "",
        datePublished: p.date, author: { "@type": "Person", name: p.author || B.author || "" }, image: coverUrl ? origin + "/" + coverUrl : undefined })] };
  }
  function sitemapFor(xml, p, wasLoc) {
    var origin = (C.origin || "").replace(/\/$/, ""), loc = origin + (B.publicUrl ? B.publicUrl(p.slug) : "/" + PREFIX + p.slug);
    loc = loc.replace(/&/g, "&amp;");
    if (wasLoc) xml = xml.replace(new RegExp("\\s*<url><loc>" + wasLoc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "</loc></url>"), "");
    var has = xml.indexOf("<loc>" + loc + "</loc>") >= 0;
    if (!p.draft && !has) xml = xml.replace("</urlset>", "  <url><loc>" + loc + "</loc></url>\n</urlset>");
    if (p.draft && has) xml = xml.replace(new RegExp("\\s*<url><loc>" + loc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "</loc></url>"), "");
    return xml;
  }
  function locOf(p) { var origin = (C.origin || "").replace(/\/$/, ""); return (origin + (B.publicUrl ? B.publicUrl(p.slug) : "/" + PREFIX + p.slug)).replace(/&/g, "&amp;"); }

  /* ------------------------------ saving ------------------------------ */
  function requireSignIn() { if (!E.cfg.token) { E.openSettings("Sign in to publish blog posts."); return true; } return false; }

  function savePost(p, bodyText, isNew, oldSlug) {
    var files = [], coverUrl = p.cover || "";
    if (/^data:image\//.test(coverUrl)) {               // an uploaded photo: saved next to the other uploads
      var up = E.extractUploads('<img src="' + coverUrl + '">', "");
      files = files.concat(up.files); coverUrl = up.html.match(/src="([^"]+)"/)[1];
    }
    p.cover = rel(coverUrl);
    var file = fileOf(p), oldFile = oldSlug ? PREFIX + oldSlug + ".html" : null;
    var reads = [E.readFile(INDEX), E.readFile("sitemap.xml").catch(function () { return null; }),
      isNew ? E.readFile(B.template || C.pageTemplate || "index.html") : E.readFile(oldFile || file)];
    return Promise.all(reads).then(function (r) {
      var indexSrc = r[0], xml = r[1], src = r[2], html;
      if (isNew) {
        var body = toHtml(bodyText) || "<p>Start writing here.</p>";
        html = E.setRegion(src, "main", B.post(p, H, body));
        html = html.replace(/<style id="page-styles">[\s\S]*?<\/style>/, '<style id="page-styles"></style>').replace(/\s*aria-current="page"/g, "");
      } else {
        html = E.setRegion(src, "main", swapParts(E.region(src, "main"), { "data-post-head": B.head(p, H), "data-post-cover": B.cover(p, H) }));
      }
      html = E.markEdited(E.applyMeta(html, metaFor(p, p.cover)));
      var next = posts.filter(function (x) { return x.slug !== (oldSlug || p.slug); }).concat([p]);
      files.push({ path: file, content: html });
      if (oldFile && oldFile !== file) files.push({ path: oldFile, remove: true });
      files.push({ path: DATA, content: dataJson(next) });
      files.push({ path: INDEX, content: indexWith(indexSrc, next) });
      if (xml) files.push({ path: "sitemap.xml", content: sitemapFor(xml, p, oldSlug && oldSlug !== p.slug ? locOf({ slug: oldSlug }) : null) });
      return E.commitFiles(files, (isNew ? "New blog post: " : "Update blog post: ") + p.title + " (via site editor)").then(function () {
        posts = next;
        if (oldFile && oldFile !== file) { delete E.PAGE_NAMES[oldFile]; E.state.pages = E.state.pages.filter(function (x) { return x !== oldFile; }); }
        E.PAGE_NAMES[file] = p.title;
        if (E.state.pages.indexOf(file) < 0) E.state.pages.push(file);
        if (E.fillTargets) E.fillTargets();
        return file;
      });
    });
  }

  function deletePost(p) {
    return Promise.all([E.readFile(INDEX), E.readFile("sitemap.xml").catch(function () { return null; })]).then(function (r) {
      var next = posts.filter(function (x) { return x.slug !== p.slug; }), file = fileOf(p);
      var files = [{ path: file, remove: true }, { path: DATA, content: dataJson(next) }, { path: INDEX, content: indexWith(r[0], next) }];
      if (r[1]) files.push({ path: "sitemap.xml", content: r[1].replace(new RegExp("\\s*<url><loc>" + locOf(p).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "</loc></url>"), "") });
      return E.commitFiles(files, "Delete blog post: " + p.title + " (via site editor)").then(function () {
        posts = next; delete E.PAGE_NAMES[file];
        E.state.pages = E.state.pages.filter(function (x) { return x !== file; });
        if (E.fillTargets) E.fillTargets();
        if (E.state.target === file) E.load(INDEX);
      });
    });
  }

  /* ------------------------------ panel ------------------------------ */
  var modal = $("#m-blog");
  function show(view) { modal.querySelectorAll("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== view; }); }
  function renderList() {
    var box = $("#blog-list");
    var list = sorted(posts);
    box.innerHTML = list.length ? list.map(function (p) {
      var thumb = p.cover ? '<img src="' + esc(/^data:/.test(p.cover) ? p.cover : E.SITE + p.cover) + '" alt="">' : "";
      return '<div class="ed-blog__row" data-slug="' + esc(p.slug) + '"><span class="ed-blog__thumb">' + thumb + "</span>" +
        '<span class="ed-blog__info"><b>' + esc(p.title) + "</b><small>" + esc(niceDate(p.date)) + (p.category ? " · " + esc(p.category) : "") +
        (p.draft ? ' · <span class="ed-blog__draft">Draft</span>' : "") + "</small></span>" +
        '<span class="ed-blog__acts"><button type="button" class="ed-btn ed-btn--ghost" data-act="open">Edit text &amp; photos</button>' +
        '<button type="button" class="ed-btn ed-btn--ghost" data-act="details">Details</button>' +
        '<button type="button" class="ed-icon" data-act="delete" title="Delete post"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button></span></div>';
    }).join("") : '<p class="ed-muted">No posts yet. Click <b>New post</b> to write the first one.</p>';
  }
  function setCover(src, alt) {
    cover = src || null;
    $("#bp-cover-img").innerHTML = src ? '<img src="' + esc(/^data:|^https?:/.test(src) ? src : E.SITE + src) + '" alt="">' : "<span>No photo yet</span>";
    if (alt != null) $("#bp-cover-alt").value = alt;
  }
  function openForm(p) {
    editing = p || null;
    var f = $("#f-blog");
    f.reset();
    f.title.value = p ? p.title : ""; f.date.value = p ? p.date : today(); f.category.value = p ? p.category || "" : (B.categories || [])[0] || "";
    f.excerpt.value = p ? p.excerpt || "" : ""; f.author.value = p ? p.author || "" : (B.author || "");
    f.slug.value = p ? p.slug : ""; f.draft.checked = !!(p && p.draft);
    var cats = (B.categories || []).concat(posts.map(function (x) { return x.category; })).filter(function (c, i, a) { return c && a.indexOf(c) === i; });
    $("#bp-cats").innerHTML = cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("");
    setCover(p ? p.cover : "", p ? p.coverAlt || "" : "");
    $("#bp-text-wrap").hidden = !!p;
    $("#bp-edit-note").hidden = !p;
    $("#bp-heading").textContent = p ? "Edit post details" : "New blog post";
    $("#bp-save").textContent = p ? "Save details" : "Create post";
    $("#bp-msg").hidden = true;
    show("form");
    setTimeout(function () { f.title.focus(); }, 30);
  }
  function msg(t) { var m = $("#bp-msg"); m.textContent = t; m.hidden = !t; }

  function open() {
    show("list");
    E.openModal("#m-blog");
    loadPosts().then(renderList);
  }
  btn.addEventListener("click", open);
  $("#blog-new").addEventListener("click", function () { openForm(null); });
  $("#bp-back").addEventListener("click", function () { show("list"); renderList(); });
  $("#bp-cover-pick").addEventListener("click", function () {
    modal.hidden = true;
    var reshow = function () { E.editor.off("modal:close", reshow); modal.hidden = false; };
    E.editor.on("modal:close", reshow);
    E.pickPhoto(function (src) { setCover(rel(src)); });
  });
  $("#f-blog").title.addEventListener("input", function (e) { if (!editing) $("#f-blog").slug.placeholder = slugify(e.target.value) || "made-from-the-title"; });
  $("#blog-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var p = posts.filter(function (x) { return x.slug === b.closest("[data-slug]").getAttribute("data-slug"); })[0]; if (!p) return;
    var act = b.getAttribute("data-act");
    if (act === "details") openForm(p);
    if (act === "open") { E.closeModals(); E.load(fileOf(p)); }
    if (act === "delete") {
      if (requireSignIn() || !confirm("Delete \"" + p.title + "\"? Its page and its card on the blog page are removed (GitHub keeps a copy in the history).")) return;
      b.disabled = true;
      deletePost(p).then(function () { renderList(); E.toast("Post deleted."); }).catch(function (err) { b.disabled = false; E.toast("Couldn't delete: " + err.message, true); });
    }
  });
  $("#f-blog").addEventListener("submit", function (e) {
    e.preventDefault();
    if (requireSignIn()) return;
    var f = e.target, title = f.title.value.trim();
    if (!title) { msg("Please give the post a title."); return; }
    var slug = slugify(f.slug.value.trim() || title);
    if (!slug) { msg("Please use letters or numbers in the title."); return; }
    if (posts.some(function (x) { return x.slug === slug && x !== editing; })) { msg("Another post already uses the address " + slug + ". Change the title or the address."); return; }
    if (!editing && !f.text.value.trim()) { msg("Write a little text for the post (you can add photos and more in the editor afterwards)."); return; }
    var p = { slug: slug, title: title, date: f.date.value || today(), category: f.category.value.trim(), excerpt: f.excerpt.value.trim(),
      author: f.author.value.trim(), cover: cover || "", coverAlt: $("#bp-cover-alt").value.trim() || title, draft: f.draft.checked };
    if (editing) p.minutes = editing.minutes;
    else p.minutes = Math.max(1, Math.ceil(words(toHtml(f.text.value)) / 200));
    var save = $("#bp-save"); save.disabled = true; save.textContent = "Publishing…"; msg("");
    savePost(p, f.text.value, !editing, editing ? editing.slug : null).then(function (file) {
      save.disabled = false;
      E.closeModals();
      E.toast(editing ? "Post details saved. The site updates in about a minute." : "Post created. Add photos and polish the text here, then Publish.", false, "success");
      E.load(file);
    }).catch(function (err) { save.disabled = false; save.textContent = editing ? "Save details" : "Create post"; msg("Couldn't save: " + err.message); });
  });

  loadPosts();
  window.__blog = { open: open, posts: function () { return posts; }, toHtml: toHtml, savePost: savePost, deletePost: deletePost, slugify: slugify, H: H };
})();
