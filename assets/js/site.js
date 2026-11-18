/* ==========================================================================
   Love to Cook: interface layer
   Catalogue rendering, booking bag, checkout, calendar, gift builder, forms.
   Built by Code Bunny
   ========================================================================== */
(function () {
  "use strict";

  const D = window.LTC_DATA;
  const B = D.business;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  /* ---------- Config ----------
     DEMO_MODE: checkout simulates payment. Set to false and plug the
     Square Web Payments SDK into `processPayment` to take real payments. */
  const CONFIG = { DEMO_MODE: true, FORM_ENDPOINT: "" };

  /* ---------- Utils ---------- */
  const money = (n) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: B.currency, minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const parseDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmt = (d, o) => d.toLocaleDateString("en-GB", o);
  const dayShort = (d) => fmt(d, { weekday: "short" });
  const monShort = (d) => fmt(d, { month: "short" });
  const longDate = (d) => fmt(d, { weekday: "long", day: "numeric", month: "long" });
  const midDate = (d) => fmt(d, { weekday: "short", day: "numeric", month: "short" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id, cls = "") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const arrowIcon = () => `<span class="btn__icon">${icon("arrow")}${icon("arrow")}</span>`;
  const catLabel = (id) => (D.categories.find((c) => c.id === id) || {}).label || "";
  const store = {
    get(k, f) { try { const v = localStorage.getItem("ltc:" + k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem("ltc:" + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  /* ---------- Catalogue model ---------- */
  const booked = store.get("booked", {}); // sessionId -> seats booked in this browser (demo)
  const course = (id) => D.courses.find((c) => c.id === id);
  const seatsLeft = (s) => Math.max(0, s.left - (booked[s.id] || 0));
  const allSessions = () =>
    D.courses
      .flatMap((c) => c.sessions.map((s) => ({ ...s, course: c, d: parseDate(s.date) })))
      .filter((s) => s.d >= TODAY)
      .sort((a, b) => a.d - b.d || a.start.localeCompare(b.start));
  const findSession = (sid) => allSessions().find((s) => s.id === sid);

  function seatsHTML(s, cap) {
    const left = seatsLeft(s);
    const total = Math.min(cap, 8);
    const scaled = cap > 8 ? Math.round((left / cap) * 8) : left;
    const low = left > 0 && left <= 2;
    let bars = "";
    for (let i = 0; i < total; i++) bars += `<i class="${i < total - scaled ? "is-taken" : ""}"></i>`;
    const txt = left === 0 ? "Sold out · join waitlist" : left === 1 ? "Last seat!" : `${left} of ${cap} seats left`;
    return `<span class="seats ${low ? "is-low" : ""} ${left === 0 ? "is-full" : ""}"><span class="seats__bar" aria-hidden="true">${bars}</span><span class="seats__txt">${txt}</span></span>`;
  }

  /* ---------- Bag ---------- */
  let bag = store.get("bag", []);
  const saveBag = () => { store.set("bag", bag); renderBag(); };
  const bagCount = () => bag.reduce((n, i) => n + i.qty, 0);
  function bagLine(i) {
    if (i.type === "class") {
      const s = findSession(i.sid);
      if (!s) return null;
      return { title: s.course.title, sub: `${longDate(s.d)} · ${s.start}–${s.end}`, img: s.course.image, price: s.course.price, max: seatsLeft(s), unit: "seat" };
    }
    if (i.type === "bake") {
      const b = D.bakes.find((x) => x.id === i.id);
      if (!b) return null;
      return { title: b.name, sub: "Bakery pre-order · collection", img: b.img, price: b.price, max: 24, unit: "item" };
    }
    if (i.type === "voucher") {
      return { title: `Gift voucher for ${i.to || "someone lovely"}`, sub: i.cls ? `For: ${i.cls}` : "Any class or bake · 12 months", voucher: true, amount: i.amount, price: i.amount, max: 10, unit: "voucher" };
    }
    return null;
  }
  const bagTotal = () => bag.reduce((t, i) => { const l = bagLine(i); return t + (l ? l.price * i.qty : 0); }, 0);

  function addToBag(item, label) {
    const key = JSON.stringify({ ...item, qty: 0 });
    const ex = bag.find((i) => JSON.stringify({ ...i, qty: 0 }) === key);
    if (ex) ex.qty += item.qty; else bag.push(item);
    saveBag();
    const btn = $(".bag-btn");
    if (btn) { btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump"); }
    toast(`${label} added to your bag`, "View bag", openDrawer);
  }

  function renderBag() {
    $$(".bag-count").forEach((el) => { const n = bagCount(); el.textContent = n; el.classList.toggle("is-on", n > 0); });
    const body = $("#drawer-body");
    if (!body) return;
    $("#drawer-n").textContent = bagCount() ? `(${bagCount()})` : "";
    if (!bag.length) {
      body.innerHTML = `<div class="bag-empty"><p class="label">Your bag is empty</p><p class="h3">Something <em>delicious</em> is waiting.</p><p>Book a class, pre-order bakes or send a gift voucher.</p><a class="btn btn--sm" href="classes.html">Browse classes ${arrowIcon()}</a></div>`;
      $("#drawer-foot").classList.add("hide");
      return;
    }
    $("#drawer-foot").classList.remove("hide");
    body.innerHTML = bag
      .map((i, idx) => {
        const l = bagLine(i);
        if (!l) return "";
        const img = l.voucher ? `<div class="bag-item__img bag-item__img--voucher">${money(l.amount)}</div>` : `<img class="bag-item__img" src="${l.img}" alt="">`;
        return `<div class="bag-item">${img}<div><b>${esc(l.title)}</b><small>${esc(l.sub)}</small>
          <div class="stepper" role="group" aria-label="Quantity"><button type="button" data-bag-dec="${idx}" aria-label="Fewer">−</button><output>${i.qty}</output><button type="button" data-bag-inc="${idx}" ${i.qty >= l.max ? "disabled" : ""} aria-label="More">+</button></div></div>
          <div class="bag-item__price">${money(l.price * i.qty)}<button type="button" class="bag-item__rm" data-bag-rm="${idx}">Remove</button></div></div>`;
      })
      .join("");
    $("#drawer-total").textContent = money(bagTotal());
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-bag-inc],[data-bag-dec],[data-bag-rm]");
    if (!t) return;
    const idx = +(t.dataset.bagInc ?? t.dataset.bagDec ?? t.dataset.bagRm);
    if ("bagInc" in t.dataset) bag[idx].qty++;
    if ("bagDec" in t.dataset) bag[idx].qty--;
    if ("bagRm" in t.dataset || bag[idx].qty < 1) bag.splice(idx, 1);
    saveBag();
    renderBakeryQty();
  });

  /* ---------- Overlay management ---------- */
  const scrim = $(".scrim");
  let openLayer = null;
  function lockScroll(on) {
    document.documentElement.style.overflow = on ? "hidden" : "";
    if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start();
  }
  function openDrawer() { closeLayer(); $(".drawer").classList.add("is-open"); scrim.classList.add("is-on"); openLayer = "drawer"; lockScroll(true); setTimeout(() => $(".drawer .icon-btn").focus(), 50); }
  function openModal(html) {
    closeLayer();
    const m = $(".modal");
    $(".modal__content", m).innerHTML = html;
    m.classList.add("is-open"); scrim.classList.add("is-on"); openLayer = "modal"; lockScroll(true);
    m.setAttribute("aria-hidden", "false");
    setTimeout(() => { const f = $("input,button:not(.modal__close)", m); f && f.focus(); }, 80);
  }
  function closeLayer() {
    $(".drawer")?.classList.remove("is-open");
    const m = $(".modal");
    if (m) { m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); }
    scrim?.classList.remove("is-on");
    if (openLayer) lockScroll(false);
    openLayer = null;
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-bag]")) { e.preventDefault(); openDrawer(); }
    if (e.target.closest("[data-close]") || e.target === scrim) closeLayer();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeLayer(); closeMenu(); } });

  /* ---------- Toast ---------- */
  let toastT;
  function toast(msg, action, fn) {
    const t = $(".toast");
    if (!t) return;
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="btn btn--sm btn--butter btn--plain" type="button">${action}</button>` : ""}`;
    if (action) $("button", t).onclick = () => { t.classList.remove("is-on"); fn(); };
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 4200);
  }

  /* ---------- Header / menu ---------- */
  const header = $(".header");
  function closeMenu() { document.body.classList.remove("menu-open"); $(".menu-btn")?.setAttribute("aria-expanded", "false"); if (window.__lenis) window.__lenis.start(); }
  $(".menu-btn")?.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", open);
    $(".menu-btn").setAttribute("aria-expanded", String(open));
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  });
  $$(".mmenu a").forEach((a) => a.addEventListener("click", closeMenu));

  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    const hide = y > 400 && y > lastY && !document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", hide);
    document.body.classList.toggle("header-hidden", hide);
    lastY = y;
    // theme switch on dark sections under header
    const probe = header.offsetHeight / 2;
    let dark = false;
    for (const s of $$("[data-header-dark]")) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) { dark = true; break; }
    }
    header.classList.toggle("is-dark", dark);
    const mbar = $(".mbar");
    if (mbar) mbar.classList.toggle("is-on", y > window.innerHeight * 0.6 && !nearFooter());
  }
  const nearFooter = () => { const f = $(".footer"); return f && f.getBoundingClientRect().top < window.innerHeight; };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Next class pill & mobile bar ---------- */
  function nextOpen() { return allSessions().find((s) => seatsLeft(s) > 0); }
  function renderNext() {
    const n = nextOpen();
    if (!n) return;
    $$("[data-next-class]").forEach((el) => {
      el.href = `class.html?c=${n.course.id}&s=${n.id}`;
      el.innerHTML = `<span class="next-card__date"><b>${n.d.getDate()}</b><small>${monShort(n.d)}</small></span>
        <span class="next-card__body"><span class="label"><span class="dot-live"></span>Next class · ${dayShort(n.d)} ${n.start}</span>
        <span class="next-card__title" style="display:block">${esc(n.course.title)}</span>${seatsHTML(n, n.course.capacity)}</span>
        <span class="next-card__go">${icon("arrow")}</span>`;
    });
    $$("[data-mbar-next]").forEach((el) => { el.textContent = `${n.course.short} · ${midDate(n.d)} · ${seatsLeft(n)} left`; });
  }

  /* ---------- Upcoming rows (home) ---------- */
  function rowHTML(s) {
    const c = s.course, left = seatsLeft(s);
    return `<article class="row-class" data-hover-img="${c.image}">
      <div class="row-class__date"><b>${String(s.d.getDate()).padStart(2, "0")}</b><span>${monShort(s.d)}<br>${dayShort(s.d)}</span></div>
      <div><span class="label" style="color:var(--caramel)">${catLabel(c.category)}</span>
        <h3 class="row-class__title" style="margin-top:8px"><a href="class.html?c=${c.id}&s=${s.id}">${esc(c.title)}</a></h3>
        <div class="row-class__meta"><span>${icon("clock")}${s.start}–${s.end}</span><span>${icon("level")}${c.level}</span><span>${icon("users")}Max ${c.capacity}</span></div></div>
      <div class="row-class__seats">${seatsHTML(s, c.capacity)}</div>
      <div class="row-class__price">${money(c.price)}<small>per person</small></div>
      <div class="row-class__cta">${left ? `<button class="btn btn--sm" type="button" data-quick-book="${s.id}">Book ${arrowIcon()}</button>` : `<button class="btn btn--sm btn--ghost" type="button" data-waitlist="${s.id}">Waitlist ${arrowIcon()}</button>`}</div>
    </article>`;
  }
  function renderUpcoming() {
    const wrap = $("[data-upcoming]");
    if (!wrap) return;
    const limit = +wrap.dataset.limit || 6;
    const chips = $$("[data-up-filter]");
    const draw = (cat) => {
      const list = allSessions().filter((s) => cat === "all" || s.course.category === cat).slice(0, limit);
      wrap.innerHTML = list.length ? list.map(rowHTML).join("") : `<p class="row-empty">New dates coming soon. Join the list below for first dibs.</p>`;
      bindHoverImg();
      window.ScrollTrigger && ScrollTrigger.refresh();
    };
    chips.forEach((ch) => ch.addEventListener("click", () => { chips.forEach((c) => c.setAttribute("aria-pressed", String(c === ch))); draw(ch.dataset.upFilter); }));
    draw("all");
  }

  /* Hover image that follows the cursor on list rows */
  function bindHoverImg() {
    const hi = $(".hover-img");
    if (!hi || !matchMedia("(hover:hover) and (min-width:1001px)").matches) return;
    const img = $("img", hi);
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const loop = () => { cx += (x - cx) * 0.14; cy += (y - cy) * 0.14; hi.style.transform = ""; hi.style.left = cx + 24 + "px"; hi.style.top = cy - 180 + "px"; raf = requestAnimationFrame(loop); };
    $$("[data-hover-img]").forEach((row) => {
      row.addEventListener("mouseenter", (e) => { img.src = row.dataset.hoverImg; x = cx = e.clientX; y = cy = e.clientY; hi.classList.add("is-on"); cancelAnimationFrame(raf); loop(); });
      row.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; });
      row.addEventListener("mouseleave", () => { hi.classList.remove("is-on"); setTimeout(() => cancelAnimationFrame(raf), 400); });
    });
  }

  /* ---------- Classes catalogue ---------- */
  function cardHTML(s, others = []) {
    const c = s.course, left = seatsLeft(s);
    const more = others.length ? `<div class="ccard__dates"><span class="label">More dates</span>${others.slice(0, 4).map((o) => `<a href="class.html?c=${c.id}&s=${o.id}" class="${seatsLeft(o) ? "" : "is-full"}" title="${seatsLeft(o) ? seatsLeft(o) + " seats left" : "Sold out"}">${o.d.getDate()} ${monShort(o.d)}</a>`).join("")}</div>` : "";
    const flag = left === 0 ? `<span class="tag tag--dark">Sold out</span>` : left <= 2 ? `<span class="tag tag--hot">Almost full</span>` : c.level === "Beginner" ? `<span class="tag">Beginner friendly</span>` : "";
    return `<article class="ccard">
      <div class="ccard__media"><img src="${c.image}" alt="${esc(c.title)}" loading="lazy" style="object-position:${c.imagePos || "center"}">
        <span class="ccard__date"><b>${s.d.getDate()}</b><small>${monShort(s.d)} · ${dayShort(s.d)}</small></span>
        <span class="ccard__flags">${flag}</span></div>
      <div class="ccard__body"><span class="label ccard__cat">${catLabel(c.category)} · ${c.level}</span>
        <h3 class="ccard__title"><a href="class.html?c=${c.id}&s=${s.id}">${esc(c.title)}</a></h3>
        <p class="ccard__teaser">${esc(c.teaser)}</p>
        <div class="ccard__meta"><span>${s.start}–${s.end}</span><span>·</span><span>${c.duration}</span></div>
        <div style="margin-top:6px">${seatsHTML(s, c.capacity)}</div>
        ${more}
        <div class="ccard__foot"><span class="ccard__price">${money(c.price)}<small>pp</small></span>
        ${left ? `<button class="btn btn--sm" type="button" data-quick-book="${s.id}">Book ${arrowIcon()}</button>` : `<button class="btn btn--sm btn--ghost" type="button" data-waitlist="${s.id}">Join waitlist ${arrowIcon()}</button>`}</div>
      </div></article>`;
  }
  function renderCatalogue() {
    const root = $("[data-catalogue]");
    if (!root) return;
    const grid = $("[data-cards]", root);
    const calWrap = $("[data-cal]", root);
    const chips = $$("[data-cat]", root);
    let cat = new URLSearchParams(location.search).get("cat") || "all";
    let view = "list";
    chips.forEach((ch) => {
      const n = D.courses.filter((c) => (ch.dataset.cat === "all" || c.category === ch.dataset.cat) && allSessions().some((s) => s.course.id === c.id)).length;
      const cnt = $(".count", ch); if (cnt) cnt.textContent = n;
      ch.setAttribute("aria-pressed", String(ch.dataset.cat === cat));
      ch.addEventListener("click", () => { cat = ch.dataset.cat; chips.forEach((c) => c.setAttribute("aria-pressed", String(c === ch))); draw(); });
    });
    $$("[data-view]", root).forEach((b) => b.addEventListener("click", () => {
      view = b.dataset.view;
      $$("[data-view]", root).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    }));
    const list = () => allSessions().filter((s) => cat === "all" || s.course.category === cat);
    // one card per course: lead with the next date that has seats, list the rest as chips
    const grouped = () => {
      const by = new Map();
      list().forEach((s) => { if (!by.has(s.course.id)) by.set(s.course.id, []); by.get(s.course.id).push(s); });
      return [...by.values()].map((ss) => { const lead = ss.find((x) => seatsLeft(x)) || ss[0]; return [lead, ss.filter((x) => x !== lead)]; });
    };
    function draw() {
      grid.classList.toggle("hide", view !== "list");
      calWrap.classList.toggle("hide", view !== "cal");
      if (view === "list") grid.innerHTML = grouped().map(([s, others]) => cardHTML(s, others)).join("") || `<p class="row-empty">No dates in this category yet.</p>`;
      else drawCal();
      window.ScrollTrigger && ScrollTrigger.refresh();
    }
    // Calendar
    const first = allSessions()[0];
    let month = first ? new Date(first.d.getFullYear(), first.d.getMonth(), 1) : new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    let selected = null;
    function drawCal() {
      const sessions = list();
      const y = month.getFullYear(), m = month.getMonth();
      const start = new Date(y, m, 1);
      const offset = (start.getDay() + 6) % 7;
      const days = new Date(y, m + 1, 0).getDate();
      const byDay = {};
      sessions.forEach((s) => { if (s.d.getMonth() === m && s.d.getFullYear() === y) (byDay[s.d.getDate()] ||= []).push(s); });
      if (!selected || selected.getMonth() !== m) {
        const firstDay = Object.keys(byDay).map(Number).sort((a, b) => a - b)[0];
        selected = firstDay ? new Date(y, m, firstDay) : null;
      }
      let cells = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="cal__dow">${d}</div>`).join("");
      for (let i = 0; i < offset; i++) cells += `<div class="cal__day is-out"></div>`;
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const ev = byDay[d];
        const sel = selected && +selected === +date;
        const cls = ["cal__day", ev ? "has-ev" : "", date < TODAY ? "is-past" : "", +date === +TODAY ? "is-today" : "", sel ? "is-sel" : ""].join(" ");
        const dots = ev ? `<span class="cal__dots">${ev.map((s) => `<i class="${s.course.category}"></i>`).join("")}</span>` : "";
        cells += ev ? `<button type="button" class="${cls}" data-day="${d}" aria-label="${longDate(date)}, ${ev.length} class${ev.length > 1 ? "es" : ""}">${d}${dots}</button>` : `<div class="${cls}">${d}</div>`;
      }
      const side = selected && byDay[selected.getDate()]
        ? `<h4>${longDate(selected)}</h4>` + byDay[selected.getDate()].map((s) => `<div class="cal__item"><img src="${s.course.image}" alt="" style="object-position:${s.course.imagePos || "center"}"><div><b>${esc(s.course.title)}</b><small>${s.start}–${s.end} · ${money(s.course.price)} pp</small>${seatsHTML(s, s.course.capacity)}<div class="btn-row" style="margin-top:12px">${seatsLeft(s) ? `<button class="btn btn--sm" type="button" data-quick-book="${s.id}">Book ${arrowIcon()}</button>` : `<button class="btn btn--sm btn--ghost" type="button" data-waitlist="${s.id}">Waitlist ${arrowIcon()}</button>`}<a class="link" href="class.html?c=${s.course.id}&s=${s.id}">Details</a></div></div></div>`).join("")
        : `<h4>${fmt(month, { month: "long" })}</h4><p class="muted">No classes this month in this category. Try the next month, or <a class="link" href="private.html">book a private lesson</a>.</p>`;
      calWrap.innerHTML = `<div class="cal"><div><div class="cal__head"><h3>${fmt(month, { month: "long", year: "numeric" })}</h3><div class="cal__nav"><button class="icon-btn" type="button" data-cal-nav="-1" aria-label="Previous month">${icon("arrow")}</button><button class="icon-btn" type="button" data-cal-nav="1" aria-label="Next month">${icon("arrow")}</button></div></div>
        <div class="cal__grid">${cells}</div>
        <div class="cal__legend"><span><i></i>Pâtisserie</span><span><i class="bread"></i>Bread</span><span><i class="cuisine"></i>Cuisine & Events</span></div></div>
        <aside class="cal__side">${side}</aside></div>`;
      $$("[data-cal-nav]", calWrap).forEach((b) => b.addEventListener("click", () => { month = new Date(y, m + +b.dataset.calNav, 1); selected = null; drawCal(); }));
      $$("[data-day]", calWrap).forEach((b) => b.addEventListener("click", () => { selected = new Date(y, m, +b.dataset.day); drawCal(); }));
    }
    draw();
  }

  /* ---------- Class detail ---------- */
  function renderDetail() {
    const root = $("[data-class-detail]");
    if (!root) return;
    const q = new URLSearchParams(location.search);
    const c = course(q.get("c")) || D.courses[0];
    const sessions = allSessions().filter((s) => s.course.id === c.id);
    let sel = sessions.find((s) => s.id === q.get("s") && seatsLeft(s)) || sessions.find((s) => seatsLeft(s)) || sessions[0];
    let qty = 1;
    document.title = `${c.title} | Love to Cook, Crieff`;
    $$("[data-d]").forEach((el) => {
      const k = el.dataset.d;
      if (k === "title") {
        const t = esc(c.title);
        el.innerHTML = t.includes(":") ? t.replace(/:\s*(.*)$/, ": <em>$1</em>") : t.replace(/\s(\S+)$/, " <em>$1</em>");
      }
      if (k === "crumb") el.textContent = c.short;
      if (k === "cat") el.textContent = catLabel(c.category);
      if (k === "teaser") el.textContent = c.teaser;
      if (k === "overview") el.textContent = c.overview;
      if (k === "duration") el.textContent = c.duration;
      if (k === "level") el.textContent = c.level;
      if (k === "size") el.textContent = `Max ${c.capacity}`;
      if (k === "price") el.textContent = money(c.price);
      if (k === "make") el.innerHTML = c.make.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("");
      if (k === "learn") el.innerHTML = c.learn.map((x) => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("");
      if (k === "schedule") el.innerHTML = c.schedule.map(([t, x]) => `<li><time>${t}</time><span>${esc(x)}</span></li>`).join("");
      if (k === "gallery") el.innerHTML = c.gallery.map((g, i) => `<div class="media img-reveal" data-reveal-img><img src="${g}" alt="${i ? "" : esc(c.title)}" ${i ? 'loading="lazy"' : ""} style="object-position:${i === 0 && c.imagePos ? c.imagePos : "center"}"></div>`).join("");
    });
    // related
    const rel = $("[data-related]");
    if (rel) rel.innerHTML = allSessions().filter((s) => s.course.id !== c.id).filter((s, i, a) => a.findIndex((x) => x.course.id === s.course.id) === i).slice(0, 3).map(cardHTML).join("");

    const card = $("[data-book-card]");
    function draw() {
      if (!sessions.length) { card.innerHTML = `<p>New dates coming soon.</p>`; return; }
      const left = seatsLeft(sel);
      qty = Math.min(Math.max(1, qty), Math.max(1, left));
      card.innerHTML = `<div class="book-card__price"><b>${money(c.price)}</b><span>per person · all ingredients &amp; take-home box</span></div>
        <span class="label book-card__label">Choose a date</span>
        <div class="date-opts" role="radiogroup" aria-label="Choose a date">${sessions.map((s) => `<button type="button" role="radio" class="date-opt ${seatsLeft(s) ? "" : "is-full"}" aria-checked="${s.id === sel.id}" data-sel="${s.id}"><span class="radio"></span><span><b>${midDate(s.d)}</b><small>${s.start}–${s.end}</small></span>${seatsHTML(s, c.capacity).replace('class="seats__bar"', 'class="seats__bar hide"')}</button>`).join("")}</div>
        ${left ? `<div class="book-card__row"><span class="label" style="color:var(--muted)">Seats</span><div class="stepper" role="group" aria-label="Number of seats"><button type="button" data-q="-1" ${qty <= 1 ? "disabled" : ""} aria-label="Fewer seats">−</button><output aria-live="polite">${qty}</output><button type="button" data-q="1" ${qty >= left ? "disabled" : ""} aria-label="More seats">+</button></div></div>
        <div class="book-card__total"><span>Total</span><b>${money(c.price * qty)}</b></div>
        <button class="btn" type="button" data-book-now>Reserve ${qty > 1 ? qty + " seats" : "my seat"} ${arrowIcon()}</button>`
        : `<div class="book-card__total"><span>This date is full</span><b>Waitlist</b></div><button class="btn" type="button" data-waitlist="${sel.id}">Join the waitlist ${arrowIcon()}</button>`}
        <div class="book-card__trust"><span>${icon("lock")}Secure checkout · Apple Pay, Google Pay &amp; cards</span><span>${icon("calendar")}Free date transfer up to 7 days before</span><span>${icon("users")}Never more than ${c.capacity} at the bench</span></div>
        <a class="book-card__gift" href="gift.html?class=${c.id}">Buying for someone else? Give this class as a gift →</a>`;
      $$("[data-sel]", card).forEach((b) => b.addEventListener("click", () => { sel = sessions.find((s) => s.id === b.dataset.sel); draw(); }));
      $$("[data-q]", card).forEach((b) => b.addEventListener("click", () => { qty += +b.dataset.q; draw(); }));
      $("[data-book-now]", card)?.addEventListener("click", () => { bag = bag.filter((i) => !(i.type === "class" && i.sid === sel.id)); bag.push({ type: "class", sid: sel.id, qty }); saveBag(); startCheckout(); });
      $$("[data-mbar-price]").forEach((el) => (el.textContent = `${money(c.price)} pp · ${midDate(sel.d)}`));
    }
    draw();
    document.addEventListener("ltc:booked", draw);
    // JSON-LD Event schema for SEO
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify(sessions.map((s) => ({
      "@context": "https://schema.org", "@type": "Event", name: c.title, description: c.overview,
      startDate: `${s.date}T${s.start}`, endDate: `${s.date}T${s.end}`, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled", image: new URL(c.image, location.href).href,
      location: { "@type": "Place", name: "Love to Cook", address: { "@type": "PostalAddress", streetAddress: B.street, addressLocality: B.town, addressRegion: "Perthshire", addressCountry: "GB" } },
      organizer: { "@type": "Organization", name: "Love to Cook", url: "https://www.lovetocook.uk" },
      offers: { "@type": "Offer", price: c.price, priceCurrency: "GBP", availability: seatsLeft(s) ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: location.href },
    })));
    document.head.appendChild(ld);
  }

  /* ---------- Quick book & waitlist ---------- */
  document.addEventListener("click", (e) => {
    const qb = e.target.closest("[data-quick-book]");
    if (qb) { const s = findSession(qb.dataset.quickBook); if (s) addToBag({ type: "class", sid: s.id, qty: 1 }, `1 seat · ${s.course.short}`); }
    const wl = e.target.closest("[data-waitlist]");
    if (wl) {
      const s = findSession(wl.dataset.waitlist);
      if (!s) return;
      openModal(`<p class="label" style="color:var(--caramel);margin-bottom:12px">Waitlist</p><h2>This one's <em>full</em>, for now.</h2>
        <p class="sub">${esc(s.course.title)} · ${longDate(s.d)}. Seats come back more often than you'd think. Leave your details and you'll get first refusal by email, automatically.</p>
        <form class="form" data-form="waitlist" novalidate><div class="form-row"><label class="field"><input name="name" placeholder=" " required autocomplete="name"><span>Your name</span></label><label class="field"><input name="email" type="email" placeholder=" " required autocomplete="email"><span>Email</span></label></div>
        <button class="btn" type="submit">Notify me ${arrowIcon()}</button>
        <div class="form-success"><div class="tick">${icon("check")}</div><h3 class="h3">You're on the list.</h3><p>We'll email you the moment a seat opens up for ${esc(s.course.short)}.</p></div></form>`);
    }
  });

  /* ---------- Checkout ---------- */
  function startCheckout() {
    if (!bag.length) return;
    const hasClass = bag.some((i) => i.type === "class");
    const hasBake = bag.some((i) => i.type === "bake");
    const lines = bag.map((i) => { const l = bagLine(i); return l ? `<div><span>${i.qty} × ${esc(l.title)}</span><span>${money(l.price * i.qty)}</span></div>` : ""; }).join("");
    const steps = (n) => `<div class="modal__steps">${["Details", "Payment", "Confirmed"].map((t, i) => `<span class="${i <= n ? "is-on" : ""}">${t}</span>`).join("")}</div>`;
    const draft = store.get("draft", {});
    openModal(`${steps(0)}<h2>Almost <em>there</em>.</h2><p class="sub">Tell us who's coming. Takes 30 seconds.</p>
      <div class="co-summary">${lines}<div class="tot"><span>Total</span><span>${money(bagTotal())}</span></div></div>
      <form class="form" id="co-form" novalidate>
        <div class="form-row"><label class="field"><input name="name" required placeholder=" " autocomplete="name" value="${esc(draft.name || "")}"><span>Full name</span></label>
        <label class="field"><input name="email" type="email" required placeholder=" " autocomplete="email" value="${esc(draft.email || "")}"><span>Email</span></label></div>
        <label class="field"><input name="phone" type="tel" placeholder=" " autocomplete="tel" value="${esc(draft.phone || "")}"><span>Mobile (for class-day updates)</span></label>
        ${hasClass ? `<label class="field"><textarea name="diet" placeholder=" "></textarea><span>Allergies or dietary needs? Names of any guests?</span></label>` : ""}
        ${hasBake ? `<label class="field"><select name="collect" required><option>Friday · 9am–1pm</option><option>Saturday · 9am–1pm</option></select><span>Collection from 16 King Street</span></label>` : ""}
        <label class="check"><input type="checkbox" name="news" checked> Send me new class dates before they're announced (no spam, ever).</label>
        <button class="btn" type="submit">Continue to payment ${arrowIcon()}</button>
      </form>`);
    $("#co-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      if (!validate(f)) return;
      const data = Object.fromEntries(new FormData(f));
      store.set("draft", { name: data.name, email: data.email, phone: data.phone });
      payStep(data);
    });
    function payStep(data) {
      $(".modal__content").innerHTML = `${steps(1)}<h2>Pay <em>securely</em>.</h2><p class="sub">${money(bagTotal())} · processed by Square, the system Love to Cook already uses.</p>
        <div class="paybtns"><button type="button" class="paybtn" data-pay>${icon("apple")}<span>Pay</span></button><button type="button" class="paybtn paybtn--g" data-pay>${icon("google")}<span>Pay</span></button></div>
        <div class="or">or pay by card</div>
        <form class="form" id="pay-form" novalidate>
          <label class="field"><input name="card" inputmode="numeric" placeholder=" " required autocomplete="cc-number" maxlength="19"><span>Card number</span></label>
          <div class="form-row"><label class="field"><input name="exp" placeholder=" " required autocomplete="cc-exp" maxlength="5"><span>MM / YY</span></label><label class="field"><input name="cvc" inputmode="numeric" placeholder=" " required autocomplete="cc-csc" maxlength="4"><span>CVC</span></label></div>
          <button class="btn" type="submit">Pay ${money(bagTotal())} ${arrowIcon()}</button>
        </form>
        <p class="secure">${icon("lock")}256-bit encrypted · Card details never touch our server</p>
        ${CONFIG.DEMO_MODE ? `<p class="demo-note">Preview mode: no card is charged. Any details will complete the demo.</p>` : ""}`;
      const card = $("#pay-form [name=card]");
      card.addEventListener("input", () => { card.value = card.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); });
      const exp = $("#pay-form [name=exp]");
      exp.addEventListener("input", () => { exp.value = exp.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2"); });
      const go = (btn) => { btn.classList.add("is-disabled"); btn.innerHTML = "Processing…"; setTimeout(() => confirmStep(data), 1100); };
      $$("[data-pay]").forEach((b) => b.addEventListener("click", () => go(b)));
      $("#pay-form").addEventListener("submit", (e) => { e.preventDefault(); if (CONFIG.DEMO_MODE || validate(e.target)) go($("#pay-form .btn")); });
    }
    function confirmStep(data) {
      const ref = "LTC-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      const classes = bag.filter((i) => i.type === "class").map((i) => ({ i, s: findSession(i.sid) })).filter((x) => x.s);
      classes.forEach(({ i, s }) => { booked[s.id] = (booked[s.id] || 0) + i.qty; });
      store.set("booked", booked);
      const ics = classes.length ? makeICS(classes.map((x) => x.s), ref) : null;
      bag = []; saveBag(); renderNext(); renderUpcoming(); renderBakeryQty();
      document.dispatchEvent(new CustomEvent("ltc:booked"));
      $(".modal__content").innerHTML = `${steps(2)}<div class="confirm"><div class="tick">${icon("check")}</div>
        <h2>See you <em>soon</em>, ${esc(data.name.split(" ")[0])}!</h2><p class="sub">A confirmation is on its way to ${esc(data.email)}.</p>
        <div class="ref">Booking ref <b>${ref}</b></div>
        <div class="btn-row">${ics ? `<a class="btn" href="${ics}" download="love-to-cook-${ref}.ics">Add to calendar ${arrowIcon()}</a>` : ""}<button class="btn btn--ghost" type="button" data-close>Done ${arrowIcon()}</button></div>
        <p class="demo-note">You'll get a reminder 48 hours before, with directions and what to bring.</p></div>`;
    }
  }
  $("[data-checkout]")?.addEventListener("click", startCheckout);

  function makeICS(sessions, ref) {
    const stamp = (d, t) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
    const evs = sessions.map((s) => [
      "BEGIN:VEVENT", `UID:${s.id}-${ref}@lovetocook.uk`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;TZID=Europe/London:${stamp(s.date, s.start)}`, `DTEND;TZID=Europe/London:${stamp(s.date, s.end)}`,
      `SUMMARY:${s.course.title} · Love to Cook`, `LOCATION:${B.street}\\, ${B.town}\\, Scotland`,
      `DESCRIPTION:Booking ${ref}. Wear comfortable shoes and tie long hair back. Everything else is provided.`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Love to Cook tomorrow", "END:VALARM", "END:VEVENT",
    ].join("\r\n"));
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Love to Cook//Bookings//EN", "CALSCALE:GREGORIAN", ...evs, "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  }

  /* ---------- Bakery ---------- */
  function renderBakery() {
    const root = $("[data-bakery]");
    if (!root) return;
    const grid = $("[data-bakes]", root);
    const chips = $$("[data-bcat]", root);
    let cat = "all";
    const draw = () => {
      grid.innerHTML = D.bakes.filter((b) => cat === "all" || b.cat === cat).map((b) => `<article class="bake" data-bake="${b.id}">
        <div class="bake__media"><img src="${b.img}" alt="${esc(b.name)}" loading="lazy"><span class="tag">${b.cat}</span><div class="bake__add" data-bake-ctrl="${b.id}"></div></div>
        <div class="bake__body"><div><h3>${esc(b.name)}</h3><p>${esc(b.note)}</p></div><span class="bake__price">${money(b.price)}</span></div></article>`).join("");
      renderBakeryQty();
      window.ScrollTrigger && ScrollTrigger.refresh();
    };
    chips.forEach((ch) => ch.addEventListener("click", () => { cat = ch.dataset.bcat; chips.forEach((c) => c.setAttribute("aria-pressed", String(c === ch))); draw(); }));
    draw();
  }
  function renderBakeryQty() {
    $$("[data-bake-ctrl]").forEach((el) => {
      const id = el.dataset.bakeCtrl;
      const item = bag.find((i) => i.type === "bake" && i.id === id);
      el.innerHTML = item
        ? `<div class="qty-pill"><button type="button" data-bk="-1" aria-label="Remove one">−</button><output>${item.qty}</output><button type="button" data-bk="1" aria-label="Add one">+</button></div>`
        : `<button type="button" class="add-btn" data-bk="1">Add <span class="plus">+</span></button>`;
      $$("[data-bk]", el).forEach((b) => b.addEventListener("click", () => {
        const d = +b.dataset.bk;
        const it = bag.find((i) => i.type === "bake" && i.id === id);
        if (!it) { const bk = D.bakes.find((x) => x.id === id); addToBag({ type: "bake", id, qty: 1 }, bk.name); }
        else { it.qty += d; if (it.qty < 1) bag.splice(bag.indexOf(it), 1); saveBag(); }
        renderBakeryQty();
      }));
    });
  }

  /* ---------- Gift voucher builder ---------- */
  function renderGift() {
    const root = $("[data-gift]");
    if (!root) return;
    const preClass = course(new URLSearchParams(location.search).get("class"));
    const st = { amount: preClass ? preClass.price : 75, to: "", from: "", msg: "", cls: preClass ? preClass.title : "" };
    const amounts = $$("[data-amount]", root);
    const custom = $("[name=custom]", root);
    const sel = $("[name=cls]", root);
    sel.innerHTML = `<option value="">Any class or bake (most flexible)</option>` + D.courses.map((c) => `<option value="${c.id}" ${preClass && preClass.id === c.id ? "selected" : ""}>${esc(c.title)} · ${money(c.price)}</option>`).join("");
    const pv = {
      amount: $("[data-v=amount]"), to: $("[data-v=to]"), msg: $("[data-v=msg]"), code: $("[data-v=code]"), cls: $("[data-v=cls]"),
    };
    function paint() {
      amounts.forEach((a) => a.setAttribute("aria-checked", String(+a.dataset.amount === st.amount && !custom.value)));
      pv.amount.textContent = money(st.amount);
      pv.to.textContent = st.to ? `For ${st.to}` : "For someone lovely";
      pv.msg.textContent = st.msg || (st.from ? `With love from ${st.from}` : "A day of baking, on me.");
      pv.cls.textContent = st.cls ? st.cls : "Redeemable on any class or bake";
      $("[data-gift-total]").textContent = money(st.amount);
    }
    pv.code.textContent = "LTC · " + Math.random().toString(36).slice(2, 6).toUpperCase() + " · " + new Date().getFullYear();
    amounts.forEach((a) => a.addEventListener("click", () => { custom.value = ""; st.amount = +a.dataset.amount; sel.value = ""; st.cls = ""; paint(); }));
    custom.addEventListener("input", () => { const v = Math.max(0, Math.min(1000, Math.round(+custom.value || 0))); if (v) { st.amount = v; sel.value = ""; st.cls = ""; } paint(); });
    sel.addEventListener("change", () => { const c = course(sel.value); st.cls = c ? c.title : ""; if (c) { st.amount = c.price; custom.value = ""; } paint(); });
    ["to", "from", "msg"].forEach((k) => $(`[name=${k}]`, root).addEventListener("input", (e) => { st[k] = e.target.value.trim(); paint(); }));
    $("[data-gift-add]").addEventListener("click", () => {
      if (st.amount < 10) { toast("Choose an amount of £10 or more"); return; }
      addToBag({ type: "voucher", amount: st.amount, to: st.to, from: st.from, msg: st.msg, cls: st.cls, qty: 1 }, `${money(st.amount)} gift voucher`);
    });
    paint();
  }

  /* ---------- Private lesson enquiry builder ---------- */
  function renderEnquiry() {
    const root = $("[data-enquiry]");
    if (!root) return;
    const st = { fmt: D.privateFormats[1], guests: 2, topics: new Set(["Croissants"]) };
    const fmts = $("[data-formats]", root);
    fmts.innerHTML = D.privateFormats.map((f) => `<button type="button" role="radio" class="choice" data-fmt="${f.id}"><b>${f.title}</b><small>From ${money(f.from)} ${f.unit} · ${f.guests[0] === f.guests[1] ? "1 guest" : f.guests[0] + "–" + f.guests[1] + " guests"}</small></button>`).join("");
    const topics = $("[data-topics]", root);
    topics.innerHTML = D.topics.map((t) => `<button type="button" class="chip" data-topic="${t}" aria-pressed="false">${t}</button>`).join("");
    const out = $("[data-guests]", root);
    function paint() {
      $$("[data-fmt]", root).forEach((b) => b.setAttribute("aria-checked", String(b.dataset.fmt === st.fmt.id)));
      $$("[data-topic]", root).forEach((b) => b.setAttribute("aria-pressed", String(st.topics.has(b.dataset.topic))));
      st.guests = Math.min(st.fmt.guests[1], Math.max(st.fmt.guests[0], st.guests));
      out.textContent = st.guests;
      $('[data-g="-1"]', root).disabled = st.guests <= st.fmt.guests[0];
      $('[data-g="1"]', root).disabled = st.guests >= st.fmt.guests[1];
      const est = st.fmt.unit === "per person" ? st.fmt.from * st.guests : st.fmt.from;
      $("[data-estimate]", root).textContent = money(est);
      $("[name=summary]", root).value = `${st.fmt.title} · ${st.guests} guest(s) · ${[...st.topics].join(", ")} · est. ${money(est)}`;
    }
    $$("[data-fmt]", root).forEach((b) => b.addEventListener("click", () => { st.fmt = D.privateFormats.find((f) => f.id === b.dataset.fmt); paint(); }));
    $$("[data-topic]", root).forEach((b) => b.addEventListener("click", () => { st.topics.has(b.dataset.topic) ? st.topics.delete(b.dataset.topic) : st.topics.add(b.dataset.topic); paint(); }));
    $$("[data-g]", root).forEach((b) => b.addEventListener("click", () => { st.guests += +b.dataset.g; paint(); }));
    $$("[data-pick-format]").forEach((b) => b.addEventListener("click", () => { st.fmt = D.privateFormats.find((f) => f.id === b.dataset.pickFormat); paint(); }));
    const dt = $("[name=date]", root);
    if (dt) dt.min = new Date(Date.now() + 864e5 * 7).toISOString().slice(0, 10);
    paint();
  }

  /* ---------- Forms ---------- */
  function validate(form) {
    let ok = true;
    $$("[required]", form).forEach((el) => {
      const f = el.closest(".field");
      $(".field__err", f)?.remove();
      let bad = !el.value.trim();
      if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (f) f.classList.toggle("is-invalid", bad);
      if (bad && f) { f.insertAdjacentHTML("beforeend", `<span class="field__err">${el.type === "email" && el.value ? "Please check this email address" : "This one's needed"}</span>`); if (ok) el.focus(); ok = false; }
    });
    return ok;
  }
  document.addEventListener("input", (e) => { const f = e.target.closest(".field.is-invalid"); if (f) { f.classList.remove("is-invalid"); $(".field__err", f)?.remove(); } });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    if (!validate(form)) return;
    const btn = $("button[type=submit]", form);
    if (btn) { btn.classList.add("is-disabled"); }
    const done = () => { form.classList.add("is-sent"); if (form.dataset.form === "news") toast("You're on the list. First dibs on new dates!"); };
    if (CONFIG.FORM_ENDPOINT) fetch(CONFIG.FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } }).finally(done);
    else setTimeout(done, 600);
  });

  /* ---------- Testimonials ---------- */
  function renderTestimonials() {
    const root = $("[data-testimonials]");
    if (!root) return;
    const track = $(".tslider__track", root);
    track.innerHTML = D.testimonials.map((t) => `<figure class="tslide"><blockquote>${esc(t.quote)}</blockquote><figcaption><span class="av">${t.name[0]}</span><span><b>${esc(t.name)}</b><small>${esc(t.meta)}</small></span><span class="stars" aria-label="5 stars" style="margin-left:auto">${icon("star").repeat(5)}</span></figcaption></figure>`).join("");
    const dots = $(".tslider__dots", root);
    dots.innerHTML = D.testimonials.map((_, i) => `<button type="button" aria-label="Review ${i + 1}"></button>`).join("");
    let i = 0, timer;
    const go = (n) => {
      i = (n + D.testimonials.length) % D.testimonials.length;
      track.style.transform = `translateX(${-100 * i}%)`;
      $$("button", dots).forEach((d, k) => d.classList.toggle("is-active", k === i));
      $$(".tslide", track).forEach((s, k) => s.setAttribute("aria-hidden", String(k !== i)));
      clearInterval(timer); timer = setInterval(() => go(i + 1), 7000);
    };
    $$("button", dots).forEach((d, k) => d.addEventListener("click", () => go(k)));
    $("[data-t-prev]", root).addEventListener("click", () => go(i - 1));
    $("[data-t-next]", root).addEventListener("click", () => go(i + 1));
    let sx = null;
    track.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    track.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); sx = null; });
    go(0);
  }

  /* ---------- FAQ (render + smooth open) ---------- */
  function renderFAQ() {
    $$("[data-faq]").forEach((root) => {
      const n = +root.dataset.faq || D.faqs.length;
      root.innerHTML = D.faqs.slice(0, n).map(([q, a], k) => `<details ${k === 0 ? "open" : ""}><summary>${esc(q)}<span class="plus" aria-hidden="true"></span></summary><div class="faq__a"><p>${esc(a)}</p></div></details>`).join("");
      $$("details", root).forEach((d) => {
        const sum = $("summary", d), body = $(".faq__a", d);
        sum.addEventListener("click", (e) => {
          if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          e.preventDefault();
          if (d.open) {
            body.animate([{ height: body.offsetHeight + "px" }, { height: "0px" }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" }).onfinish = () => { d.open = false; window.ScrollTrigger && ScrollTrigger.refresh(); };
          } else {
            d.open = true;
            const h = body.offsetHeight;
            body.animate([{ height: "0px" }, { height: h + "px" }], { duration: 550, easing: "cubic-bezier(.22,1,.36,1)" }).onfinish = () => window.ScrollTrigger && ScrollTrigger.refresh();
          }
        });
      });
    });
  }

  /* ---------- Small bits ---------- */
  const topic = new URLSearchParams(location.search).get("topic");
  if (topic && $("#topic")) $("#topic").value = topic;
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-to-top]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); window.__lenis ? window.__lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0, behavior: "smooth" }); }));
  $$("[data-count-sessions]").forEach((el) => (el.textContent = allSessions().length));
  $$("[data-from-price]").forEach((el) => (el.textContent = money(Math.min(...D.courses.map((c) => c.price)))));

  /* ---------- Boot ---------- */
  renderNext();
  renderUpcoming();
  renderCatalogue();
  renderDetail();
  renderBakery();
  renderGift();
  renderEnquiry();
  renderTestimonials();
  renderFAQ();
  renderBag();
  onScroll();

  window.LTC = { openDrawer, toast, money };
})();
