=== ai-search-optimization
title: How to Get Your Business Mentioned in ChatGPT, Perplexity and Google AI Overviews
desc: A practical guide to AI search optimisation (GEO) for small businesses: how AI assistants choose sources and what to change on your website to get cited.
cat: seo
kw: ai search optimization, generative engine optimization, get mentioned in chatgpt, google ai overviews seo, llms.txt
takeaways: AI assistants favour clear, specific, well-structured content they can quote | State who you are, what you do, where and for whom in plain sentences | FAQ sections, schema markup and consistent business details all help | Allow AI crawlers in robots.txt and consider an llms.txt summary
---
More and more people skip the list of blue links and ask an AI: "who's a good wedding photographer in Chicago?", "which solar installers near me handle the grant application?" The assistant replies with a short answer and a few named businesses. If you're not among them, you're invisible to that customer.

Optimising for these tools is sometimes called generative engine optimisation (GEO) or answer engine optimisation. The good news: it rewards the same things as good SEO, with a few additions.

## How AI assistants find and choose sources

Broadly, they work in two ways:

1. **Training data.** What the model learned from the public web up to its cutoff.
2. **Live retrieval.** The assistant searches the web (via Bing, Google or its own index), reads a handful of pages and summarises them, usually with citations.

For local and commercial questions, live retrieval matters most. That means your pages need to (a) be found by the underlying search, and (b) be easy for a machine to read, trust and quote.

## 1. Say exactly who you are and what you do

AI tools look for explicit statements. Don't make them infer.

Weak: "We craft digital experiences that inspire."

Strong: "Code Bunny is a web design and development studio that builds websites for coaches, wedding photographers, solar companies and local businesses in the US, Canada, the UK, Ireland, Australia, New Zealand and India."

Put a sentence like that on your homepage and about page. Include your location, services, audience and what makes you different.

## 2. Answer questions directly

Structure content the way people ask:

- Use question headings: "How much does a website cost?"
- Put the direct answer in the first one or two sentences
- Follow with detail

This "answer first" format is easy for an assistant to lift and cite.

## 3. Add FAQ sections

Every key page should end with three to six real questions and concise answers. Mark them up with FAQ schema.

## 4. Use structured data

Schema markup tells machines precisely what your content means: your organisation, services, location, reviews, articles, FAQs and products. It removes guesswork. See our [schema markup guide](/blog/schema-markup-guide/).

## 5. Be specific and factual

Assistants prefer concrete, checkable facts:

- Years in business, number of projects, areas served
- Prices or ranges
- Named clients, with permission
- Timelines and processes
- Certifications

Vague superlatives ("leading", "best-in-class") give them nothing to quote.

## 6. Keep your details consistent everywhere

AI tools cross-check. Your name, address, phone, services and description should match across your website, Google Business Profile, Bing Places, Apple Business Connect, LinkedIn, directories and review sites. Bing matters more than you'd expect because several assistants rely on it.

## 7. Earn mentions on other sites

Models learn who's reputable from how often and where you're mentioned: reviews, directories, local press, podcasts, partner sites, "best of" lists. Each credible mention makes you more likely to be named.

## 8. Let AI crawlers in

Check your `robots.txt`. If it blocks crawlers such as GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot or Google-Extended, those tools can't read your site. Unless you have a reason to block them, allow them.

## 9. Add an llms.txt file

`llms.txt` is an emerging convention: a plain Markdown file at the root of your site that summarises who you are and links to your most important pages. Not every assistant uses it yet, but it costs little and gives machines a clean overview. We publish one at [codebunny.net/llms.txt](/llms.txt), along with a full-text version for deeper context.

## 10. Make pages fast and readable without tricks

Some AI crawlers don't run JavaScript. Make sure your key content is in the HTML itself, not loaded only after scripts run. Clean headings, short paragraphs, lists and tables all help.

[[audit]]

## 11. Publish genuinely useful content

