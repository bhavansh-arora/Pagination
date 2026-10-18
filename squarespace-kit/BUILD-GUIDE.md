# Dan Reynolds Photography: Squarespace build guide

How to rebuild **danreynoldsphotography.codebunny.net** inside Dan's existing Squarespace site so
all his integrations stay connected. Everything stays editable in the normal Squarespace editor.

**Files in this kit**

| File | What it is | Where it goes |
|---|---|---|
| `custom.css` | The whole look: colours, fonts, headings, buttons, images, FAQ, form, header | Website → Website Tools → **Custom CSS** |
| `code-injection.html` | One-line switch that turns the look on per page (then site-wide at launch) | Page settings → Advanced → **Page Header Code Injection** |
| `photos.zip` | All 52 photos as high-quality JPGs, same names as the live site | Uploaded into image blocks / galleries |

Keep the live site open in another tab while you build: **https://danreynoldsphotography.codebunny.net**.
Copy every piece of text straight from it.

---

## The 6 rules that keep the design (tell Dan these too)

1. **Every section → Edit Section → Colors → "Darkest 1".** (Use "Dark 1" for a slightly lighter panel.)
2. **Small label above a heading** (e.g. `(01) — THE STUDIO`) → text style **Paragraph 3**. It turns into the small uppercase gold-grey label.
3. **Gold italic words**: select the word(s) in a heading and press **Italic**. "Two crafts, *one story.*" → only *one story.* is italic.
4. **Big section heading** = **Heading 2**. **Page title** = **Heading 1**. **Big sentence** ("We're Dan & Lydia…") = **Heading 3**. **Card titles** = **Heading 4**. **Intro paragraph** = **Paragraph 1**. Normal text = **Paragraph 2**.
5. **Buttons**: **Primary** = gold pill (main action), **Secondary** = outline pill, **Tertiary** = text link with arrow ("Meet Dan & Lydia →").
6. Build each section on **desktop first, then switch to the mobile view** (phone icon top-right of the editor) and tidy the mobile layout. Fluid Engine keeps a separate mobile layout.

---

## Step 1. Access and plan (5 min)

1. Dan invites you: **Settings → Permissions & Ownership → Invite contributor → Administrator**. Accept the email.
2. Check the plan is **Core** or higher (or legacy Business/Commerce). Page code injection needs it.

## Step 2. Paste the CSS (2 min)

1. **Website → Website Tools (Utilities) → Custom CSS**.
2. If there's existing CSS, scroll to the **bottom** and paste the whole of `custom.css` below it. Save.
3. Nothing changes on Dan's live site yet: every rule only applies to pages with the switch from step 3.

## Step 3. Create the new pages, hidden (10 min)

1. **Pages** panel → under **Not Linked**, click **+** → **Blank page**. Create six:

   | Page title | URL slug |
   |---|---|
   | New Home | `/new-home` (becomes the homepage at launch) |
   | About | `/about-new` |
   | Portfolio | `/portfolio-new` |
   | Films | `/films-new` |
   | Investment | `/investment-new` |
   | Contact | `/contact-new` |

   Use temporary slugs so they don't clash with Dan's current pages. You'll change them at launch.
2. On **each** page: hover → **⚙ Settings → Advanced → Page Header Code Injection**, paste:
   - New Home: `<script>document.documentElement.classList.add("dr-site", "dr-home");</script>`
   - All others: `<script>document.documentElement.classList.add("dr-site");</script>`
3. Open a page: the background should go espresso-dark. If it doesn't, check the plan (step 1) and the CSS (step 2).
4. Also in ⚙ Settings → **SEO**: copy each page's title and description from the live site (view the live page → right-click → *View page source* → the `<title>` and `<meta name="description">` lines).

## Step 4. Upload the photos

Unzip `photos.zip`. Each section below names the exact files (e.g. `ceremony-dip.jpg`). Squarespace keeps
uploads in its library, so you upload each photo once and reuse it.

---

## Step 5. Build each page

Notation: **Label** = Paragraph 3 · *italics* = make those words Italic · "copy" = copy the exact text from the live page.

### 5.1 New Home (`/new-home`)

