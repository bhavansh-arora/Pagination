# Dan Reynolds — Visual Storyteller

A hand-built, multi-page website for **Dan Reynolds Photography**, a husband-and-wife wedding photography and film studio (Dan & Lydia Reynolds) serving Chicago, Central Illinois, Milwaukee and Madison.

The copy, packages, FAQs, testimonials, photos and films all come from danreynoldsphotography.com and the studio's YouTube channel.

## Pages

| Page | File | Highlights |
| --- | --- | --- |
| Home | `index.html` | Full-bleed hero, signature quote, intro, photo/film split, love stories, featured film, testimonial slider, stats, Instagram strip |
| About | `about.html` | Team cards, the "My story began with Kodak" chapters, favourite venues, testimonial |
| Portfolio | `portfolio.html` | Filterable masonry gallery (38 images) with a swipeable, keyboard-accessible lightbox, plus links to client galleries |
| Films | `films.html` | Featured film, 16 wedding films, commercial work. YouTube players load only when clicked (privacy-enhanced embeds) |
| Investment | `investment.html` | Philosophy, Photo & Video packages from $3,500, combo callout, 3-step process, animated FAQ (with FAQ schema) |
| Contact | `contact.html` | Inquiry form with validation and a success state |
| 404 | `404.html` | Branded not-found page |

## Built for mobile first

- Fluid type and spacing scale (`clamp()`), a 16px minimum gutter, and no horizontal scroll at 320–1920px+.
- Full-screen animated mobile menu, a sticky "Check your date" bar on phones, swipeable carousels and touch-sized targets (44px or larger).
- Responsive WebP images (800w / 1600w `srcset`) with explicit dimensions and colour placeholders, so there is no layout shift. Everything below the fold is lazy-loaded.
- No frameworks or build step at runtime: one CSS file and one dependency-free JS file. Animations respect `prefers-reduced-motion`.
- SEO: unique titles and descriptions, canonical URLs, Open Graph/Twitter cards (1200×630 JPGs), `ProfessionalService` + `FAQPage` JSON-LD, `sitemap.xml`, `robots.txt`.

## Before going live

1. **Inquiry form:** create a free form at [formspree.io](https://formspree.io) and replace `YOUR_FORM_ID` in `tools/build.py` (contact page), then rebuild. Until then the form runs in demo mode: it validates and shows the thank-you state, but nothing is sent.
2. **Email / phone:** the original site doesn't publish them. Add them to the `info-list` on the contact page if wanted.
3. **Domain:** `SITE_URL` in `tools/build.py` controls canonical, OG and sitemap URLs.

## Editing

All pages are generated from `tools/build.py` (shared header, footer, image helper and content lists such as `PORTFOLIO`, `WEDDING_FILMS`, `FAQS` and `TESTIMONIALS`):

```bash
python3 tools/build.py      # regenerates every .html page
python3 -m http.server 8000 # preview at http://localhost:8000
```

To add a photo, save `name-800.webp` and `name-1600.webp` into `assets/img/`, add its width, height and placeholder colour to `tools/image-meta.json`, then reference it by `name`.

## Deploying

The site is fully static. Drag the folder into Netlify, Vercel, Cloudflare Pages or GitHub Pages; no configuration is needed.
