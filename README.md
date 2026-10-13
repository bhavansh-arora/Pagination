# Velora: Event Atelier

A conversion-focused landing site for a premium event management brand.
It is static HTML, CSS and JS with no build step: open `index.html` or serve the folder.

```
npx serve .   # or: python3 -m http.server
```

## Structure
- `index.html`: all page sections
- `assets/css/styles.css`: design system (tokens, components, responsive)
- `assets/js/main.js`: nav, reveal animations, counters, portfolio filter, testimonial slider, multi-step lead form
- `assets/img/logo.svg`, `assets/img/logo-mark.svg`, `favicon.svg`: brand logo

## Wiring up leads
The lead form currently logs submissions to the console. Replace the `TODO` in `assets/js/main.js`
(form `submit` handler) with a POST to your CRM or form service (HubSpot, Formspree, your own API, etc.).

Photos load from Unsplash and the avatars from pravatar.cc. Swap in real event photography before launch.
The testimonials, client names, stats and phone number are placeholders.
