=== image-seo
title: Image SEO: How to Optimise Images for Speed and Search
desc: A practical image SEO guide: file formats, sizing, compression, file names, alt text, lazy loading and structured data, for faster pages and better rankings.
cat: seo
kw: image seo, optimize images for web, alt text, webp images, image compression seo
takeaways: Images are usually the heaviest part of a page, so optimising them is the fastest speed win | Use WebP or AVIF, sized to how they're displayed | Descriptive file names and alt text help search engines and screen-reader users | Lazy-load everything below the first screen and always set dimensions
---
Images make a website feel alive. They're also the main reason most websites are slow. Image SEO is about getting both: pictures that look great, load fast and help you get found in search.

## 1. Choose the right format

| Format | Best for |
| --- | --- |
| WebP | Almost everything; small files, wide support |
| AVIF | Even smaller; excellent for photos |
| JPEG | Fallback for photos |
| PNG | Graphics needing transparency, when WebP isn't an option |
| SVG | Logos, icons and simple illustrations |

For most sites, converting JPEGs and PNGs to WebP cuts image weight by a quarter to a third with no visible difference.

## 2. Resize before you upload

Don't upload a 6,000-pixel photo to display at 800 pixels. Export at the largest size it will actually appear, typically:

- Full-width hero: 1,800 to 2,400 px
- Content image: 1,200 to 1,600 px
- Thumbnail: 400 to 800 px

## 3. Compress

Aim for quality settings of roughly 75 to 82 for WebP. Tools: Squoosh, TinyPNG, ImageOptim, ShortPixel, or your platform's built-in optimiser.

Targets: under 200 to 300 KB for large images, under 100 KB for smaller ones.

## 4. Serve responsive images

Use `srcset` so phones get a smaller file than desktops. Modern platforms and well-built custom sites do this automatically.

## 5. Lazy-load

Images below the first screen should load only as the visitor scrolls. Add `loading="lazy"`. Don't lazy-load the main hero image; prioritise it so it appears immediately.

## 6. Set width and height

Declaring dimensions lets the browser reserve space, preventing content from jumping as images load. This improves your layout shift score. See [Core Web Vitals explained](/blog/core-web-vitals-explained/).

## 7. Name files descriptively

Before uploading, rename:

- `IMG_4821.jpg` → `kitchen-renovation-leeds-oak-worktop.webp`

Use lowercase words separated by hyphens. Describe what's in the image.

## 8. Write good alt text

Alt text describes an image for people using screen readers and for search engines.

- Describe what's in the picture, concisely
- Include a keyword only if it fits naturally
- Skip "image of" or "picture of"
- Leave decorative images with empty alt (`alt=""`)

Good: "Bride and groom walking through vineyard at sunset"

Bad: "wedding photographer chicago best wedding photographer illinois"

## 9. Add context

Search engines use the text around an image to understand it. Place images near relevant headings and paragraphs, and use captions where they help.

## 10. Use original images

Real photos of your work, team and premises outperform stock images for trust, and can rank in image search. Stock photos appear on thousands of sites.

## 11. Consider image search

For visual businesses (photographers, designers, salons, restaurants, manufacturers) Google Images and Google Lens can send real traffic. Descriptive names, alt text and surrounding content all help.

## 12. Add structured data

Product, Recipe and Article schema can include images, making them eligible for rich results. See our [schema markup guide](/blog/schema-markup-guide/).

## 13. Social sharing images

Set an Open Graph image (1200 × 630 px) for each key page so links look good when shared on Facebook, LinkedIn and WhatsApp.

[[audit]]

## How to audit your images

