# Torvane Manufacturing — marketing site

A static, dependency-free landing page for **Torvane**, a fictional precision contract manufacturer (CNC, sheet metal, injection molding, additive, assembly).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

- `index.html` — page markup (hero, certifications, capabilities, process, comparison, case studies, quote form, FAQ)
- `styles.css` — design tokens and all styles (responsive down to 360px, respects reduced motion)
- `script.js` — scroll reveals, stat counters, mobile menu, multi-step quote form
- `assets/` — logo mark, wordmark and favicon (SVG)

## Before going live

- Hook the quote form up to your CRM or form backend (see the `TODO` in `script.js`).
- Replace the placeholder phone, email, address, stats, case studies and testimonials with real ones.
