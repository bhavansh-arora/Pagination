/* MDJ Mortgages — site interactions. No dependencies. */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  var gbp2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var BOOKING = "https://calendly.com/mdjmortgages/free-30-minute-discovery-meeting-clone";
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ---------- Header ---------- */
  var header = $(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }
  $$(".nav__item > button.nav__link").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var item = btn.parentElement;
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) {
    $$(".nav__item.is-open").forEach(function (item) {
      if (!item.contains(e.target) && window.innerWidth > 1020) {
        item.classList.remove("is-open");
        $("button", item).setAttribute("aria-expanded", "false");
      }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    $$(".nav__item.is-open").forEach(function (item) {
      item.classList.remove("is-open");
      $("button", item).setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$("[data-count]");
  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var prefix = el.getAttribute("data-prefix") || "";
    var start = performance.now(), dur = 1400;
    var tick = function (now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Range inputs ---------- */
  var paintRange = function (r) {
    var pct = ((r.value - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty("--fill", pct + "%");
  };
  var fmtOut = function (r) {
    var out = document.getElementById(r.getAttribute("data-out"));
    if (!out) return;
    var v = parseFloat(r.value), f = r.getAttribute("data-format");
    out.textContent = f === "gbp" ? gbp.format(v) : f === "pct" ? v.toFixed(2) + "%" : f === "yrs" ? v + " years" : v;
  };
  $$('input[type="range"]').forEach(function (r) {
    paintRange(r); fmtOut(r);
    r.addEventListener("input", function () { paintRange(r); fmtOut(r); });
  });

  /* ---------- Calculators ---------- */
  var num = function (form, name) {
    var el = form.elements[name];
    if (!el) return 0;
    if (el.length && !el.tagName) { // radio group
      for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
      return "";
    }
    var v = parseFloat(String(el.value).replace(/[^0-9.]/g, ""));
    return isNaN(v) ? 0 : v;
  };
  var set = function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; };
  var monthlyPayment = function (principal, annualRate, years) {
    var n = years * 12, r = annualRate / 100 / 12;
    if (principal <= 0 || n <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  };

  var calcs = {
    borrow: function (f) {
      var income = num(f, "income1") + num(f, "income2");
      var commitments = num(f, "commitments") * 12;
      var deposit = num(f, "deposit");
      var assessable = Math.max(0, income - commitments);
      var low = assessable * 4, mid = assessable * 4.5, high = assessable * 5.5;
      set("b-mid", gbp.format(Math.round(mid / 1000) * 1000));
      set("b-range", gbp.format(Math.round(low / 1000) * 1000) + " – " + gbp.format(Math.round(high / 1000) * 1000));
      set("b-budget", gbp.format(Math.round((mid + deposit) / 1000) * 1000));
      var ltv = mid + deposit > 0 ? (mid / (mid + deposit)) * 100 : 0;
      set("b-ltv", ltv ? ltv.toFixed(0) + "%" : "–");
      set("b-deposit", gbp.format(deposit));
    },
    repay: function (f) {
      var loan = num(f, "loan"), rate = num(f, "rate"), term = num(f, "term");
      var type = num(f, "type");
      var m = type === "io" ? (loan * rate) / 100 / 12 : monthlyPayment(loan, rate, term);
      var total = m * term * 12 + (type === "io" ? loan : 0);
      var stress = type === "io" ? (loan * (rate + 1)) / 100 / 12 : monthlyPayment(loan, rate + 1, term);
      set("r-monthly", gbp2.format(m));
      set("r-total", gbp.format(total));
      set("r-interest", gbp.format(total - loan));
      set("r-stress", gbp2.format(stress) + " (+" + gbp2.format(stress - m) + ")");
    },
    sdlt: function (f) {
      var price = num(f, "price"), buyer = num(f, "buyer");
      var bands = [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.1], [Infinity, 0.12]];
      if (buyer === "ftb" && price <= 500000) bands = [[300000, 0], [500000, 0.05]];
      var surcharge = buyer === "additional" && price >= 40000 ? 0.05 : 0;
      var tax = 0, prev = 0;
      bands.forEach(function (b) {
        if (price > prev) tax += (Math.min(price, b[0]) - prev) * (b[1] + surcharge);
        prev = b[0];
      });
      set("s-tax", gbp.format(Math.round(tax)));
      set("s-rate", price ? ((tax / price) * 100).toFixed(2) + "%" : "0%");
      set("s-note", buyer === "ftb" && price > 500000
        ? "First-time buyer relief isn't available above £500,000, so standard rates apply."
        : buyer === "ftb" ? "Includes first-time buyer relief." : buyer === "additional" ? "Includes the 5% higher-rate surcharge for additional properties." : "Standard residential rates.");
    },
    remo: function (f) {
      var bal = num(f, "balance"), term = num(f, "term");
      var cur = monthlyPayment(bal, num(f, "current"), term);
      var neu = monthlyPayment(bal, num(f, "new"), term);
      var save = cur - neu;
      set("m-save", gbp.format(Math.max(0, save)));
      set("m-year", gbp.format(Math.max(0, save * 12)));
      set("m-five", gbp.format(Math.max(0, save * 60)));
      set("m-cur", gbp2.format(cur));
      set("m-new", gbp2.format(neu));
    }
  };
  $$("form[data-calc]").forEach(function (f) {
    var fn = calcs[f.getAttribute("data-calc")];
    if (!fn) return;
    f.addEventListener("input", function () { fn(f); });
    f.addEventListener("change", function () { fn(f); });
    f.addEventListener("submit", function (e) { e.preventDefault(); fn(f); });
    fn(f);
  });

  /* ---------- Calculator tabs ---------- */
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    var activate = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (history.replaceState) history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") activate(tabs[(i + 1) % tabs.length], true);
        if (e.key === "ArrowLeft") activate(tabs[(i - 1 + tabs.length) % tabs.length], true);
      });
    });
    var fromHash = tabs.filter(function (t) { return "#" + t.getAttribute("aria-controls") === location.hash; })[0];
    activate(fromHash || tabs[0]);
  });

  /* ---------- Journey finder ---------- */
  var JOURNEYS = {
    ftb: {
      title: "Buying your first home",
      intro: "We'll take you from \"how much can I borrow?\" to picking up the keys, and explain every step in plain English.",
      points: ["An agreement in principle to show estate agents", "Schemes and lenders for smaller deposits", "Guidance through solicitors, surveys and completion"],
      link: "first-time-buyers.html", label: "First-time buyer guide"
    },
    move: {
      title: "Moving home",
      intro: "Whether you port your current deal or start fresh, we'll line up the numbers so your sale and purchase move together.",
      points: ["Port versus new deal, compared side by side", "Borrow more for a bigger home", "Timed around your chain"],
      link: "moving-home.html", label: "Moving home guide"
    },
    remo: {
      title: "Remortgaging",
      intro: "Rolling onto your lender's standard rate can cost hundreds a month. Many lenders let you secure a new deal up to six months before yours ends.",
      points: ["Product transfer and whole-of-market compared", "Release equity for improvements", "We'll remind you before your next deal ends"],
      link: "remortgage.html", label: "Remortgage guide"
    },
    self: {
      title: "Self-employed",
      intro: "Sole trader, contractor or company director, we know which lenders look at your income the right way.",
      points: ["Lenders that accept one year's accounts", "Salary plus dividends, or retained profit", "Day-rate contractor calculations"],
      link: "self-employed.html", label: "Self-employed guide"
    },
    later: {
      title: "Later life and equity release",
      intro: "Mark started out as an equity release adviser. We'll help you weigh up every option, with your family included if you'd like.",
      points: ["Lifetime and retirement interest-only mortgages", "Borrowing into retirement", "Honest advice, including when not to proceed"],
      link: "equity-release.html", label: "Later life guide"
    },
    protect: {
      title: "Protecting your family",
      intro: "Make sure the mortgage gets paid, whatever happens. We review your cover alongside your mortgage, not as an afterthought.",
      points: ["Life and critical illness cover", "Income protection", "Reviews when you remortgage, which can save money"],
      link: "protection.html", label: "Protection guide"
    }
  };
  $$("[data-journey]").forEach(function (j) {
    var choose = $(".journey__panel--choose", j), result = $(".journey__panel--result", j);
    var bars = $$(".journey__progress i", j), stepLabel = $(".journey__step", j);
    $$(".journey__opt", j).forEach(function (opt) {
      opt.addEventListener("click", function () {
        var d = JOURNEYS[opt.getAttribute("data-key")];
        if (!d) return;
        result.innerHTML =
          '<div class="journey__result"><h3>' + d.title + "</h3><p>" + d.intro + "</p><ul>" +
          d.points.map(function (p) { return "<li>" + CHECK + "<span>" + p + "</span></li>"; }).join("") +
          '</ul><div class="btn-row"><a class="btn btn--gold" href="' + BOOKING + '" target="_blank" rel="noopener">Book a free 30-min call ' + ARROW + '</a>' +
          '<a class="btn btn--ghost-light" href="' + d.link + '">' + d.label + "</a></div>" +
          '<button type="button" class="journey__back">← Choose something else</button></div>';
        choose.hidden = true; result.hidden = false;
        bars.forEach(function (b, i) { b.classList.toggle("is-on", i < 2); });
        stepLabel.textContent = "Step 2 of 2 · Your next step";
        $(".journey__back", result).addEventListener("click", function () {
          result.hidden = true; choose.hidden = false;
          bars.forEach(function (b, i) { b.classList.toggle("is-on", i < 1); });
          stepLabel.textContent = "Step 1 of 2 · Start your journey";
          $(".journey__opt", choose).focus();
        });
        $("h3", result).setAttribute("tabindex", "-1");
        $("h3", result).focus({ preventScroll: true });
      });
    });
  });

  /* ---------- Slider ---------- */
  $$("[data-slider]").forEach(function (s) {
    var track = $(".slider__track", s);
    var step = function () { var c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 24 : 300; };
    var prev = $("[data-prev]", s.parentElement) || $("[data-prev]", s);
    var next = $("[data-next]", s.parentElement) || $("[data-next]", s);
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
  });

  /* ---------- Forms → email enquiry ----------
     Static hosting has no server, so forms open a pre-filled email to Mark.
     Swap data-mailto for a Formspree / Netlify Forms endpoint when going live. */
  $$("form[data-mailto]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var subject = f.getAttribute("data-subject") || "Website enquiry";
      var lines = [];
      $$("input, select, textarea", f).forEach(function (el) {
        if (!el.name || el.type === "submit" || (el.type === "checkbox" && !el.checked) || (el.type === "radio" && !el.checked)) return;
        var label = el.getAttribute("data-label") || el.name;
        lines.push(label + ": " + el.value);
      });
      window.location.href = "mailto:" + f.getAttribute("data-mailto") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      var ok = $(".form-success", f.parentElement) || $(".form-success", f);
      if (ok) ok.classList.add("is-visible");
    });
  });

  /* ---------- Year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
