# Carole St-Pierre salon & spa — website

A multi-page static site for Carole St-Pierre salon & spa (Aveda Concept salon and eco-spa, Vaudreuil-Dorion), built by Code Bunny as a redesign proposal. All content, prices, photos, team bios and reviews come from carolest-pierre.com.

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Hero, services bento, bridal teaser, 3-tap **treatment finder**, pinned spa-ritual scroller, values, reviews, team, gift card + app promos |
| `weddings.html` | Approach, process, bridal menu (salon / on location tabs), **live bridal quote builder** with suggested start time, gallery, FAQ, inquiry form |
| `hair.html` | Aveda ritual, full hair menu with sticky section nav, treatments, stylist levels, stylists |
| `skin.html` | Éminence facials, searchable wax/sugar/threading table, nails, lashes, spray tan prep & aftercare |
| `massage.html` | 11 massages with a **60/90/120-minute price toggle**, balneotherapy, wraps, wood therapy |
| `medispa.html` | Cynosure Elite+ laser with a **searchable 39-zone price table**, safety checklist, photorejuvenation, mesotherapy, peels, permanent makeup |
| `rituals.html` | 10 spa packages with filters (relaxation, skin, under 2 h, moms, men), gift cards, etiquette |
| `team.html` | Leadership, 24 specialists filterable by expertise, languages, careers |
| `about.html` | Carole's letter, her story, values, the space, brands, careers & internships |
| `visit.html` | Contact cards, live open/closed status, hours, map, contact form, FAQ (with FAQ schema), policies |
| `privacy.html`, `404.html` | Law 25 privacy page, not-found page |

## Editing

The HTML is generated. Edit the sources, then rebuild:

```bash
python3 _build/build.py
```

- **Prices, team, rituals, reviews, FAQ:** `_build/content.py` (plus per-page menus in `_build/p_*.py`)
- **Shared header, footer, contact details, booking links:** `_build/csp.py`
- **Wedding quote builder prices:** `QB_ITEMS` in `assets/js/main.js`
- **Form destination, hours used by the live "open now" status:** `assets/js/config.js`
- **Design tokens (colours, type, spacing):** top of `assets/css/main.css`
- **Images:** `python3 _build/images.py <folder-of-originals>` regenerates the WebP files in `assets/img/`

## Forms

While `formEndpoint` in `assets/js/config.js` is empty, forms open a pre-filled email to info@carolest-pierre.com. Paste a Formspree, Basin or Zapier webhook URL there to receive submissions directly.

## Tech

Plain HTML/CSS/JS, with no build step needed to host it. Fonts are self-hosted (Manrope, Fraunces, JetBrains Mono, all OFL). GSAP + ScrollTrigger and Lenis are vendored in `assets/vendor/` and only enhance motion: the site works without them and respects `prefers-reduced-motion`. Each page carries schema.org BeautySalon/DaySpa data; `sitemap.xml` and `robots.txt` are included.

## To confirm with the salon before launch

- Postal code (J7V 8W5 is from a directory listing)
- Cancellation policy: the current FAQ says no fee, while the Etiquette section says 50% under 24 h. The site shows the Etiquette version.
- Durations not listed on the current site: Ultimate Relaxation ritual, and Lomi Lomi (assumed 60 / 90 min)
- Laser "Full face" price (missing on the current site, so it's left out)
- French version of every page (Bill 96)
- Form endpoint and hosting domain