Guides, comparisons, pricing explanations and how-tos give assistants material to cite when answering related questions. Each article is another chance to be the source. See [how to write a blog post that ranks](/blog/how-to-write-a-blog-post-that-ranks/).

## 12. Show real expertise

Name the author, show their credentials, date your content and keep it updated. Signals of experience and trustworthiness matter to both search engines and AI systems.

## How to check whether you're showing up

- Ask ChatGPT, Perplexity, Gemini and Copilot the questions your customers would ask
- Note which businesses are named and which sources are cited
- Look at what those cited pages do well
- Repeat monthly; answers change

## A quick checklist

| Do this | Why |
| --- | --- |
| Clear "who we are" sentence on home and about | Easy to quote |
| FAQ sections with schema | Matches question format |
| Organization, LocalBusiness, Service schema | Removes ambiguity |
| Consistent listings, including Bing | Cross-verification |
| Allow AI crawlers | They can't cite what they can't read |
| llms.txt | Clean summary for machines |
| Reviews and third-party mentions | Reputation signals |

## Does traditional SEO still matter?

Yes. AI assistants lean on search indexes to find pages, so ranking well remains the foundation. Think of AI visibility as SEO plus clarity.

## Frequently asked questions

### Can I pay to appear in ChatGPT answers?
Not in the organic answer itself. Visibility comes from the quality and clarity of your web presence.

### How long does it take to appear in AI answers?
For tools using live search, improvements can show within weeks of your pages being indexed.

### Is llms.txt required?
No. It's optional and still emerging, but simple to add and helpful for tools that read it.

=== technical-seo-checklist
title: Technical SEO Checklist for Small Business Websites
desc: A plain-English technical SEO checklist for small business websites: crawling, indexing, speed, mobile, structured data, security and the tools to check each.
cat: seo
kw: technical seo checklist, technical seo for small business, website seo audit, seo basics
takeaways: Technical SEO makes sure search engines can find, read and trust your pages | Most small sites only need to get a dozen fundamentals right | Free tools like Search Console and PageSpeed Insights reveal most problems | Fix crawling and indexing issues before worrying about anything else
---
Technical SEO sounds intimidating, but for a small business website it comes down to a short list of things that must be right. Get them right and your content has a fair chance to rank. Get them wrong and nothing else you do will matter much.

Work through this checklist with your developer, or use it to audit your own site.

## Crawling and indexing

- [ ] **Your site is indexed.** Search `site:yourdomain.com` on Google. Your main pages should appear.
- [ ] **No accidental noindex.** Check that important pages don't carry a `noindex` tag left over from development.
- [ ] **robots.txt isn't blocking key pages** and points to your sitemap.
- [ ] **An XML sitemap exists** at `/sitemap.xml` and is submitted in Search Console.
- [ ] **Canonical tags** point each page to its preferred URL.
- [ ] **One version of the site.** `http`, `https`, `www` and non-`www` all redirect to a single version.

## Site structure

- [ ] **Clean, readable URLs:** `/services/boiler-repair/`, not `/page?id=47`
- [ ] **Every important page is reachable** within three clicks of the homepage
- [ ] **Internal links** connect related pages ([guide](/blog/internal-linking-guide/))
- [ ] **Breadcrumbs** on deeper pages
- [ ] **No broken links** or orphan pages

## On-page elements

- [ ] **A unique title tag** on every page, under about 60 characters
- [ ] **A unique meta description,** under about 155 characters
- [ ] **One H1 per page,** with H2s and H3s in logical order
- [ ] **Descriptive alt text** on meaningful images

See [title tags and meta descriptions](/blog/title-tags-meta-descriptions/).

## Speed and Core Web Vitals

- [ ] **Largest Contentful Paint** under 2.5 seconds on mobile
- [ ] **Interaction to Next Paint** under 200 milliseconds
- [ ] **Cumulative Layout Shift** under 0.1
- [ ] **Images compressed** and in modern formats
- [ ] **Lazy loading** for off-screen images
- [ ] **Minimal third-party scripts**

