(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Nav background on scroll + mobile sticky CTA
  const nav = $("#nav");
  const sticky = $("#stickyCta");
  const quote = $("#quote");
  let quoteVisible = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);
    sticky.classList.toggle("is-on", y > 600 && !quoteVisible);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  new IntersectionObserver(([e]) => { quoteVisible = e.isIntersecting; onScroll(); }, { threshold: 0.1 }).observe(quote);
  onScroll();

  // Mobile menu
  const toggle = $(".nav__toggle");
  const menu = $("#mobile-menu");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    nav.classList.toggle("is-scrolled", open || window.scrollY > 20);
  };
  toggle.addEventListener("click", () => setMenu(menu.hidden));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  // Reveal on scroll, staggered within each parent
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const siblings = $$(":scope > .reveal", e.target.parentElement);
      e.target.style.setProperty("--d", `${Math.min(siblings.indexOf(e.target), 6) * 0.07}s`);
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  // Count-up stats
  const fmt = (n, d) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || "0", 10);
      const t0 = performance.now();
      const dur = 1600;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 4)), dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) $$("[data-count]").forEach((el) => counter.observe(el));

  // Card spotlight follows cursor
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // Multi-step quote form
  const form = $("#qform");
  const steps = $$(".qstep", form);
  const bar = $("#qbar");
  const labels = $$(".qform__labels span", form);
  const err = $("#qerror");
  let current = 0;
  const go = (i) => {
    steps[current].classList.remove("is-active");
    current = i;
    steps[current].classList.add("is-active");
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    labels.forEach((l, j) => l.classList.toggle("is-on", j <= i));
    const first = $("input:not([type=radio]):not([type=file]), select", steps[current]);
    if (first && window.innerWidth > 720) first.focus({ preventScroll: true });
  };
  $$("[data-next]", form).forEach((b) => b.addEventListener("click", () => go(current + 1)));
  $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => go(current - 1)));

  // File drop
  const drop = $("#drop");
  const fileInput = $("input[type=file]", drop);
  const fileList = $("#dropFiles");
  const showFiles = () => {
    const names = [...fileInput.files].map((f) => f.name);
    fileList.textContent = names.length ? `✓ ${names.join(", ")}` : "";
  };
  fileInput.addEventListener("change", showFiles);
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, () => drop.classList.add("is-over")));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("is-over")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const required = $$("[required]", steps[current]);
    let ok = true;
    required.forEach((f) => {
      const valid = f.value.trim() && (f.type !== "email" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      err.textContent = "Please fill in your name, company and a valid work email.";
      return;
    }
    err.textContent = "";
    // TODO: connect to your CRM / form backend (e.g. HubSpot, Formspree) here.
    steps.forEach((s) => s.classList.remove("is-active"));
    $(".qform__progress", form).hidden = true;
    $("#qref").textContent = `TV-${Math.floor(100000 + Math.random() * 900000)}`;
    $("#qsuccess").hidden = false;
  });

  $("#year").textContent = new Date().getFullYear();
})();
