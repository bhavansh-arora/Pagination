# Mark Arista Films: website

A multi-page static site for Hawaii wedding videographer Mark Arista, built by Code Bunny.

The look is golden-hour cinema: a dark volcanic background, warm sand and a sunset-orange accent, with expanded Archivo headlines and Instrument Serif italics. It's image-led throughout: 132 real stills from Mark's 33 public YouTube films, plus a muted background reel of his footage on the home page and on every film page.

## Pages

| Page | File | Highlights |
| --- | --- | --- |
| Home | `index.html` | Background film reel, proof bar, film-strip marquee, pinned sideways reel of 8 films, family mosaic, venue index with live preview, review carousel, 4-step process, date check |
| Films (33) | `films.html` | Moving film wall, filter by island and by venue (`?venue=paliku`), scrub-preview cards |
| Film pages ×33 | `films/<slug>.html` | Background reel, 4-frame bento, details, inline player, "I want a film like this", more from the same venue, next film |
| About | `about.html` | Portraits, stats, story, three beliefs, venue index, reviews |
| Experience | `experience.html` | 6-step process, traditions, collections, FAQ, reviews |
| Contact | `contact.html` | 3-step inquiry (prefills the date and film from links), HoneyBook fallback |
| 404 | `404.html` | |

**Scrub cards:** move the mouse across any film card to flip through 4 frames from that film. On phones, cards flip on their own as they reach the middle of the screen.

## Editing content

All content lives in `src/`, and the HTML is generated from it. Don't hand-edit the root `.html` files.

- `src/data.mjs`: films, venues, featured films, reviews and site details.
- `src/pages.mjs`: page templates and copy.
- `src/layout.mjs`: shared head, header, footer, film card, film strip and CTA.

**Add a film:** add one line to `films` in `src/data.mjs`, then:

```bash
python3 tools/frames.py assets/img/f YOUTUBE_ID
```

```bash
node src/build.mjs
```

The first command needs Pillow (`pip install pillow`). The build needs Node 18+ and has no dependencies.

## Inquiry form

`assets/js/config.js`:

- `formEndpoint`: paste a Formspree, Basin or Zapier webhook URL to post inquiries directly. While it's empty, submitting opens a pre-written email to `email`.
- `honeybookPid`: Mark's existing HoneyBook placement, loaded only when someone opens it.

`contact.html?film=<slug>&date=YYYY-MM-DD` prefills the form.

## Tech

- Plain HTML, CSS and JS. GSAP, ScrollTrigger and Lenis are vendored in `assets/vendor/`.
- Pages render without JS. Motion respects `prefers-reduced-motion`. The background reel is skipped on Save-Data or 2G connections, and pauses when off screen.
- Stills are WebP at 1280w and 640w with `srcset`, lazy-loaded. The full film player loads only on click (`youtube-nocookie`).
- SEO: per-page meta and OG tags; JSON-LD for ProfessionalService with AggregateRating, VideoObject on each film page, and FAQPage; `sitemap.xml` and `robots.txt`.

## Preview locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Deploy

Any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages). Point it at the repo root. There's no build step on the host.
