# codebunny.net

The Code Bunny studio website: a fast, static, SEO-first site with no framework and no build dependencies beyond Python 3.

## What's in here

```
public/            ← the website (this folder is what gets deployed)
tools/content.py   ← all page copy: services, industries, FAQs, testimonials, contact details
tools/projects.json← portfolio: every live site, its category, blurb and URL
tools/build.py     ← generates every HTML page, sitemap.xml, robots.txt, llms.txt
tools/screenshots.js / optimize.py ← re-capture portfolio screenshots from the live sites
tools/og.js        ← renders the social-share images
deploy/            ← Caddyfile + rsync deploy script for the VPS
```

Pages: Home, Work (filterable portfolio, 39 projects), Services + 6 service pages, Industries + 4 industry pages, Templates (sites for sale), Free website preview, About, Contact, Privacy, 404.

## Everyday edits

1. Change copy in `tools/content.py` (or add a project to `tools/projects.json`).
2. Rebuild: `python3 tools/build.py`
3. Preview: `cd public && python3 -m http.server 8080`, then open http://localhost:8080
4. Deploy: `DEPLOY_HOST=user@your-vps ./deploy/deploy.sh`

### Adding a new portfolio site

1. Add an entry to `tools/projects.json` (`cat` is one of: coaching, weddings, energy, local, education, products, templates; `featured: true` also captures a phone screenshot).
2. `node tools/screenshots.js <slug>` (uses Playwright + Chromium), then `python3 tools/optimize.py`
3. `python3 tools/build.py`

## SEO built in

- Unique, keyword-targeted `<title>` and meta description on every page; canonical URLs
- JSON-LD structured data: Organization, WebSite, WebPage, BreadcrumbList, Service, OfferCatalog, FAQPage, ItemList (portfolio), Product (templates), Person (founder), Offer (free preview)
- Open Graph + Twitter cards with custom 1200×630 share images
- `sitemap.xml`, `robots.txt`, `llms.txt` (for AI search engines), web manifest, favicons
- Service and industry landing pages targeting real search intent ("website design for coaches", "solar company website", etc.)
- Self-hosted fonts, WebP images with `srcset`, lazy loading, no render-blocking third-party JS (~650 KB first load)
- 301 redirects from the old `about.html` / `contact.html` / `marketplace.html` URLs (in the Caddyfile, plus fallback stubs)

### After launch

1. Add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://www.codebunny.net/sitemap.xml`.
2. Do the same in Bing Webmaster Tools.
3. Create or update the Google Business Profile with the same name, email and website.
4. Optional: add GA4 (the contact form already fires a `generate_lead` event if `gtag` is present).

## Contact form

Submissions go through [FormSubmit](https://formsubmit.co) to the inbox in `SITE["form_inbox"]` (`tools/content.py`), the same setup as the previous site. Two modes: **Free website preview** (default) and **Start a project**. Links like `/contact/?site=beauty.codebunny.net` pre-fill a purchase enquiry.
