/* =========================================================
   Dentava Dental Studio — Core Script
   ========================================================= */
(function(){
  "use strict";

  /* ---------- Always start each page at the top ---------- */
  if("scrollRestoration" in history){ history.scrollRestoration = "manual"; }
  if(!window.location.hash){ window.scrollTo(0, 0); }
  window.addEventListener("pageshow", function(){
    if(!window.location.hash){ window.scrollTo(0, 0); }
  });

  document.addEventListener("DOMContentLoaded", function(){

    /* ---------- AOS init ---------- */
    if(window.AOS){ AOS.init({ duration:750, easing:"ease-out-cubic", once:true, offset:60 }); }

    /* ---------- Navbar scroll state ---------- */
    var navbar = document.querySelector(".navbar");
    var onScroll = function(){
      if(!navbar) return;
      if(window.scrollY > 12){ navbar.classList.add("scrolled"); }
      else{ navbar.classList.remove("scrolled"); }
    };
    document.addEventListener("scroll", onScroll, { passive:true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    var hamburger = document.querySelector(".hamburger");
    var navLinks = document.querySelector(".nav-links");
    var navClose = document.querySelector(".nav-close");
    var navBackdrop = document.querySelector(".nav-backdrop");
    if(hamburger && navLinks){
      var openMenu = function(){
        hamburger.classList.add("open");
        navLinks.classList.add("mobile-open");
        if(navBackdrop) navBackdrop.classList.add("show");
        document.body.style.overflow = "hidden";
      };
      var closeMenu = function(){
        hamburger.classList.remove("open");
        navLinks.classList.remove("mobile-open");
        if(navBackdrop) navBackdrop.classList.remove("show");
        document.body.style.overflow = "";
      };
      hamburger.addEventListener("click", function(){
        if(navLinks.classList.contains("mobile-open")){ closeMenu(); }
        else{ openMenu(); }
      });
      if(navClose) navClose.addEventListener("click", closeMenu);
      if(navBackdrop) navBackdrop.addEventListener("click", closeMenu);
      navLinks.querySelectorAll("a").forEach(function(a){
        a.addEventListener("click", closeMenu);
      });
      document.addEventListener("keydown", function(e){
        if(e.key === "Escape") closeMenu();
      });
    }

    /* ---------- Announcement bar dismiss ---------- */
    var announce = document.querySelector(".announce");
    var closeAnnounce = document.querySelector(".close-announce");
    if(announce && closeAnnounce){
      if(sessionStorage.getItem("dentava_announce_closed") === "1"){ announce.style.display = "none"; }
      closeAnnounce.addEventListener("click", function(){
        announce.style.display = "none";
        try{ sessionStorage.setItem("dentava_announce_closed","1"); }catch(e){}
      });
    }

    /* ---------- Sticky upsell CTA bar ---------- */
    var stickyCta = document.querySelector(".sticky-cta");
    var stickyClose = document.querySelector(".sticky-cta-close");
    if(stickyCta){
      if(sessionStorage.getItem("dentava_sticky_closed") === "1"){
        stickyCta.classList.add("hide");
      }
      if(stickyClose){
        stickyClose.addEventListener("click", function(){
          stickyCta.classList.add("hide");
          try{ sessionStorage.setItem("dentava_sticky_closed","1"); }catch(e){}
        });
      }
    }

    /* ---------- Back to top ---------- */
    var backToTop = document.querySelector(".back-to-top");
    if(backToTop){
      document.addEventListener("scroll", function(){
        if(window.scrollY > 600){ backToTop.classList.add("show"); }
        else{ backToTop.classList.remove("show"); }
      }, { passive:true });
      backToTop.addEventListener("click", function(){
        window.scrollTo({ top:0, behavior:"smooth" });
      });
    }

    /* ---------- Animated counters ---------- */
    var counters = document.querySelectorAll("[data-count]");
    if(counters.length){
      var animateCounter = function(el){
        var target = parseFloat(el.getAttribute("data-count"));
        var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
        var duration = 1800;
        var start = null;
        var step = function(ts){
          if(!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var value = target * eased;
          el.textContent = value.toFixed(decimals);
          if(progress < 1){ requestAnimationFrame(step); }
          else{ el.textContent = target.toFixed(decimals); }
        };
        requestAnimationFrame(step);
      };
      var counterObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold:0.4 });
      counters.forEach(function(c){ counterObserver.observe(c); });
    }

    /* ---------- Rating bar fill animation ---------- */
    var ratingBars = document.querySelectorAll(".rs-bar-fill");
    if(ratingBars.length){
      var barObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            entry.target.style.width = entry.target.getAttribute("data-width");
            barObserver.unobserve(entry.target);
          }
        });
      }, { threshold:0.3 });
      ratingBars.forEach(function(b){ barObserver.observe(b); });
    }

    /* ---------- FAQ Accordion ---------- */
    document.querySelectorAll(".acc-item").forEach(function(item){
      var head = item.querySelector(".acc-head");
      var body = item.querySelector(".acc-body");
      if(!head || !body) return;
      head.addEventListener("click", function(){
        var isOpen = item.classList.contains("open");
        item.closest(".accordion").querySelectorAll(".acc-item").forEach(function(other){
          other.classList.remove("open");
          other.querySelector(".acc-body").style.maxHeight = null;
        });
        if(!isOpen){
          item.classList.add("open");
          body.style.maxHeight = body.scrollHeight + "px";
        }
      });
    });

    /* ---------- Gallery filter ---------- */
    var filterBtns = document.querySelectorAll(".filter-btn");
    var galleryItems = document.querySelectorAll("[data-cat]");
    if(filterBtns.length && galleryItems.length){
      filterBtns.forEach(function(btn){
        btn.addEventListener("click", function(){
          filterBtns.forEach(function(b){ b.classList.remove("active"); });
          btn.classList.add("active");
          var filter = btn.getAttribute("data-filter");
          galleryItems.forEach(function(item){
            var cats = item.getAttribute("data-cat");
            if(filter === "all" || cats.indexOf(filter) !== -1){
              item.style.display = "";
              item.style.animation = "popIn .5s ease";
            } else {
              item.style.display = "none";
            }
          });
        });
      });
    }

    /* ---------- Lightbox ---------- */
    var lightbox = document.querySelector(".lightbox");
    if(lightbox){
      var lbImg = lightbox.querySelector("img");
      var lbClose = lightbox.querySelector(".lightbox-close");
      var lbPrev = lightbox.querySelector(".lightbox-nav.prev");
      var lbNext = lightbox.querySelector(".lightbox-nav.next");
      var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
      var current = 0;

      var openLightbox = function(index){
        current = index;
        var src = triggers[current].getAttribute("data-lightbox");
        lbImg.setAttribute("src", src);
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
      };
      var closeLightbox = function(){
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
      };
      triggers.forEach(function(t, i){
        t.addEventListener("click", function(){ openLightbox(i); });
      });
      if(lbClose) lbClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function(e){ if(e.target === lightbox) closeLightbox(); });
      if(lbPrev) lbPrev.addEventListener("click", function(){ openLightbox((current - 1 + triggers.length) % triggers.length); });
      if(lbNext) lbNext.addEventListener("click", function(){ openLightbox((current + 1) % triggers.length); });
      document.addEventListener("keydown", function(e){
        if(!lightbox.classList.contains("open")) return;
        if(e.key === "Escape") closeLightbox();
        if(e.key === "ArrowLeft" && lbPrev) lbPrev.click();
        if(e.key === "ArrowRight" && lbNext) lbNext.click();
      });
    }

    /* ---------- Testimonials Swiper ---------- */
    if(window.Swiper && document.querySelector(".testimonial-swiper")){
      new Swiper(".testimonial-swiper", {
        loop:true,
        spaceBetween:26,
        autoplay:{ delay:4200, disableOnInteraction:false },
        pagination:{ el:".swiper-pagination", clickable:true },
        navigation:{ nextEl:".swiper-button-next", prevEl:".swiper-button-prev" },
        breakpoints:{
          0:{ slidesPerView:1 },
          768:{ slidesPerView:2 },
          1080:{ slidesPerView:3 }
        }
      });
    }
    if(window.Swiper && document.querySelector(".gallery-swiper")){
      new Swiper(".gallery-swiper", {
        loop:true,
        spaceBetween:20,
        autoplay:{ delay:2800, disableOnInteraction:false },
        breakpoints:{
          0:{ slidesPerView:2 },
          640:{ slidesPerView:3 },
          1080:{ slidesPerView:5 }
        }
      });
    }

    /* ---------- Booking form (front-end demo submit) ---------- */
    var bookingForm = document.querySelector("#booking-form");
    if(bookingForm){
      bookingForm.addEventListener("submit", function(e){
        e.preventDefault();
        var btn = bookingForm.querySelector("button[type=submit]");
        var originalText = btn.innerHTML;
        btn.innerHTML = "Sending&hellip;";
        btn.disabled = true;
        setTimeout(function(){
          bookingForm.style.display = "none";
          var success = document.querySelector("#form-success");
          if(success) success.classList.add("show");
          btn.innerHTML = originalText;
          btn.disabled = false;
        }, 1100);
      });
    }

    /* ---------- Newsletter mock ---------- */
    var newsletterForm = document.querySelector(".newsletter");
    if(newsletterForm){
      newsletterForm.addEventListener("submit", function(e){
        e.preventDefault();
        showToast("Thanks! You are subscribed. 🦷");
        newsletterForm.reset();
      });
    }

    function showToast(msg){
      var toast = document.querySelector(".toast");
      if(!toast) return;
      toast.textContent = msg;
      toast.classList.add("show");
      setTimeout(function(){ toast.classList.remove("show"); }, 2800);
    }

    /* ---------- Active nav link ---------- */
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function(a){
      var href = a.getAttribute("href");
      if(href === path){ a.classList.add("active"); }
    });

  });
})();
