# Mark Arista Films: website

A multi-page static site for Hawaii wedding videographer Mark Arista, built by Code Bunny.

The visual direction is golden-hour cinema: a volcanic-ink background, warm sand and a sunset-ember accent. The type pairs expanded Archivo with Instrument Serif italics. Film motifs run through the site: timecode, REC, viewfinder brackets and a "Sc. 01" scene numbering.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Films (filter by island, grid/index view) | `films.html` |
| Film pages ×6 (generated) | `films/<slug>.html` |
| The Experience (process, traditions, FAQ) | `experience.html` |
| Contact (3-step inquiry + HoneyBook fallback) | `contact.html` |
| 404 | `404.html` |

## Editing content

All content lives in `src/` and the HTML is generated from it. Don't hand-edit the root `.html` files.

- `src/data.mjs`: site details and the **films list**. Add a film here and its page, card, filter count, contact-form option and sitemap entry are all created.
- `src/pages.mjs`: page templates and copy.
- `src/layout.mjs`: shared head, header, footer and CTA.

Rebuild after any change (needs Node 18+, no dependencies):

```bash
node src/build.mjs
```

Film stills live in `assets/img/films/<youtube-id>.jpg`. These are the YouTube thumbnails with letterbox bars cropped off.

## Inquiry form

`assets/js/config.js`:

- `formEndpoint`: paste a Formspree, Basin or Zapier webhook URL to post inquiries directly. While it's empty, submitting the form opens a pre-written email to `email`.
- `honeybookPid`: Mark's existing HoneyBook placement. It loads lazily under "Prefer the classic booking form?".

`contact.html?film=<slug>` preselects that film. Every film page links to it through the "I want a film like this" button.

## Tech

- Plain HTML, CSS and JS. GSAP, ScrollTrigger and Lenis are vendored in `assets/vendor/`.
- Content renders without JS. Motion is layered on top and respects `prefers-reduced-motion`.
- YouTube loads only on click (lightbox or inline facade, via `youtube-nocookie`).
- SEO: per-page meta and OG tags, plus JSON-LD (ProfessionalService, VideoObject on each film page, FAQPage). Includes `sitemap.xml` and `robots.txt`.

## Preview locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Deploy

Any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages). Point it at the repo root. There's no build step on the host, because the built HTML is committed.
