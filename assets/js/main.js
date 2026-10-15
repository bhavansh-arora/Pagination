/* Alpha Visuals — site behaviour */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var fmt = function (n) { return '$' + n.toLocaleString('en-NZ'); };

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Nav: solid on scroll, hide on scroll down ---------- */
  var nav = $('#nav');
  var sticky = $('#sticky-cta');
  var lastY = window.scrollY;
  var ticking = false;
  var heroEl = $('.hero, .page-hero, #enquire');
  var stickyBlocked = false;

  function onScroll() {
    var y = window.scrollY;
    var threshold = heroEl ? Math.max(heroEl.offsetHeight - 120, 80) : 80;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    if (sticky) {
      var on = y > threshold && !stickyBlocked;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      var a = $('a', sticky); if (a) a.tabIndex = on ? 0 : -1;
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Hide sticky CTA while the enquiry form or footer CTA band is on screen.
  if (sticky && 'IntersectionObserver' in window) {
    var blockers = $$('#enquiry-form, .cta-band, .footer');
    var visible = new Set();
    var bo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? visible.add(e.target) : visible.delete(e.target); });
      stickyBlocked = visible.size > 0;
      onScroll();
    });
    blockers.forEach(function (b) { bo.observe(b); });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    if (open) nav.classList.remove('is-hidden');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!document.documentElement.classList.contains('menu-open'));
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Reveal on scroll ---------- */
  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('is-in'); }, 60); });

  var revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---------- Lazy, in-view autoplay videos ---------- */
  var lazyVideos = $$('video[data-lazy-video]');
  if ('IntersectionObserver' in window && lazyVideos.length) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.loaded) {
            $$('source[data-src]', v).forEach(function (s) { s.src = s.dataset.src; });
            v.load();
            v.dataset.loaded = '1';
          }
          if (!reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    lazyVideos.forEach(function (v) { vo.observe(v); });
  }
  if (reduceMotion) $$('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });

  /* ---------- Film lightbox ---------- */
  var lb = $('#lightbox');
  var lbFrame = lb && $('.lightbox__frame', lb);
  var lbTitle = lb && $('.lightbox__title', lb);
  var lastFocus = null;
  function openFilm(id, title) {
    lastFocus = document.activeElement;
    lbFrame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + (title || 'Film').replace(/"/g, '&quot;') +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    lbTitle.textContent = title || '';
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.documentElement.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  }
  function closeFilm() {
    lb.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () { lb.hidden = true; lbFrame.innerHTML = ''; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  if (lb) {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-film]');
      if (t) { e.preventDefault(); openFilm(t.dataset.film, t.dataset.title); }
    });
    $('.lightbox__close', lb).addEventListener('click', closeFilm);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeFilm(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!lb.hidden) closeFilm();
        else if (document.documentElement.classList.contains('menu-open')) setMenu(false);
      }
    });
  }

  /* ---------- Package builder ---------- */
  var builder = $('#builder');
  if (builder) {
    var reels = 0;
    var reelOut = $('#reel-count');
    var lines = $('#sum-lines');
    var totalOut = $('#sum-total');
    var cta = $('#builder-cta');

    var update = function () {
      var pkg = $('input[name="b-pkg"]:checked', builder);
      var total = +pkg.dataset.price;
      var html = '<li><span>' + pkg.value + '</span><span>' + fmt(+pkg.dataset.price) + '</span></li>';
      var extras = [];
      $$('input[name="b-add"]:checked', builder).forEach(function (c) {
        total += +c.dataset.price;
        extras.push(c.value);
        html += '<li><span>' + c.value + '</span><span>+' + fmt(+c.dataset.price) + '</span></li>';
      });
      if (reels) {
        total += reels * 150;
        extras.push(reels + ' × Social Media Reel');
        html += '<li><span>' + reels + ' × Social Reel</span><span>+' + fmt(reels * 150) + '</span></li>';
      }
      lines.innerHTML = html;
      totalOut.textContent = fmt(total);
      reelOut.textContent = reels;
      var q = new URLSearchParams({ package: pkg.value });
      if (extras.length) q.set('extras', extras.join(', '));
      cta.href = 'contact.html?' + q.toString();
    };
    builder.addEventListener('change', update);
    $$('[data-step]', builder).forEach(function (b) {
      b.addEventListener('click', function () {
        reels = Math.min(5, Math.max(0, reels + +b.dataset.step));
        update();
      });
    });
    update();
  }

  /* ---------- Enquiry form (3 steps) ---------- */
  var form = $('#enquiry-form');
  if (form) {
    var steps = $$('.form__step', form);
    var bars = $$('.form__progress i', form);
    var back = $('.form__back', form);
    var nextLabel = $('.form__next-label', form);
    var submitBtn = $('button[type="submit"]', form);
    var fine = $('.form__fine', form);
    var current = 0;

    // Prefill from URL (?package=…&extras=…&type=commercial)
    var pkgParam = params.get('package');
    if (pkgParam) {
      var radio = $('input[name="package"][value="' + pkgParam.replace(/"/g, '') + '"]', form);
      if (radio) radio.checked = true;
    }
    var extrasParam = params.get('extras');
    if (extrasParam) {
      $('#f-extras').value = extrasParam;
      var msg = $('#f-msg');
      if (msg && !msg.value) msg.value = 'I\'m interested in adding: ' + extrasParam + '.\n\n';
    }
    if (params.get('type') === 'commercial') {
      $('#f-extras').value = 'Commercial project';
      var h = $('.enquire__aside .h2'); if (h) h.innerHTML = 'Let\'s make <em>something.</em>';
      var s1 = steps[0];
      $('h3', s1).textContent = 'When do you need it?';
      $('label[for="f-date"]', s1).textContent = 'Shoot date (or rough timing)';
      $('label[for="f-venue"]', s1).textContent = 'Brand or company';
      $('#f-venue').placeholder = 'e.g. Untouched World';
      $('#f-date').required = false;
      var pills = $('.field--full', s1); if (pills) pills.style.display = 'none';
      $('h3', steps[1]).textContent = 'Tell me about the project';
      $('label[for="f-partner"]', steps[1]).textContent = 'Your role';
      $('#f-msg').placeholder = 'What are you making, who is it for, and where will it live?';
    }

    // Date input: no past dates
    var dateInput = $('#f-date');
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

    function show(i) {
      steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      bars.forEach(function (b, n) { b.classList.toggle('on', n <= i); });
      back.hidden = i === 0;
      nextLabel.textContent = i === steps.length - 1 ? 'Send enquiry' : 'Next';
      current = i;
    }
    function validate(step) {
      var ok = true;
      $$('input[required], select[required], textarea[required]', step).forEach(function (el) {
        var f = el.closest('.field');
        var valid = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));
        f.classList.toggle('has-error', !valid);
        if (!valid && ok) { el.focus(); ok = false; }
      });
      return ok;
    }
    $$('input, textarea, select', form).forEach(function (el) {
      el.addEventListener('input', function () { var f = el.closest('.field'); if (f) f.classList.remove('has-error'); });
    });
    back.addEventListener('click', function () { show(Math.max(0, current - 1)); });

    function collect() {
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== '_gotcha') data[k] = v; });
      return data;
    }
    function done() {
      steps.forEach(function (s) { s.classList.remove('is-active'); });
      $('.form__progress', form).style.display = 'none';
      $('.form__nav', form).style.display = 'none';
      fine.style.display = 'none';
      $('.form__done', form).hidden = false;
      if (window.gtag) window.gtag('event', 'generate_lead', { method: 'enquiry_form' });
      if (window.fbq) window.fbq('track', 'Lead');
    }
    function mailtoFallback(data) {
      var body = Object.keys(data).filter(function (k) { return data[k]; })
        .map(function (k) { return k.replace(/_/g, ' ') + ': ' + data[k]; }).join('\n');
      var subject = 'Wedding film enquiry' + (data.date ? ' · ' + data.date : '');
      location.href = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(steps[current])) return;
      if (current < steps.length - 1) { show(current + 1); form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); return; }
      if ($('input[name="_gotcha"]', form).value) return;

      var data = collect();
      var endpoint = form.dataset.endpoint;
      if (!endpoint) { mailtoFallback(data); done(); return; }

      submitBtn.disabled = true;
      nextLabel.textContent = 'Sending…';
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('Request failed');
        done();
      }).catch(function () {
        submitBtn.disabled = false;
        nextLabel.textContent = 'Send enquiry';
        fine.innerHTML = 'Something went wrong. Please email <a href="mailto:' + form.dataset.email + '">' + form.dataset.email + '</a> instead.';
        fine.style.color = '#b4483a';
      });
    });
    show(0);
  }
})();
