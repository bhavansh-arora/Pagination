# Co-Allies: website redesign concept

A multi-page redesign concept for [Co-Allies](https://www.co-allies.com), the Montréal coaching practice of Nathalia del Moral Fleury. Designed and built by Code Bunny.

**Pages:** Home · Fertility coaching · Coaching (Transition, Founders & CEOs, Conscious leadership) · Approach · About · Contact · 404

## What's inside

| Area | Detail |
| --- | --- |
| Design system | One tokenised stylesheet (`assets/css/main.css`): colour, type scale, spacing, radii and motion tokens shared by every page |
| Type | Fraunces (variable: opsz, wght, SOFT, WONK), Manrope, JetBrains Mono. All self-hosted |
| Motion | GSAP + ScrollTrigger (parallax, scroll-drawn step lines), Lenis smooth scroll, masked word reveals, scroll-lit manifesto, magnetic buttons, custom cursor |
| Signature experience | Once-per-visit intro sequence (the two "allies" circles draw and merge), curtain page transitions, a cinematic hero with her portrait set into the type and living ember orbs that follow the cursor, a pinned full-screen image reveal, a horizontal-scroll paths gallery, inner hero images that expand to full bleed, scroll-reactive marquees and a cursor spotlight on the footer wordmark |
| Conversion features | "Find your path" selector, fertility stage navigator, 1-minute guided breathing, 3-step "what happens next", FAQ on every key page, lazy-loaded Calendly embed, sticky mobile booking bar |
| Trust & ethics | Coaching vs therapy vs medical care comparison, crisis lines (811 / 9-8-8), confidentiality notes, land acknowledgement, disclaimer |
| SEO | Unique titles and descriptions, canonical URLs, Open Graph image, `ProfessionalService` JSON-LD, `sitemap.xml` |
| Accessibility | Semantic landmarks, skip link, keyboard tabs (arrow keys), `aria-pressed` and `aria-selected` states, visible focus, `prefers-reduced-motion` respected, works without JavaScript |
| Responsive | Fluid `clamp()` type and spacing, tested at 390px (phone), 820px (tablet) and 1440px (desktop) |

## Editing

Pages are written in `src/pages/*.html`. The shared head, header, menu, closing CTA and footer live in `tools/build.py`. To rebuild the root `*.html` files:

```bash
python3 tools/build.py
```

Contact details and the booking link are set once in `SITE` inside `tools/build.py`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

The site is plain static files. The repository root can be deployed as-is to Netlify, Vercel, Cloudflare Pages or GitHub Pages.

## Before launch

- Confirm the session format (online, in person or both), languages and preferred contact email.
- Connect the contact form to a form service (it currently opens a pre-filled email).
- Add client testimonials, with permission.
- French version (or bilingual FR/EN).

Photography: the portrait of Nathalia is by Frédérique Ménard-Aubin and comes from the current co-allies.com site. Other imagery is from Unsplash. Baby imagery is deliberately avoided on fertility pages.
