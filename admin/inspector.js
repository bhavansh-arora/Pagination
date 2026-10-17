/* Element inspector for the site editor, Elementor-style: Content / Style / Advanced tabs for
   whatever is selected. Content covers photos (swap, focus point, adjustments), videos (source,
   thumbnail, playback), links and text tags; Advanced covers ID, classes, attributes, per-device
   visibility, entrance animations, and custom CSS/HTML for just this element. */
(function () {
  "use strict";
  var E = window.__siteEditor;
  if (!E) return;
  var editor = E.editor, SITE = E.SITE;

  /* ------------------------------ Small DOM kit ------------------------------ */
  function h(tag, props, kids) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var openSecs = { photos: true, adjust: true, video: true, link: true, text: true, ident: true, classes: true, attrs: false, responsive: true, motion: true, css: false, html: false };
  function section(key, title, kids, note) {
    var d = h("details", { class: "ed-sec", "data-sec": key }, [h("summary", {}, [h("span", { text: title }), note ? h("em", { text: note }) : null])].concat(kids));
    d.open = openSecs[key] !== false;
    d.addEventListener("toggle", function () { openSecs[key] = d.open; });
    return d;
  }
  function field(label, control, hint) {
    return h("label", { class: "ed-f" }, [h("span", { class: "ed-f__l", text: label }), control, hint ? h("small", { class: "ed-f__h", text: hint }) : null]);
  }
  function input(value, onChange, opts) {
    opts = opts || {};
    var el = h("input", { type: opts.type || "text", value: value == null ? "" : value, placeholder: opts.placeholder, list: opts.list, spellcheck: "false" });
    el.addEventListener("change", function () { onChange(el.value.trim(), el); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
    return el;
  }
  function select(value, options, onChange) {
    var el = h("select", { onchange: function () { onChange(el.value); } }, options.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    el.value = value; if (el.value !== value) el.value = options[0][0];
    return el;
  }
  function check(label, checked, onChange) {
    var box = h("input", { type: "checkbox" });
    box.checked = !!checked;
    box.addEventListener("change", function () { onChange(box.checked); });
    return h("label", { class: "ed-check" }, [box, h("span", { text: label })]);
  }
  function slider(label, value, min, max, step, unit, def, onInput) {
    var num = h("output", { text: fmt(value) + unit });
    var rng = h("input", { type: "range", min: min, max: max, step: step, value: value });
    function fmt(v) { return Math.round(v * 100) / 100; }
    rng.addEventListener("input", function () { num.textContent = fmt(+rng.value) + unit; onInput(+rng.value, false); });
    rng.addEventListener("change", function () { onInput(+rng.value, true); });
    var reset = h("button", { type: "button", class: "ed-mini", title: "Reset", text: "↺", onclick: function () { rng.value = def; num.textContent = fmt(def) + unit; onInput(def, true); } });
    return h("div", { class: "ed-slider" + (value !== def ? " is-set" : "") }, [h("span", { class: "ed-f__l", text: label }), rng, num, reset]);
  }
  function btn(text, cls, onClick, title) { return h("button", { type: "button", class: "ed-btn " + (cls || ""), text: text, title: title, onclick: onClick }); }
  function changed() { editor.trigger("update"); }

  /* ------------------------------ Panel shell ------------------------------ */
  var tabs = h("div", { class: "ed-itabs", hidden: true }, [
    h("button", { type: "button", "data-t": "content", html: "<svg viewBox='0 0 24 24'><path d='M4 6h16M4 12h10M4 18h13'/></svg>Content" }),
    h("button", { type: "button", "data-t": "style", html: "<svg viewBox='0 0 24 24'><path d='M14 4l6 6-9 9H5v-6z'/></svg>Style" }),
    h("button", { type: "button", "data-t": "advanced", html: "<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1'/></svg>Advanced" })
  ]);
  var head = h("div", { class: "ed-ihead" });
  var body = h("div", { class: "ed-ibody" });
  var panel = h("div", { class: "ed-insp", hidden: true }, [body]);
  var state = { tab: "content", active: false };

  function mount() {
    var host = document.querySelector(".gjs-pn-views-container");
    if (!host) return false;
    if (tabs.parentNode !== host) { host.insertBefore(panel, host.firstChild); host.insertBefore(head, panel); host.insertBefore(tabs, head); }
    return true;
  }
  function viewBtn(id) { return editor.Panels.getButton("views", id); }
  function others(fn) { ["open-sm", "open-tm", "open-layers", "open-blocks"].forEach(function (id) { var b = viewBtn(id); if (b) fn(b); }); }

  editor.Commands.add("ed-open-insp", {
    run: function () { state.active = true; others(function (b) { if (b.get("active")) b.set("active", false); }); sync(); },
    stop: function () { state.active = false; sync(); }
  });
  editor.Panels.addButton("views", {
    id: "open-insp", command: "ed-open-insp", togglable: false, active: false,
    attributes: { title: "Element: content, links, video & advanced settings" },
    label: "<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round'><path d='M4 7h10M18 7h2M4 17h4M12 17h8'/><circle cx='16' cy='7' r='2'/><circle cx='10' cy='17' r='2'/></svg>"
  });
  ["open-sm", "open-tm", "open-layers", "open-blocks"].forEach(function (id) {
    editor.on("run:" + id, function () { var b = viewBtn("open-insp"); if (b && b.get("active")) b.set("active", false); state.active = false; sync(); });
    editor.on("stop:" + id, sync);
  });

  function show(tab) {
    if (tab) state.tab = tab;
    if (state.tab === "style") { E.openStyle(); sync(); return; }
    var b = viewBtn("open-insp");
    if (b && !b.get("active")) b.set("active", true); else { state.active = true; sync(); }
  }
  tabs.addEventListener("click", function (e) {
    var t = e.target.closest("[data-t]"); if (!t) return;
    show(t.getAttribute("data-t"));
  });

  function sync() {
    if (!mount()) return;
    var c = editor.getSelected();
    var sm = viewBtn("open-sm"), smOn = sm && sm.get("active");
    var showTabs = !!c && (state.active || smOn);
    tabs.hidden = head.hidden = !showTabs;
    panel.hidden = !(c && state.active);
    var cur = state.active ? state.tab : smOn ? "style" : "";
    if (cur === "style" && state.active) cur = state.tab = "content";
    tabs.querySelectorAll("[data-t]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-t") === cur); });
    if (showTabs) renderHead(c);
    if (!panel.hidden) render();
  }
  var timer;
  function refresh() { clearTimeout(timer); timer = setTimeout(sync, 40); }
  editor.on("component:selected component:deselected", refresh);
  // Re-render when the selected element changes from elsewhere (undo, code edits) but not while typing in the panel.
  editor.on("component:update", function (c) { if (!panel.hidden && c === editor.getSelected() && !panel.contains(document.activeElement)) refresh(); });

  function renderHead(c) {
    head.innerHTML = "";
    var p = c.parent();
    head.appendChild(h("div", { class: "ed-ihead__name" }, [h("strong", { text: c.getName() }), h("code", { text: "<" + (c.get("tagName") || "div") + ">" })]));
    if (p && p.get("type") !== "wrapper") head.appendChild(btn("↑ Parent", "ed-btn--ghost ed-mini-btn", function () { editor.select(p); }, "Select the element this one sits in: " + p.getName()));
  }

  /* ------------------------------ Render ------------------------------ */
  function render() {
    var c = editor.getSelected();
    var scroll = panel.scrollTop;
    body.innerHTML = "";
    if (!c) return;
    var parts = state.tab === "advanced" ? advanced(c) : content(c);
    parts.forEach(function (p) { if (p) body.appendChild(p); });
    panel.scrollTop = scroll;
  }

  /* ================================ CONTENT ================================ */
  function content(c) {
    var out = [];
    var vid = videoFileIn(c), yt = ytIn(c);
    if (yt) out.push(youtubeSection(yt));
    if (vid) out.push(videoSection(vid));
    var ph = E.photosFor(c);
    if (ph.list.length) out.push(photosSection(c, ph));
    out.push(linkSection(c));
    if (isTextish(c)) out.push(textSection(c));
    if (out.length === 1 && !isTextish(c)) out.push(h("p", { class: "ed-hint", text: "Click text on the page to type. Use Style for colours, spacing and fonts, and Advanced for classes, custom CSS and HTML." }));
    return out;
  }

  /* ---------- Photos ---------- */
  function frameOf(p) {
    var parent = p.comp.parent();
    if (p.kind === "img" && parent && parent.getClasses().indexOf("media") >= 0) return parent;
    return p.comp;
  }
  function photosSection(c, ph) {
    var list = ph.list, n = list.length, kids = [];
    if (n > 1) kids.push(h("p", { class: "ed-hint", text: "Click a thumbnail to set the focus point. Use Adjust for size, filters and more." }));
    list.forEach(function (p, i) {
      var f = E.focusOf(p);
      var dot = h("i", { class: "ed-photo__dot", style: "left:" + f[0] + "%;top:" + f[1] + "%" });
      var img = h("img", { alt: "", src: p.src });
      var pic = h("div", { class: "ed-photo__pic", title: "Click to keep this point in frame (e.g. faces)" }, [img, dot]);
      pic.addEventListener("click", function (e) {
        var r = img.getBoundingClientRect(), nw = img.naturalWidth || r.width, nh = img.naturalHeight || r.height, sc = Math.min(r.width / nw, r.height / nh);
        var w = nw * sc, hh = nh * sc, ox = r.left + (r.width - w) / 2, oy = r.top + (r.height - hh) / 2;
        var x = Math.round(Math.max(0, Math.min(100, (e.clientX - ox) / w * 100))), y = Math.round(Math.max(0, Math.min(100, (e.clientY - oy) / hh * 100)));
        var st = {}; st[p.kind === "img" ? "object-position" : "background-position"] = x + "% " + y + "%";
        p.comp.addStyle(st); changed();
        dot.style.left = x + "%"; dot.style.top = y + "%";
      });
      var adjustBox = h("div", { class: "ed-adjust", hidden: true });
      var adjBtn = btn("Adjust", "", function () {
        adjustBox.hidden = !adjustBox.hidden; adjBtn.classList.toggle("is-on", !adjustBox.hidden);
        if (!adjustBox.hidden && !adjustBox.firstChild) adjustBox.appendChild(adjustPanel(p));
      });
      var row = h("div", { class: "ed-photo" }, [pic, h("div", { class: "ed-photo__meta" }, [
        h("span", { class: "ed-photo__label", text: E.photoLabel(p, i, n) }),
        h("span", { class: "ed-photo__name", text: E.photoName(p.src), title: E.photoName(p.src) }),
        h("div", { class: "ed-photo__acts" }, [
          btn("Change", "ed-btn--gold", function () { E.pickPhoto(function (src) { E.setPhoto(p.comp, src); changed(); refresh(); }); }, "Pick another photo or upload one"),
          adjBtn,
          p.comp !== c ? btn("Select", "ed-btn--ghost", function () { editor.select(p.comp); try { editor.Canvas.scrollTo(p.comp, { behavior: "smooth", block: "center" }); } catch (e) {} }) : null
        ])
      ])]);
      kids.push(h("div", { class: "ed-photo-wrap" }, [row, adjustBox]));
      if (n === 1) { adjustBox.hidden = false; adjBtn.classList.add("is-on"); adjustBox.appendChild(adjustPanel(p)); }
    });
    return section("photos", n > 1 ? n + " photos" + (ph.from !== c ? " here" : "") : "Photo" + (ph.from !== c ? " here" : ""), kids, "click to set focus");
  }

  // Filters, zoom and flip are kept in separate CSS properties so the site's own scroll effects
  // (which animate `transform`) still work on top of them.
  function parseFilter(s) {
    var o = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, blur: 0 };
    String(s || "").replace(/(brightness|contrast|saturate|grayscale|blur)\(([\d.]+)(%|px)?\)/g, function (m, k, v, u) {
      o[k] = k === "blur" ? +v : (u === "%" ? +v : +v * 100);
    });
    return o;
  }
  function filterCss(o) {
    var parts = [];
    if (o.brightness !== 100) parts.push("brightness(" + o.brightness + "%)");
    if (o.contrast !== 100) parts.push("contrast(" + o.contrast + "%)");
    if (o.saturate !== 100) parts.push("saturate(" + o.saturate + "%)");
    if (o.grayscale) parts.push("grayscale(" + o.grayscale + "%)");
    if (o.blur) parts.push("blur(" + o.blur + "px)");
    return parts.join(" ");
  }
  function setProp(comp, prop, val) {
    if (val === "" || val == null) comp.removeStyle(prop); else { var o = {}; o[prop] = val; comp.addStyle(o); }
  }
  function adjustPanel(p) {
    var c = p.comp, frame = frameOf(p), st = c.getStyle(), fst = frame.getStyle(), isImg = p.kind === "img";
    var sc = String(st.scale || "1").trim().split(/\s+/).map(Number);
    var zoom = Math.abs(sc[1] != null ? sc[1] : sc[0]) || 1, flip = sc[0] < 0;
    var filt = parseFilter(st.filter);
    var out = [];
    function applyScale() {
      var v = zoom === 1 && !flip ? "" : (flip ? "-" + zoom + " " + zoom : String(zoom));
      setProp(c, "scale", v);
    }
    function applyFilter(commit) { setProp(c, "filter", filterCss(filt)); if (commit) changed(); }
    if (isImg) out.push(field("Alt text (for Google & screen readers)", input(c.getAttributes().alt || "", function (v) { c.addAttributes({ alt: v }); changed(); }, { placeholder: "Describe the photo" })));
    if (isImg) out.push(field("Fit", select(st["object-fit"] || "", [["", "Site default"], ["cover", "Fill the frame (crop)"], ["contain", "Show the whole photo"], ["fill", "Stretch"]], function (v) { setProp(c, "object-fit", v); changed(); })));
    out.push(field("Shape", select(fst["aspect-ratio"] || "", [["", "Site default"], ["1 / 1", "Square 1:1"], ["4 / 5", "Portrait 4:5"], ["3 / 4", "Portrait 3:4"], ["2 / 3", "Tall 2:3"], ["4 / 3", "Landscape 4:3"], ["3 / 2", "Landscape 3:2"], ["16 / 9", "Wide 16:9"], ["21 / 9", "Cinema 21:9"]], function (v) {
      setProp(frame, "aspect-ratio", v);
      if (frame === c && isImg) setProp(c, "height", v ? "auto" : "");
      changed();
    }), frame !== c ? "Applies to the photo's frame" : null));
    if (isImg) out.push(slider("Zoom", zoom * 100, 100, 250, 1, "%", 100, function (v, commit) { zoom = v / 100; applyScale(); if (commit) changed(); }));
    out.push(check("Flip horizontally", flip, function (v) { flip = v; applyScale(); changed(); }));
    out.push(h("p", { class: "ed-sub", text: "Filters" }));
    out.push(slider("Brightness", filt.brightness, 0, 200, 1, "%", 100, function (v, k) { filt.brightness = v; applyFilter(k); }));
    out.push(slider("Contrast", filt.contrast, 0, 200, 1, "%", 100, function (v, k) { filt.contrast = v; applyFilter(k); }));
    out.push(slider("Saturation", filt.saturate, 0, 200, 1, "%", 100, function (v, k) { filt.saturate = v; applyFilter(k); }));
    out.push(slider("Black & white", filt.grayscale, 0, 100, 1, "%", 0, function (v, k) { filt.grayscale = v; applyFilter(k); }));
    out.push(slider("Blur", filt.blur, 0, 12, 0.5, "px", 0, function (v, k) { filt.blur = v; applyFilter(k); }));
    var op = st.opacity != null && st.opacity !== "" ? Math.round(parseFloat(st.opacity) * 100) : 100;
    out.push(slider("Opacity", op, 0, 100, 1, "%", 100, function (v, k) { setProp(c, "opacity", v === 100 ? "" : String(v / 100)); if (k) changed(); }));
    var rad = parseFloat(fst["border-radius"]); rad = isNaN(rad) ? 0 : rad;
    out.push(slider("Rounded corners", rad, 0, 80, 1, "px", 0, function (v, k) { setProp(frame, "border-radius", v ? v + "px" : ""); if (k) changed(); }));
    out.push(h("div", { class: "ed-row" }, [btn("Reset all adjustments", "ed-btn--ghost", function () {
      ["scale", "filter", "opacity", "object-fit"].forEach(function (k) { c.removeStyle(k); });
      ["aspect-ratio", "border-radius"].forEach(function (k) { frame.removeStyle(k); });
      if (frame === c) c.removeStyle("height");
      changed(); refresh();
    })]));
    return h("div", { class: "ed-fields" }, out);
  }

  /* ---------- Videos ---------- */
  function findDeep(c, test) {
    if (test(c)) return c;
    var hit = null;
    c.components().forEach(function (k) { if (!hit) hit = findDeep(k, test); });
    return hit;
  }
  function isYt(c) { return c.get("type") === "yt-film"; }
  function ytIn(c) { return (c.closest && c.closest(".yt")) || findDeep(c, isYt); }
  function videoFileIn(c) { return findDeep(c, function (k) { return k.get("type") === "video" || k.get("tagName") === "video"; }); }
  function ytId(v) { var m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(String(v).trim()) ? String(v).trim() : null); }

  function youtubeSection(yt) {
    var a = yt.getAttributes(), id = a["data-id"] || "";
    var thumb = findDeep(yt, function (k) { return k.get("type") === "image" || k.get("tagName") === "img"; });
    var tsrc = thumb ? thumb.get("src") : "";
    var custom = tsrc && tsrc.indexOf("i.ytimg.com") < 0;
    var preview = h("img", { alt: "", src: tsrc || ("https://i.ytimg.com/vi/" + id + "/hqdefault.jpg") });
    var kids = [
      h("div", { class: "ed-vthumb" }, [preview, h("span", { class: "mm-badge", text: custom ? "Custom thumbnail" : "YouTube thumbnail" })]),
      field("YouTube video (link or ID)", input(id ? "https://youtu.be/" + id : "", function (v, el) {
        var nid = ytId(v);
        if (!nid) { E.toast("That doesn't look like a YouTube link.", true); el.value = id ? "https://youtu.be/" + id : ""; return; }
        yt.addAttributes({ "data-id": nid });
        if (thumb && !custom) { thumb.set("src", "https://i.ytimg.com/vi/" + nid + "/hqdefault.jpg"); thumb.removeAttributes(["srcset", "sizes"]); }
        changed(); refresh();
      }, { placeholder: "https://youtu.be/…" }), "Plays when visitors click the thumbnail"),
      field("Title (read out to screen readers)", input(String(a["aria-label"] || "").replace(/^Play film:\s*/, ""), function (v) { yt.addAttributes({ "aria-label": "Play film: " + v }); changed(); })),
      h("div", { class: "ed-row" }, [
        thumb ? btn("Change thumbnail", "ed-btn--gold", function () { E.pickPhoto(function (src) { thumb.set("src", src); thumb.removeAttributes(["srcset", "sizes"]); changed(); refresh(); }); }) : null,
        thumb && custom ? btn("Use YouTube's", "", function () { thumb.set("src", "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg"); changed(); refresh(); }, "Go back to the thumbnail from YouTube") : null,
        id ? h("a", { class: "ed-btn ed-btn--ghost", href: "https://www.youtube.com/watch?v=" + id, target: "_blank", rel: "noopener", text: "Watch ↗" }) : null
      ]),
      h("p", { class: "ed-hint", text: "To change this film on every page at once, use Media → Videos → Change video." })
    ];
    return section("video", "YouTube film", kids);
  }

  function videoSection(v) {
    var a = v.getAttributes(), src = v.get("src") || a.src || "";
    var shown = E.fromEditor((E.state.blobMap && E.state.blobMap[src]) || src);
    if (/\/admin\/?$/.test(shown)) shown = "";
    var poster = a.poster || "";
    var kids = [
      h("div", { class: "ed-vthumb" }, [shown ? h("video", { src: src, poster: poster ? E.toEditor(poster) : null, muted: true, preload: "metadata", controls: true }) : h("div", { class: "ed-empty", text: "No video chosen yet" })]),
      field("Video source", input(shown, function (val) { var s = E.toEditor(val); v.set("src", s); v.addAttributes({ src: s }); changed(); refresh(); }, { placeholder: "assets/uploads/my-film.mp4 or https://…" }), "An MP4/WebM file on this site, or a full link to one"),
      h("div", { class: "ed-row" }, [btn("Choose or upload…", "ed-btn--gold", function () { if (window.__mediaLibrary) window.__mediaLibrary.open("videos"); })]),
      h("p", { class: "ed-sub", text: "Thumbnail (shown before the video plays)" }),
      h("div", { class: "ed-row ed-poster" }, [
        poster ? h("img", { alt: "", src: E.toEditor(poster) }) : h("span", { class: "ed-hint", text: "None: the first frame is shown" }),
        btn(poster ? "Change" : "Add thumbnail", poster ? "" : "ed-btn--gold", function () { E.pickPhoto(function (s) { v.addAttributes({ poster: s }); changed(); refresh(); }); }),
        poster ? btn("Remove", "ed-btn--ghost", function () { v.removeAttributes(["poster"]); changed(); refresh(); }) : null
      ]),
      h("p", { class: "ed-sub", text: "Playback" }),
      h("div", { class: "ed-checks" }, [
        check("Autoplay", v.get("autoplay"), function (x) { v.set("autoplay", x); if (x) { v.addAttributes({ muted: "" }); } changed(); refresh(); }),
        check("Loop", v.get("loop"), function (x) { v.set("loop", x); changed(); }),
        check("Muted", "muted" in a, function (x) { if (x) v.addAttributes({ muted: "" }); else v.removeAttributes(["muted"]); changed(); }),
        check("Show controls", v.get("controls"), function (x) { v.set("controls", x); changed(); }),
        check("Play inline on phones", "playsinline" in a, function (x) { if (x) v.addAttributes({ playsinline: "" }); else v.removeAttributes(["playsinline"]); changed(); })
      ]),
      v.get("autoplay") && !("muted" in a) ? h("p", { class: "ed-warn", text: "Browsers only autoplay muted videos." }) : null
    ];
    return section("video", "Video", kids);
  }

  /* ---------- Links ---------- */
  function pageOptions() {
    var dl = document.getElementById("ed-pages-dl");
    if (!dl) {
      dl = h("datalist", { id: "ed-pages-dl" });
      document.body.appendChild(dl);
    }
    dl.innerHTML = "";
    document.querySelectorAll("#ed-target option").forEach(function (o) {
      if (/\.html$/.test(o.value)) dl.appendChild(h("option", { value: o.value, text: o.textContent }));
    });
    ["#contact", "mailto:", "tel:", "https://"].forEach(function (v) { dl.appendChild(h("option", { value: v })); });
    return "ed-pages-dl";
  }
  function linkOf(c) { return c.get("tagName") === "a" ? c : (c.closest && c.closest("a")); }
  function linkSection(c) {
    var link = linkOf(c);
    if (!link) {
      var url = input("", function () {}, { placeholder: "Page, #section or https://…", list: pageOptions() });
      return section("link", "Link", [
        h("p", { class: "ed-hint", text: "This element doesn't link anywhere." }),
        field("Link to", url),
        h("div", { class: "ed-row" }, [btn("Add link", "ed-btn--gold", function () {
          var v = url.value.trim(); if (!v) { url.focus(); return; }
          var parent = c.parent(), at = c.index();
          var a = parent.append({ type: "link", tagName: "a", attributes: { href: v }, style: {} }, { at: at })[0];
          c.move(a, { at: 0 });
          if (/^(https?:)?\/\//.test(v)) a.addAttributes({ target: "_blank", rel: "noopener" });
          changed(); editor.select(c); refresh();
          E.toast("Link added. It's live after you Publish.");
        })])
      ], "none");
    }
    var at = link.getAttributes(), href = at.href || "";
    var rel = String(at.rel || "").split(/\s+/).filter(Boolean);
    function setRel(word, on) {
      rel = rel.filter(function (r) { return r !== word; }); if (on) rel.push(word);
      if (rel.length) link.addAttributes({ rel: rel.join(" ") }); else link.removeAttributes(["rel"]);
    }
    var testHref = /^(https?:|mailto:|tel:)/.test(href) ? href : SITE + href.replace(/^\//, "");
    var kids = [
      link !== c ? h("p", { class: "ed-hint" }, ["This is inside a link (", h("strong", { text: link.getName() }), "). ", h("a", { href: "#", text: "Select the link", onclick: function (e) { e.preventDefault(); editor.select(link); } })]) : null,
      field("Link to", input(E.fromEditor(href), function (v) { link.addAttributes({ href: v || "#" }); changed(); refresh(); }, { placeholder: "Page, #section or https://…", list: pageOptions() }), "Pick a page, type #section-id, mailto:, tel: or a full web address"),
      h("div", { class: "ed-checks" }, [
        check("Open in a new tab", at.target === "_blank", function (x) { if (x) { link.addAttributes({ target: "_blank" }); setRel("noopener", true); } else { link.removeAttributes(["target"]); setRel("noopener", false); } changed(); }),
        check("Ask Google not to follow (nofollow)", rel.indexOf("nofollow") >= 0, function (x) { setRel("nofollow", x); changed(); })
      ]),
      h("div", { class: "ed-row" }, [
        href && href !== "#" ? h("a", { class: "ed-btn ed-btn--ghost", href: testHref, target: "_blank", rel: "noopener", text: "Open link ↗" }) : null,
        btn("Remove link", "ed-btn--danger", function () { removeLink(link); })
      ])
    ];
    return section("link", "Link", kids, E.fromEditor(href).slice(0, 28));
  }
  function removeLink(link) {
    var parent = link.parent(), kids = link.components().models.slice();
    var plainWrapper = !link.getClasses().length && kids.length && kids.every(function (k) { return k.get("type") !== "textnode"; });
    if (plainWrapper) {
      var at = link.index(), first = kids[0];
      kids.forEach(function (k, i) { k.move(parent, { at: at + i }); });
      link.remove(); editor.select(first);
    } else {
      // A styled link (e.g. a button): keep its look, just stop it linking.
      link.removeAttributes(["href", "target", "rel"]);
      link.set("tagName", "span");
    }
    changed(); refresh();
    E.toast("Link removed.");
  }

  /* ---------- Text ---------- */
  var TEXT_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "div", "span"];
  function isTextish(c) { var t = c.get("tagName"); return c.get("type") === "text" || /^h[1-6]$/.test(t) || t === "p" || t === "blockquote"; }
  function textSection(c) {
    var t = c.get("tagName");
    return section("text", "Text", [
      field("HTML tag", select(TEXT_TAGS.indexOf(t) >= 0 ? t : "div", TEXT_TAGS.map(function (x) { return [x, x === "p" ? "Paragraph <p>" : x === "div" ? "Block <div>" : x === "span" ? "Inline <span>" : x === "blockquote" ? "Quote <blockquote>" : "Heading " + x.toUpperCase()]; }), function (v) {
        c.set("tagName", v); changed(); refresh();
      }), "Headings matter for Google: one H1 per page, then H2s for sections. Looks are set by the classes/Style tab."),
      h("p", { class: "ed-hint", text: "Double-click the text on the page to type. Select words to make them bold, italic, a link or a colour." })
    ]);
  }

  /* ================================ ADVANCED ================================ */
  var siteClasses = null;
  function classList() {
    if (siteClasses) return siteClasses;
    var set = {};
    try {
      Array.prototype.forEach.call(editor.Canvas.getDocument().styleSheets, function (ss) {
        var rules; try { rules = ss.cssRules; } catch (e) { return; }
        (function walk(rs) {
          Array.prototype.forEach.call(rs || [], function (r) {
            if (r.selectorText) r.selectorText.replace(/\.([A-Za-z][\w-]*)/g, function (m, n) { if (!/^(gjs|ed-)/.test(n)) set[n] = 1; });
            if (r.cssRules) walk(r.cssRules);
          });
        })(rules);
      });
    } catch (e) {}
    siteClasses = Object.keys(set).sort();
    return siteClasses;
  }
  function classDatalist() {
    var dl = document.getElementById("ed-classes-dl");
    if (!dl) { dl = h("datalist", { id: "ed-classes-dl" }); classList().forEach(function (n) { dl.appendChild(h("option", { value: n })); }); document.body.appendChild(dl); }
    return "ed-classes-dl";
  }
  function rulesFor(id) {
    var re = new RegExp("#" + id.replace(/[-]/g, "\\-") + "(?![\\w-])");
    return editor.Css.getAll().filter(function (r) { return re.test(r.selectorsToString()); });
  }
  function prettyCss(css) {
    var out = "", ind = 0, pad = function () { return new Array(ind + 1).join("  "); };
    css.replace(/\s+/g, " ").split(/([{};])/).forEach(function (tok) {
      tok = tok.trim(); if (!tok) return;
      if (tok === "{") { out += " {\n"; ind++; }
      else if (tok === "}") { if (!/\n$/.test(out)) out += ";\n"; ind = Math.max(0, ind - 1); out += pad() + "}\n"; }
      else if (tok === ";") { out = out.replace(/\s*$/, "") + ";\n"; }
      else out += pad() + tok;
    });
    return out.trim();
  }
  function cssFor(id) {
    var css = rulesFor(id).map(function (r) { return r.toCSS(); }).filter(Boolean).join("");
    return prettyCss(css.split("#" + id).join("selector"));
  }

  function advanced(c) {
    var out = [], id = c.getId(), attrs = c.getAttributes();
    // ID
    out.push(section("ident", "CSS ID", [field("ID", input(attrs.id || id, function (v, el) {
      if (!v || v === c.getId()) return;
      if (!/^[A-Za-z][\w-]*$/.test(v)) { E.toast("IDs start with a letter and use only letters, numbers, - and _.", true); el.value = c.getId(); return; }
      if (editor.Canvas.getDocument().getElementById(v)) { E.toast("Another element already uses #" + v + ".", true); el.value = c.getId(); return; }
      var old = c.getId(), extra = rulesFor(old).filter(function (r) { return r.selectorsToString() !== "#" + old || r.get("mediaText") || r.get("state"); });
      var css = extra.map(function (r) { return r.toCSS(); }).join("");
      extra.forEach(function (r) { editor.Css.remove(r); });
      c.setId(v);
      if (css) editor.Css.addRules(css.split("#" + old).join("#" + v));
      changed(); refresh();
    }), "Lets links jump here with #your-id, and targets this element in custom CSS")]));

    // Classes
    var chips = h("div", { class: "ed-chips" });
    c.getClasses().forEach(function (n) {
      chips.appendChild(h("span", { class: "ed-chip" }, [n, h("button", { type: "button", title: "Remove class", text: "×", onclick: function () { c.removeClass(n); changed(); refresh(); } })]));
    });
    var addCls = input("", function (v, el) {
      v.split(/[\s,]+/).filter(Boolean).forEach(function (n) { if (/^-?[_A-Za-z][\w-]*$/.test(n)) c.addClass(n); });
      el.value = ""; changed(); refresh();
    }, { placeholder: "Add a class, press Enter", list: classDatalist() });
    out.push(section("classes", "CSS classes", [chips, addCls, h("small", { class: "ed-f__h", text: "Any class from the site's stylesheet works, e.g. h-xl, btn, btn--light, label, mt-l, reveal" })]));

    // Attributes
    var rows = h("div", { class: "ed-attrs" });
    Object.keys(attrs).filter(function (k) { return ["id", "class", "style"].indexOf(k) < 0; }).forEach(function (k) {
      var name = input(k, function (nv) {
        if (!nv || nv === k) return;
        var val = c.getAttributes()[k]; c.removeAttributes([k]); var o = {}; o[nv] = val; c.addAttributes(o); changed(); refresh();
      });
      var val = input(attrs[k] === true ? "" : String(attrs[k]), function (nv) { var o = {}; o[k] = nv; c.addAttributes(o); changed(); });
      rows.appendChild(h("div", { class: "ed-attr" }, [name, val, h("button", { type: "button", class: "ed-mini", title: "Remove", text: "×", onclick: function () { c.removeAttributes([k]); changed(); refresh(); } })]));
    });
    var nk = input("", function () {}, { placeholder: "name" }), nv = input("", function () {}, { placeholder: "value" });
    rows.appendChild(h("div", { class: "ed-attr ed-attr--new" }, [nk, nv, h("button", { type: "button", class: "ed-mini", title: "Add attribute", text: "+", onclick: function () {
      var k = nk.value.trim(); if (!/^[A-Za-z_:][\w:.-]*$/.test(k)) { nk.focus(); return; }
      var o = {}; o[k] = nv.value; c.addAttributes(o); changed(); refresh();
    } })]));
    out.push(section("attrs", "Attributes", [rows, h("small", { class: "ed-f__h", text: "e.g. title, aria-label, data-… attributes, loading" })], Object.keys(attrs).length - (attrs.id ? 1 : 0) - (attrs.class ? 1 : 0) + ""));

    // Responsive visibility
    var cls = c.getClasses();
    function toggleCls(n, on) { if (on) c.addClass(n); else c.removeClass(n); changed(); }
    out.push(section("responsive", "Responsive", [
      h("div", { class: "ed-checks" }, [
        check("Hide on desktop", cls.indexOf("hide-desktop") >= 0, function (x) { toggleCls("hide-desktop", x); }),
        check("Hide on tablet", cls.indexOf("hide-tablet") >= 0, function (x) { toggleCls("hide-tablet", x); }),
        check("Hide on phones", cls.indexOf("hide-mobile") >= 0, function (x) { toggleCls("hide-mobile", x); })
      ]),
      h("small", { class: "ed-f__h", text: "Hidden elements stay visible but faded in the editor, so you can still select them." })
    ]));

    // Motion
    var anim = cls.indexOf("reveal-img") >= 0 ? "reveal-img" : cls.indexOf("reveal") >= 0 ? "reveal" : ("data-parallax" in attrs) ? "parallax" : "";
    out.push(section("motion", "Motion effects", [
      field("Entrance animation", select(anim, [["", "None"], ["reveal", "Fade up"], ["reveal-img", "Photo reveal (unmasks)"], ["parallax", "Parallax drift while scrolling"]], function (v) {
        ["reveal", "reveal-img"].forEach(function (n) { c.removeClass(n); });
        c.removeAttributes(["data-parallax"]);
        if (v === "parallax") c.addAttributes({ "data-parallax": "" }); else if (v) c.addClass(v);
        changed(); refresh();
      }), "Plays on the live site as the element scrolls into view"),
      anim === "reveal" ? field("Delay", select(String(attrs["data-delay"] || ""), [["", "None"], ["1", "0.08s"], ["2", "0.16s"], ["3", "0.24s"], ["4", "0.32s"]], function (v) {
        if (v) c.addAttributes({ "data-delay": v }); else c.removeAttributes(["data-delay"]); changed();
      })) : null
    ]));

    // Custom CSS
    var ta = h("textarea", { rows: 9, spellcheck: "false", class: "ed-code" });
    ta.value = cssFor(id) || "selector {\n  \n}";
    out.push(section("css", "Custom CSS", [
      h("small", { class: "ed-f__h", html: "Use <code>selector</code> for this element, e.g. <code>selector:hover { opacity: .8 }</code> or <code>@media (max-width: 759px) { selector { display: none } }</code>." }),
      ta,
      h("div", { class: "ed-row" }, [btn("Apply CSS", "ed-btn--gold", function () {
        var src = ta.value.split("selector").join("#" + id).trim();
        rulesFor(id).forEach(function (r) { editor.Css.remove(r); });
        if (src && !/^#[\w-]+\s*\{\s*\}$/.test(src)) editor.Css.addRules(src);
        c.addAttributes({ id: id });
        changed(); refresh(); E.toast("CSS applied.");
      })])
    ], (function (n) { return n ? n + " rule" + (n > 1 ? "s" : "") : ""; })(rulesFor(id).filter(function (r) { return r.toCSS(); }).length)));

    // HTML
    var hta = h("textarea", { rows: 10, spellcheck: "false", class: "ed-code" });
    hta.value = E.fromEditor(c.toHTML());
    out.push(section("html", "HTML code", [
      h("small", { class: "ed-f__h", text: "The full HTML of this element. Edit and apply to replace it." }),
      hta,
      h("div", { class: "ed-row" }, [btn("Apply HTML", "ed-btn--gold", function () {
        var v = hta.value.trim(); if (!v) return;
        // Replacing drops the old elements' style rules; carry them over for any IDs the new HTML keeps.
        var ids = [];
        (function walk(k) { ids.push(k.getId()); k.components().forEach(walk); })(c);
        var keep = ids.map(function (i) { return rulesFor(i).map(function (r) { return r.toCSS(); }).join(""); }).join("");
        var res = c.replaceWith(E.toEditor(v));
        if (keep) editor.Css.addRules(keep);
        res = Array.isArray(res) ? res : [res];
        changed(); if (res[0]) editor.select(res[0]); E.applyOverrides(E.state.target); E.toast("HTML applied.");
      })])
    ]));
    return out;
  }

  window.__inspector = { show: show, refresh: refresh, sync: sync, state: state };
  editor.on("load", function () { setTimeout(sync, 0); });
})();
