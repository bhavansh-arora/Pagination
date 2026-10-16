/* IB Refrigeration & Engineering — site behaviour */
(function () {
  "use strict";

  var WHATSAPP = "919021426223";
  var PHONE = "+919021426223";
  var IMG = "assets/img/products/";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var waLink = function (text) { return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text); };
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  /* ---------- Header ---------- */
  var header = $(".site-header");
  var toTop = $(".to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  var toggle = $(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Reveal on scroll ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  function observe(root) {
    $$(".reveal:not(.in)", root).forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });
  }
  observe(document);

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, end = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length;
        var t0 = performance.now(), dur = 1600;
        (function tick(t) {
          var p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(dec);
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Products ---------- */
  var PRODUCTS = window.IB_PRODUCTS || [];
  var CATS = window.IB_CATEGORIES || [];
  var catName = function (id) { var c = CATS.filter(function (x) { return x.id === id; })[0]; return c ? c.name : ""; };

  function productCard(p) {
    return '<button type="button" class="product reveal" data-product="' + esc(p.id) + '">' +
      '<div class="product-media"><span class="product-tag">' + esc(catName(p.cat)) + '</span>' +
      '<img src="' + IMG + esc(p.img) + '.jpg" alt="' + esc(p.name) + ' by IB Refrigeration" loading="lazy" width="800" height="800">' +
      '<span class="product-cta">View details &amp; price ' + arrow + '</span></div>' +
      '<div class="product-body"><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p></div></button>';
  }

  var grid = $("#product-grid");
  if (grid) {
    var filtersEl = $("#filters"), searchEl = $("#product-search"), countEl = $("#product-count");
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get("cat") || "all", q: "" };
    if (!CATS.some(function (c) { return c.id === state.cat; })) state.cat = "all";

    var btns = [{ id: "all", name: "All Products" }].concat(CATS).map(function (c) {
      var n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
      return '<button type="button" class="filter" data-cat="' + c.id + '" aria-pressed="' + (c.id === state.cat) + '">' + esc(c.name) + '<small>' + n + '</small></button>';
    }).join("");
    filtersEl.innerHTML = btns;

    function render() {
      var q = state.q.trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        return (state.cat === "all" || p.cat === state.cat) &&
          (!q || (p.name + " " + p.desc + " " + catName(p.cat)).toLowerCase().indexOf(q) > -1);
      });
      grid.innerHTML = list.length ? list.map(productCard).join("") :
        '<div class="empty-state"><h3>No exact match — but we can build it.</h3><p>Everything we make is custom. Tell us what you need.</p>' +
        '<a class="btn btn-whatsapp" href="' + waLink("Hi IB Refrigeration, I am looking for: " + state.q) + '" target="_blank" rel="noopener">Ask on WhatsApp</a></div>';
      if (countEl) countEl.textContent = list.length + (list.length === 1 ? " product" : " products");
      observe(grid);
    }
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest(".filter"); if (!b) return;
      state.cat = b.getAttribute("data-cat");
      $$(".filter", filtersEl).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var url = new URL(location.href);
      state.cat === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", state.cat);
      history.replaceState(null, "", url);
      render();
    });
    searchEl.addEventListener("input", function () { state.q = searchEl.value; render(); });
    render();

    var target = $$(".filter", filtersEl).filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0];
    if (target && target.scrollIntoView && state.cat !== "all") target.scrollIntoView({ block: "nearest", inline: "center" });
  }

  var featured = $("#featured-products");
  if (featured) {
    var ids = (featured.getAttribute("data-ids") || "").split(",");
    featured.innerHTML = ids.map(function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; })
      .filter(Boolean).map(productCard).join("");
    observe(featured);
  }

  /* ---------- Product modal ---------- */
  var modal = $("#product-modal");
  var lastFocus = null;
  function openProduct(id) {
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
    if (!p || !modal) return;
    var msg = "Hi IB Refrigeration, I'm interested in the " + p.name + ". Please share price and details.";
    $(".modal-media", modal).innerHTML = '<img src="' + IMG + esc(p.img) + '.jpg" alt="' + esc(p.name) + '">';
    $(".modal-body", modal).innerHTML =
      '<span class="eyebrow">' + esc(catName(p.cat)) + '</span><h2 id="modal-title">' + esc(p.name) + '</h2><p class="lead" style="font-size:17px">' + esc(p.desc) + '</p>' +
      '<ul class="spec-list">' + p.specs.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + '</ul>' +
      '<div class="modal-actions">' +
      '<a class="btn btn-whatsapp" target="_blank" rel="noopener" href="' + waLink(msg) + '">' + ICON_WA + 'Get Price on WhatsApp</a>' +
      '<a class="btn btn-ghost" href="tel:' + PHONE + '">' + ICON_PHONE + 'Call Now</a></div>' +
      '<p class="form-note">Made to order in our Nagpur workshop · Size, finish & branding fully customisable.</p>';
    lastFocus = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".modal-close", modal).focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-product]");
    if (card) { openProduct(card.getAttribute("data-product")); return; }
    if (e.target.closest("[data-close]")) closeModal();
  });

  /* ---------- Gallery + lightbox ---------- */
  var galleryEl = $("#gallery");
  var lb = $("#lightbox");
  var lbIndex = 0;
  var SHOTS = (window.IB_PHOTOS || []).map(function (p) { return { src: p.src, name: p.name, cap: p.name }; })
    .concat(PRODUCTS.map(function (p) { return { src: IMG + p.img + ".jpg", name: p.name, cap: p.name + " — " + catName(p.cat) }; }));
  if (galleryEl) {
    galleryEl.innerHTML = SHOTS.map(function (s, i) {
      return '<button type="button" class="gallery-item reveal" data-lb="' + i + '"><figure><img src="' + esc(s.src) +
        '" alt="' + esc(s.name) + '" loading="lazy"><figcaption>' + esc(s.name) + '</figcaption></figure></button>';
    }).join("");
    observe(galleryEl);
    galleryEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb]"); if (!b) return;
      showLb(parseInt(b.getAttribute("data-lb"), 10));
    });
  }
  function showLb(i) {
    if (!lb) return;
    lbIndex = (i + SHOTS.length) % SHOTS.length;
    var s = SHOTS[lbIndex];
    $("img", lb).src = s.src;
    $("img", lb).alt = s.name;
    $("figcaption", lb).textContent = s.cap;
    if (!lb.classList.contains("open")) { lastFocus = document.activeElement; lb.classList.add("open"); document.body.style.overflow = "hidden"; $(".lb-close", lb).focus(); }
  }
  function closeLb() { if (!lb) return; lb.classList.remove("open"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  if (lb) {
    $(".lb-close", lb).addEventListener("click", closeLb);
    $(".lb-prev", lb).addEventListener("click", function () { showLb(lbIndex - 1); });
    $(".lb-next", lb).addEventListener("click", function () { showLb(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeLb(); }
    if (lb && lb.classList.contains("open")) {
      if (e.key === "ArrowLeft") showLb(lbIndex - 1);
      if (e.key === "ArrowRight") showLb(lbIndex + 1);
    }
  });

  /* ---------- Reviews: source filter + home carousel ---------- */
  var rf = $("#review-filters");
  if (rf) rf.addEventListener("click", function (e) {
    var b = e.target.closest(".filter"); if (!b) return;
    var src = b.getAttribute("data-src");
    $$(".filter", rf).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    $$("#review-grid .review").forEach(function (r) {
      var s = r.getAttribute("data-src");
      r.hidden = !(src === "all" || s === src || s === "cta");
    });
  });
  var rail = $("#review-rail");
  $$("[data-rail]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!rail) return;
      var card = $(".review", rail);
      var step = card ? card.getBoundingClientRect().width + 20 : 340;
      rail.scrollBy({ left: step * parseInt(b.getAttribute("data-rail"), 10), behavior: "smooth" });
    });
  });

  /* ---------- Quote form → WhatsApp / Email ---------- */
  var form = $("#quote-form");
  if (form) {
    var sel = $("#q-product", form);
    if (sel && CATS.length) {
      sel.innerHTML = '<option value="">Select a category</option>' + CATS.map(function (c) {
        return '<option>' + esc(c.name) + '</option>';
      }).join("") + '<option>Complete Restaurant Kitchen</option><option>Maintenance & Repair</option><option>Something else</option>';
      var pre = new URLSearchParams(location.search).get("need");
      if (pre) sel.value = pre;
    }
    function compose() {
      var d = new FormData(form);
      return "New enquiry from website\n" +
        "Name: " + (d.get("name") || "") + "\n" +
        "Phone: " + (d.get("phone") || "") + "\n" +
        "City: " + (d.get("city") || "") + "\n" +
        "Requirement: " + (d.get("product") || "") + "\n" +
        "Details: " + (d.get("message") || "");
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      window.open(waLink(compose()), "_blank", "noopener");
    });
    var mailBtn = $("#quote-email");
    if (mailBtn) mailBtn.addEventListener("click", function () {
      if (!form.reportValidity()) return;
      location.href = "mailto:info@ibrefrigeration.in?subject=" + encodeURIComponent("Website enquiry") + "&body=" + encodeURIComponent(compose());
    });
  }

  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.1 8.1 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.8L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6Z"/></svg>';
  var ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>';
})();
