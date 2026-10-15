# Alpha Visuals: website redesign

A fast, mobile-first, multi-page static site for Alpha Visuals, a cinematic wedding videographer based in Christchurch and Adelaide. It has no framework and no runtime dependencies: plain HTML, CSS and a small vanilla JS file.

## Pages

| Page | File | Purpose |
| --- | --- | --- |
| Home | `index.html` | Hero reel, approach, featured films, testimonial, packages, Super 8, process, about teaser |
| Films | `films.html` | Full film library in a lightbox player |
| Packages | `packages.html` | Pricing, add-ons, interactive **film builder** (live total), process, key FAQs |
| Super 8 | `super8.html` | Analogue add-on sales page |
| About | `about.html` | Sam's story, credentials, reasons to book |
| FAQ | `faq.html` | All FAQs, with `FAQPage` structured data for Google rich results |
| Commercial | `commercial.html` | Brand and fashion work, plus a commercial enquiry route |
| Contact | `contact.html` | 3-step enquiry form, prefilled from the builder or package buttons |

## Conversion features

- A "Check my date" CTA in the nav, every hero, the lightbox, and a sticky mobile bar that hides while the form or CTA band is on screen
- **Film builder**: pick a package and add-ons to see the NZD total and the $1,100 deposit, then go to Contact with everything prefilled
- **3-step enquiry form** (date → couple → contact) to lower friction, with inline validation, a honeypot spam trap and a success state. It fires `gtag('generate_lead')` and `fbq('Lead')` if those trackers are installed.
- Urgency and trust messages ("pricing increases 1 Dec 2026", reviews, 4K, the EMT and firefighter "calm in the chaos" angle)
- SEO: unique titles and descriptions, canonical and Open Graph tags, `ProfessionalService` and `FAQPage` JSON-LD
- Accessibility and performance: semantic landmarks, a skip link, focus styles, keyboard and Escape support, `prefers-reduced-motion`, lazy images, in-view lazy video, and the privacy-friendly `youtube-nocookie` embed

## Editing and building

Edit the files in `src/`, never the generated HTML in the repo root:

```
src/partials/   head, nav, footer, sprite, cta band, short FAQ, Super 8 extras
src/pages/      one file per page, starting with a JSON front-matter comment
```

Then rebuild (Python 3, no packages needed):

```
python3 build.py
```

Use `<!-- @include name -->` inside a page to pull in a partial.

## Before launch

1. **Connect the form.** Set `data-endpoint` on `#enquiry-form` in `src/pages/contact.html` to a JSON form endpoint (e.g. Formspree, Basin or a Netlify/Vercel function). If it's left empty, the form opens a prefilled email to `sam@alphavisuals.co.nz` instead.
2. **Self-host media (recommended).** Images and videos currently load from the existing Webflow CDN. Download them into `assets/media/` before the Webflow plan is cancelled.
3. Add analytics (GA4 / Meta Pixel). Lead events fire automatically.
4. Deploy the repo root to any static host (Netlify, Vercel, Cloudflare Pages or GitHub Pages).
