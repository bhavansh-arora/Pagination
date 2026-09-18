/* =========================================================
   VELMORA — shared site behaviour
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Page loader ---------- */
  window.addEventListener("load", () => {
    const loader = document.getElementById("pageLoader");
    if (loader) setTimeout(() => loader.classList.add("done"), 350);
  });

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById("toTop");
  function toggleBackToTop() {
    if (!toTop) return;
    toTop.classList.toggle("show", window.scrollY > 700);
  }
  if (toTop) {
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 30);
    toggleBackToTop();
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("is-open");
      mainNav.classList.toggle("is-open");
      document.body.style.overflow = mainNav.classList.contains("is-open") ? "hidden" : "";
    });
    mainNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navToggle.classList.remove("is-open");
        mainNav.classList.remove("is-open");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- Mark active nav link ---------- */
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el, i) => {
      el.style.setProperty("--i", el.closest("[data-reveal-stagger]") ? i % 8 : 0);
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const decimals = el.dataset.count.includes(".") ? 1 : 0;
          const duration = 1600;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Sticky WhatsApp CTA bar ---------- */
  const stickyCta = document.getElementById("stickyCta");
  const stickyClose = document.getElementById("stickyCtaClose");
  if (stickyCta && stickyClose) {
    if (sessionStorage.getItem("velmora-cta-dismissed") === "1") {
      stickyCta.classList.add("is-hidden");
      document.body.style.paddingBottom = "8px";
    }
    stickyClose.addEventListener("click", () => {
      stickyCta.classList.add("is-hidden");
      document.body.style.paddingBottom = "8px";
      sessionStorage.setItem("velmora-cta-dismissed", "1");
    });
  }

  /* ---------- 3D tilt on product / feature cards ---------- */
  const tiltCards = document.querySelectorAll(".tilt-wrap");
  tiltCards.forEach((card) => {
    const inner = card.querySelector(".tilt-el") || card;
    let raf = null;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        inner.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(10px)`;
      });
    });
    card.addEventListener("mouseleave", () => {
      inner.style.transform = "rotateY(0) rotateX(0) translateZ(0)";
    });
  });

  /* ---------- Mouse-parallax blobs / hero badge ---------- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length) {
    window.addEventListener("mousemove", (e) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      parallaxEls.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 20;
        el.style.transform = `translate3d(${px * depth}px, ${py * depth}px, 0)`;
      });
    });
  }

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById("testiTrack");
  if (track) {
    const cards = track.children.length;
    let index = 0;
    const perView = () => (window.innerWidth >= 1100 ? 3 : window.innerWidth >= 760 ? 2 : 1);
    const update = () => {
      const max = Math.max(0, cards - perView());
      index = Math.min(index, max);
      const cardWidth = track.children[0].getBoundingClientRect().width + 26;
      track.style.transform = `translateX(-${index * cardWidth}px)`;
    };
    document.getElementById("testiPrev")?.addEventListener("click", () => {
      index = Math.max(0, index - 1);
      update();
    });
    document.getElementById("testiNext")?.addEventListener("click", () => {
      const max = Math.max(0, cards - perView());
      index = Math.min(max, index + 1);
      update();
    });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Shop filter ---------- */
  const chips = document.querySelectorAll(".filter-chip");
  const products = document.querySelectorAll("[data-cat]");
  if (chips.length && products.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const cat = chip.dataset.filter;
        products.forEach((p) => {
          const show = cat === "all" || p.dataset.cat === cat;
          p.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".accordion-item").forEach((item) => {
    const head = item.querySelector(".accordion-head");
    const panel = item.querySelector(".accordion-panel");
    head?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".accordion-item").forEach((i) => {
        i.classList.remove("open");
        i.querySelector(".accordion-panel").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  /* ---------- Fake form submissions (front-end demo only) ---------- */
  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const original = btn.textContent;
      btn.textContent = "Sending…";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = "Thank you! We'll be in touch ✓";
        form.reset();
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 2600);
      }, 900);
    });
  });
})();
