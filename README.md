# IB Refrigeration & Engineering — Website

Multi-page marketing website for **IB Refrigeration & Engineering**, Nagpur: display counters, food carts, shawarma machines, commercial refrigeration and restaurant kitchens.

It's a static site (plain HTML, CSS and JS). No framework or server is needed, so it runs on any host: GitHub Pages, Netlify, Vercel, Hostinger or cPanel.

## Pages

| Page | What's on it |
|---|---|
| `index.html` | Hero, stats, product categories, why us, 4-step process, best sellers, industries, rating, YouTube, FAQ |
| `about.html` | Story since 2007, values, milestones, owners (SK Iqbal, SK Amaan), company facts and GSTIN |
| `products.html` | 39-product catalogue with category filters, live search, a details popup and "Get Price on WhatsApp" |
| `services.html` | Turnkey kitchens, fabrication, refrigeration, repair and maintenance |
| `gallery.html` | Product photo gallery with a lightbox (keyboard arrows work) |
| `reviews.html` | Rating summary, links to Google, Justdial, IndiaMART and Facebook, testimonials, Google Map |
| `contact.html` | Contact cards, a quote form that opens WhatsApp or email pre-filled, maps of the workshop and office |
| `404.html` | Not-found page |

Every page also includes:
- a sticky header with a mobile menu
- floating Call and WhatsApp buttons
- SEO tags: title, description, Open Graph, canonical URL, and LocalBusiness JSON-LD with the rating
- `sitemap.xml` and `robots.txt`

## Editing

- **Business details, navigation, page text and footer**: edit `build.py`, then run `python3 build.py`. This regenerates every `.html` file.
- **Products**: edit `assets/js/products.js`. Add a square JPG to `assets/img/products/` and reference it by file name, without the extension.
- **Reviews**: the `REVIEWS` list in `build.py` holds every publicly visible review (5 from Google, 3 from Justdial), copied word for word. The rating summary (4.9★ from 49 Google reviews, star breakdown, and 4.9★ from 58 Justdial ratings) is in `BIZ`. To add a review, append it as (name, profile line, date, stars, text, source) and rebuild.
- **Photos**: `assets/img/site/` holds the business's own photos from its Google Business Profile (workshop, showroom, stalls). Product photos in `assets/img/products/` are the IndiaMART brochure images, upscaled 4× with an EDSR model.
- **Styles**: `assets/css/style.css`. Brand colours are the variables at the top of the file.

## Before go-live checklist

- [ ] Get better product photos. The brochure images are upscaled from about 250px; fresh 1000px+ photos of each product will look noticeably sharper.
- [ ] Ask the owner to share any extra Google reviews they want featured. Google shows only 5 reviews' text to signed-out visitors, so the other 44 couldn't be pulled automatically.
- [ ] Confirm the working hours (currently Mon–Sat, 10 AM – 8 PM) and the WhatsApp number (currently 9021426223).
- [ ] Point the `ibrefrigeration.in` domain at the host. If the domain changes, update `SITE` in `build.py`.
- [ ] Submit `sitemap.xml` in Google Search Console, and link the website from the Google Business Profile.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
