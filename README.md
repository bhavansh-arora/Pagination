# ASB Media Group — Website

A multi-page portfolio site for ASB Media Group, a commercial video and photography studio in Tampa Bay. It is static HTML, CSS and JS, with no framework and no backend.

## Pages

| Page | File |
| --- | --- |
| Home: hero film, selected-films reel, services, Film Finder, process, industries, CTA | `index.html` |
| Work: filterable film index | `work.html` |
| Case studies (×4) | `film-mary-lees-house.html`, `film-fun-bike-center.html`, `film-teco-energy-audit.html`, `film-the-dance-room.html` |
| Services and packages | `services.html` |
| Weddings | `weddings.html` |
| Stills: sports, product and wedding gallery with lightbox | `photography.html` |
| Studio / About | `about.html` |
| Contact: 4-step Brief Builder plus FAQ | `contact.html` |
| 404 | `404.html` |

## Editing

Pages are generated. **Edit the files in `src/`, then rebuild:**

```bash
python3 build.py
```

- `src/partials/`: shared head, header, menu, footer and preloader
- `src/pages/`: the body of each page. The first line is a JSON meta comment with title, description and nav.
- `src/cases.py`: all four case studies come from one data list and one template. To add a film, add an entry here.
- `assets/css/styles.css`: the design system (tokens are at the top)
- `assets/js/main.js`: interactions (GSAP, ScrollTrigger and Lenis are vendored in `assets/vendor/`)

## Preview locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Before launch

- **Form delivery.** By default the Brief Builder opens the visitor's email app with the brief pre-filled. To receive submissions directly, add `data-endpoint="https://formspree.io/f/XXXX"` to the `<form data-brief>` in `src/pages/contact.html`.
- **Vimeo embeds.** The films use ASB's existing Vimeo IDs. If the Vimeo privacy settings restrict embedding by domain, add the new domain in Vimeo.
- **Confirm with the client:** the package names and inclusions (`services.html`), the timeline wording in the FAQ ("3–6 weeks"), the "free 20-minute discovery call" and "fixed price" promises, the founder portrait (it currently uses a film still), and any client testimonials.
