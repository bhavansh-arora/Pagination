/* Meridian Care Clinic — site script */
(function(){
  "use strict";

  /* Always land at the top of a freshly loaded page instead of wherever
     the browser last scrolled to on a previous page. */
  if("scrollRestoration" in history){ history.scrollRestoration = "manual"; }
  if(!window.location.hash){ window.scrollTo(0, 0); }
  window.addEventListener("pageshow", function(){
    if(!window.location.hash){ window.scrollTo(0, 0); }
  });

  document.addEventListener("DOMContentLoaded", function(){
    if(!window.location.hash){ window.scrollTo(0, 0); }
    initHeader();
    initMobileMenu();
    initSellBar();
    initBackToTop();
    initReveal();
    initCounters();
    initFAQ();
    initTestimonialSlider();
    initDoctorModal();
    initForms();
    initYear();
    if(window.AOS){ AOS.init({ duration:700, once:true, offset:60, easing:"ease-out-cubic" }); }
  });

  /* Header shadow + shrink on scroll */
  function initHeader(){
    var header = document.querySelector(".site-header");
    if(!header) return;
    function onScroll(){
      header.classList.toggle("scrolled", window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });
  }

  /* Mobile nav drawer */
  function initMobileMenu(){
    var burger = document.querySelector(".burger");
    var menu = document.querySelector(".mobile-menu");
    var closeBtn = document.querySelector(".mclose");
    if(!burger || !menu) return;
    function open(){ menu.classList.add("open"); burger.classList.add("open"); document.body.style.overflow="hidden"; }
    function close(){ menu.classList.remove("open"); burger.classList.remove("open"); document.body.style.overflow=""; }
    burger.addEventListener("click", function(){
      menu.classList.contains("open") ? close() : open();
    });
    if(closeBtn) closeBtn.addEventListener("click", close);
    menu.addEventListener("click", function(e){ if(e.target === menu) close(); });
    menu.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", close); });
  }

  /* Sticky "make it yours" sell bar */
  function initSellBar(){
    var bar = document.getElementById("sellBar");
    if(!bar) return;
    setTimeout(function(){ bar.classList.add("show"); }, 900);
  }

  /* Back to top button */
  function initBackToTop(){
    var btn = document.getElementById("backToTop");
    if(!btn) return;
    window.addEventListener("scroll", function(){
      btn.classList.toggle("show", window.scrollY > 560);
    }, { passive:true });
    btn.addEventListener("click", function(){
      window.scrollTo({ top:0, behavior:"smooth" });
    });
  }

  /* Scroll reveal fallback (data-reveal attr) */
  function initReveal(){
    var els = document.querySelectorAll("[data-reveal]");
    if(!els.length) return;
    if(!("IntersectionObserver" in window)){
      els.forEach(function(el){ el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0, rootMargin:"0px 0px -10px 0px" });
    els.forEach(function(el){ io.observe(el); });
  }

  /* Animated stat counters */
  function initCounters(){
    var counters = document.querySelectorAll("[data-count]");
    if(!counters.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold:0.4 });
    counters.forEach(function(c){ io.observe(c); });

    function animateCount(el){
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      var duration = 1800;
      var start = null;
      function step(ts){
        if(!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = target * eased;
        el.textContent = decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString();
        if(progress < 1) requestAnimationFrame(step);
        else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
      }
      requestAnimationFrame(step);
    }
  }

  /* FAQ accordion */
  function initFAQ(){
    var items = document.querySelectorAll(".faq-item");
    if(!items.length) return;
    items.forEach(function(item){
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      q.addEventListener("click", function(){
        var isOpen = item.classList.contains("open");
        items.forEach(function(other){
          other.classList.remove("open");
          other.querySelector(".faq-a").style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      });
    });
  }

  /* Testimonial slider */
  function initTestimonialSlider(){
    var track = document.getElementById("testiTrack");
    if(!track) return;
    var cards = track.children.length;
    var perView = window.innerWidth >= 860 ? 3 : 1;
    var index = 0;
    var dotsWrap = document.getElementById("testiDots");
    var maxIndex = Math.max(0, cards - perView);

    function buildDots(){
      if(!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for(var i=0;i<=maxIndex;i++){
        var d = document.createElement("span");
        if(i===0) d.classList.add("active");
        d.addEventListener("click", function(idx){ return function(){ goTo(idx); }; }(i));
        dotsWrap.appendChild(d);
      }
    }
    function update(){
      perView = window.innerWidth >= 860 ? 3 : 1;
      maxIndex = Math.max(0, cards - perView);
      if(index > maxIndex) index = maxIndex;
      var pct = (100/perView) * index;
      track.style.transform = "translateX(-" + pct + "%)";
      if(dotsWrap){
        Array.prototype.forEach.call(dotsWrap.children, function(d,i){ d.classList.toggle("active", i===index); });
      }
    }
    function goTo(i){ index = Math.max(0, Math.min(maxIndex, i)); update(); }

    var prev = document.getElementById("testiPrev");
    var next = document.getElementById("testiNext");
    if(prev) prev.addEventListener("click", function(){ goTo(index-1 < 0 ? maxIndex : index-1); });
    if(next) next.addEventListener("click", function(){ goTo(index+1 > maxIndex ? 0 : index+1); });

    buildDots();
    update();
    window.addEventListener("resize", function(){ buildDots(); update(); });

    var auto = setInterval(function(){
      goTo(index+1 > maxIndex ? 0 : index+1);
    }, 5200);
    track.closest(".testi-track-wrap").addEventListener("mouseenter", function(){ clearInterval(auto); });
  }

  /* Doctor bio modal */
  function initDoctorModal(){
    var overlay = document.getElementById("doctorModal");
    if(!overlay) return;
    var cards = document.querySelectorAll("[data-doctor]");
    var closeBtn = overlay.querySelector(".modal-close");

    cards.forEach(function(card){
      card.addEventListener("click", function(){
        overlay.querySelector(".modal-head-img").src = card.getAttribute("data-img");
        overlay.querySelector("[data-m-name]").textContent = card.getAttribute("data-name");
        overlay.querySelector("[data-m-role]").textContent = card.getAttribute("data-role");
        overlay.querySelector("[data-m-bio]").textContent = card.getAttribute("data-bio");
        var tagsWrap = overlay.querySelector("[data-m-tags]");
        tagsWrap.innerHTML = "";
        (card.getAttribute("data-tags") || "").split(",").forEach(function(t){
          if(!t.trim()) return;
          var span = document.createElement("span");
          span.className = "pill";
          span.textContent = t.trim();
          tagsWrap.appendChild(span);
        });
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    function close(){ overlay.classList.remove("open"); document.body.style.overflow=""; }
    if(closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function(e){ if(e.target === overlay) close(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
  }

  /* Forms: front-end validation + success toast (no backend) */
  function initForms(){
    var forms = document.querySelectorAll("[data-demo-form]");
    forms.forEach(function(form){
      form.addEventListener("submit", function(e){
        e.preventDefault();
        if(!form.checkValidity()){
          form.reportValidity();
          return;
        }
        var successEl = form.querySelector(".form-success");
        var btn = form.querySelector("button[type=submit]");
        if(btn){ btn.disabled = true; btn.dataset.label = btn.dataset.label || btn.textContent; btn.textContent = "Sending..."; }
        setTimeout(function(){
          if(successEl) successEl.classList.add("show");
          if(btn){ btn.disabled = false; btn.textContent = btn.dataset.label; }
          form.reset();
          showToast("Request received! Our care team will contact you shortly.");
        }, 900);
      });
    });
  }

  function showToast(message){
    var toast = document.getElementById("toast");
    if(!toast) return;
    toast.querySelector("[data-toast-text]").textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function(){ toast.classList.remove("show"); }, 4200);
  }

  function initYear(){
    var el = document.getElementById("year");
    if(el) el.textContent = new Date().getFullYear();
  }
})();
