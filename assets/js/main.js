(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.remove('no-js');
  $('#year').textContent = new Date().getFullYear();

  /* Nav: solid on scroll, mobile menu */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks'), sticky = $('#stickyCta');
  const hero = $('.hero'), contact = $('#contact');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const pastHero = y > hero.offsetHeight * 0.7;
    const r = contact.getBoundingClientRect();
    const atForm = r.top < innerHeight && r.bottom > 0;
    sticky.classList.toggle('show', pastHero && !atForm);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggleMenu = (open) => {
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => toggleMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* Hero sparkles */
  const sp = $('.sparkles');
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = 20 + Math.random() * 75 + '%';
    s.style.setProperty('--d', 3 + Math.random() * 5 + 's');
    s.style.setProperty('--delay', -Math.random() * 8 + 's');
    sp.appendChild(s);
  }

  /* Reveal on scroll with stagger */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const sibs = $$('.reveal', e.target.parentElement);
      e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 90 + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Count-up stats */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1800;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
        el.textContent = v.toLocaleString() + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* Portfolio filter */
  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => b.classList.toggle('active', b === btn));
    const f = btn.dataset.filter;
    $$('.g-item').forEach(it => it.classList.toggle('hide', f !== 'all' && it.dataset.cat !== f));
  }));

  /* Testimonials slider */
  const track = $('#tTrack'), cards = $$('.t-card', track), dots = $('#tDots');
  let idx = 0, timer;
  const perView = () => innerWidth <= 560 ? 1 : innerWidth <= 900 ? 2 : 3;
  const maxIdx = () => Math.max(0, cards.length - perView());
  const renderDots = () => {
    dots.innerHTML = '';
    for (let i = 0; i <= maxIdx(); i++) {
      const d = document.createElement('button');
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', () => { go(i); restart(); });
      dots.appendChild(d);
    }
  };
  const go = (i) => {
    idx = (i + maxIdx() + 1) % (maxIdx() + 1);
    const gap = 24, w = cards[0].getBoundingClientRect().width + gap;
    track.style.transform = `translateX(${-idx * w}px)`;
    $$('button', dots).forEach((d, j) => d.classList.toggle('active', j === idx));
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(idx + 1), 6000); };
  $('#tPrev').addEventListener('click', () => { go(idx - 1); restart(); });
  $('#tNext').addEventListener('click', () => { go(idx + 1); restart(); });
  addEventListener('resize', () => { renderDots(); go(Math.min(idx, maxIdx())); });
  renderDots(); go(0); restart();

  /* Multi-step lead form */
  const form = $('#leadForm'), steps = $$('.f-step', form), bar = $('#formBar');
  let step = 0;
  const show = (n) => {
    steps.forEach((s, i) => s.classList.toggle('active', i === n));
    bar.style.width = ((n + 1) / steps.length) * 100 + '%';
    step = n;
  };
  const validate = (fs) => {
    let ok = true;
    const radios = $$('input[type=radio][required]', fs);
    if (radios.length) {
      const name = radios[0].name, grid = radios[0].closest('.choice-grid');
      const checked = !!$(`input[name="${name}"]:checked`, fs);
      grid.classList.toggle('invalid', !checked);
      ok = ok && checked;
    }
    $$('input:not([type=radio])[required], select[required]', fs).forEach(el => {
      const valid = el.checkValidity() && el.value.trim() !== '';
      el.closest('.field').classList.toggle('invalid', !valid);
      if (!valid && ok) el.focus();
      ok = ok && valid;
    });
    return ok;
  };
  $$('.f-next', form).forEach(b => b.addEventListener('click', () => { if (validate(steps[step])) show(step + 1); }));
  $$('.f-back', form).forEach(b => b.addEventListener('click', () => show(step - 1)));
  $$('input[name=type]', form).forEach(r => r.addEventListener('change', () => {
    $('.choice-grid', form).classList.remove('invalid');
    setTimeout(() => show(1), 280);
  }));
  $$('input, select', form).forEach(el => el.addEventListener('input', () => el.closest('.field')?.classList.remove('invalid')));

  const budgets = ['Under $10k', '$10k – $25k', '$25k – $50k', '$50k – $100k', '$100k – $250k', '$250k+'];
  const budget = $('#budget'), out = $('#budgetOut');
  budget.addEventListener('input', () => out.textContent = budgets[budget.value]);

  // Pre-fill from service / package CTAs
  $$('[data-type]').forEach(a => a.addEventListener('click', () => {
    const r = $(`input[name=type][value="${a.dataset.type}"]`, form);
    if (r) { r.checked = true; show(1); }
  }));
  $$('[data-pkg]').forEach(a => a.addEventListener('click', () => {
    form.package.value = a.dataset.pkg;
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(steps[step])) return;
    const data = Object.fromEntries(new FormData(form));
    data.budget = budgets[data.budget];
    // TODO: send `data` to your CRM / form endpoint (e.g. fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) }))
    console.log('Lead captured:', data);
    steps.forEach(s => s.classList.remove('active'));
    $('#sName').textContent = (data.name || 'friend').split(' ')[0];
    $('#fSuccess').hidden = false;
    bar.style.width = '100%';
  });

  /* Newsletter */
  $('#nlForm').addEventListener('submit', (e) => {
    e.preventDefault();
    e.target.innerHTML = '<span style="padding:10px 14px;color:#E8CF94">✦ You\'re on the list. Welcome!</span>';
  });
})();
