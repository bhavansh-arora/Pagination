# Aurelia — Luxury Event Management Website (Code EM-7319)

A premium, mobile-first, multi-page website template for event management companies.

**Pages:** `index.html` (Home) · `services.html` · `portfolio.html` · `about.html` · `contact.html`

## Highlights
- Interactive WebGL 3D galaxy hero (three.js) that responds to mouse, device tilt and scroll
- Floating 3D image stack, 3D tilt service cards with glare, drag-to-spin 3D carousel, 3D flip team cards
- Scroll-triggered reveals, split-word headline animations, animated counters, marquees, progress bar
- Conversion features: instant budget estimator, urgency meter, testimonials slider, pricing packages, FAQ, multiple CTAs
- Filterable masonry portfolio with lightbox, plus case studies with results
- Sticky "Love this site? Make it yours." bar with a WhatsApp button
- Fully responsive with a full-screen mobile menu; respects `prefers-reduced-motion`
- Pure HTML/CSS/JS. No build step. Works on any static host (Netlify, Vercel, GitHub Pages, cPanel)

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Customize
| What | Where |
| --- | --- |
| Colours & fonts | `:root` variables at the top of `assets/css/style.css` |
| Brand name, copy, contact info | Each `.html` file (header/footer are repeated per page) |
| Images | Unsplash URLs in the HTML; swap for your own photos |
| Estimator pricing | `tiers` and the `data-v` values in `assets/js/main.js` / `index.html` |
| Forms | `form[data-demo]` shows a success state only. Point the form `action` at Formspree, Netlify Forms or your backend |
| 3D hero | `assets/js/hero3d.js` (particle count, colours, rings) |
