# MDJ Mortgages: website concept

A premium, multi-page website concept for **MDJ Mortgages Ltd** (Basingstoke), built by Code Bunny.
The design picks up the black and gold of their 2026 Quality Business Awards branding: an editorial serif (Fraunces) paired with a clean sans (Manrope).

## Pages (`site/`)

| Page | Highlights |
| --- | --- |
| `index.html` | Hero with award badge, trust strip, 6 service cards, 4-step process, live affordability estimate, team, review slider, awards, areas, FAQ |
| `about.html` | Mark's story, stats counters, team bios (Mark & Jodie), values, awards |
| `mortgages.html` | First-time buyers, moving home, remortgage, buy-to-let; sticky in-page sub-nav |
| `specialist.html` | Self-employed, retirement, lifetime, no-deposit, commercial, foreign national, adverse credit, shared ownership |
| `equity-release.html` | How it works, interactive release estimator, considerations, FAQs, FCA warnings |
| `protection.html` | Life, critical illness, income protection, home insurance; remortgage cover review |
| `calculators.html` | Repayment, affordability and **2025/26 England SDLT** calculators (tabbed) |
| `fees.html` | Transparent fee table taken from their published fees |
| `reviews.html` | Rating summary, real Google reviews, refer-a-friend (£50 voucher) |
| `areas.html` | 16 towns grouped by district + map |
| `contact.html` | 3-step enquiry form with validation, Calendly / phone / WhatsApp, hours, map |

Every page also has a sticky header with a mega-menu, a mobile drawer, a floating WhatsApp button, full FCA / fraud-alert compliance text in the footer, `FinancialService` schema.org markup, and scroll-reveal animations (these respect reduced motion).

## Editing & building

Content and layout live in `build.py`; styles in `site/assets/css/styles.css`; behaviour in `site/assets/js/main.js`.

```bash
python3 build.py                              # regenerate site/*.html
cd site && python3 -m http.server 8000        # preview at http://localhost:8000
```

There is no framework and no dependencies, so the `site/` folder can be uploaded to any static host as-is.

### Hooking up the enquiry form
Set `data-endpoint` on `<form id="enquiry">` in `build.py` (for example a Formspree or Basin URL) and rebuild.
With no endpoint set, the form shows its success state and offers a pre-filled email to `mark@mdjmortgages.com`.

## Before going live
- Replace the social links in the footer (they currently point to the platform home pages) with MDJ's real profile URLs.
- Confirm the fee wording, review count and compliance text with MDJ and their network (Stonebridge).
- Photos and award badges come from mdjmortgages.com. The hero meeting photo is low resolution, so a fresh shoot would lift the site further.
