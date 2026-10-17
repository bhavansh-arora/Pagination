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

## Look & motion

- **Type:** Inter Tight (tight, oversized headlines), Instrument Serif italics for accent words, Geist Mono for small labels.
- **Palette:** espresso black (`#0e0c0a`), ivory type (`#efe7da`) and champagne gold (`#c6a46a`), with gold-foil numerals, gold hairlines and ivory sections for rhythm. All colours are CSS tokens at the top of `assets/css/styles.css`.
- **Motion** (`assets/js/motion.js`, using GSAP and ScrollTrigger, stored locally in `assets/vendor/`):
  - Cinematic preloader with a drawn monogram and a percentage count
  - Curtain transitions between pages
  - native scrolling (no scroll hijacking)
  - Hero slideshow with wipe transitions and a rotating word ("see / hear / feel")
  - Word-by-word masked headline reveals
  - A quote that lights up word by word as you scroll
  - Parallax inside image frames
  - Pinned horizontal "love stories" gallery on desktop
  - Scroll-velocity marquee and count-up stats
  - Custom cursor with "View / Play / Drag" labels, magnetic buttons and hover image previews
  - Process cards that stack as you scroll, a scroll progress bar, and static film grain baked into surfaces
- **Faces always in frame:** each photo has a face-detected focal point (`fx`/`fy` in `tools/image-meta.json`). Every crop and parallax effect centres on it, so no heads are cut off at any screen size.
- **Accessibility:** everything turns off under `prefers-reduced-motion`. The custom cursor only appears on mouse and trackpad devices.

## Before going live

