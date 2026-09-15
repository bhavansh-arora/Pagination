// =====================================================
// ATELIER — booking wizard (fully client-side demo)
//
// No backend/database is wired up. Availability is
// simulated with localStorage so the flow feels real:
// once a slot is confirmed in this browser it will show
// as taken. Swap `saveBooking()` / `fetchTakenSlots()`
// for real API calls when you add a backend.
// =====================================================
(function () {
  "use strict";
  const wizard = document.querySelector("#booking-wizard");
  if (!wizard) return;

  const STORAGE_KEY = "atelier_demo_bookings";

  const SERVICES = [
    {
      id: "consult",
      name: "Design Consultation",
      desc: "A focused 1-hour session to talk through your space, style and goals.",
      duration: 60,
      price: "₹2,999",
      location: "In studio or video call",
    },
    {
      id: "room",
      name: "Single Room Refresh",
      desc: "Concept, layout and sourcing for one room — from mood board to install.",
      duration: 90,
      price: "From ₹1,80,000",
      location: "In-home visit",
    },
    {
      id: "home",
      name: "Full Home Design",
      desc: "End-to-end design across your entire home, led by a senior designer.",
      duration: 120,
      price: "From ₹6,50,000",
      location: "In-home visit",
    },
    {
      id: "commercial",
      name: "Commercial Space",
      desc: "Retail, hospitality or office design tailored to your brand.",
      duration: 120,
      price: "Custom quote",
      location: "On-site walkthrough",
    },
    {
      id: "styling",
      name: "Color & Styling",
      desc: "Palette, finishes and styling direction for a room or full home.",
      duration: 60,
      price: "From ₹15,000",
      location: "In studio or video call",
    },
  ];

  const HOURS = {
    // 0 = Sunday (closed) ... 6 = Saturday
    1: { open: 10, close: 19 },
    2: { open: 10, close: 19 },
    3: { open: 10, close: 19 },
    4: { open: 10, close: 19 },
    5: { open: 10, close: 19 },
    6: { open: 10, close: 19 },
  };

  const state = {
    step: 1,
    serviceId: null,
    date: "",
    time: "",
    details: {},
  };

  /* ---------------- storage helpers (demo persistence only) ---------------- */
  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function saveBooking(booking) {
    const list = getBookings();
    list.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function takenTimesFor(dateStr) {
    return getBookings()
      .filter((b) => b.date === dateStr)
      .map((b) => b.time);
  }

  /* ---------------- render: service cards ---------------- */
  const serviceGrid = wizard.querySelector("#service-pick-grid");
  function renderServices() {
    serviceGrid.innerHTML = SERVICES.map(
      (s) => `
      <div class="pick-card" data-id="${s.id}" role="button" tabindex="0" aria-pressed="false">
        <div class="check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
        <div class="meta"><span>${s.duration} min</span><span>${s.price}</span></div>
      </div>`
    ).join("");

    serviceGrid.querySelectorAll(".pick-card").forEach((card) => {
      card.addEventListener("click", () => selectService(card.getAttribute("data-id")));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectService(card.getAttribute("data-id"));
        }
      });
    });
  }
  function selectService(id) {
    state.serviceId = id;
    serviceGrid.querySelectorAll(".pick-card").forEach((c) => {
      const on = c.getAttribute("data-id") === id;
      c.classList.toggle("selected", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    wizard.querySelector('[data-next="1"]').disabled = false;
    updateSummary();
  }

  /* ---------------- date + slots ---------------- */
  const dateInput = wizard.querySelector("#booking-date");
  const slotsGrid = wizard.querySelector("#slots-grid");
  const slotsEmpty = wizard.querySelector("#slots-empty");

  function initDate() {
    const today = new Date();
    const max = new Date();
    max.setDate(max.getDate() + 60);
    dateInput.min = toISODate(today);
    dateInput.max = toISODate(max);
    dateInput.addEventListener("change", () => {
      state.time = "";
      renderSlots(dateInput.value);
      updateSummary();
      wizard.querySelector('[data-next="2"]').disabled = true;
    });
  }
  function toISODate(d) {
    return d.toISOString().slice(0, 10);
  }
  function renderSlots(dateStr) {
    slotsGrid.innerHTML = "";
    if (!dateStr) {
      slotsEmpty.hidden = false;
      slotsEmpty.textContent = "Choose a date to see available times.";
      return;
    }
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDay();
    const hours = HOURS[day];
    if (!hours) {
      slotsEmpty.hidden = false;
      slotsEmpty.textContent = "We're closed on Sundays — please pick another date.";
      return;
    }
    const taken = new Set(takenTimesFor(dateStr));
    const now = new Date();
    const isToday = toISODate(now) === dateStr;
    const slots = [];
    for (let h = hours.open; h < hours.close; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    let anyAvailable = false;
    slots.forEach((t) => {
      const [h, m] = t.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(h, m, 0, 0);
      const isPast = isToday && slotDate.getTime() < now.getTime();
      const isTaken = taken.has(t);
      const disabled = isPast || isTaken;
      if (!disabled) anyAvailable = true;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-btn";
      btn.textContent = formatTime(t);
      btn.disabled = disabled;
      if (state.time === t) btn.classList.add("selected");
      btn.addEventListener("click", () => selectSlot(t, btn));
      slotsGrid.appendChild(btn);
    });
    slotsEmpty.hidden = anyAvailable;
    slotsEmpty.textContent = "No times left that day — please try another date.";
  }
  function formatTime(t) {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }
  function selectSlot(t, btn) {
    state.time = t;
    slotsGrid.querySelectorAll(".slot-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    wizard.querySelector('[data-next="2"]').disabled = false;
    updateSummary();
  }

  /* ---------------- details form ---------------- */
  const detailsForm = wizard.querySelector("#details-form");
  function validateDetails() {
    let valid = true;
    detailsForm.querySelectorAll("[required]").forEach((input) => {
      const field = input.closest(".field");
      const ok =
        input.value.trim().length > 0 &&
        (input.type !== "email" || /^\S+@\S+\.\S+$/.test(input.value));
      field.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    return valid;
  }
  function collectDetails() {
    const fd = new FormData(detailsForm);
    state.details = Object.fromEntries(fd.entries());
  }

  /* ---------------- summary + review ---------------- */
  const summaryPanel = wizard.querySelector("#summary-panel");
  function updateSummary() {
    const service = SERVICES.find((s) => s.id === state.serviceId);
    const rows = [];
    if (service) {
      rows.push(["Service", service.name]);
      rows.push(["Duration", `${service.duration} min`]);
      rows.push(["Format", service.location]);
    }
    if (state.date) rows.push(["Date", formatDateLong(state.date)]);
    if (state.time) rows.push(["Time", formatTime(state.time)]);
    if (state.details.name) rows.push(["Name", state.details.name]);

    if (!rows.length) {
      summaryPanel.querySelector(".summary-rows").innerHTML = "";
      summaryPanel.querySelector(".summary-empty").hidden = false;
      summaryPanel.querySelector(".summary-total").hidden = true;
      return;
    }
    summaryPanel.querySelector(".summary-empty").hidden = true;
    summaryPanel.querySelector(".summary-rows").innerHTML = rows
      .map(([k, v]) => `<div class="summary-row"><span>${k}</span><span>${v}</span></div>`)
      .join("");
    const totalEl = summaryPanel.querySelector(".summary-total");
    if (service) {
      totalEl.hidden = false;
      totalEl.innerHTML = `<span>Estimated</span><span>${service.price}</span>`;
    }
  }
  function formatDateLong(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  function renderReview() {
    const service = SERVICES.find((s) => s.id === state.serviceId);
    wizard.querySelector("#review-service").innerHTML = `
      <div><dt>Service</dt><dd>${service.name}</dd></div>
      <div><dt>Duration</dt><dd>${service.duration} minutes</dd></div>
      <div><dt>Format</dt><dd>${service.location}</dd></div>
      <div><dt>Estimated</dt><dd>${service.price}</dd></div>`;
    wizard.querySelector("#review-datetime").innerHTML = `
      <div><dt>Date</dt><dd>${formatDateLong(state.date)}</dd></div>
      <div><dt>Time</dt><dd>${formatTime(state.time)}</dd></div>`;
    const d = state.details;
    wizard.querySelector("#review-details").innerHTML = `
      <div><dt>Name</dt><dd>${escapeHTML(d.name || "")}</dd></div>
      <div><dt>Email</dt><dd>${escapeHTML(d.email || "")}</dd></div>
      <div><dt>Phone</dt><dd>${escapeHTML(d.phone || "")}</dd></div>
      <div><dt>Budget</dt><dd>${escapeHTML(d.budget || "Not specified")}</dd></div>`;
  }
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------------- step navigation ---------------- */
  const steps = [...wizard.querySelectorAll(".booking-step")];
  const stepItems = [...wizard.querySelectorAll(".step-item")];

  function goToStep(n) {
    state.step = n;
    steps.forEach((s) => s.classList.toggle("active", Number(s.dataset.step) === n));
    stepItems.forEach((s, i) => {
      const num = i + 1;
      s.classList.toggle("active", num === n);
      s.classList.toggle("done", num < n);
    });
    wizard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  wizard.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const from = Number(btn.getAttribute("data-next"));
      if (from === 1 && !state.serviceId) return;
      if (from === 2) {
        state.date = dateInput.value;
        if (!state.date || !state.time) return;
      }
      if (from === 3) {
        if (!validateDetails()) return;
        collectDetails();
        renderReview();
      }
      goToStep(from + 1);
      updateSummary();
    });
  });
  wizard.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => goToStep(Number(btn.getAttribute("data-prev")) - 1));
  });

  /* ---------------- confirm + ICS ---------------- */
  const confirmBtn = wizard.querySelector("#confirm-booking");
  confirmBtn?.addEventListener("click", () => {
    const consent = wizard.querySelector("#consent-check");
    if (consent && !consent.checked) {
      consent.closest(".consent-row").style.color = "#b3413a";
      return;
    }
    const service = SERVICES.find((s) => s.id === state.serviceId);
    const ref = "ATL-" + Date.now().toString(36).toUpperCase().slice(-6);
    const booking = {
      ref,
      serviceId: state.serviceId,
      serviceName: service.name,
      date: state.date,
      time: state.time,
      details: state.details,
      createdAt: new Date().toISOString(),
    };
    saveBooking(booking);

    wizard.querySelector("#confirm-ref").textContent = ref;
    wizard.querySelector("#confirm-summary").innerHTML = `
      <div class="summary-row"><span>Service</span><span>${service.name}</span></div>
      <div class="summary-row"><span>Date</span><span>${formatDateLong(state.date)}</span></div>
      <div class="summary-row"><span>Time</span><span>${formatTime(state.time)}</span></div>
      <div class="summary-row"><span>Name</span><span>${escapeHTML(state.details.name || "")}</span></div>`;

    wizard.querySelector("#download-ics").onclick = () => downloadICS(booking, service);

    goToStep(5);
  });

  function downloadICS(booking, service) {
    const start = new Date(`${booking.date}T${booking.time}:00`);
    const end = new Date(start.getTime() + service.duration * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Atelier Interiors//Booking//EN",
      "BEGIN:VEVENT",
      `UID:${booking.ref}@atelier-interiors.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${service.name} — Atelier Interiors`,
      `DESCRIPTION:Booking reference ${booking.ref}. We look forward to meeting you.`,
      "LOCATION:Atelier Interiors Studio",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atelier-booking-${booking.ref}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ---------------- book another ---------------- */
  wizard.querySelector("#book-another")?.addEventListener("click", () => {
    state.step = 1;
    state.serviceId = null;
    state.date = "";
    state.time = "";
    state.details = {};
    detailsForm.reset();
    dateInput.value = "";
    slotsGrid.innerHTML = "";
    slotsEmpty.hidden = false;
    slotsEmpty.textContent = "Choose a date to see available times.";
    serviceGrid.querySelectorAll(".pick-card").forEach((c) => c.classList.remove("selected"));
    wizard.querySelector('[data-next="1"]').disabled = true;
    wizard.querySelector('[data-next="2"]').disabled = true;
    goToStep(1);
    updateSummary();
  });

  /* ---------------- pre-select service via ?service=id ---------------- */
  function preselectFromQuery() {
    const params = new URLSearchParams(location.search);
    const wanted = params.get("service");
    if (wanted && SERVICES.some((s) => s.id === wanted)) {
      selectService(wanted);
    }
  }

  /* ---------------- init ---------------- */
  renderServices();
  initDate();
  renderSlots("");
  updateSummary();
  preselectFromQuery();
})();