**Section 1: Hero**
- Add Section → **blank section**. Edit Section: **Background → Image → `golden-hour-portrait.jpg`**, overlay/dim about 35%. **Section height: Large / Fill screen.** Content alignment: bottom.
- Blocks (left aligned, bottom of the section):
  - Label: `WEDDING PHOTO + FILM · ILLINOIS & WISCONSIN`
  - Heading 1: `Moments you'll *relive* again.` (the live site rotates "relive / see / hear / feel"; here it's one word. Note: the live page currently has a typo "yoou'll").
  - Paragraph 1: "Documentary-style wedding photos and cinematic films by husband-and-wife team Dan & Lydia Reynolds."
  - Buttons side by side: **Primary** "Check your date" → `/contact`, **Secondary** "See the work" → `/portfolio`.
- Optional: an Image block (small, top-right) of the YouTube thumbnail linking to Films, caption "Latest film · What if Wes Anderson filmed a wedding?". Leave it off on mobile.

**Section 2: The studio**
- Labels on one row: left `(01) — THE STUDIO`, right `PEORIA · CHICAGO · WISCONSIN`.
- Heading 3: `We're Dan & Lydia, a husband-and-wife team telling love stories through honest photographs and *cinematic film* so you can feel your day all over again.` (the little round photos inside the sentence aren't possible; leave them out.)
- Paragraph 3 row: `DOCUMENTARY APPROACH · TWO ARTISTS AT EVERY WEDDING · HAND-EDITED BY DAN`
- **Tertiary** button "Meet Dan & Lydia" → `/about`.

**Section 3: What we do** (the photo/number tiles)
- Labels: `(02) — WHAT WE DO` / `PHOTO · FILM · BOTH`. Heading 2: `Two crafts, *one story.*`. Paragraph 1: copy.
- Tile grid (Fluid Engine, 12 columns):
  - **Image block** `ceremony-dip.jpg`, spans 6 columns, tall. Design → **Poster**: title "Stills that feel *alive.*", subtitle "01 — Photography", click-through → `/portfolio`.
  - **Image block** `dan-filming.jpg`, 6 columns, Poster: "Cinematic *films.*", "02 — Film" → `/films`.
  - Four number tiles, each 3 columns: a **Shape block** (rectangle, colour `#1e1a16`) with a **Text block** on top:
    - Label "ON AVERAGE · PER HOUR", Heading 2 "100", Paragraph 2 "images · Delivered for every hour of coverage. A first look adds about 40% more."
    - Label "DAN + LYDIA", Heading 4 "Two artists at every wedding.", text copy.
    - Gold tile (Shape colour `#c6a46a`, text dark): Label "DATES GO FAST", Heading 2 "18 months+", text copy, links to `/contact`.
    - Label "FILM TEASER · 30–60 SEC", Heading 2 "14 days", text copy.
  - Quote tile: Shape + Text: "We worked with Dan and his wife Lydia…" (copy) and "— Eileen + Matt", Tertiary button "More about us" → `/about`.

**Section 4: Recent love stories**
- Add Section → **List → Carousel**. Section heading: label `(03) — RECENT LOVE STORIES`, Heading 2 `Real couples, *real moments.*`, text "Scroll through a few recent weddings, then open each couple's full gallery."
- 4 items (image, title, button "Full gallery ↗" → link opens in new tab):

  | Image | Title | Button link |
  |---|---|---|
  | `ethan-gwyn-barn.jpg` | Ethan & Gwyn | https://danreynolds.passgallery.com/-gwynandethanmills/gallery |
  | `amanda-rick.jpg` | Amanda & Rick | https://danreynolds.passgallery.com/-amandaandrickfrance/gallery |
  | `kelly-adam.jpg` | Kelly & Adam | https://danreynolds.passgallery.com/-kellyandadamporter/gallery |
  | `steve-taylor.jpg` | Steve & Taylor | https://danreynolds.passgallery.com/-steveandtaylortorresweddinggallery/gallery |
- Below: Tertiary button "See every love story" → `/portfolio`.

**Section 5: Featured film**
- Label `(04) — FEATURED FILM`, Tertiary "All films" → `/films`.
- **Video block**, full width: `https://www.youtube.com/watch?v=Gpq9IPxnIhE`.

**Section 6: Three simple steps**
- Label `(05) — HOW IT WORKS` / `INQUIRE · CALL · BOOK`, Heading 2 `Three simple *steps.*`, Paragraph 1 copy.
- Add Section → **List → Simple**, 3 columns:

  | Image | Title | Description (copy full text) |
  |---|---|---|
  | `lexi-lucas-1.jpg` | Submit an inquiry | "Step 01 / 03 · Day 1": Fill out the form, or message us… |
  | `dan-coffee.jpg` | Schedule a call | "Step 02 / 03 · Within a week": We'll answer your questions… |
  | `golden-hour-portrait.jpg` | Book it | "Step 03 / 03 · Your date is yours": Lock in your date, then relax… |
- Optional: **Marquee** block with: Authentic · Cinematic · Timeless · Documentary · Heartfelt · Unposed.

**Section 7: Kind words**
- Label `(06) — KIND WORDS` / `REAL REVIEWS`, Heading 2 `Loved by *our couples.*`, Paragraph 1 copy.
- **List → Simple**, 3 columns (image, quote as description, name as title):
  `roseleina-cameron-2.jpg` Rose · `julia-kirk.jpg` Eileen + Matt · `manny-karina.jpg` Manny + Karina (copy each quote).

**Section 8: Behind the lens**
- Label `(07) — FOLLOW ALONG`, Heading 2 `Behind the *lens.*`, Secondary buttons "@danreynoldsphotography" → https://www.instagram.com/danreynoldsphotography and "@danreynoldsfilms" → https://www.instagram.com/danreynoldsfilms.
- If Dan's Instagram is connected in Squarespace: **Social Links / Instagram block** (live feed). Otherwise **Gallery → Strip** with: `colin-amanda-6`, `lexi-lucas-9`, `quinn-charlotte-2`, `roseleina-cameron-3`, `ethan-gwyn-3`, `lexi-lucas-10`, `ben-tamar`, `yura-joe-2`, `brian-tori`, `kelly-adam-2`.

### 5.2 About (`/about-new`)

1. **Page hero**: Label `ABOUT US · DAN & LYDIA REYNOLDS`, Heading 1 `Get to know the team with *the vision.*`, Paragraph 1 copy. Below it a wide **Image block** `dan-patagonia.jpg` (aspect 21:9).
2. **Approach**: Label `(01) — OUR APPROACH` / `A TRUE TEAM EFFORT`, Heading 3 copy (italicise *Dan's name*).
3. **The team**: Label `(02) — THE TEAM` / `PHOTO · FILM`, Heading 2 `Meet the *two of us.*`, Paragraph 1 copy. Two columns: Image `dan-coffee.jpg` + Label "LEAD PHOTOGRAPHER & FILMMAKER" + Heading 2 "Dan" + text; Image `lydia.jpg` + Label "PHOTOGRAPHER & CREATIVE PARTNER" + Heading 2 "Lydia" + text.
4. **Our story**: Label `(03) — OUR STORY` / `SINCE ROCHESTER`, Heading 2 `My story began with *Kodak.*`, Paragraph 1 copy. Paragraph 3 line: `STRONG COFFEE · TRAVEL · FRESH, SEASONAL FOOD · OUR CATS · NEW CAMERA GEAR · GOLDEN HOUR`.
   Then three rows (image left, text right, alternate sides):
   - `dan-seattle.jpg`: Label "CHAPTER I.", Heading 4 "Rochester, New York", text copy.
   - `dan-lydia-mountains.jpg`: "CHAPTER II.", "A trip to Ireland", text copy (2 paragraphs).
   - `dan-filming.jpg`: "CHAPTER III.", "Today, together", text copy (2 paragraphs).
5. **Venues**: Label `(04) — FAVOURITE VENUES` / `ILLINOIS`, Heading 2 `Places we *love to shoot.*`, Paragraph 1 copy. A 2-column list of Heading 4 + Label pairs: Sarabande · Chicago, Ovation · Chicago, Joliet Union Station · Joliet, Haven on the Farm · Illinois, Sanctuary Events · Illinois, Le Fleur — 905 Room · Illinois. (Optional Marquee with the venue names.)
6. **Quote**: centred Heading 3 with the Manny + Karina quote, Label `— MANNY + KARINA`.

### 5.3 Portfolio (`/portfolio-new`)

1. **Page hero**: Label `PORTFOLIO · 38 SELECTED FRAMES`, Heading 1 `Love stories, *as they unfolded.*`, Paragraph 1 copy.
2. **Gallery**: Add Section → **Gallery → Masonry**. Design: 3 columns desktop, 2 mobile, spacing ~12px, **Lightbox: on**. Upload in this order (captions = couple names):
   `colin-amanda-2, lexi-lucas-6, ethan-gwyn-3, golden-hour-portrait, roseleina-cameron-1, lexi-lucas-3, colin-amanda-1, chicago-skyline-couple, ethan-gwyn-1, lexi-lucas-2, roseleina-cameron-3, colin-amanda-3, ceremony-dip, lexi-lucas-8, ben-tamar, ethan-gwyn-2, quinn-charlotte-2, lexi-lucas-5, colin-amanda-6, roseleina-cameron-4, bouquet-detail`
   then every remaining couple photo (`lexi-lucas-*`, `colin-amanda-*`, `ethan-gwyn-*`, `roseleina-cameron-*`, `yura-joe-*`, `quinn-charlotte-*`, `amanda-rick`, `kelly-adam*`, `steve-taylor`, `brian-tori`, `manny-karina`, `julia-kirk`) to reach 38.
   The live site's filter buttons (All work / Colin + Amanda / …) aren't a Squarespace feature. Skip them, or make one gallery section per couple with a Heading 4 above each.
3. **CTA**: Label "WANT THE FULL STORY?", Heading 4 "See a complete wedding, *start to finish.*", Primary "Request a full gallery" → `/contact`.
4. **Client galleries**: Label `(02) — CLIENT GALLERIES`, Heading 2 `Recent *love stories.*`, Paragraph 1 copy. Four rows, each: Label "01" + Heading 4 "Ethan & Gwyn" + Tertiary "Open gallery" (same 4 PassGallery links as Home section 4, open in new tab).

### 5.4 Films (`/films-new`)

1. **Page hero**: Label `FILMS · 16 WEDDING FILMS`, Heading 1 `Films you don't just watch. *You feel them.*`, Paragraph 1 copy. Full-width **Video block**: `https://www.youtube.com/watch?v=Gpq9IPxnIhE`.
2. **Recent films**: Label `(01) — WEDDING FILMS`, Tertiary "YouTube" → https://www.youtube.com/@danreynoldsphotography2735, Heading 2 `Recent *films.*`, Paragraph 1 copy.
   **Video blocks** in a 3-column grid (2 on tablet, 1 on mobile), each with Heading 4 title + Label below:

   | Title | Label | YouTube URL |
   |---|---|---|
   | Wedding Show Reel | Photo + film reel | https://youtu.be/k7mlTdWmj0o |
   | Clara + Vince | Chicago, Illinois | https://youtu.be/uMWyF0awV_Y |
   | Rebekah + Tyler | Fairlie — Chicago | https://youtu.be/iQ8-pWzK3gg |
   | Julia + Kirk | Westmoreland Country Club | https://youtu.be/I9k8FBiaOtc |
   | Lauren + Ben | Madison, Wisconsin | https://youtu.be/2XM_cg0nLqE |
   | Lauren + Joel | Chicago, Illinois | https://youtu.be/yAqZ-5NoTB4 |
   | Eileen + Matthew | Wedding film | https://youtu.be/7_heEQhFX18 |
   | Yura + Joe | Highlight reel | https://youtu.be/5Lx9Q7I5jT8 |
   | Eleanor + Ryan | Full highlight film | https://youtu.be/pIeFJgLjOj4 |
   | Jade + Lars | Highlight film | https://youtu.be/fAk-YClUN1Q |
   | Chloe + Grant | Highlight reel | https://youtu.be/nWng4rPcNxw |
   | Jevon + Keyariah | Highlight film | https://youtu.be/iq3GEm4Duq8 |
   | Toni + Andy | Wedding film | https://youtu.be/QsGi2K15s3o |
   | Liz + Ryan | Highlight reel | https://youtu.be/xVkxb2pO-w0 |
   | Ashley + Alex | Highlight reel | https://youtu.be/DNkte8PT0Ns |
   | Liz + Michael | Highlight reel | https://youtu.be/v3B8ATsWutQ |
3. **The kit**: Label `(02) — THE KIT` / `GEAR`, Heading 2 `Cinema tools, *quietly used.*`, Paragraph 1 copy. Tiles (Shape + Text, like Home section 3): Camera system / **Sony**, Stabiliser / **DJI Ronin 4D**, Aerials / **DJI Mavic 3**, Sound / **Pro audio**, Highlight film / **3–7 min**, Teaser / **30–60 sec**, gold tile "Film packages / **From $3,500**" → `/investment` (copy each tile's sentence).
4. **Commercial**: Label `(03) — COMMERCIAL & EVENTS`, Heading 2 `Beyond *the aisle.*`, Paragraph 1 copy. Video grid:
   St. Jude Run & Telethon · Peoria, Illinois — 2023 · https://youtu.be/v4EgbQTo9XU ·
   Gather Illinois · Venue promo — 4K · https://youtu.be/M250nWZPbeg ·
   Signature Smile Arts · Brand film — Homewood, IL · https://youtu.be/O0xD8kRDsFM ·
   NYU — Liu Fellowship in Implantology · Event documentary · https://youtu.be/i3sRv-bI0Hk

### 5.5 Investment (`/investment-new`)

1. **Page hero**: Label `INVESTMENT · COLLECTIONS FROM $3,500`, Heading 1 `And so the *adventure begins.*`, Paragraph 1 copy, wide Image `garden-estate-portrait.jpg`.
2. **Philosophy**: Label `(01) — OUR PHILOSOPHY` / `REAL · RAW · PERSONAL`, Heading 3 copy (italicise *quiet touches*).
3. **Collections**: Label `(02) — COLLECTIONS`, Heading 2 `Choose your *story.*`, Paragraph 1 copy. Two cards side by side, each = Shape block (`#15120f`, rounded) behind:
   - Image `lexi-lucas-9.jpg` · Label "PHOTO PACKAGE I · 6 HOURS" · Heading 2 "From $3,500" · bulleted list (copy the 8 items) · Paragraph 3 "MOST POPULAR: …" · Primary "Enquire about photo" → `/contact`.
   - Image `dan-bts.jpg` · "VIDEO PACKAGE I · 6 HOURS" · "From $3,500" · list (10 items) · note · Primary "Enquire about film" → `/contact`.
   - Full-width gold card (Shape `#c6a46a`): Label "PHOTO + FILM", Heading 2 "All in *one.*", text copy, Secondary "Ask about combos" → `/contact`.
4. **Three simple steps**: same as Home section 6 (in Squarespace you can **Save Section** on Home and add it here).
5. **The experience**: Label `(04) — THE EXPERIENCE`, Heading 2 `Stress-free, *start to finish.*`, Image `roseleina-cameron-3.jpg`, two text columns "ON THE DAY" / "AFTER THE DAY" (copy).
6. **FAQ**: Label `(05) — FAQ` / `GOOD TO KNOW`, Heading 2 `Questions, *answered.*`, Paragraph 1 copy, Primary "Ask us anything" → `/contact`. **Accordion block** with the 7 questions and answers (copy): Do you travel? · What gear do you use? · How far in advance should we book you? · Do you have insurance? · How many photos will we get? · How long until we get our images and films back? · Do you offer engagement photos?

### 5.6 Contact (`/contact-new`)

1. **Page hero**: Label `GET IN TOUCH · WE REPLY PERSONALLY`, Heading 1 `Let's talk about *your day.*`, Paragraph 1 copy.
2. **Two columns**:
   - Left (4 cols): Image `julia-kirk.jpg`, Label "BASED IN PEORIA, ILLINOIS", Heading 4 "No travel fee for Chicago, Central Illinois, Milwaukee & Madison.", then three Tertiary buttons: Instagram · Photo, Instagram · Films, Facebook (links in Home section 8 / footer).
   - Right (8 cols): **Form block**. If Dan already has an inquiry form wired to his integrations (CRM, email, Google Sheets, Mailchimp…), **reuse that form's Storage settings** so inquiries keep flowing to the same place. Fields:

     | Field | Type | Required |
     |---|---|---|
     | Your name | Name | ✓ |
     | Partner's name | Text | |
     | Email | Email | ✓ |
     | Phone | Phone | |
     | Wedding date | Date | |
     | Venue / location | Text | |
     | I'm interested in | Radio: Photography / Film / Photo + Film / Something else | |
     | Estimated guests | Dropdown: Under 50 / 50–100 / 100–150 / 150–250 / 250+ | |
     | How did you find us? | Dropdown: Instagram / Google / Venue / planner / Friend or family / YouTube / Other | |
     | Tell us about your day | Text area | ✓ |

     Submit button: "Send inquiry". **Post-submit message**: "Thank you, friend. We've got your note and can't wait to hear more about your day. Dan or Lydia will be in touch soon to set up a call."
   - Under the form, Paragraph 3: "WE REPLY TO EVERY INQUIRY PERSONALLY. YOUR DETAILS ARE NEVER SHARED."

---

## Step 6. Launch day (30 min)

Header and footer are shared by every page, so change them only now.

1. **Turn the look on site-wide**: Settings → Advanced → **Code Injection → Header**: `<script>document.documentElement.classList.add("dr-site");</script>`
2. **Header** (Edit Site Header):
   - Site title "Dan Reynolds" (or Dan's logo), colour theme **Darkest 1**.
   - Navigation: About, Portfolio, Films, Investment, Contact.
   - **Elements → Button: on**, text "Book a call", link `/contact`.
3. **Footer** (the last sections on any page, shared): rebuild the live footer:
   - Label "LIMITED DATES EACH YEAR"
   - Heading 2 "Let's tell *your story.*"
   - Primary "Check your date"
   - three columns:
     - Explore: page links
     - Follow: Instagram · Photo, Instagram · Films, YouTube, Facebook, X / Twitter
     - Serving: Chicago, Peoria & Central Illinois, Milwaukee, Madison, WI, Destinations worldwide
   - Paragraph 3 "© 2026 DAN REYNOLDS PHOTOGRAPHY · ILLINOIS & WISCONSIN".
4. **Swap the pages**:
   - Move Dan's old pages into **Not Linked**, or disable them; don't delete until he's happy.
   - Rename the new slugs to `/about`, `/portfolio`, `/films`, `/investment`, `/contact`. Squarespace offers to add redirects; accept.
   - Drag them into **Main Navigation**.
   - New Home → ⚙ → **Set as Homepage**.
5. **Old links**: Settings → Advanced → **URL Mappings**, e.g. `/old-gallery -> /portfolio 301`, for any old page addresses Google knows.
6. **Site-wide SEO**: Marketing → SEO: site title "Dan Reynolds | Chicago & Peoria Wedding Photographer & Films"; favicon (Design → Browser Icon) from Dan's logo.

## Step 7. Check before telling Dan it's live

- [ ] Every page on desktop, tablet and phone (Squarespace preview + a real phone).
- [ ] Gold italic words show on every heading that should have them.
- [ ] All buttons and links work; PassGallery links open in a new tab.
- [ ] Videos play; gallery lightbox opens.
- [ ] Submit the contact form once and confirm it arrives wherever Dan's integrations send it.
- [ ] Dan's existing integrations (scheduling, email, shop, analytics…) still work.

---

### What's simplified compared to the custom site (agreed trade-offs)

- Rotating word in the home headline → one fixed word.
- Hero photo slideshow → one photo (or a short background video).
- Little round photos inside the big sentences → left out.
- Sideways-scrolling stories → Squarespace carousel.
- Portfolio filter buttons → one gallery, or one gallery per couple.
- Scrolling word banners → Squarespace Marquee block (optional).

### If something looks off

The CSS targets Squarespace's standard blocks. If one element doesn't pick up the style (Squarespace
occasionally changes its markup), right-click it → **Inspect**, note its class, and add a rule
in Custom CSS starting with `html.dr-site`.
