/* CROWN & BLADE Barber Co. — site behaviour */
(function(){
  "use strict";

  const WA_LINK = "https://api.whatsapp.com/send/?phone=917017905835&text=Hi%2C+I%E2%80%99d+like+to+get+this+website+for+my+business.%0A%0AWebsite+Code%3A+LM-7319&utm_source=chatgpt.com";
  document.querySelectorAll('[data-wa-link]').forEach(el=>{ el.href = WA_LINK; });

  /* ---------- Preloader ---------- */
  window.addEventListener('load',()=>{
    const pl = document.getElementById('preloader');
    if(pl){ setTimeout(()=>pl.classList.add('done'), 500); }
  });

  /* ---------- Nav scroll state ---------- */
  const nav = document.querySelector('.nav');
  const toTop = document.querySelector('.to-top');
  const onScroll = ()=>{
    const y = window.scrollY;
    if(nav) nav.classList.toggle('scrolled', y > 40);
    if(toTop) toTop.classList.toggle('show', y > 700);
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if(toTop) toTop.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if(burger && mobileMenu){
    burger.addEventListener('click', ()=>{
      burger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },{threshold:0.15, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el=>io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add('in'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if(counters.length){
    const animateCount = (el)=>{
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600, start = performance.now();
      const step = (now)=>{
        const p = Math.min((now-start)/dur, 1);
        const eased = 1 - Math.pow(1-p, 3);
        const val = target < 10 ? (target*eased).toFixed(1) : Math.floor(target*eased);
        el.textContent = val + suffix;
        if(p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ animateCount(entry.target); cio.unobserve(entry.target); }
      });
    },{threshold:0.6});
    counters.forEach(el=>cio.observe(el));
  }

  /* ---------- Tilt cards (desktop only) ---------- */
  const isTouch = matchMedia('(hover:none)').matches;
  if(!isTouch){
    document.querySelectorAll('.tilt-card').forEach(card=>{
      const inner = card.querySelector('.service-card, .team-photo, .testi-card') || card;
      card.addEventListener('mousemove', (e)=>{
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left)/r.width - 0.5;
        const y = (e.clientY - r.top)/r.height - 0.5;
        inner.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(0)`;
      });
      card.addEventListener('mouseleave', ()=>{ inner.style.transform = 'rotateY(0) rotateX(0)'; });
    });
  }

  /* ---------- Filters (services / gallery) ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if(filterBtns.length){
    filterBtns.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        filterBtns.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        document.querySelectorAll('[data-cat]').forEach(item=>{
          const show = cat === 'all' || item.dataset.cat === cat;
          item.style.display = show ? '' : 'none';
          if(show){ item.style.animation = 'none'; requestAnimationFrame(()=>{ item.style.animation = ''; }); }
        });
      });
    });
  }

  /* ---------- Lightbox gallery ---------- */
  const lightbox = document.querySelector('.lightbox');
  if(lightbox){
    const lbImg = lightbox.querySelector('img');
    const items = Array.from(document.querySelectorAll('.gallery-item[data-full]'));
    let idx = 0;
    const open = (i)=>{
      idx = i;
      lbImg.src = items[idx].dataset.full;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = ()=>{ lightbox.classList.remove('open'); document.body.style.overflow=''; };
    items.forEach((item,i)=> item.addEventListener('click', ()=>open(i)) );
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', close);
    lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });
    lightbox.querySelector('.lightbox-prev')?.addEventListener('click', ()=>open((idx-1+items.length)%items.length));
    lightbox.querySelector('.lightbox-next')?.addEventListener('click', ()=>open((idx+1)%items.length));
    document.addEventListener('keydown', (e)=>{
      if(!lightbox.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') open((idx-1+items.length)%items.length);
      if(e.key === 'ArrowRight') open((idx+1)%items.length);
    });
  }

  /* ---------- Testimonial carousel ---------- */
  const track = document.querySelector('.testi-track');
  if(track){
    const cards = track.children;
    let pos = 0;
    const step = ()=> cards[0].getBoundingClientRect().width + 28;
    const update = ()=>{ track.style.transform = `translateX(-${pos*step()}px)`; };
    document.querySelector('.testi-next')?.addEventListener('click', ()=>{
      pos = (pos + 1) % cards.length; update();
    });
    document.querySelector('.testi-prev')?.addEventListener('click', ()=>{
      pos = (pos - 1 + cards.length) % cards.length; update();
    });
    window.addEventListener('resize', update);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q?.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(other=>{
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Before/After compare slider ---------- */
  document.querySelectorAll('.compare').forEach(comp=>{
    const after = comp.querySelector('.after-img');
    const handle = comp.querySelector('.compare-handle');
    let dragging = false;
    const setPos = (clientX)=>{
      const r = comp.getBoundingClientRect();
      let pct = ((clientX - r.left)/r.width)*100;
      pct = Math.max(0, Math.min(100, pct));
      after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + '%';
    };
    const start = (e)=>{ dragging = true; };
    const move = (e)=>{ if(!dragging) return; const x = e.touches ? e.touches[0].clientX : e.clientX; setPos(x); };
    const end = ()=>{ dragging = false; };
    handle?.addEventListener('mousedown', start);
    handle?.addEventListener('touchstart', start, {passive:true});
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, {passive:true});
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  });

  /* ---------- Contact form (static demo) ---------- */
  const contactForm = document.querySelector('#contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = 'Sending…';
      setTimeout(()=>{
        btn.innerHTML = 'Message Sent ✓';
        contactForm.reset();
        setTimeout(()=>{ btn.innerHTML = original; }, 2600);
      }, 900);
    });
  }

  /* ---------- Broken image graceful fallback ---------- */
  document.addEventListener('error', (e)=>{
    const t = e.target;
    if(t && t.tagName === 'IMG'){
      const holder = t.closest('.img-wrap,.gallery-item,.team-photo,.testi-person,.compare,.floating-badge,.brand-logo-img');
      if(holder) holder.classList.add('img-broken');
      t.style.opacity = '0';
    }
  }, true);

  /* ---------- Current year ---------- */
  document.querySelectorAll('[data-year]').forEach(el=> el.textContent = new Date().getFullYear());

})();