Explained in [Core Web Vitals for business owners](/blog/core-web-vitals-explained/).

## Mobile

- [ ] **Responsive design** that works on all screen sizes
- [ ] **Readable text** without zooming
- [ ] **Tap targets** large enough for thumbs
- [ ] **No horizontal scrolling**
- [ ] **Same content on mobile and desktop** (Google indexes the mobile version)

## Security

- [ ] **HTTPS everywhere** with a valid certificate
- [ ] **No mixed content** warnings
- [ ] **Software up to date** if you use a CMS

## Structured data

- [ ] **Organization or LocalBusiness** schema on the homepage
- [ ] **Service, Product, Article, FAQ** schema where relevant
- [ ] **Breadcrumb** schema
- [ ] **Validated** with Google's Rich Results Test

See the [schema markup guide](/blog/schema-markup-guide/).

## Redirects and errors

- [ ] **301 redirects** for any changed or removed URLs
- [ ] **A helpful 404 page**
- [ ] **No redirect chains** (A to B to C)
- [ ] **No server errors** in Search Console

[[audit]]

## International and language

- [ ] **Correct `lang` attribute** on the HTML
- [ ] **hreflang tags** if you have multiple language or country versions

## AI and modern search

- [ ] **Key content is in the HTML,** not only rendered by JavaScript
- [ ] **AI crawlers allowed** in robots.txt, if you want to appear in AI answers
- [ ] **llms.txt** summary file

See [how to get mentioned in AI search](/blog/ai-search-optimization/).

## Tools to check it all

| Tool | What it checks | Cost |
| --- | --- | --- |
| Google Search Console | Indexing, errors, queries | Free |
| PageSpeed Insights | Speed and Core Web Vitals | Free |
| Rich Results Test | Schema markup | Free |
| Screaming Frog | Full crawl, up to 500 URLs | Free tier |
| Bing Webmaster Tools | Bing indexing and audit | Free |

Our [Search Console guide](/blog/google-search-console-guide/) shows how to use the most important one.

## What to fix first

1. Anything stopping pages being indexed
2. HTTPS and duplicate versions
3. Mobile usability
4. Speed
5. Titles, descriptions and headings
6. Schema

## Frequently asked questions

### How often should I run a technical audit?
A quick check monthly in Search Console, and a fuller audit every six months or after any major site change.

### Do I need a developer?
For some fixes, yes. Many checks you can run yourself with free tools.

### Does technical SEO alone make a site rank?
No. It removes obstacles. You still need useful content and a good reputation.

=== schema-markup-guide
title: Schema Markup for Small Businesses: A Plain-English Guide
desc: What schema markup is, which types matter for small businesses, how to add it and how it helps you earn rich results and AI visibility.
cat: seo
kw: schema markup, structured data for small business, local business schema, faq schema, json-ld
takeaways: Schema is a label that tells search engines exactly what your content means | LocalBusiness, Service, FAQ, Review and Article are the types most small businesses need | It can earn rich results such as stars, FAQs and business details in search | JSON-LD is the recommended format and can be added without changing how your page looks
---
Search engines are good at reading text, but they still have to guess what it means. Is "Dan Reynolds" a person, a business or a place? Is "5.0" a rating or a version number? Schema markup removes the guessing. It's a standard vocabulary that labels your content so machines understand it precisely.

## What it looks like

Schema is usually added as a block of JSON-LD code in your page's HTML. Visitors never see it. A simple example for a local business:

`{"@type": "LocalBusiness", "name": "Harbour Dental", "telephone": "+44 1904 000000", "address": {...}, "openingHours": "Mo-Fr 09:00-17:30"}`

That tells Google, Bing and AI assistants: this is a business, here's its name, phone, address and hours.

## Why it matters

