# Code Bunny — Portfolio & Site Marketplace

A mobile-optimized, animated portfolio website for **Bhavansh Arora / Code Bunny**: a dark, glassmorphic, gradient-driven design with a particle-canvas hero, 3D tilt cards, scroll reveals, animated stat counters, and a testimonial carousel — plus a marketplace of Code Bunny products for sale.

## Pages

- `index.html` — Home: hero, services, featured listings, stats, testimonials, CTA
- `about.html` — About Bhavansh Arora, capabilities, and the Code Bunny timeline
- `marketplace.html` — Full "Sites for Sale" listings (CustomBotify, Beauty)
- `contact.html` — Contact form + FAQ

Shared assets live in `assets/css/style.css` and `assets/js/main.js`. No build step or dependencies — just static HTML/CSS/JS (Google Fonts loaded via CDN).

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.

## Before going live — things to edit

Search for `EDIT ME` comments at the top of each HTML file:

- **about.html** — swap the placeholder bio/timeline for your real story, dates and history.
- **marketplace.html** — replace placeholder prices/terms with your real numbers.
- **contact.html** — the form is front-end only; wire it to a real backend or a service like Formspree, and update the placeholder email address.