1. **Inquiry form:** create a free form at [formspree.io](https://formspree.io) and replace `YOUR_FORM_ID` in `tools/build.py` (`build_contact`), then rebuild. Until then the form runs in demo mode: it validates and shows the thank-you state, but nothing is sent.
2. **Email / phone:** the original site doesn't publish them. Add them to the `info-list` on the contact page if wanted.
3. **Domain:** `SITE_URL` in `tools/content.py` controls canonical, OG and sitemap URLs.

## Visual editor (`/admin`)

Open **`/admin/`** on the live site (for example `danreynoldsphotography.codebunny.net/admin/`) to edit the website visually. It is hidden from search engines.

- **Edit anything:** click any text to type, double-click a photo to swap it, and drag sections to reorder them. The **Blocks** panel (grid icon, top right) has every section of this site ready to drag in, plus layout pieces (columns, spacer, divider) and elements (headings, buttons, photos, YouTube films, quotes, checklists). Use the **brush** icon to restyle anything (spacing, colours, fonts, sizes) and the **layers** icon to see the page structure.
- **Pages and shared areas:** pick a page from the dropdown, or choose **Header & menu** or **Footer** to change them on every page at once. **+ Page** adds a new page (and adds it to the sitemap). The editing panel sits on the left.
- **SEO** (the search button, with a live score out of 100 for the page):
  - **This page:** the Google title and description with character counters and a live Google preview, a social share image (any photo, cropped to 1200×630 automatically) with a share-card preview, the canonical URL, *Hide from Google* (noindex, also removed from `sitemap.xml`) and structured data (JSON-LD).
  - **Images & alt text:** every image on the page with its alt text to edit, a *Suggest* button, *Decorative* for purely decorative images, and *Fill missing from file names*. Photos swapped in without alt text get a suggested description automatically.
  - **Checklist:** title and description length, one H1, heading order, alt text, share image, indexing, canonical, amount of text, link text and structured data, each with a Fix button. *Check every page* reports titles (including duplicates), descriptions and missing alt text across the site.
  - **Site & favicon:** upload a new favicon (PNG, JPG or SVG; background, rounded corners and padding options). It is saved as `favicon.svg`, a 48px PNG, `apple-touch-icon.png`, `icon-512.png` and a multi-size `/favicon.ico`. Also set the site name, X/Twitter handle, browser theme colour, Google Search Console verification and Google Analytics 4, applied to every page.
- **Phone and tablet views:** use the device buttons at the top to check layouts. **`</>`** opens the raw HTML/CSS for full control.
- **Colours:** select anything and click **🎨 Colours** for brand-colour or custom text and background colours. To colour just a few words, select them while typing and use the **A** button in the text toolbar. **Edit site theme colours…** changes the brand palette on every page.
- **Everything is editable:** the editor shows content the live site animates or hides, so you can change every word. That includes the rotating "see / hear / feel" words, FAQ answers and the contact form's thank-you message.
- **Publishing status:** the pill at the top right always shows where things stand: *Unpublished changes → Saved to GitHub ✓ · going live… → Live on the website ✓* (confirmed against the live site). Click it to see every saved version of the page, open each on GitHub, or **Restore** an older version.
- **Element panel (Content / Style / Advanced):** click anything and the right panel opens on it, Elementor-style.
  - **Content:** photos (Change, a click-to-set focus point, and Adjust: alt text, fit, shape, zoom, flip, brightness, contrast, saturation, black & white, blur, opacity, rounded corners). It also covers YouTube films (link, title, custom or YouTube thumbnail), video files (source, thumbnail, autoplay, loop, muted, controls), links (see where anything links, change it, open in a new tab, nofollow, add or remove a link) and the HTML tag for headings and text. Containers list every photo inside them, including the small photos in headlines and the hero slideshow.
  - **Style:** fonts, colours, sizes, spacing, borders and layout, showing the values currently applied.
  - **Advanced:** CSS ID, classes (with suggestions from the site's stylesheet), any attributes, hide on desktop/tablet/phone, entrance animations (fade up, photo reveal, parallax) with delay, custom CSS for the element (`selector { … }`, including `:hover` and `@media`), and its full HTML code.
- **Media library:** the **Media** button lists every photo and video on the site, with where each one is used. Select a photo or video on the page and click **Use here** to swap it. **Replace everywhere…** swaps a photo or video file on every page at once, **Change video…** points a YouTube film at a new link wherever it appears, and unused uploads can be deleted. **Upload video** adds MP4/WebM files (under 90 MB): drag in the **Video file** block and pick one.
- **Publish:** puts the change live in one GitHub commit, and the site updates about a minute later. Every version is kept in GitHub's history, so anything can be rolled back. Unpublished work is kept as a draft in your browser, and **Ctrl/Cmd+S** saves a draft.

**Signing in.** Open `/admin/`. The first time, whoever owns the GitHub repository does a one-time setup:
1. Create a token: GitHub → Settings → Developer settings → [Fine-grained tokens → Generate new token](https://github.com/settings/personal-access-tokens/new). Name it "Site editor" and give it the longest expiration offered. Under *Repository access* choose *Only select repositories* → this repository. Under *Repository permissions* set **Contents: Read and write**, then generate and copy it (`github_pat_…`).
2. On the setup screen, paste the token and choose a username (default `admin`) and a strong password (*Generate* makes one). This saves the sign-in and opens the editor.

After that, everyone just signs in with a username and password. In **⚙ Account** you can add or remove people, change your password, sign out, and **replace the GitHub token** when it expires. Everyone keeps their own password when the token is replaced.

**How sign-in is secured:** the site is static, so everything in `/admin` is public. The GitHub token is therefore never stored in plain text. `admin/auth.json` holds it encrypted (AES-256-GCM) under a random master key, and each person's password unlocks that key (PBKDF2-SHA256, 600,000 rounds). A correct password decrypts the token in the browser, and it's kept only for that browser session (or on that computer if *Keep me signed in* is ticked). Because the encrypted file is public, passwords must be strong; the editor enforces this. `/admin/?preview` opens the editor without signing in (publishing disabled).

**How it works:** each page marks its editable areas with `<!-- editor:main -->`, `<!-- editor:header -->` and `<!-- editor:footer -->` comments. Page-specific styles are saved in `<style id="page-styles">`, and shared header/footer styles in `assets/css/editor-global.css`. Pages saved from the editor are the source of truth: `tools/build.py` skips them, unless you run it with `--force`, which overwrites editor changes.

## Editing (code)

Pages are generated by `tools/build.py` (layout: floating pill nav, bento grids, stacking process cards, rounded footer). All copy and lists (`PORTFOLIO`, `WEDDING_FILMS`, `FAQS`, `TESTIMONIALS`, social links) live in `tools/content.py`:

```bash
python3 tools/build.py      # regenerates every .html page
python3 -m http.server 8000 # preview at http://localhost:8000
```

To add a photo, save `name-800.webp` and `name-1600.webp` into `assets/img/`, add its width, height and placeholder colour to `tools/image-meta.json`, then reference it by `name`.

## Deploying

The site is fully static. Drag the folder into Netlify, Vercel, Cloudflare Pages or GitHub Pages; no configuration is needed.