- **Rich results.** Stars, prices, FAQs, breadcrumbs and event details can appear in your search listing, making it bigger and more clickable.
- **Clarity.** Search engines are more confident about what you offer and where.
- **Knowledge panels and maps.** Consistent business data supports your local presence.
- **AI answers.** Assistants rely on structured, unambiguous information. See [how to get mentioned in AI search](/blog/ai-search-optimization/).

Schema doesn't guarantee rich results or rankings. It makes you eligible and removes ambiguity.

## The types small businesses need

### Organization / LocalBusiness

Your name, logo, contact details, address, hours, areas served and social profiles. Use the most specific subtype available: `Dentist`, `HairSalon`, `Plumber`, `Restaurant`, `LegalService`.

### Service

Describes each service you offer, who provides it and where.

### Product and Offer

For anything with a price: products, packages, templates. Enables price and availability in results.

### FAQPage

Marks up question-and-answer sections so machines can read them cleanly.

### Review and AggregateRating

Shows ratings for products and services. Follow Google's rules: reviews must be genuine and visible on the page, and self-serving reviews of your own business aren't eligible for star snippets.

### Article / BlogPosting

For articles: headline, author, dates and image. Supports author credibility.

### BreadcrumbList

Shows the page's position in your site, often displayed in search results.

### Person

For founders, practitioners and authors: name, role and credentials.

### Event, Course, Recipe, JobPosting

Use when relevant; each can unlock its own rich result.

## How to add schema

1. **If you have a developer or a custom site:** have JSON-LD added to each page template. It should be generated from your real content so it never goes out of date.
2. **On WordPress:** plugins like Rank Math or Yoast add basic schema; check the output.
3. **On builders:** Wix and Squarespace add some automatically; extra types can often be added through a code block.
4. **By hand:** use Google's Structured Data Markup Helper or a generator, then paste the code into the page head.

## Test it

- **Rich Results Test** (search.google.com/test/rich-results) shows which rich results a page is eligible for
- **Schema Markup Validator** (validator.schema.org) checks syntax
- **Search Console** reports errors under Enhancements

## Rules to follow

- Mark up only content that's visible on the page
- Keep it accurate and current
- Don't mark up fake reviews or misleading information
- Use the most specific type that fits

Breaking the rules can lead to a manual action that removes rich results.

[[audit]]

## A sensible starting set

| Page | Schema |
| --- | --- |
| Homepage | Organization or LocalBusiness, WebSite |
| Service pages | Service, FAQPage, BreadcrumbList |
| Location pages | LocalBusiness with areaServed, FAQPage |
| Product pages | Product, Offer |
| Blog posts | BlogPosting, BreadcrumbList, FAQPage |
| About page | Person, AboutPage |

Every page on this site uses that structure. It's part of every Code Bunny build.

## Frequently asked questions

### Does schema improve rankings directly?
Not directly, but richer listings earn more clicks and clearer data helps search engines match you to the right searches.

### Is schema hard to maintain?
Not when it's generated automatically from your page content. Hand-written schema needs updating whenever details change.

### Will schema make stars appear next to my site?
Only for eligible types and genuine reviews. Google no longer shows stars for a business's own reviews of itself on its own site.

=== core-web-vitals-explained
title: Core Web Vitals Explained for Business Owners
desc: What Core Web Vitals are, why they matter for rankings and conversions, how to check yours and the most common fixes, explained without jargon.
cat: seo
kw: core web vitals, page speed for small business, largest contentful paint, website speed seo
takeaways: Core Web Vitals measure loading speed, responsiveness and visual stability | They affect rankings a little and conversions a lot | Check them free with PageSpeed Insights and Search Console | Images, fonts and third-party scripts cause most problems
---
Core Web Vitals are Google's way of measuring whether a page is pleasant to use. They're three numbers. You don't need to be technical to understand them, and knowing what they mean will help you have a much better conversation with whoever looks after your website.

