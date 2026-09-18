# CROWN & BLADE Barber Co. — Website Template

A premium, mobile-optimized, animated multi-page website built for barbershops and men's grooming studios.

## Pages

- `index.html` — Home (3D WebGL barber-pole hero, services preview, stats, testimonials, gallery preview)
- `services.html` — Full service menu with pricing, filters, and FAQ
- `gallery.html` — Filterable portfolio gallery, lightbox, before/after slider
- `about.html` — Shop story, values, team of barbers
- `contact.html` — Booking form, contact info, map

## Stack

Plain HTML/CSS/JS — no build step required. Just open `index.html` or serve the folder statically.

- Three.js (CDN) for the animated 3D spinning barber pole on the homepage
- Font Awesome (CDN) for icons
- Vanilla JS for scroll reveals, tilt cards, filters, lightbox, carousel and the sticky WhatsApp bar

## Customizing

- Colors & fonts: `assets/css/style.css` (`:root` variables at the top)
- Behavior: `assets/js/main.js`
- WhatsApp CTA link: update the `WA_LINK` constant in `assets/js/main.js`
- Images: currently hotlinked from Unsplash — swap `src` attributes for your own shop photography before going live

## Local preview

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