1. Run [PageSpeed Insights](https://pagespeed.web.dev/) on your main pages
2. Look for "Properly size images", "Serve images in next-gen formats" and "Defer offscreen images"
3. Check total page weight; images are usually the bulk
4. Fix the largest files first

## A quick workflow

1. Export at display size
2. Rename descriptively
3. Convert to WebP and compress
4. Upload with width and height set
5. Write alt text
6. Lazy-load if below the fold

## Image-heavy sites

Portfolios and galleries need extra care. We cover the specifics in [how to make your photography website load fast](/blog/photography-website-speed/).

## Frequently asked questions

### Does alt text help rankings?
It helps search engines understand images and can improve image search visibility. Its main purpose is accessibility.

### Is WebP supported everywhere?
Yes, by all modern browsers.

### How many images are too many?
There's no limit if they're optimised and lazy-loaded. Unoptimised, even a few can slow a page badly.

=== seo-migration-redesign
title: How to Redesign Your Website Without Losing SEO
desc: A step-by-step guide to protecting your Google rankings during a website redesign or migration: URL mapping, 301 redirects, content, testing and monitoring.
cat: seo
kw: redesign website without losing seo, website migration seo, 301 redirects, seo migration checklist
takeaways: Most ranking losses after a redesign come from missing redirects | Map every old URL to its closest new equivalent before launch | Keep the content and titles that already rank | Monitor Search Console closely for the first month
---
A redesign should make your site rank better: it's faster, clearer and better structured. Yet redesigns are one of the most common causes of sudden traffic loss. The reason is almost always the same. URLs changed, nobody set up redirects, and Google found a site full of dead ends.

Follow these steps and you'll keep what you've earned.

## Before: take stock

### 1. Crawl your current site

Use Screaming Frog (free up to 500 URLs) or a similar tool to export every URL, title, description and H1.

### 2. Identify your valuable pages

In Search Console, export the Pages report for the past 12 to 16 months. Sort by clicks. In analytics, find pages that drive enquiries. These are the pages you can't afford to break.

### 3. Find pages with backlinks

Check Search Console's Links report for pages other sites link to. Their URLs must be preserved or redirected.

### 4. Record benchmarks

Note current traffic, rankings for key terms and conversion numbers so you can compare afterwards.

## During: plan the move

### 5. Keep URLs where you can

If a URL ranks, the safest option is not to change it.

### 6. Build a redirect map

A spreadsheet:

| Old URL | New URL | Notes |
| --- | --- | --- |
| /about.html | /about/ | |
| /services.html#seo | /services/seo/ | Split into own page |
| /old-blog-post | /blog/new-slug/ | Updated |
| /discontinued-service | /services/ | Closest relevant page |

Rules:

- Every old URL gets a destination
- Redirect to the most relevant page, not everything to the homepage
- Use 301 (permanent) redirects
- Avoid chains: A should go straight to C, not via B

### 7. Preserve what works

For pages that rank:

- Keep the main topic, headings and substantial content
- Keep or improve the title tag
- Don't cut a detailed page down to two sentences for design reasons

### 8. Carry over technical elements

- Title tags and meta descriptions
- Schema markup
- Canonical tags
- Image alt text
- Analytics and tag manager code
- Any verification codes

### 9. Build on staging, blocked from search

Use a staging URL with noindex or password protection so the unfinished site isn't indexed.

## Launch day

### 10. Remove the noindex

The most common launch mistake is going live with search engines still blocked.

### 11. Implement and test redirects

Test a sample of old URLs. Each should land on the right page with a 301 status.

### 12. Submit the new sitemap

In Search Console and Bing Webmaster Tools.

### 13. Check robots.txt

Make sure it isn't blocking the new site.

### 14. Test everything

Forms, phone links, booking, payments, mobile layout, speed.

## After: monitor

### 15. Watch Search Console daily for two weeks

- **Pages report:** 404 errors and "not indexed" reasons
- **Performance:** clicks and impressions for your key pages

Fix 404s by adding missing redirects.

### 16. Update external links you control

Google Business Profile, social profiles, directory listings, email signatures.

### 17. Compare with benchmarks

A dip in the first couple of weeks is normal as Google recrawls. Traffic should recover and then improve. A sustained drop after four weeks needs investigation.

[[audit]]

## Changing domain too?

A domain change adds steps:

- Redirect every URL on the old domain to the same path on the new one
- Use Search Console's Change of Address tool
- Keep the old domain registered and redirecting for at least a year, ideally permanently

## Platform changes

Moving from WordPress, Wix or Squarespace to a custom build (or vice versa) usually changes URL formats. That makes the redirect map essential. On this site, for example, old `.html` URLs redirect to clean folder-style URLs.

## What to do if rankings have already dropped

1. Check for a leftover noindex or robots.txt block
2. Find 404s in Search Console and redirect them
3. Compare old and new versions of key pages (use the Wayback Machine) and restore missing content
4. Check titles and headings weren't changed for the worse
5. Confirm the site isn't slower than before

Most losses are recoverable if you act within a few weeks.

For the complete project plan, see our [30-step website redesign checklist](/blog/website-redesign-checklist/).

## Frequently asked questions

### How long do redirects need to stay in place?
Indefinitely is best. At minimum, a year.

### Will I lose rankings temporarily?
Small fluctuations are normal for a few weeks. With correct redirects, rankings usually stabilise or improve.

### Can I redirect all old pages to the homepage?
No. Google treats irrelevant redirects like missing pages. Redirect each to its closest match.

=== google-search-console-guide
title: Google Search Console for Beginners: What to Check and Why
desc: A beginner's guide to Google Search Console: setup, the reports that matter, how to find quick SEO wins and a simple monthly routine for small businesses.
cat: seo
kw: google search console guide, how to use search console, search console for beginners, gsc
takeaways: Search Console is free and shows exactly how Google sees your site | The Performance report reveals the searches you appear for and where you rank | The Pages report tells you which pages aren't indexed and why | Fifteen minutes a month is enough to catch problems and find opportunities
---
Google Search Console is a free tool from Google that shows how your website performs in search: which queries bring people to you, which pages are indexed and what's going wrong. If you only use one SEO tool, make it this one.

## Setting up

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your site as a **Domain property** (covers all versions) and verify through a DNS record, or as a **URL prefix** and verify with an HTML tag
3. Submit your sitemap under **Sitemaps** (usually `yourdomain.com/sitemap.xml`)

Data starts appearing within a couple of days.

## The Performance report

This is where you'll spend most of your time.

### Four numbers

- **Clicks:** visits from Google search
- **Impressions:** how often you appeared
- **CTR:** clicks divided by impressions
- **Average position:** your typical ranking

### Queries

The actual searches you showed up for. Look for:

- Searches you didn't know you ranked for
- Queries with lots of impressions and few clicks
- Queries where you rank between positions 5 and 20

### Pages

Which pages bring traffic. Click a page, then switch to Queries to see what it ranks for.

### Filters

Compare date ranges, filter by country or device, and search for queries containing a word such as your town.

## Finding quick wins

### 1. "Almost there" keywords

Filter for position 8 to 20. These are within reach of page one. Improve the page: better content, clearer title, more internal links.

### 2. Low click-through rate

High impressions but low CTR means your title and description aren't enticing. Rewrite them. See [title tags and meta descriptions](/blog/title-tags-meta-descriptions/).

### 3. Content ideas

Queries you appear for without a dedicated page are topics to write about. See [how to write a blog post that ranks](/blog/how-to-write-a-blog-post-that-ranks/).

## The Pages (indexing) report

Shows which pages Google has indexed and which it hasn't, with reasons.

| Status | Meaning | Action |
| --- | --- | --- |
| Not found (404) | Page doesn't exist | Redirect or fix the link |
| Excluded by noindex | You've told Google not to index it | Remove tag if unintended |
| Crawled, currently not indexed | Google saw it and wasn't convinced | Improve content, add internal links |
| Duplicate without canonical | Similar pages | Set canonical or merge |
| Redirect | Normal for redirected URLs | Usually fine |

Not every excluded URL is a problem. Focus on important pages that should be indexed and aren't.

## URL Inspection

Paste any URL to see whether it's indexed, when it was last crawled and how Google renders it. Use **Request indexing** after publishing or updating a page.

## Experience reports

- **Core Web Vitals:** speed and stability by page group ([explained](/blog/core-web-vitals-explained/))
- **HTTPS:** confirms pages are served securely

## Enhancements

Shows structured data Google has found (FAQs, breadcrumbs, products, reviews) and any errors. See the [schema markup guide](/blog/schema-markup-guide/).

## Links

- **External links:** who links to you and to which pages
- **Internal links:** which of your pages have the most links; important pages should be near the top ([internal linking guide](/blog/internal-linking-guide/))

## Security and manual actions

Hopefully empty. If Google detects hacking or applies a penalty, it's reported here.

[[audit]]

## A 15-minute monthly routine

1. **Performance:** compare the last 28 days with the previous period. Note rises and falls.
2. **Queries:** scan for new terms and "almost there" keywords.
3. **Pages report:** check for new errors.
4. **Core Web Vitals:** any pages slipping?
5. **Pick one action** for the month: improve a page, rewrite a title, fix an error.

## Bing Webmaster Tools

Set this up too. It's free, imports your Search Console settings, and Bing's index powers several AI assistants. See [how to get mentioned in AI search](/blog/ai-search-optimization/).

## Frequently asked questions

### Is Search Console the same as Google Analytics?
No. Search Console shows how you appear in Google search. Analytics shows what visitors do once they're on your site. Use both.

### Why don't the numbers match my analytics?
They measure different things in different ways. Small discrepancies are normal.

### How far back does the data go?
Sixteen months. Export reports periodically if you want a longer history.

=== how-long-does-seo-take
title: How Long Does SEO Take to Work? Honest Timelines
desc: Realistic timelines for SEO results, what affects how fast you'll see them, what to expect month by month and how to speed things up.
cat: seo
kw: how long does seo take, seo timeline, when will seo work, seo results time
takeaways: Most businesses see meaningful movement in three to six months and strong results in six to twelve | New sites, competitive markets and thin content all slow things down | Local and long-tail keywords pay off fastest | SEO compounds; early months feel slow and later months accelerate
---
"How long until we're on page one?" is the question every business asks and few agencies answer honestly. The truthful answer has a range and some conditions. Here's what to expect and why.

## The short version

- **Brand searches** (your business name): days to weeks
- **Long-tail and local searches:** one to three months
- **Main service keywords in a moderately competitive market:** three to six months
- **Competitive city or national terms:** six to twelve months or more

## Why it takes time

1. **Crawling and indexing.** Google has to find and process your pages.
2. **Trust.** New sites and new content are tested gradually.
3. **Competition.** Others have been building content and links for years.
4. **Compounding.** Each page, link and review adds a little; the effect builds.

## What affects your timeline

| Factor | Faster | Slower |
| --- | --- | --- |
| Site age | Established domain | Brand-new domain |
| Competition | Small town, niche service | Big city, crowded industry |
| Starting point | Good technical base | Slow, broken or thin site |
| Content | Regular, useful, specific | Sparse or generic |
| Links and reviews | Existing reputation | None yet |
| Consistency | Monthly effort | One-off push |

## Month by month

**Month 1:** audit, technical fixes, tracking, Google Business Profile, keyword mapping. Little visible change.

**Month 2:** improved pages get recrawled. Impressions start rising in Search Console. Long-tail queries appear.

**Month 3:** first ranking gains for specific and local terms. Early organic enquiries.

**Months 4 to 6:** steady growth as more content is indexed and links and reviews accumulate. Main keywords move onto pages one and two.

**Months 6 to 12:** compounding. Content published early now ranks well. Organic becomes a reliable lead source.

## Quick wins while you wait

- **Fix titles and descriptions** on pages already ranking; more clicks without ranking higher ([how](/blog/title-tags-meta-descriptions/))
- **Target "almost there" keywords** at positions 8 to 20 ([Search Console guide](/blog/google-search-console-guide/))
- **Complete your Google Business Profile** and gather reviews; map results can move in weeks ([checklist](/blog/google-business-profile-optimization/))
- **Speed up the site** ([Core Web Vitals](/blog/core-web-vitals-explained/))
- **Add internal links** to key pages ([guide](/blog/internal-linking-guide/))

## How to tell it's working before the leads arrive

Leading indicators:

- Rising impressions in Search Console
- More queries triggering your pages
- Average position improving
- More pages indexed
- More branded searches

If these are trending up, traffic and enquiries will follow.

[[audit]]

## Red flags

- **Guaranteed rankings** or timeframes
- **"Instant results"**
- **Bought links** or private blog networks
- **No reporting** or only vanity metrics
- **Nothing visible being done** each month

Honest SEO involves visible work: pages improved, content published, issues fixed.

## Should you run ads in the meantime?

Often, yes. Ads bring enquiries from day one and reveal which keywords convert. Use that data to guide SEO. See [SEO vs Google Ads](/blog/seo-vs-google-ads/).

## Is it worth the wait?

Once you rank, each click is free and the traffic continues. Businesses that invest steadily for a year typically find organic search becomes their lowest-cost source of leads.

## New site?

Follow our [first 90 days SEO plan](/blog/seo-for-new-websites/) to build the right foundations.

## Frequently asked questions

### Can SEO work in a month?
You can fix technical issues and see small gains, particularly locally, but meaningful results take longer.

### Why did my rankings drop after improving?
Fluctuations are normal as Google re-evaluates pages. Judge trends over months, not days.

### Does SEO ever finish?
No. Competitors keep working and search changes. The effort needed to maintain is less than the effort to build.

=== seo-vs-google-ads
title: SEO vs Google Ads: Which Is Better for a Small Business?
desc: An honest comparison of SEO and Google Ads for small businesses: cost, speed, trust, longevity and how to combine them for the best return.
cat: seo
kw: seo vs google ads, seo or ppc, google ads for small business, search marketing strategy
takeaways: Ads deliver traffic immediately; SEO builds a lasting asset | Ads stop the moment you stop paying, while SEO keeps working | Most businesses do best with ads for quick wins and SEO for long-term growth | Both fail without a website that converts visitors into enquiries
---
You want more customers from Google. There are two ways to get them: pay for ads at the top of the page, or earn a place in the organic results below. Each has strengths. The right mix depends on your budget, timeline and market.

## Side by side

| | SEO | Google Ads |
| --- | --- | --- |
| Speed | Months | Same day |
| Cost model | Time and expertise | Pay per click |
| Longevity | Continues after work stops | Stops when budget stops |
| Trust | Many users prefer organic results | Marked "Sponsored" |
| Control | Limited; Google decides | Precise targeting and budgets |
| Data | Slower feedback | Immediate keyword and conversion data |
| Best for | Long-term, sustainable leads | Launches, promotions, quick results |

## The case for Google Ads

- **Instant visibility.** Be at the top today.
- **Precise targeting.** By keyword, location, time and device.
- **Budget control.** Set a daily cap.
- **Measurable.** Track cost per lead exactly.
- **Testing.** Learn which keywords and messages convert.

### Downsides

- Costs can be high in competitive industries; some clicks cost $20 or more
- Traffic ends when spending stops
- Poorly managed campaigns waste money fast
- Needs ongoing optimisation

## The case for SEO

- **Compounding returns.** Content you publish today can bring leads for years.
- **Lower cost per lead over time.**
- **Credibility.** Ranking organically signals authority.
- **Broader reach.** Captures research-stage searches ads rarely target.
- **Supports AI visibility.** Assistants draw on organic content. See [how to get mentioned in AI search](/blog/ai-search-optimization/).

### Downsides

- Takes months ([realistic timelines](/blog/how-long-does-seo-take/))
- No guarantees
- Requires consistent effort
- Algorithm changes can shift rankings

## When to prioritise ads

- You need leads this month
- You're launching a new business, service or location
- You have a seasonal or time-limited offer
- Your market's organic results are dominated by giants
- You want to test demand before investing in content

## When to prioritise SEO

- You're building for the long term
- Your budget is limited but you have time
- Clicks in your industry are expensive
- You already have some authority to build on
- Local search and map results are key to your business

## Why most businesses should do both

They reinforce each other.

- **Ads data guides SEO.** See which keywords convert, then build content for them.
- **SEO lowers ad dependence.** As rankings grow, shift budget.
- **Double presence.** Appearing in both ads and organic results increases total clicks.
- **Remarketing.** Bring back visitors who found you organically.

### A sensible plan

| Phase | Focus |
| --- | --- |
| Months 1 to 3 | Ads for immediate leads; start SEO foundations |
| Months 4 to 9 | Continue both; expand content |
| Months 10+ | Reduce ad spend where organic now ranks; keep ads for high-value and seasonal terms |

## Don't forget Local Services Ads and Maps

For local businesses, Google's map results and Local Services Ads (where available) often sit above everything. A strong [Google Business Profile](/blog/google-business-profile-optimization/) is essential either way.

## The thing both depend on

A click is only worth something if the page converts. Sending expensive traffic to a slow, confusing website wastes money on ads and squanders rankings from SEO.

Before spending more on traffic, make sure your site:

- Loads fast on mobile
- Says clearly what you do and where
- Shows proof
- Has an obvious next step

See [how to get more leads from your website](/blog/website-conversion-rate-optimization/).

[[cta]]

## Landing pages for ads

Send ad clicks to a focused page that matches the ad, not your homepage. See [landing page vs website](/blog/landing-page-vs-website/).

## Frequently asked questions

### Do Google Ads improve my SEO rankings?
No. Paying for ads doesn't affect organic rankings directly.

### Which is cheaper?
Ads cost less to start and more over time. SEO costs more up front and less per lead in the long run.

### How much should I spend on Google Ads?
Enough to gather meaningful data: often $500 to $1,500 a month for a local service business to begin, adjusted by results.