## The three metrics

### Largest Contentful Paint (LCP): how fast it loads

The time until the biggest thing on screen (usually the main image or headline) appears.

- **Good:** under 2.5 seconds
- **Poor:** over 4 seconds

### Interaction to Next Paint (INP): how fast it responds

How quickly the page reacts when someone taps or clicks.

- **Good:** under 200 milliseconds
- **Poor:** over 500 milliseconds

### Cumulative Layout Shift (CLS): how stable it is

Whether things jump around as the page loads. You've felt this when you go to tap a button and an advert pushes it away.

- **Good:** under 0.1
- **Poor:** over 0.25

## Why they matter

**Rankings.** Core Web Vitals are part of Google's page experience signals. They won't lift a weak page above a great one, but between similar pages, the better experience tends to win.

**Conversions.** This is the bigger effect. Slow, jumpy pages lose visitors. A site that loads in two seconds instead of five keeps far more of the people you've worked hard to attract.

**Mobile.** Google measures the mobile experience, where connections and processors are slower.

## How to check yours

1. Go to [PageSpeed Insights](https://pagespeed.web.dev/)
2. Enter your URL
3. Look at the mobile tab first

You'll see two kinds of data:

- **Field data:** real experiences of your visitors over the last 28 days. This is what Google uses.
- **Lab data:** a simulated test, useful for diagnosing.

For the whole site, open **Search Console** and look at the Core Web Vitals report, which groups pages into good, needs improvement and poor. See our [Search Console guide](/blog/google-search-console-guide/).

## Common causes and fixes

### Slow LCP

| Cause | Fix |
| --- | --- |
| Huge hero image | Compress, resize, use WebP |
| Image loads late | Prioritise it; don't lazy-load the hero |
| Slow server | Better hosting or a CDN |
| Render-blocking CSS and fonts | Preload fonts, trim unused CSS |

### Poor INP

| Cause | Fix |
| --- | --- |
| Heavy JavaScript | Remove unused scripts, defer the rest |
| Too many third-party tools | Audit chat widgets, trackers and embeds |
| Bloated page builders | Simplify or rebuild |

### High CLS

| Cause | Fix |
| --- | --- |
| Images without dimensions | Set width and height |
| Late-loading fonts | Use `font-display: swap` and preload |
| Banners and embeds injected late | Reserve space for them |

More on images in our [image SEO guide](/blog/image-seo/).

## The usual suspects

In our audits, three things account for most failing sites:

1. **Unoptimised images**
2. **Too many plugins and third-party scripts**
3. **Heavy themes or page builders**

Fixing images alone often moves a site from red to green.

[[audit]]

## Can animations and good scores coexist?

Yes. Animation only hurts when it's implemented carelessly. This site uses scroll effects, a WebGL background and page transitions while keeping its first load light, because scripts are deferred and images are optimised. See [website animations and performance](/blog/website-animations-performance/).

## What score should I aim for?

Aim for all three metrics in the "good" range on mobile. Don't obsess over a perfect 100 lab score; real-user data matters more.

## When to rebuild

If your site is built on a platform or theme that makes good scores impossible, patching costs more than starting fresh. See [12 signs you need a new website](/blog/signs-you-need-a-new-website/).

## Frequently asked questions

### Do Core Web Vitals affect rankings a lot?
They're one factor among many. Content relevance matters more, but speed can be the tiebreaker and strongly affects conversions.

### Why is my desktop score good and mobile poor?
Phones have slower processors and connections. Google assesses mobile, so that's the score to fix.

### How long until improvements show?
Lab scores change immediately. Field data in Search Console updates over about 28 days.

=== title-tags-meta-descriptions
title: Title Tags and Meta Descriptions: How to Write Them (With Examples)
desc: How to write title tags and meta descriptions that rank and get clicked, with formulas, length guidance and examples for small business pages.
cat: seo
kw: title tags, meta descriptions, how to write title tags, seo titles, meta description examples
takeaways: The title tag is the strongest on-page signal you control | Put the main keyword near the front and keep titles under about 60 characters | Meta descriptions don't affect rankings directly but drive clicks | Every page needs a unique title and description
---
When your page appears on Google, the searcher sees two things: a blue headline and a short description beneath it. Those come from your title tag and meta description. They decide whether you rank for the right searches and whether anyone clicks.

They're also among the quickest SEO improvements you can make.

## Title tags

### What they are

The title tag is the page's name in the HTML. It appears in search results, browser tabs and when links are shared.

### Why they matter

It's one of the clearest signals to Google about what a page is about, and it's your headline in the results.

### How to write them

**Formula:** Primary keyword + benefit or detail | Brand

- "Wedding Photographer in Chicago & Peoria | Dan Reynolds Photography"
- "Emergency Plumber in Leeds, 24/7 Callouts | Harbour Plumbing"
- "Website Design for Coaches | Code Bunny"

**Rules:**

- **Under about 60 characters,** so it doesn't get cut off
- **Main keyword near the start**
- **Location** for local businesses
- **Unique** for every page
- **Readable.** Write for people, not a list of keywords.
- **Brand at the end,** except on the homepage where it can lead

### Common mistakes

- "Home" or "Welcome" as the homepage title
- The same title on every page
- Keyword stuffing: "Plumber Leeds | Plumbing Leeds | Leeds Plumbers"
- Titles that are too long or too vague

## Meta descriptions

### What they are

A short summary of the page that often appears under the title in search results.

### Why they matter

They don't influence rankings directly. They influence clicks, and more clicks mean more customers. Think of it as a tiny advert.

### How to write them

**Formula:** What the page offers + a reason to choose you + a call to action

- "Award-winning mortgage advice in Basingstoke for first-time buyers, remortgages and the self-employed. Free first consultation. 5.0 on Google from 186 reviews."
- "Custom-designed, hand-coded websites that load fast and rank on Google. Get a free homepage preview from Code Bunny."

**Rules:**

- **Under about 155 characters**
- **Include the keyword;** Google bolds matching words
- **Add proof:** a rating, a number, a guarantee
- **End with an action:** book, get, see, call
- **Unique** per page

Google sometimes rewrites descriptions to match the search. A well-written one is still used most of the time.

## Templates by page type

| Page | Title template |
| --- | --- |
| Homepage | [What you do] in [Location] \| [Brand] |
| Service | [Service] in [Location] \| [Brand] |
| Location | [Service] [Town] \| [Brand] |
| Blog post | [Question or topic as searched] |
| About | About [Brand]: [What makes you different] |
| Contact | Contact [Brand]: [Offer, e.g. Free Quote] |

## How to check your current tags

- Search `site:yourdomain.com` and scan the results
- In Search Console, review pages with high impressions and low click-through rate; their titles and descriptions need work
- Use a crawler like Screaming Frog to list every title and description and spot duplicates or missing ones

[[audit]]

## Improve click-through rate

In Search Console, find queries where you rank on page one but get few clicks. Rewrite those titles and descriptions to be more specific and appealing, then compare after a few weeks. It's one of the fastest ways to get more traffic without ranking any higher.

## What about headings?

Your on-page H1 should be closely related to the title tag but doesn't need to be identical. The title is for search results; the H1 is for the visitor who's arrived.

## Don't forget social sharing

Open Graph tags control how your page looks when shared on Facebook, LinkedIn, WhatsApp and elsewhere: title, description and image. Set them alongside your SEO tags.

## Frequently asked questions

### How long should a title tag be?
Aim for 50 to 60 characters. Google truncates by pixel width, so shorter is safer.

### Should every page have a meta description?
Yes. If one is missing, Google picks text from the page, which may not sell it well.

### How often should I update them?
Review them when rankings or click-through rates drop, or when your services change.
