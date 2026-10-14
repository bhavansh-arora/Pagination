(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---------- Year ---------- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  var nav = document.querySelector(".site-nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector(".hamburger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .stagger");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll("[data-count]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function runCount(el) {
    var target = +el.getAttribute("data-count");
    if (reduce) { el.textContent = target; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute("data-count"); });
  }

  /* ---------- Marketplace filters ---------- */
  var filters = document.querySelectorAll(".filters button");
  if (filters.length) {
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filters.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        document.querySelectorAll(".listing").forEach(function (l) {
          l.hidden = !(f === "all" || l.getAttribute("data-cat") === f);
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var CONTACT_EMAIL = "bhavansharora21@gmail.com";

    /* Pre-select from ?site=beauty.codebunny.net or ?interest=notify|build */
    var params = new URLSearchParams(window.location.search);
    var interest = document.getElementById("interest");
    var site = params.get("site");
    var want = params.get("interest");
    if (interest) {
      if (site) interest.value = site.split(".")[0];
      else if (want === "notify") interest.value = "notify";
      else if (want === "build") interest.value = "new-project";
    }

    /* Phone country picker — defaults to the visitor's own country via IP lookup */
    var phoneInput = document.getElementById("phone");
    var phoneField = phoneInput ? phoneInput.closest(".field") : null;
    var iti = null;
    if (phoneInput && window.intlTelInput) {
      iti = window.intlTelInput(phoneInput, {
        initialCountry: "auto",
        loadUtils: function () {
          return import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.11.2/build/js/utils.js");
        },
        geoIpLookup: function (success) {
          fetch("https://ipapi.co/json")
            .then(function (res) { return res.json(); })
            .then(function (data) { success((data && data.country_code) || "us"); })
            .catch(function () { success("us"); });
        }
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (iti) {
        if (typeof iti.isValidNumber === "function" && !iti.isValidNumber()) {
          if (phoneField) phoneField.classList.add("has-error");
          phoneInput.focus();
          return;
        }
        if (phoneField) phoneField.classList.remove("has-error");
        var fullNumber = iti.getNumber();
        if (fullNumber) phoneInput.value = fullNumber;
      }

      var btn = form.querySelector("button[type=submit]");
      var original = btn.innerHTML;
      btn.textContent = "Sending…";
      btn.disabled = true;

      fetch("https://formsubmit.co/ajax/" + CONTACT_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
        .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
        .then(function () {
          btn.textContent = "Message sent ✓";
          form.reset();
        })
        .catch(function () {
          btn.textContent = "Couldn't send — email us directly";
        })
        .finally(function () {
          setTimeout(function () { btn.innerHTML = original; btn.disabled = false; }, 3200);
        });
    });
  }
})();
