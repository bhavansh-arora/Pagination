(function () {
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.add('loading');
  document.getElementById('year').textContent = new Date().getFullYear();

  // Hero: stagger the headline lines and fade-ins
  document.querySelectorAll('.line-inner').forEach(function (el, i) {
    el.style.transitionDelay = (0.15 + 0.18 * i) + 's';
  });
  document.querySelectorAll('.fade-in').forEach(function (el) {
    el.style.transitionDelay = (parseFloat(el.dataset.delay || 0) + 0.15) + 's';
  });

  // Preloader: count 0 -> 100 over 1.5s, then slide up
  var bar = document.getElementById('preloader-bar');
  var count = document.getElementById('preloader-count');
  var preloader = document.getElementById('preloader');
  var start = performance.now();
  var duration = reduced ? 1 : 1500;

  function tick(now) {
    var p = Math.min(1, (now - start) / duration);
    var v = Math.round(p * 100);
    bar.style.width = v + '%';
    count.textContent = v;
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 300);
  }
  function finish() {
    preloader.classList.add('done');
    body.classList.remove('loading');
    setTimeout(function () {
      body.classList.add('ready');
      animateStats();
    }, 250);
    setTimeout(function () { preloader.remove(); }, 1000);
  }
  requestAnimationFrame(tick);

  // Animated hero stats
  function animateStats() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.decimals || 0, 10);
      var suffix = el.dataset.suffix || '';
      var t0 = performance.now();
      var d = 1800;
      (function step(now) {
        var p = Math.min(1, (now - t0) / d);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  // Header shrink on scroll + hero parallax (y 0->140px, scale 1.06->1.2)
  var header = document.getElementById('site-header');
  var hero = document.getElementById('hero');
  var heroMedia = document.getElementById('hero-media');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    if (!reduced) {
      var h = hero.offsetHeight;
      var p = Math.max(0, Math.min(1, y / h));
      heroMedia.style.transform = 'translate3d(0,' + (140 * p) + 'px,0) scale(' + (1.06 + 0.14 * p) + ')';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Scroll reveals
  document.querySelectorAll('.reveal[data-stagger]').forEach(function (el) {
    el.style.transitionDelay = (0.1 * parseInt(el.dataset.stagger, 10)) + 's';
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -80px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // Mobile menu
  var toggle = document.getElementById('menu-toggle');
  var mobile = document.getElementById('nav-mobile');
  toggle.addEventListener('click', function () {
    var open = mobile.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  mobile.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mobile.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();
