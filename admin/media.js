/* Media library for the site editor: every photo and video on the site, where
   each is used, and one-click use / replace / change / delete. */
(function () {
  "use strict";
  var E = window.__siteEditor;
  if (!E) return;
  var editor = E.editor, SITE = E.SITE, cfg = E.cfg, state = E.state;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var MAX_VIDEO_MB = 90;

  var lib = { tab: "photos", photos: [], videos: [], loadedAt: 0, query: "" };

  /* ------------------------------ Index ------------------------------ */
  function usedOn(sources, needle) {
    return Object.keys(sources).filter(function (p) { return sources[p].indexOf(needle) >= 0; });
  }
  function buildIndex(force) {
    if (!force && Date.now() - lib.loadedAt < 60000 && lib.photos.length) return Promise.resolve();
    var sources = {}, tree = null;
    return E.listPages().then(function (pages) {
      return Promise.all(pages.map(function (p) { return E.readFile(p).then(function (s) { sources[p] = s; }).catch(function () {}); }));
    }).then(function () {
      return cfg.token ? E.api("/git/trees/" + encodeURIComponent(cfg.branch) + "?recursive=1").then(function (t) { tree = t.tree; }).catch(function () {}) : null;
    }).then(function () {
      return fetch("assets.json", { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () { return []; });
    }).then(function (site) {
      var photos = [], seen = {};
      site.forEach(function (a) {
        var name = a.name;
        photos.push({ kind: "site", key: "assets/img/" + name, name: name, thumb: SITE + "assets/img/" + name + "-800.webp", src: SITE + a.src,
          paths: ["assets/img/" + name + "-1600.webp", "assets/img/" + name + "-800.webp"], used: usedOn(sources, "assets/img/" + name + "-") });
        seen["assets/img/" + name] = 1;
      });
      // Uploaded files: from the repository listing and from page references.
      var uploads = {};
      (tree || []).forEach(function (t) { if (t.type === "blob" && /^assets\/uploads\//.test(t.path)) uploads[t.path] = t.size || 0; });
      Object.keys(sources).forEach(function (p) {
        var re = /assets\/uploads\/[A-Za-z0-9._-]+/g, m;
        while ((m = re.exec(sources[p]))) if (!(m[0] in uploads)) uploads[m[0]] = 0;
      });
      var videos = [];
      Object.keys(uploads).forEach(function (path) {
        var isVid = /\.(mp4|webm|mov)$/i.test(path);
        var item = { kind: isVid ? "videofile" : "upload", key: path, name: path.split("/").pop(), src: SITE + path, thumb: SITE + path,
          paths: [path], size: uploads[path], used: usedOn(sources, path) };
        (isVid ? videos : photos).push(item);
      });
      // Photos uploaded in this session but not published yet.
      editor.AssetManager.getAll().forEach(function (a) {
        var src = a.get("src");
        if (src.indexOf("data:") === 0) photos.unshift({ kind: "pending", key: src.slice(0, 64), name: a.get("name") || "New photo", src: src, thumb: src, paths: [], used: [] });
      });
      // YouTube films.
      var films = {};
      Object.keys(sources).forEach(function (p) {
        var re = /<button class="yt[^"]*"[^>]*data-id="([A-Za-z0-9_-]{11})"[^>]*>/g, m;
        while ((m = re.exec(sources[p]))) {
          var id = m[1], label = (m[0].match(/aria-label="Play film: ([^"]*)"/) || [])[1] || "";
          films[id] = films[id] || { kind: "youtube", key: id, id: id, name: label.replace(/&amp;/g, "&") || id, thumb: "https://i.ytimg.com/vi/" + id + "/mqdefault.jpg", used: [] };
          if (films[id].used.indexOf(p) < 0) films[id].used.push(p);
        }
      });
      Object.keys(films).forEach(function (id) { videos.push(films[id]); });
      Object.keys(state.blobMap || {}).forEach(function (b) {
        var path = state.blobMap[b];
        if (!videos.some(function (v) { return v.key === path; })) videos.unshift({ kind: "videofile", key: path, name: path.split("/").pop(), src: b, thumb: b, paths: [path], used: [], fresh: true });
      });
      lib.photos = photos; lib.videos = videos; lib.loadedAt = Date.now(); lib.sources = sources;
    });
  }

  /* ------------------------------ Render ------------------------------ */
  function findVideo(c) {
    if (!c) return null;
    if (c.get("type") === "video" || c.get("tagName") === "video") return c;
    var hit = null;
    c.components().forEach(function (k) { if (!hit) hit = findVideo(k); });
    return hit;
  }
  function selectedTarget() {
    var c = editor.getSelected();
    if (!c) return null;
    if (c.get("type") === "image" || c.get("tagName") === "img") return { type: "image", comp: c };
    if (c.get("type") === "video" || c.get("tagName") === "video") return { type: "video", comp: c };
    if (c.get("type") === "yt-film") return { type: "youtube", comp: c };
    if (E.photoOf(c)) return { type: "image", comp: c };
    var img = c.find && c.find("img")[0];
    if (img && c.find("img").length === 1) return { type: "image", comp: img };
    var vid = findVideo(c);
    if (vid) return { type: "video", comp: vid };
    return null;
  }
  function usedText(item) {
    if (item.kind === "pending") return "Not published yet: goes live with your next Publish";
    if (item.fresh) return "Just uploaded";
    if (!item.used.length) return "Not used on any page";
    return "Used on: " + item.used.map(E.labelFor).join(", ");
  }
  function render() {
    var tgt = selectedTarget(), q = lib.query.toLowerCase();
    $("#mt-photos").textContent = "Photos (" + lib.photos.length + ")";
    $("#mt-videos").textContent = "Videos (" + lib.videos.length + ")";
    document.querySelectorAll("#m-media .ed-tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-tab") === lib.tab); });
    $("#mm-target").innerHTML = tgt ? "Selected on the page: <strong>" + (tgt.type === "youtube" ? "YouTube film" : tgt.type === "video" ? "video" : "photo") + "</strong>. Choose <em>Use here</em> on any " + (tgt.type === "image" ? "photo" : "video") + " below to swap it."
      : "Tip: click a photo or video on the page first, then choose <em>Use here</em> to swap it.";
    var items = (lib.tab === "photos" ? lib.photos : lib.videos).filter(function (it) { return !q || (it.name + " " + (it.used || []).join(" ")).toLowerCase().indexOf(q) >= 0; });
    var grid = $("#mm-grid");
    if (!items.length) { grid.innerHTML = "<p class='ed-muted'>Nothing here yet. Use the upload button above.</p>"; return; }
    grid.innerHTML = items.map(function (it, i) {
      var media;
      if (it.kind === "videofile") media = "<video src='" + esc(it.src) + "' muted preload='metadata'></video><span class='mm-badge'>Video file</span>";
      else if (it.kind === "youtube") media = "<img src='" + esc(it.thumb) + "' alt='' loading='lazy'><span class='mm-badge'>YouTube</span>";
      else media = "<img src='" + esc(it.thumb) + "' alt='' loading='lazy'>" + (it.kind === "site" ? "" : "<span class='mm-badge'>" + (it.kind === "pending" ? "New" : "Uploaded") + "</span>");
      var canUse = tgt && ((tgt.type === "image" && /site|upload|pending/.test(it.kind)) || (tgt.type === "video" && it.kind === "videofile") || (tgt.type === "youtube" && it.kind === "youtube"));
      var acts = [];
      if (canUse) acts.push("<button class='ed-btn ed-btn--gold' data-act='use' data-i='" + i + "'>Use here</button>");
      if (it.kind === "site" || it.kind === "upload" || it.kind === "videofile") acts.push("<button class='ed-btn' data-act='replace' data-i='" + i + "'>Replace everywhere…</button>");
      if (it.kind === "youtube") acts.push("<button class='ed-btn' data-act='change' data-i='" + i + "'>Change video…</button><a class='ed-btn ed-btn--ghost' href='https://www.youtube.com/watch?v=" + it.id + "' target='_blank' rel='noopener'>Watch ↗</a>");
      if ((it.kind === "upload" || it.kind === "videofile") && !it.used.length && !it.fresh) acts.push("<button class='ed-btn ed-btn--danger' data-act='delete' data-i='" + i + "'>Delete</button>");
      return "<article class='mm-card' data-i='" + i + "'><div class='mm-thumb'>" + media + "</div><div class='mm-body'><strong title='" + esc(it.name) + "'>" + esc(it.name) + "</strong>" +
        "<span class='mm-used'>" + esc(usedText(it)) + "</span><div class='mm-acts'>" + acts.join("") + "</div>" +
        (it.kind === "youtube" ? "<form class='mm-change' hidden><input placeholder='Paste a YouTube link or ID' required><button class='ed-btn ed-btn--gold' type='submit'>Save</button></form>" : "") +
        "</div></article>";
    }).join("");
    grid._items = items;
  }

  function open(tab) {
    var tgt = selectedTarget();
    lib.tab = tab || (tgt ? (tgt.type === "image" ? "photos" : "videos") : lib.tab);
    E.openModal("#m-media");
    $("#mm-grid").innerHTML = "<p class='ed-muted'>Loading media…</p>";
    buildIndex(true).then(render).catch(function (e) { $("#mm-grid").innerHTML = "<p class='ed-muted'>" + esc(e.message) + "</p>"; });
  }

  /* ------------------------------ Actions ------------------------------ */
  function needsToken(what) {
    if (cfg.token) return false;
    E.openSettings("Connect to GitHub to " + what + ".");
    return true;
  }
  function blockIfDirty() {
    if (!state.dirty) return false;
    E.toast("Publish or discard your page changes first: this updates every page on the site.", true);
    return true;
  }
  function readAsDataURL(file) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); });
  }
  function resizeTo(file, width) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var w = Math.min(width, im.width), h = Math.round(im.height * w / im.width);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(im, 0, 0, w, h); URL.revokeObjectURL(url);
        res(c.toDataURL("image/webp", 0.82).split(",")[1]);
      };
      im.onerror = function () { rej(new Error("Could not read " + file.name)); };
      im.src = url;
    });
  }
  function choose(accept, multiple) {
    return new Promise(function (res) {
      var inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.multiple = !!multiple;
      inp.onchange = function () { res(Array.prototype.slice.call(inp.files)); }; inp.click();
    });
  }
  function committed(c, msg) {
    state.pub = { phase: "saved", sha: c.sha, url: c.html_url || ("https://github.com/" + cfg.owner + "/" + cfg.repo + "/commit/" + c.sha), time: Date.now(), target: state.target, version: "media" };
    E.updateUI();
    E.toast(msg, false, state.pub.url);
    setTimeout(function () { if (state.pub && state.pub.version === "media") { state.pub.phase = "live"; E.updateUI(); } }, 75000);
  }

  function useHere(it) {
    var tgt = selectedTarget();
    if (!tgt) return;
    if (tgt.type === "image") { E.setPhoto(tgt.comp, it.kind === "site" ? SITE + "assets/img/" + it.name + "-1600.webp" : it.src); E.renderPhotos(); }
    else if (tgt.type === "video") { tgt.comp.set("src", it.src); tgt.comp.addAttributes({ src: it.src }); }
    else if (tgt.type === "youtube") { tgt.comp.addAttributes({ "data-id": it.id, "aria-label": "Play film: " + it.name }); }
    editor.trigger("update");
    E.closeModals();
    E.toast("Swapped. Click Publish to put it live.");
  }

  function replaceEverywhere(it) {
    if (needsToken("replace media")) return;
    var isVid = it.kind === "videofile";
    choose(isVid ? "video/mp4,video/webm" : "image/*").then(function (files) {
      var f = files[0]; if (!f) return;
      if (isVid && f.size > MAX_VIDEO_MB * 1048576) { E.toast("That video is " + Math.round(f.size / 1048576) + " MB. Please keep videos under " + MAX_VIDEO_MB + " MB (compress it first).", true); return; }
      if (!confirm("Replace \"" + it.name + "\" with \"" + f.name + "\" on " + (it.used.length ? "every page that uses it (" + it.used.map(E.labelFor).join(", ") + ")" : "the site") + "?")) return;
      E.toast("Uploading…");
      var job;
      if (isVid) job = readAsDataURL(f).then(function (d) { return [{ path: it.paths[0], base64: d.split(",")[1] }]; });
      else if (it.kind === "site") job = Promise.all([resizeTo(f, 1600), resizeTo(f, 800)]).then(function (b) { return [{ path: it.paths[0], base64: b[0] }, { path: it.paths[1], base64: b[1] }]; });
      else job = resizeTo(f, 2200).then(function (b) { return [{ path: it.paths[0], base64: b }]; });
      job.then(function (files) { return E.commitFiles(files, "Replace " + it.name + " via media library"); })
        .then(function (c) { committed(c, "Replaced everywhere ✓ The live site shows the new " + (isVid ? "video" : "photo") + " in about a minute."); lib.loadedAt = 0; open(); })
        .catch(function (e) { E.toast("Replace failed: " + e.message, true); });
    });
  }

  function ytId(v) { var m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(v.trim()) ? v.trim() : null); }
  function thumbFor(id) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im.naturalWidth > 200 ? "maxresdefault" : "hqdefault"); };
      im.onerror = function () { res("hqdefault"); };
      im.src = "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
    });
  }
  function changeVideo(it, value) {
    if (needsToken("change videos")) return;
    if (blockIfDirty()) return;
    var id = ytId(value);
    if (!id) { E.toast("That doesn't look like a YouTube link.", true); return; }
    if (id === it.id) return;
    E.toast("Updating every page that shows this film…");
    var version = "v" + Date.now().toString(36);
    thumbFor(id).then(function (q) {
      return Promise.all(it.used.map(function (p) {
        return E.readFile(p).then(function (src) {
          var out = src.split('data-id="' + it.id + '"').join('data-id="' + id + '"')
            .replace(new RegExp("i\\.ytimg\\.com/vi/" + it.id + "/(maxresdefault|hqdefault|mqdefault)\\.jpg", "g"), function (m, size) { return "i.ytimg.com/vi/" + id + "/" + (size === "mqdefault" ? "mqdefault" : q) + ".jpg"; });
          return { path: p, content: E.setVersion(E.markEdited(out), version) };
        });
      }));
    }).then(function (files) {
      return E.commitFiles(files, "Change film " + it.id + " → " + id + " via media library");
    }).then(function (c) {
      committed(c, "Film changed on " + it.used.length + " page(s) ✓");
      lib.loadedAt = 0; open();
      E.load(state.target);
    }).catch(function (e) { E.toast("Change failed: " + e.message, true); });
  }

  function deleteUpload(it) {
    if (needsToken("delete media")) return;
    if (it.used.length) return;
    if (!confirm("Delete \"" + it.name + "\" from the website? It isn't used on any page.")) return;
    E.commitFiles([{ path: it.paths[0], remove: true }], "Delete " + it.name + " via media library")
      .then(function (c) { committed(c, "Deleted ✓"); lib.loadedAt = 0; open(); })
      .catch(function (e) { E.toast("Delete failed: " + e.message, true); });
  }

  function uploadPhotos() {
    choose("image/*", true).then(function (files) {
      if (!files.length) return;
      return Promise.all(files.map(function (f) {
        return E.prepareImage(f).then(function (src) { editor.AssetManager.add({ type: "image", src: src, name: f.name }); });
      })).then(function () {
        E.toast(files.length + " photo(s) added. They go live with your next Publish wherever you use them.");
        lib.loadedAt = 0; lib.tab = "photos"; return buildIndex(true).then(render);
      });
    }).catch(function (e) { E.toast(e.message, true); });
  }
  function uploadVideo() {
    if (needsToken("upload videos")) return;
    choose("video/mp4,video/webm").then(function (files) {
      var f = files[0]; if (!f) return;
      if (f.size > MAX_VIDEO_MB * 1048576) { E.toast("That video is " + Math.round(f.size / 1048576) + " MB. Please keep videos under " + MAX_VIDEO_MB + " MB (compress it first).", true); return; }
      var slug = f.name.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
      var path = "assets/uploads/" + Date.now().toString(36) + "-" + slug + (/\.webm$/i.test(f.name) ? ".webm" : ".mp4");
      E.toast("Uploading " + f.name + " (" + Math.round(f.size / 1048576) + " MB)…");
      readAsDataURL(f).then(function (d) {
        return E.commitFiles([{ path: path, base64: d.split(",")[1] }], "Upload video " + f.name + " via media library");
      }).then(function (c) {
        var blob = URL.createObjectURL(f);
        state.blobMap[blob] = path;
        committed(c, "Video uploaded ✓ Select a video spot on the page (or drag in a “Video file” block) and choose Use here.");
        lib.loadedAt = 0; lib.tab = "videos"; return buildIndex(true).then(render);
      }).catch(function (e) { E.toast("Upload failed: " + e.message, true); });
    });
  }

  /* ------------------------------ Wiring ------------------------------ */
  $("#ed-media").addEventListener("click", function () { open(); });
  document.querySelectorAll("#m-media .ed-tab").forEach(function (t) { t.addEventListener("click", function () { lib.tab = t.getAttribute("data-tab"); render(); }); });
  $("#mm-search").addEventListener("input", function (e) { lib.query = e.target.value; render(); });
  $("#mm-up-photo").addEventListener("click", uploadPhotos);
  $("#mm-up-video").addEventListener("click", uploadVideo);
  $("#mm-grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var it = $("#mm-grid")._items[+b.getAttribute("data-i")], act = b.getAttribute("data-act");
    if (act === "use") useHere(it);
    else if (act === "replace") replaceEverywhere(it);
    else if (act === "delete") deleteUpload(it);
    else if (act === "change") { var f = b.closest(".mm-body").querySelector(".mm-change"); f.hidden = !f.hidden; if (!f.hidden) f.querySelector("input").focus(); }
  });
  $("#mm-grid").addEventListener("submit", function (e) {
    e.preventDefault();
    var card = e.target.closest(".mm-card"), it = $("#mm-grid")._items[+card.getAttribute("data-i")];
    changeVideo(it, e.target.querySelector("input").value);
  });
  // Double-clicking a video on the page opens the library on the Videos tab.
  editor.on("component:selected", function (c) {
    if (!c) return;
    if ($("#m-media") && !$("#m-media").hidden) render();
  });
  editor.on("block:drag:stop", function (c, block) {
    if (block && block.get && block.get("id") === "el-videofile" && c) {
      var v = findVideo(c) || c;
      setTimeout(function () { editor.select(v); open("videos"); E.toast("Choose a video for this spot (or upload one)."); }, 100);
    }
  });
  window.__mediaLibrary = { open: open, lib: lib, buildIndex: buildIndex };
})();
