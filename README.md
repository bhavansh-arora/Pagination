# MDJ Mortgages — multi-page website

A premium, 15-page static website for **MDJ Mortgages Ltd**, the award-winning mortgage broker in Basingstoke, Hampshire. Built by Code Bunny.

## Pages

| Page | File |
| --- | --- |
| Home (journey finder, borrowing calculator, reviews, awards) | `index.html` |
| All services hub | `mortgages.html` |
| First-time buyers | `first-time-buyers.html` |
| Moving home | `moving-home.html` |
| Remortgaging (with renewal reminder sign-up) | `remortgage.html` |
| Self-employed | `self-employed.html` |
| Specialist lending (no deposit, commercial, foreign national) | `specialist-mortgages.html` |
| Later life & equity release | `equity-release.html` |
| Protection | `protection.html` |
| About (team, values, awards, areas, refer-a-friend) | `about.html` |
| Reviews | `reviews.html` |
| Calculators (borrowing, repayments, stamp duty, remortgage savings) | `calculators.html` |
| FAQs | `faq.html` |
| Contact (form, map, hours) | `contact.html` |
| Legal, fees, complaints, privacy, cookies | `legal.html` |

## Project structure

```
src/partials/   head, header, footer, shared CTA and review blocks
src/pages/      one file per page (meta block + page body)
assets/         CSS, JS, images (copied into site/ on build)
build.py        zero-dependency builder (Python 3.8+)
site/           built output, ready to deploy
```

## Build

```
python3 build.py
```

This writes finished HTML plus `sitemap.xml` and `robots.txt` to `site/`. Deploy the `site/` folder to any static host (Netlify, Vercel, Cloudflare Pages, or the existing hosting).

## Before going live

- **Forms:** forms currently open a pre-filled email to `mark@mdjmortgages.com` (there's no server). Point them at Formspree, Netlify Forms or the CRM (Pipedrive) by replacing the `data-mailto` handler in `assets/js/main.js`.
- **Photos:** the team cards on `about.html` use styled placeholders. Swap in professional headshots of Mark and Jodie.
- **Compliance sign-off:** all financial promotions should be approved by Stonebridge before publishing.
- **Stamp duty rates:** the calculator uses the England and Northern Ireland rates from 1 April 2025. Update `calcs.sdlt` in `main.js` if rates change.
- **Review count:** update "186" across the site as the Google review count grows.
