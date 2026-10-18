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
  var openSecs = { "site-Background": true, "site-Text": true, "site-Accent": true, icon: true, photos: true, photosInside: false, adjust: true, video: true, link: true, text: true, ident: true, classes: true, attrs: false, responsive: true, motion: true, css: false, html: false };
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
  function others(fn) { ["open-sm", "open-tm", "open-layers", "open-blocks", "open-site"].forEach(function (id) { var b = viewBtn(id); if (b) fn(b); }); }

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
    editor.on("run:" + id, function () {
      ["open-insp", "open-site"].forEach(function (x) { var b = viewBtn(x); if (b && b.get("active")) b.set("active", false); });
      state.active = false; sync();
    });
    editor.on("stop:" + id, sync);
  });

  /* ------------------------------ Site style (colours for every page) ------------------------------ */
  var sitePanel = h("div", { class: "ed-insp ed-site", hidden: true });
  var THEME_DEFAULTS = { "--paper": "#0d0b09", "--paper-2": "#15120f", "--paper-3": "#1e1a16", "--ink": "#efe7da", "--ink-2": "#c3b9a9",
    "--muted": "#8d8373", "--ivory": "#efe7da", "--accent": "#c6a46a", "--gold-hi": "#e2c999" };
  var THEME_GROUPS = [
    ["Background", [["--paper", "Page background"], ["--paper-2", "Cards & panels"], ["--paper-3", "Raised areas & photo placeholders"]]],
    ["Text", [["--ink", "Headings & main text"], ["--ink-2", "Body text"], ["--muted", "Small labels"], ["--ivory", "Text on photos & light buttons"]]],
    ["Accent", [["--accent", "Gold accent (buttons, highlights)"], ["--gold-hi", "Light gold (headline accents)"]]]
  ];
  editor.Commands.add("ed-open-site", {
    run: function () {
      ["open-sm", "open-tm", "open-layers", "open-blocks", "open-insp"].forEach(function (id) { var b = viewBtn(id); if (b && b.get("active")) b.set("active", false); });
      state.active = false; sync();
      var host = document.querySelector(".gjs-pn-views-container");
      if (host && sitePanel.parentNode !== host) host.insertBefore(sitePanel, host.firstChild);
      sitePanel.hidden = false; renderSite();
    },
    stop: function () { sitePanel.hidden = true; }
  });
  editor.Panels.addButton("views", {
    id: "open-site", command: "ed-open-site", togglable: false, active: false,
    attributes: { title: "Site style: background and colours for every page" },
    label: "<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.1-.9-1.4-.9-2.4 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z'/><circle cx='7.5' cy='11' r='1.2'/><circle cx='10' cy='7' r='1.2'/><circle cx='14.5' cy='7' r='1.2'/></svg>"
  });
  function themeValue(v) {
    var st = E.state.theme || {};
    if (st[v]) return st[v];
    try { var cs = getComputedStyle(editor.Canvas.getDocument().documentElement).getPropertyValue(v).trim(); if (/^#[0-9a-f]{6}$/i.test(cs)) return cs; } catch (e) {}
    return THEME_DEFAULTS[v];
  }
  var siteTimer;
  function setTheme(v, val) {
    if (val == null) delete E.state.theme[v]; else E.state.theme[v] = val;
    E.state.themeChanged = true;
    E.applyOverrides(E.state.target);
    clearTimeout(siteTimer); siteTimer = setTimeout(E.updateUI, 150);
  }
  function renderSite() {
    sitePanel.innerHTML = "";
    sitePanel.appendChild(h("div", { class: "ed-site__head" }, [h("strong", { text: "Site style" }), h("p", { text: "Colours used on every page. Changes show instantly here and go live when you Publish." })]));
    THEME_GROUPS.forEach(function (g) {
      var rows = g[1].map(function (r) {
        var v = r[0], val = themeValue(v), changedFlag = !!(E.state.theme || {})[v];
        var color = h("input", { type: "color", value: val });
        var hex = h("input", { type: "text", value: val, spellcheck: "false", maxlength: 7, "aria-label": r[1] + " hex" });
        var reset = h("button", { type: "button", class: "ed-mini", title: "Back to original", text: "↺", hidden: !changedFlag, onclick: function () { setTheme(v, null); renderSite(); } });
        color.addEventListener("input", function () { hex.value = color.value; reset.hidden = false; setTheme(v, color.value); });
        hex.addEventListener("change", function () { var x = hex.value.trim(); if (!/^#?[0-9a-f]{6}$/i.test(x)) { hex.value = color.value; return; } x = x.charAt(0) === "#" ? x : "#" + x; color.value = x; hex.value = x; reset.hidden = false; setTheme(v, x); });
        return h("div", { class: "ed-swrow" }, [h("label", { class: "ed-swrow__sw" }, [color]), h("span", { class: "ed-swrow__l", text: r[1] }), hex, reset]);
      });
      sitePanel.appendChild(section("site-" + g[0], g[0], rows));
    });
    sitePanel.appendChild(h("div", { class: "ed-row ed-site__foot" }, [btn("Reset all colours", "ed-btn--ghost", function () {
      if (!confirm("Put every site colour back to the original?")) return;
      E.state.theme = {}; E.state.themeChanged = true; E.applyOverrides(E.state.target); E.updateUI(); renderSite();
    })]));
  }
  function openSite() { var b = viewBtn("open-site"); if (b) { if (b.get("active")) renderSite(); else b.set("active", true); } }

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
    head.appendChild(h("div", { class: "ed-ihead__name" }, [h("strong", { text: isSvg(c) ? "Icon" : c.getName() }), h("code", { text: "<" + (c.get("tagName") || "div") + ">" })]));
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
    // Photos appear the way Elementor shows image controls: open for a photo (or a block that is only
    // photos, like the hero slideshow), folded away for a larger block that merely contains some,
    // and not at all for text that happens to sit on top of a picture.
    var sv = svgIn(c);
    if (sv) out.push(iconSection(sv));
    var ph = E.photosFor(c), kind = photoKind(c, ph);
    if (kind === "photo") out.push(photosSection(c, ph, false));
    else if (kind === "inside") out.push(photosSection(c, ph, true));
    out.push(linkSection(c));
    if (isTextish(c)) out.push(textSection(c));
    if (out.length === 1 && !isTextish(c)) out.push(h("p", { class: "ed-hint", text: "Click text on the page to type. Use Style for colours, spacing and fonts, and Advanced for classes, custom CSS and HTML." }));
    return out;
  }

  /* ---------- Icons (inline SVG) ---------- */
  var ICONS = {
    "Arrow right": "<path d='M5 12h14M13 6l6 6-6 6'/>", "Arrow up-right": "<path d='M7 17L17 7M8 7h9v9'/>", "Arrow down": "<path d='M12 5v14M6 13l6 6 6-6'/>",
    "Chevron": "<path d='M9 6l6 6-6 6'/>", "Plus": "<path d='M12 5v14M5 12h14'/>", "Check": "<path d='M5 12.5l4.5 4.5L19 7.5'/>", "Close": "<path d='M6 6l12 12M18 6L6 18'/>",
    "Menu": "<path d='M4 7h16M4 12h16M4 17h16'/>", "Play": "<path d='M7 4.5v15l13-7.5z' fill='currentColor' stroke='none'/>",
    "Heart": "<path d='M12 20s-7-4.4-9.2-8.6C1.3 8.3 3.2 5 6.5 5c2 0 3.5 1.1 4.5 2.6C12 6.1 13.5 5 15.5 5c3.3 0 5.2 3.3 3.7 6.4C17 15.6 12 20 12 20z'/>",
    "Star": "<path d='M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z'/>",
    "Camera": "<path d='M4 8h3l2-3h6l2 3h3v11H4z'/><circle cx='12' cy='13' r='3.5'/>", "Film": "<rect x='3' y='6' width='13' height='12' rx='2'/><path d='M16 10l5-3v10l-5-3'/>",
    "Mail": "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 7l9 6 9-6'/>",
    "Phone": "<path d='M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'/>",
    "Location": "<path d='M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z'/><circle cx='12' cy='10' r='2.5'/>",
    "Calendar": "<rect x='3' y='5' width='18' height='16' rx='2'/><path d='M3 10h18M8 3v4M16 3v4'/>",
    "Instagram": "<rect x='3' y='3' width='18' height='18' rx='5'/><circle cx='12' cy='12' r='4'/><circle cx='17.5' cy='6.5' r='.8' fill='currentColor'/>",
    "Facebook": "<path d='M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z'/>",
    "YouTube": "<rect x='2.5' y='5.5' width='19' height='13' rx='4'/><path d='M10 9.5v5l4.5-2.5z' fill='currentColor'/>",
    "X / Twitter": "<path d='M4 4l16 16M20 4l-6.5 6.5M10.5 13.5L4 20'/>",
    "Quote": "<path d='M10 7H6a3 3 0 0 0-3 3v7h7v-7H6a1 1 0 0 1 1-1h3zM21 7h-4a3 3 0 0 0-3 3v7h7v-7h-4a1 1 0 0 1 1-1h3z' fill='currentColor' stroke='none'/>",
    "Globe": "<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18'/>"
  };
  function iconMarkup(inner) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>" + inner + "</svg>"; }
  function isSvg(c) { return c.get("tagName") === "svg" || c.get("type") === "svg"; }
  function svgIn(c) {
    if (isSvg(c)) return c;
    var found = [];
    (function walk(k) { if (found.length > 1) return; if (isSvg(k)) { found.push(k); return; } k.components().forEach(walk); })(c);
    return found.length === 1 && c.components().length <= 4 ? found[0] : null;
  }
  // Uploaded or pasted SVG code: keep the drawing, drop anything that could run code.
  function cleanSvg(markup) {
    var doc = new DOMParser().parseFromString(String(markup).trim(), "image/svg+xml"), root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return null;
    Array.prototype.slice.call(root.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video")).forEach(function (n) { n.remove(); });
    [root].concat(Array.prototype.slice.call(root.querySelectorAll("*"))).forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        if (/^on/i.test(a.name) || (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
      });
    });
    return root;
  }
  function replaceSvg(c, markup) {
    var root = cleanSvg(markup);
    if (!root) { E.toast("That isn't a valid SVG image.", true); return; }
    var old = c.getAttributes(), id = c.getId();
    ["class", "aria-hidden", "role", "focusable", "width", "height"].forEach(function (k) { if (old[k] != null && old[k] !== "" && !root.hasAttribute(k)) root.setAttribute(k, old[k]); });
    root.setAttribute("id", id);
    var keep = rulesFor(id).map(function (r) { return r.toCSS(); }).join("");
    var res = c.replaceWith(new XMLSerializer().serializeToString(root).replace(/ xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, ""));
    if (keep) editor.Css.addRules(keep);
    res = Array.isArray(res) ? res : [res];
    changed(); if (res[0]) editor.select(res[0]);
  }
  function iconSection(c) {
    var el = c.getEl(), cs = el ? el.ownerDocument.defaultView.getComputedStyle(el) : null;
    var prev = h("div", { class: "ed-svgprev", html: E.fromEditor(c.toHTML()) });
    if (cs) prev.style.color = cs.color;
    var grid = h("div", { class: "ed-icongrid", hidden: true }, Object.keys(ICONS).map(function (name) {
      return h("button", { type: "button", title: name, html: iconMarkup(ICONS[name]), onclick: function () { replaceSvg(c, iconMarkup(ICONS[name])); } });
    }));
    var code = h("textarea", { rows: 6, spellcheck: "false", class: "ed-code", hidden: true });
    var applyCode = btn("Apply code", "ed-btn--gold", function () { replaceSvg(c, code.value); });
    applyCode.hidden = true;
    var file = h("input", { type: "file", accept: ".svg,image/svg+xml", hidden: true });
    file.addEventListener("change", function () {
      var f = file.files[0]; if (!f) return;
      if (f.size > 200000) { E.toast("That SVG is very large. Please use one under 200 KB.", true); return; }
      f.text().then(function (t) { replaceSvg(c, t); });
    });
    var st = c.getStyle(), size = parseFloat(st.width) || (el ? Math.round(el.getBoundingClientRect().width) : 24) || 24;
    var colorIn = h("input", { type: "color", value: toHex(st.color || (cs && cs.color)) || "#c6a46a" });
    colorIn.addEventListener("input", function () { c.addStyle({ color: colorIn.value }); prev.style.color = colorIn.value; });
    colorIn.addEventListener("change", changed);
    return section("icon", "Icon", [
      prev,
      h("div", { class: "ed-row" }, [
        btn("Choose icon", "ed-btn--gold", function () { grid.hidden = !grid.hidden; }),
        btn("Upload SVG", "", function () { file.click(); }),
        btn("Edit code", "ed-btn--ghost", function () { code.hidden = !code.hidden; applyCode.hidden = code.hidden; if (!code.hidden) code.value = E.fromEditor(c.toHTML()); })
      ]),
      grid, code, h("div", { class: "ed-row" }, [applyCode]), file,
      h("div", { class: "ed-swrow" }, [h("label", { class: "ed-swrow__sw" }, [colorIn]), h("span", { class: "ed-swrow__l", text: "Icon colour" }),
        h("button", { type: "button", class: "ed-mini", title: "Use the surrounding text colour", text: "↺", onclick: function () { c.removeStyle("color"); changed(); refresh(); } })]),
      slider("Size", Math.round(size), 8, 160, 1, "px", Math.round(size), function (v, k) { c.addStyle({ width: v + "px", height: v + "px" }); if (k) changed(); }),
      h("p", { class: "ed-hint", text: "Colour works for single-colour icons (like the site's own). Multi-colour SVGs keep their own colours." })
    ]);
  }
  function toHex(c) {
    if (!c) return "";
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    var m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + (+x).toString(16)).slice(-2); }).join("") : "";
  }

  /* ---------- Photos ---------- */
  function frameOf(p) {
    var parent = p.comp.parent();
    if (p.kind === "img" && parent && parent.getClasses().indexOf("media") >= 0) return parent;
    return p.comp;
  }
  function hasText(c) {
    var found = false;
    (function walk(k) {
      if (found) return;
      var t = k.get("type");
      if ((t === "text" || t === "link" || t === "textnode") && (k.getEl() ? (k.getEl().textContent || "").trim() : (k.get("content") || "").trim())) { found = true; return; }
      k.components().forEach(walk);
    })(c);
    return found;
  }
  function photoKind(c, ph) {
    if (!ph.list.length) return "";
    if (ph.from !== c) return ""; // photos merely underneath the clicked element
    if (E.photoOf(c) || c.get("type") === "hero-slideshow" || !hasText(c)) return "photo";
    return "inside";
  }
  function photosSection(c, ph, folded) {
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
    if (folded) return section("photosInside", n + (n > 1 ? " photos" : " photo") + " inside", kids, "open to change");
    return section("photos", n > 1 ? n + " photos" : "Photo", kids, "click to set focus");
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
  var AUTO_ID = /^i[a-z0-9]{3,6}(-\d+)?$/;
  function original(c) {
    var o = c.get("edOrig");
    if (!o) {
      var a = c.getAttributes();
      // IDs the editor generates look like "ib8dp"; anything else came from the site and is locked.
      o = { ccid: c.ccid, id: a.id && !AUTO_ID.test(a.id) ? a.id : "", classes: c.getClasses().slice(),
        attrs: Object.keys(a).filter(function (k) { return ["id", "class", "style"].indexOf(k) < 0; }) };
      c.set("edOrig", o, { silent: true });
    }
    return o;
  }
  // Remember each element's original state the first time it's selected, before any edits.
  editor.on("component:selected", function (c) { if (c) original(c); });
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
    // What the element had before anyone edited it: the site's own ID, classes and attributes stay locked,
    // so a typo can't break the design, links or animations. Only additions can be changed or removed.
    var o = original(c), cur = c.getId(), myId = cur && cur !== o.ccid && cur !== o.id && !AUTO_ID.test(cur) ? cur : "";
    var lock = "<svg viewBox='0 0 24 24' width='12' height='12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'><rect x='5' y='11' width='14' height='9' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/></svg>";
    function renameId(v, el) {
      var old = c.getId();
      if (v === old) return;
      if (v !== o.ccid) {
        if (!/^[A-Za-z][\w-]*$/.test(v)) { E.toast("Use letters, numbers and dashes, starting with a letter, e.g. contact or our-story.", true); if (el) el.value = myId; return; }
        if (editor.Canvas.getDocument().getElementById(v)) { E.toast("Another part of this page already uses #" + v + ".", true); if (el) el.value = myId; return; }
      }
      var extra = rulesFor(old).filter(function (r) { return r.selectorsToString() !== "#" + old || r.get("mediaText") || r.get("state"); });
      var css = extra.map(function (r) { return r.toCSS(); }).join("");
      extra.forEach(function (r) { editor.Css.remove(r); });
      c.setId(v);
      if (css) editor.Css.addRules(css.split("#" + old).join("#" + v));
      changed(); refresh();
    }
    var idKids;
    if (o.id) idKids = [h("div", { class: "ed-locked" }, [h("span", { html: lock }), h("code", { text: "#" + o.id })]), h("small", { class: "ed-f__h", text: "Set by the site design, so it's locked. Links can jump here with #" + o.id + "." })];
    else idKids = [
      field("Link name", input(myId, function (v, el) { v = v.replace(/^#/, ""); if (!v) { if (myId) renameId(o.ccid); return; } renameId(v, el); }, { placeholder: "e.g. contact" }),
        "Optional. Lets buttons and menus jump straight here with #name."),
      myId ? h("div", { class: "ed-row" }, [btn("Remove link name", "ed-btn--ghost", function () { renameId(o.ccid); })]) : null
    ];
    out.push(section("ident", "Link name (anchor)", idKids, o.id || myId ? "#" + (o.id || myId) : ""));

    // Classes: the design's own are locked; extra ones can be added and removed.
    var cls0 = c.getClasses(), locked = cls0.filter(function (n) { return o.classes.indexOf(n) >= 0; }), mine = cls0.filter(function (n) { return o.classes.indexOf(n) < 0 && !/^(hide-(desktop|tablet|mobile)|reveal|reveal-img)$/.test(n); });
    var chips = h("div", { class: "ed-chips" });
    locked.forEach(function (n) { chips.appendChild(h("span", { class: "ed-chip is-locked", title: "Part of the site design (locked)", html: lock + "<span></span>" })); chips.lastChild.lastChild.textContent = n; });
    mine.forEach(function (n) {
      chips.appendChild(h("span", { class: "ed-chip" }, [n, h("button", { type: "button", title: "Remove this class", text: "×", onclick: function () { c.removeClass(n); changed(); refresh(); } })]));
    });
    var addCls = input("", function (v, el) {
      v.split(/[\s,]+/).filter(Boolean).forEach(function (n) { if (/^-?[_A-Za-z][\w-]*$/.test(n)) c.addClass(n); });
      el.value = ""; changed(); refresh();
    }, { placeholder: "Add a class, press Enter", list: classDatalist() });
    out.push(section("classes", "Extra CSS classes", [chips.childNodes.length ? chips : null, addCls,
      h("small", { class: "ed-f__h", text: "Locked classes come from the site design. Add extra ones from the stylesheet, e.g. label, mt-l, btn--light." })], mine.length ? mine.length + " added" : ""));

    // Attributes: existing ones are shown read-only; added ones can be edited or removed.
    var rows = h("div", { class: "ed-attrs" });
    Object.keys(attrs).filter(function (k) { return ["id", "class", "style"].indexOf(k) < 0; }).forEach(function (k) {
      var v = attrs[k] === true ? "" : String(attrs[k]);
      if (o.attrs.indexOf(k) >= 0) {
        rows.appendChild(h("div", { class: "ed-attr is-locked", title: "Part of the site (locked)" }, [h("code", { text: k }), h("code", { text: v.length > 40 ? v.slice(0, 40) + "…" : v }), h("span", { class: "ed-attr__lock", html: lock })]));
        return;
      }
      var val = input(v, function (nv) { var x = {}; x[k] = nv; c.addAttributes(x); changed(); });
      rows.appendChild(h("div", { class: "ed-attr" }, [h("code", { text: k }), val, h("button", { type: "button", class: "ed-mini", title: "Remove", text: "×", onclick: function () { c.removeAttributes([k]); changed(); refresh(); } })]));
    });
    var nk = input("", function () {}, { placeholder: "name" }), nv = input("", function () {}, { placeholder: "value" });
    rows.appendChild(h("div", { class: "ed-attr ed-attr--new" }, [nk, nv, h("button", { type: "button", class: "ed-mini", title: "Add attribute", text: "+", onclick: function () {
      var k = nk.value.trim();
      if (!/^[A-Za-z_:][\w:.-]*$/.test(k) || ["id", "class", "style"].indexOf(k.toLowerCase()) >= 0 || /^on/i.test(k)) { E.toast("Use a name like title, aria-label or data-something.", true); nk.focus(); return; }
      if (k in c.getAttributes()) { E.toast("This element already has " + k + ".", true); return; }
      var x = {}; x[k] = nv.value; c.addAttributes(x); changed(); refresh();
    } })]));
    out.push(section("attrs", "Attributes", [rows, h("small", { class: "ed-f__h", text: "Locked rows belong to the site. Add your own, e.g. title, aria-label or data-…" })]));

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

  window.__inspector = { show: show, refresh: refresh, sync: sync, state: state, openSite: openSite };
  editor.on("load", function () { setTimeout(sync, 0); });
})();
