// =====================================================
// ATELIER — shared site behavior (no backend required)
// =====================================================
(function () {
  "use strict";

  /* ---------- Always land at the top on a fresh page load ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", () => window.scrollTo(0, 0));
  window.addEventListener("load", () => window.scrollTo(0, 0));

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      navToggle.setAttribute(
        "aria-expanded",
        navLinks.classList.contains("open") ? "true" : "false"
      );
    });
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  /* ---------- Sticky navbar shadow ---------- */
  const navbar = document.querySelector(".navbar");
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 12);

    const toTop = document.querySelector(".to-top");
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Highlight active nav link ---------- */
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]:not(.btn)").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute("data-delay");
            if (delay) entry.target.style.transitionDelay = delay + "ms";
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Testimonial carousel ---------- */
  const testiWrap = document.querySelector(".testi-wrap");
  if (testiWrap) {
    const slides = [...testiWrap.querySelectorAll(".testi-slide")];
    const dotsWrap = testiWrap.querySelector(".testi-dots");
    let idx = 0;
    let timer;

    slides.forEach((_, i) => {
      const b = document.createElement("button");
      if (i === 0) b.classList.add("active");
      b.setAttribute("aria-label", "Show testimonial " + (i + 1));
      b.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(b);
    });
    const dots = [...dotsWrap.querySelectorAll("button")];

    function goTo(i) {
      slides[idx].classList.remove("active");
      dots[idx].classList.remove("active");
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add("active");
      dots[idx].classList.add("active");
      restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => goTo(idx + 1), 6000);
    }
    if (slides.length > 1) restart();
  }

  /* ---------- Portfolio filter ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");
  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.getAttribute("data-filter");
        galleryItems.forEach((item) => {
          const match = cat === "all" || item.getAttribute("data-category") === cat;
          item.hidden = !match;
        });
      });
    });
  }

  /* ---------- Lightbox ---------- */
  const lightbox = document.querySelector(".lightbox");
  if (lightbox && galleryItems.length) {
    const imgEl = lightbox.querySelector("img");
    const titleEl = lightbox.querySelector(".lightbox-cap h4");
    const descEl = lightbox.querySelector(".lightbox-cap p");
    const visible = () => [...galleryItems].filter((i) => !i.hidden);
    let current = 0;

    function open(item) {
      const list = visible();
      current = list.indexOf(item);
      render();
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function render() {
      const list = visible();
      const item = list[current];
      if (!item) return;
      imgEl.src = item.querySelector("img").src;
      titleEl.textContent = item.getAttribute("data-title") || "";
      descEl.textContent = item.getAttribute("data-desc") || "";
    }
    function close() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
    }
    galleryItems.forEach((item) => item.addEventListener("click", () => open(item)));
    lightbox.querySelector(".lightbox-close")?.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    lightbox.querySelector(".lightbox-nav.prev")?.addEventListener("click", () => {
      const list = visible();
      current = (current - 1 + list.length) % list.length;
      render();
    });
    lightbox.querySelector(".lightbox-nav.next")?.addEventListener("click", () => {
      const list = visible();
      current = (current + 1) % list.length;
      render();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") lightbox.querySelector(".lightbox-nav.next")?.click();
      if (e.key === "ArrowLeft") lightbox.querySelector(".lightbox-nav.prev")?.click();
    });
  }

  /* ---------- Newsletter / footer form (demo only) ---------- */
  const footerForm = document.querySelector(".footer-form");
  if (footerForm) {
    footerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = footerForm.querySelector("input");
      if (input && input.value) {
        window.Atelier.toast("Thanks — you're on the list!");
        input.value = "";
      }
    });
  }

  /* ---------- Contact form (demo only, no backend) ---------- */
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      contactForm.querySelectorAll("[required]").forEach((input) => {
        const field = input.closest(".field");
        const ok = input.value.trim().length > 0 && (input.type !== "email" || /^\S+@\S+\.\S+$/.test(input.value));
        field.classList.toggle("invalid", !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      contactForm.hidden = true;
      document.querySelector("#contact-success").hidden = false;
    });
  }

  /* ---------- Toast helper (global) ---------- */
  let toastEl = document.querySelector(".toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg><span></span>';
    document.body.appendChild(toastEl);
  }
  let toastTimer;
  window.Atelier = window.Atelier || {};
  window.Atelier.toast = function (msg) {
    toastEl.querySelector("span").textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  };

  /* ---------- Back to top ---------- */
  const toTopBtn = document.querySelector(".to-top");
  if (toTopBtn) {
    toTopBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
