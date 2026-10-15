(() => {
  const nav = document.getElementById('nav');
  const mcta = document.querySelector('.mcta');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 30);
    if (mcta) mcta.classList.toggle('show', scrollY > 500);
  };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // mobile drawer
  const burger = document.querySelector('.burger'), drawer = document.getElementById('drawer');
  const setDrawer = open => {
    drawer.classList.toggle('open', open);
    burger.classList.toggle('x', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  // seamless marquee
  document.querySelectorAll('.marquee').forEach(m => m.innerHTML += m.innerHTML);

  // reveal + counters
  const count = el => {
    const end = +el.dataset.count, t0 = performance.now(), d = 1600;
    const tick = t => {
      const p = Math.min((t - t0) / d, 1);
      el.firstChild.nodeValue = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  // position check instead of IntersectionObserver so fast flings never skip an element
  let pending = [...document.querySelectorAll('.reveal')], ticking = false;
  const reveal = () => {
    ticking = false;
    const edge = innerHeight * 0.92;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top > edge) return true;
      el.classList.add('in');
      el.querySelectorAll('[data-count]').forEach(count);
      return false;
    });
    if (!pending.length) removeEventListener('scroll', onReveal);
  };
  const onReveal = () => { if (!ticking) { ticking = true; requestAnimationFrame(reveal); } };
  addEventListener('scroll', onReveal, {passive:true});
  addEventListener('resize', onReveal);
  reveal();

  // toast
  const toast = document.getElementById('toast');
  const thanks = () => { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3200); };
  document.querySelectorAll('form[data-thanks]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); f.reset(); thanks(); }));

  // prefill program on contact page (?program=...)
  const sel = document.getElementById('f-int'), want = new URLSearchParams(location.search).get('program');
  if (sel && want) [...sel.options].forEach(o => { if (o.value === want) sel.value = want; });

  // pillar quiz
  const steps = [...document.querySelectorAll('.q-step')];
  if (steps.length) {
    const bar = document.getElementById('qbar'), score = {body:0, brand:0, bank:0};
    const results = {
      body:  ['Body', 'Your power starts with strength. Lauren’s Custom Physique Design will rebuild your energy, shape and confidence. Then we layer in brand and bank.', 'physique'],
      brand: ['Brand', 'You’re ready to be seen. The Camera Ready Intensive gives you the presence, look and story that make people stop scrolling and start booking you.', 'camera'],
      bank:  ['Bank', 'It’s time for abundance. Inside The Powers Circle, Lauren helps you turn your story and skills into income, with your body and brand to match.', 'circle']
    };
    let i = 0;
    document.querySelectorAll('.q-opt').forEach(b => b.addEventListener('click', () => {
      score[b.dataset.v]++;
      steps[i].classList.remove('on'); i++;
      bar.style.width = (i / 3 * 100) + '%';
      if (i === 3) {
        const top = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('qres-title').textContent = results[top][0];
        document.getElementById('qres-text').textContent = results[top][1];
        document.getElementById('qres-link').href = 'contact.html?program=' + results[top][2] + '#apply';
      }
      steps[i].classList.add('on');
    }));
  }
})();
