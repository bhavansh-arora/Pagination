# VELMORA — Furniture, Reimagined

A premium, mobile-optimized, animated marketing website for a furniture brand. Plain HTML/CSS/JS — no build step, no dependencies to install. Deploy by uploading the files to any static host (Netlify, Vercel, GitHub Pages, S3, etc.).

## Pages

- `index.html` — Home: 3D interactive hero (Three.js), USPs, bestsellers, brand story, stats, testimonials, gallery, newsletter
- `shop.html` — Filterable product catalog
- `about.html` — Brand story, timeline, values, team
- `contact.html` — Contact form, info cards, map, FAQ accordion

## Structure

```
css/style.css      shared design system + all page styles
js/main.js         shared interactions (nav, reveal animations, counters, tilt cards, accordion, filters, sticky CTA)
js/three-hero.js    3D rotating armchair hero scene (Three.js, loaded as an ES module)
```

## Notes

- Fonts load from Google Fonts, the 3D hero from a CDN-hosted Three.js build, and product imagery from Unsplash — all over HTTPS. For a fully offline/self-hosted build, download and vendor these locally.
- A dismissible sticky bottom bar links to WhatsApp for lead capture; update the phone number/message in the `.sticky-cta-btn` href across all four pages to reuse this template for another business.
