/* MDJ Mortgages — site interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const gbp = (n, dp = 0) => '£' + (isFinite(n) ? n : 0).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });

  /* ---------- Mobile drawer ---------- */
  const drawer = $('#drawer');
  const openDrawer = () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; $('.drawer-close', drawer).focus(); };
  const closeDrawer = () => { drawer.classList.remove('open'); document.body.style.overflow = ''; };
  $('.burger')?.addEventListener('click', openDrawer);
  drawer && $$('.drawer-close, .drawer-backdrop', drawer).forEach(b => b.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer?.classList.contains('open')) closeDrawer(); });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .step').forEach(el => io.observe(el));

  /* ---------- Count-up numbers ---------- */
  const counter = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = parseFloat(el.dataset.count), dp = (el.dataset.count.split('.')[1] || '').length;
      const t0 = performance.now(), dur = 1600;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dp);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => counter.observe(el));

  /* ---------- Review slider ---------- */
  $$('.review-slider').forEach(slider => {
    const track = $('.review-track', slider);
    const step = () => ($('.review', track)?.offsetWidth || 300) + 24;
    $$('[data-dir]', slider.closest('section')).forEach(btn =>
      btn.addEventListener('click', () => track.scrollBy({ left: step() * Number(btn.dataset.dir), behavior: 'smooth' })));
  });

  /* ---------- Sub-navigation active state ---------- */
  const subLinks = $$('.subnav a');
  if (subLinks.length) {
    const map = new Map(subLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          subLinks.forEach(a => a.classList.remove('active'));
          const a = map.get(en.target.id);
          if (a) { a.classList.add('active'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && spy.observe(s); });
  }

  /* ---------- Back to top ---------- */
  const topBtn = $('.fab .top');
  topBtn && addEventListener('scroll', () => topBtn.classList.toggle('show', scrollY > 900), { passive: true });

  /* ---------- Range inputs: track fill + live output ---------- */
  const fill = r => r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
  $$('input[type="range"]').forEach(r => { fill(r); r.addEventListener('input', () => fill(r)); });

  /* ---------- Calculator tabs ---------- */
  const tabs = $$('.calc-tab');
  const showTab = id => {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    $$('.calc').forEach(c => c.hidden = c.id !== id);
  };
  tabs.forEach(t => t.addEventListener('click', () => { showTab(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }));
  if (tabs.length && location.hash && $(location.hash + '.calc')) showTab(location.hash.slice(1));

  const num = el => parseFloat(String(el.value).replace(/[^0-9.]/g, '')) || 0;
  const bind = (form, fn) => { if (!form) return; form.addEventListener('input', fn); fn(); };

  /* Monthly repayment */
  bind($('#repay-form'), () => {
    const f = $('#repay-form');
    const P = num(f.amount), years = num(f.term), rate = num(f.rate) / 100 / 12, n = years * 12;
    const io = f.type.value === 'interest';
    const monthly = io ? P * rate : (rate ? P * rate / (1 - Math.pow(1 + rate, -n)) : P / n);
    const total = io ? monthly * n + P : monthly * n;
    const interest = total - P;
    $('#out-term').textContent = years + ' yrs';
    $('#out-rate').textContent = num(f.rate).toFixed(2) + '%';
    $('#repay-monthly').textContent = gbp(monthly, 2);
    $('#repay-total').textContent = gbp(total);
    $('#repay-interest').textContent = gbp(interest);
    $('#repay-loan').textContent = gbp(P);
    const pct = total ? (P / total) * 100 : 50;
    $('#repay-bar-p').style.width = pct + '%';
    $('#repay-bar-i').style.width = (100 - pct) + '%';
  });

  /* Affordability */
  bind($('#afford-form'), () => {
    const f = $('#afford-form');
    const income = num(f.income1) + num(f.income2);
    const net = Math.max(income - num(f.commitments) * 12, 0);
    const low = net * 4, high = net * 4.5, stretch = net * 5.5;
    $('#afford-high').textContent = gbp(Math.round(high / 1000) * 1000);
    $('#afford-range').textContent = gbp(Math.round(low / 1000) * 1000) + ' – ' + gbp(Math.round(high / 1000) * 1000);
    $('#afford-stretch').textContent = gbp(Math.round(stretch / 1000) * 1000);
    $('#afford-price').textContent = gbp(Math.round((high + num(f.deposit)) / 1000) * 1000);
  });

  /* Stamp duty (England & NI, rates from 1 April 2025) */
  const bands = {
    standard: [[125000, 0], [250000, .02], [925000, .05], [1500000, .10], [Infinity, .12]],
    ftb: [[300000, 0], [500000, .05]]
  };
  const sdlt = (price, kind) => {
    let table = bands.standard, surcharge = 0;
    if (kind === 'ftb' && price <= 500000) table = bands.ftb;
    if (kind === 'additional') surcharge = .05;
    let tax = 0, prev = 0;
    for (const [cap, r] of table) {
      if (price > prev) tax += (Math.min(price, cap) - prev) * (r + surcharge);
      prev = cap;
    }
    return tax;
  };
  bind($('#sdlt-form'), () => {
    const f = $('#sdlt-form');
    const price = num(f.price), kind = f.buyer.value;
    const tax = sdlt(price, kind);
    $('#sdlt-tax').textContent = gbp(tax);
    $('#sdlt-eff').textContent = price ? (tax / price * 100).toFixed(2) + '%' : '0%';
    $('#sdlt-price').textContent = gbp(price);
    const saving = kind === 'ftb' ? sdlt(price, 'standard') - tax : 0;
    $('#sdlt-saving').textContent = saving > 0 ? gbp(saving) : '—';
    $('#sdlt-note').textContent = kind === 'ftb' && price > 500000
      ? 'First-time buyer relief is not available above £500,000, so standard rates apply.'
      : kind === 'additional' ? 'Includes the 5% higher-rate surcharge for additional properties.' : '';
  });

  /* Equity release (illustrative) */
  bind($('#er-form'), () => {
    const f = $('#er-form');
    const age = num(f.age), value = num(f.value), mortgage = num(f.mortgage);
    const ltv = Math.min(Math.max(0.20 + (age - 55) * 0.012, 0.2), 0.58);
    const gross = value * ltv, net = Math.max(gross - mortgage, 0);
    $('#out-age').textContent = age;
    $('#er-gross').textContent = gbp(Math.round(gross / 500) * 500);
    $('#er-net').textContent = gbp(Math.round(net / 500) * 500);
    $('#er-ltv').textContent = Math.round(ltv * 100) + '%';
  });

  /* ---------- Multi-step enquiry ---------- */
  const form = $('#enquiry');
  if (form) {
    const steps = $$('.form-step', form), bars = $$('.progress i'), label = $('.step-label');
    let i = 0;
    const render = () => {
      steps.forEach((s, k) => s.classList.toggle('active', k === i));
      bars.forEach((b, k) => b.classList.toggle('done', k <= i));
      label.textContent = `Step ${i + 1} of ${steps.length}`;
      $('[data-prev]', form).style.visibility = i ? 'visible' : 'hidden';
      $('[data-next]', form).hidden = i === steps.length - 1;
      $('[type="submit"]', form).hidden = i !== steps.length - 1;
    };
    const valid = () => {
      let ok = true;
      $$('[required]', steps[i]).forEach(inp => {
        const fld = inp.closest('.field') || inp.closest('.choice-group')?.closest('.field');
        let good = inp.type === 'radio' ? !!$(`[name="${inp.name}"]:checked`, form) : inp.checkValidity() && inp.value.trim() !== '';
        fld?.classList.toggle('invalid', !good);
        if (!good) ok = false;
      });
      return ok;
    };
    $('[data-next]', form).addEventListener('click', () => { if (valid()) { i++; render(); } });
    $('[data-prev]', form).addEventListener('click', () => { i = Math.max(i - 1, 0); render(); });
    form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!valid()) return;
      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        try { await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) }); } catch (_) { /* fall through to success + email link */ }
      }
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
      $('#mailto-fallback').href = `mailto:mark@mdjmortgages.com?subject=${encodeURIComponent('Website enquiry: ' + (data.need || 'Mortgage advice'))}&body=${encodeURIComponent(body)}`;
      $('#success-name').textContent = (data.name || '').split(' ')[0] || 'there';
      $('.enquiry-body', form.parentElement).hidden = true;
      $('.enquiry-head', form.parentElement).hidden = true;
      $('.success-wrap').hidden = false;
    });
    render();
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
