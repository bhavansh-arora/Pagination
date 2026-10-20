/* Site settings for the visual editor (admin/).
   The editor engine (editor.js, inspector.js, media.js, seo.js, auth.js) is the same on every site;
   everything specific to this site lives here. See README.md for each option. */
window.SITE_EDITOR_CONFIG = {
  name: "Dan Reynolds",                       // shown on the sign-in screen and browser tab
  initials: "DR",                              // the little logo (sign-in screen and editor top bar)
  signInImage: "assets/img/golden-hour-portrait-1600.webp",   // photo beside the sign-in form (optional)
  signInImageSet: "assets/img/golden-hour-portrait-800.webp 800w, assets/img/golden-hour-portrait-1600.webp 1600w",
  siteName: "Dan Reynolds Photography",        // shown in the Google preview
  storageKey: "dr-site-editor",                // browser storage keys (unique per site)
  sessionKey: "dr-auth-session",
  repo: { owner: "bhavansh-arora", repo: "danreynoldsphotography", branch: "main" },
  origin: "https://www.danreynoldsphotography.com",   // live address (fallback for SEO previews)
  titleSuffix: " — Dan Reynolds Photography",         // added to new pages' titles
  altSuffix: " — Dan Reynolds Photography",           // added to suggested photo alt text
  altDefault: "Wedding photo by Dan Reynolds Photography",
  videoAltSuffix: " (wedding film thumbnail)",
  // Suggested alt text from a photo's file name, e.g. "lexi-lucas-3" → "Lexi & Lucas wedding photo by …".
  altText: function (words, fileName) {
    if (words.length === 2 && !/(detail|portrait|skyline|coffee|filming|bts)/i.test(fileName)) return words[0] + " & " + words[1] + " wedding photo by Dan Reynolds Photography";
    return null;
  },

  // Friendly names in the page picker (other .html files are listed automatically).
  pages: { "index.html": "Home", "about.html": "About", "portfolio.html": "Portfolio", "films.html": "Films",
    "investment.html": "Investment", "contact.html": "Contact", "404.html": "404 page" },

  // Files and folders (paths from the site root).
  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap",
    "assets/css/styles.css"
  ],
  globalCss: "assets/css/editor-global.css",   // theme colours, custom CSS, header/footer styles
  uploadsDir: "assets/uploads/",
  brandDir: "assets/brand/",                   // favicon files
  pageTemplate: "contact.html",                // copied (with new content) when adding a page

  // Fonts offered in the Style panel.
  fonts: [
    { id: '"Inter Tight", "Helvetica Neue", Arial, sans-serif', label: "Inter Tight (site sans)" },
    { id: '"Instrument Serif", "Times New Roman", serif', label: "Instrument Serif (site italic)" },
    { id: '"Geist Mono", ui-monospace, monospace', label: "Geist Mono (site labels)" }
  ],

  // Quick colour swatches: [name, CSS value, preview hex].
  swatches: [["Gold", "var(--accent)", "#c6a46a"], ["Light gold", "var(--gold-hi)", "#e2c999"], ["Ivory", "var(--ivory)", "#efe7da"],
    ["Soft text", "var(--ink-2)", "#c3b9a9"], ["Muted", "var(--muted)", "#8d8373"], ["Dark", "var(--paper)", "#0d0b09"],
    ["Surface", "var(--paper-2)", "#15120f"], ["White", "#ffffff", "#ffffff"]],

  // Site colours editable under Site → Colours: [CSS variable, label, default].
  theme: {
    vars: [["--accent", "Gold accent (buttons, highlights)", "#c6a46a"], ["--gold-hi", "Light gold (headline accents)", "#e2c999"],
      ["--paper", "Page background", "#0d0b09"], ["--paper-2", "Card background", "#15120f"], ["--paper-3", "Raised areas", "#1e1a16"], ["--ink", "Main text", "#efe7da"],
      ["--ink-2", "Body text", "#c3b9a9"], ["--muted", "Small labels", "#8d8373"], ["--ivory", "Light buttons & text on photos", "#efe7da"]],
    groups: [["Background", [["--paper", "Page background"], ["--paper-2", "Cards & panels"], ["--paper-3", "Raised areas & photo placeholders"]]],
      ["Text", [["--ink", "Headings & main text"], ["--ink-2", "Body text"], ["--muted", "Small labels"], ["--ivory", "Light text on photos & buttons"]]],
      ["Accent", [["--accent", "Gold (buttons, highlights)"], ["--gold-hi", "Light gold (italic headline words)"]]]],
    // Extra CSS that follows a colour change (not saved into the theme region).
    extraCss: function (t) { return t["--accent"] ? ".btn--gold,.tile--gold{border-color:" + t["--accent"] + "}" : ""; }
  },

  // Editor-only CSS: show everything the live site animates or hides, so it can be edited.
  canvasBackground: "var(--paper,#0d0b09)",
  editModeCss: [
    ".rotator{display:inline-flex!important;flex-wrap:wrap;gap:0 .22em;width:auto!important;overflow:visible!important;padding:0!important;margin:0!important}",
    ".rotator__word{transform:none!important;opacity:1!important;grid-area:auto!important}",
    ".rotator__word+.rotator__word::before{content:'/';opacity:.35;margin-right:.18em;font-style:normal}",
    ".hero__slide{animation:none!important;clip-path:none!important}.hero__slide img{transform:none!important}",
    ".hero__media{z-index:0!important}.hero__frame::before{z-index:1!important;pointer-events:none}.hero__content{z-index:3}.hero__card{z-index:4}",
    ".hscroll__intro{display:flex!important;flex-direction:column;justify-content:space-between;gap:24px;flex:none;width:340px;padding-right:24px}",
    ".masonry__tag,.index-row__cta{opacity:1!important;transform:none!important}",
    ".marquee__track{animation:none!important}",
    ".form-success{display:grid!important;gap:16px;margin-top:24px;padding:20px;border:1px dashed #c6a46a;border-radius:16px}",
    ".form-success::before{content:'Shown after the inquiry form is sent';font:12px ui-monospace,monospace;color:#c6a46a}",
    ".is-in,.reveal,.reveal-img{opacity:1!important;transform:none!important;clip-path:none!important}",
    ".section>.container:empty::before{content:'Drop elements here';display:grid;place-items:center;min-height:78px;font:12px ui-monospace,monospace;color:rgba(198,164,106,.8)}",
    ".section>.container{min-height:96px;padding-block:16px}",
    ".stack:empty,.container:empty{min-height:96px}"
  ],
  // Extra editor-only CSS while editing the shared header (so the mobile menu can be edited too).
  headerEditCss: ".site-header{position:relative!important;transform:none!important;padding-bottom:12px}.mobile-menu{position:relative!important;inset:auto!important;clip-path:none!important;visibility:visible!important;min-height:620px}.mobile-menu__list a{opacity:1!important;transform:none!important}.skip-link{position:static!important;display:inline-block;margin:8px}",
  eagerImages: ".hscroll img[loading=lazy], .marquee img[loading=lazy]",  // images inside sideways strips
  slideshow: ".hero__slides",                 // a group of photos edited together (optional)

  // Starter content for "Add page".
  newPage: function (name, esc) {
    return '<section class="page-hero"><div class="container"><div class="page-hero__meta"><span class="label label--dot">' + esc(name) + '</span><span class="label">Dan Reynolds</span></div>' +
      '<div class="page-hero__grid"><h1 class="h-xl page-hero__title">' + esc(name) + '</h1><p class="lede">Introduce this page here. Drag sections in from the Blocks panel.</p></div></div></section>';
  },

  // The Add panel: [id, category ("Layout" | "Elements" | "Sections"), label, icon, HTML].
  // H gives helpers: H.SITE (site root URL) and H.ico(svgPathMarkup) for a 24px outline icon.
  blocks: function (H) {
    var SITE = H.SITE, ico = H.ico;
    var IMG = function (name) { return SITE + "assets/img/" + name + "-1600.webp"; };
    var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    var ARROW_UR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>';
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3.5v17l15-8.5z"/></svg>';
    var media = function (name, alt, ratio) { return '<div class="media ' + (ratio || "") + '"><img src="' + IMG(name) + '" alt="' + alt + '" loading="lazy"></div>'; };
    var btn = function (text, href, kind) { return '<a class="btn ' + (kind || "btn--gold") + '" href="' + href + '">' + text + ' <span class="btn__icon">' + ARROW + "</span></a>"; };
    var head = function (num, label, title, lede) {
      return '<div class="head' + (lede ? " head--split" : "") + '"><div class="head__top"><span class="label">(' + num + ") — " + label + '</span><span class="label">Section</span></div>' +
        '<h2 class="h-xl">' + title + "</h2>" + (lede ? '<p class="lede">' + lede + "</p>" : "") + "</div>";
    };
    var wrap = function (inner, extra) { return '<section class="section' + (extra ? " " + extra : "") + '"><div class="container">' + inner + "</div></section>"; };

    var BLOCKS = [
      // ---- Sections
      ["sec-page-hero", "Sections", "Page header", ico('<path d="M4 6h16M4 11h10M4 16h7"/>'),
        '<section class="page-hero"><div class="container"><div class="page-hero__meta"><span class="label label--dot">Page label</span><span class="label">Right label</span></div>' +
        '<div class="page-hero__grid"><h1 class="h-xl page-hero__title">A bold headline,<br><em>beautifully said.</em></h1><p class="lede">A short introduction to this page. Click any text to edit it.</p></div></div></section>'],
      ["sec-heading", "Sections", "Section heading", ico('<path d="M5 6h14M5 11h9"/><path d="M5 17h6"/>'),
        wrap(head("01", "Section label", "Two lines of<br><em>headline.</em>", "A sentence that supports the headline."))],
      ["sec-statement", "Sections", "Statement with photos", ico('<path d="M4 8h9M4 13h16M4 18h11"/><rect x="15" y="6" width="5" height="4" rx="2"/>'),
        wrap('<div class="head__top"><span class="label">(01) — Label</span><span class="label">Right label</span></div><p class="statement mt-l">A big, confident sentence<span class="inline-img" style="background-image:url(' + IMG("golden-hour-portrait") + ')"></span> with little photos set right <em>inside the words.</em></p>')],
      ["sec-split", "Sections", "Image + text", ico('<rect x="3" y="5" width="8" height="14" rx="2"/><path d="M14 8h7M14 12h7M14 16h5"/>'),
        wrap('<div class="ed-cols ed-cols--2" style="align-items:center">' + media("dan-filming", "Describe this photo", "ratio-portrait") +
        '<div class="stack"><span class="label">Label</span><h2 class="h-lg">Headline with an <em>accent.</em></h2><p class="body">Write a paragraph here. Click to edit text, double-click the photo to replace it.</p>' + btn("Call to action", "contact.html") + "</div></div>")],
      ["sec-bento", "Sections", "Bento grid", ico('<rect x="3" y="3" width="10" height="10" rx="2"/><rect x="15" y="3" width="6" height="10" rx="2"/><rect x="3" y="15" width="6" height="6" rx="2"/><rect x="11" y="15" width="10" height="6" rx="2"/>'),
        wrap(head("02", "What we do", "Two crafts,<br><em>one story.</em>", "A supporting sentence.") +
        '<div class="bento"><a class="tile tile--media c-7 r-2 span-6" href="portfolio.html">' + media("ceremony-dip", "A wedding moment", "") +
        '<div class="tile__overlay"><div><span class="label">01 — Photography</span><p class="tile__title">Stills that feel <em>alive.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></div></a>" +
        '<a class="tile tile--media c-5 r-2 span-6" href="films.html">' + media("dan-filming", "Filming", "") +
        '<div class="tile__overlay"><div><span class="label">02 — Film</span><p class="tile__title">Cinematic <em>films.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></div></a>" +
        '<div class="tile c-4"><div class="tile__top"><span class="label">Label</span><span class="pill">Pill</span></div><div><div class="tile__num foil">100<sup>unit</sup></div><p class="mt-s">Describe the number.</p></div></div>' +
        '<div class="tile c-4"><span class="label">Label</span><div><p class="h-md">A short <em>highlight.</em></p><p class="mt-s">Supporting detail.</p></div></div>' +
        '<a class="tile tile--gold c-4" href="contact.html"><div class="tile__top"><span class="label">Call to action</span><span class="circle-btn">' + ARROW_UR + '</span></div><div><p class="h-md">Check your <em>date.</em></p><p class="mt-s">Dates go fast.</p></div></a></div>')],
      ["sec-cards", "Sections", "Three cards", ico('<rect x="3" y="5" width="5" height="14" rx="1.5"/><rect x="9.5" y="5" width="5" height="14" rx="1.5"/><rect x="16" y="5" width="5" height="14" rx="1.5"/>'),
        wrap(head("03", "Cards", "Three things<br><em>worth knowing.</em>") + '<div class="ed-cols ed-cols--3">' +
        ["quinn-charlotte-2", "kelly-adam-2", "manny-karina"].map(function (n, i) {
          return '<article class="qcard">' + media(n, "Photo", "") + '<div class="qcard__body"><div><span class="label">0' + (i + 1) + '</span><p class="h-md mt-s">Card title</p></div><p class="body">A short description for this card.</p></div></article>';
        }).join("") + "</div>")],
      ["sec-quotes", "Sections", "Testimonials", ico('<path d="M5 9h5v6H5zM14 9h5v6h-5z"/>'),
        wrap(head("04", "Kind words", "Loved by<br><em>our couples.</em>") + '<div class="quotes">' +
        ["roseleina-cameron-2", "julia-kirk", "manny-karina"].map(function (n) {
          return '<figure class="qcard">' + media(n, "Couple", "") + '<div class="qcard__body"><blockquote><p>“Paste a kind review from a couple here.”</p></blockquote><figcaption class="qcard__who"><strong>Couple name</strong></figcaption></div></figure>';
        }).join("") + "</div>")],
      ["sec-process", "Sections", "Stacking steps", ico('<rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="12" width="16" height="8" rx="2"/>'),
        wrap(head("05", "How it works", "Three simple<br><em>steps.</em>") + '<div class="stack-cards">' +
        [["01", "First step", "lexi-lucas-1"], ["02", "Second step", "dan-coffee"], ["03", "Third step", "golden-hour-portrait"]].map(function (s, i) {
          return '<article class="stack-card" style="--i:' + i + '"><div class="stack-card__text"><span class="stack-card__num">Step ' + s[0] + ' / 03</span><div class="stack"><h3>' + s[1] + '</h3><p>Describe this step.</p></div></div>' + media(s[2], "Step photo", "") + "</article>";
        }).join("") + "</div>")],
      ["sec-pricing", "Sections", "Pricing cards", ico('<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/><path d="M6 9h2M16 9h2"/>'),
        wrap(head("06", "Collections", "Choose your<br><em>story.</em>") + '<div class="pricing" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">' +
        ["lexi-lucas-9", "dan-bts"].map(function (n, i) {
          return '<article class="price-card' + (i ? " price-card--feature" : "") + '">' + media(n, "Package photo", "") + '<div class="price-card__body"><div class="price-card__head"><span class="label">Package name</span><span class="pill">6 hours</span></div>' +
            '<div class="price"><small>From</small><strong>$3,500</strong></div><ul class="checklist"><li>Included item</li><li>Included item</li><li>Included item</li></ul>' + btn("Enquire", "contact.html", i ? "btn--gold btn--block" : "btn--ghost btn--block") + "</div></article>";
        }).join("") + "</div>")],
      ["sec-faq", "Sections", "FAQ", ico('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01"/>'),
        wrap('<div class="faq-layout"><div class="faq-layout__aside stack"><span class="label">(07) — FAQ</span><h2 class="h-xl">Questions,<br><em>answered.</em></h2></div><div class="faq">' +
        [1, 2, 3].map(function () { return '<details><summary>A common question?<span class="faq__icon" aria-hidden="true"></span></summary><div class="faq__body"><div><p>The answer goes here.</p></div></div></details>'; }).join("") + "</div></div>")],
      ["sec-film", "Sections", "Featured film", ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'),
        wrap('<div class="head__top"><span class="label">(08) — Featured film</span><a class="link" href="films.html">All films ' + ARROW + "</a></div>" +
        '<div class="mt-l"><button class="yt yt--feature" type="button" data-id="Gpq9IPxnIhE" aria-label="Play film"><img src="https://i.ytimg.com/vi/Gpq9IPxnIhE/maxresdefault.jpg" alt=""><span class="yt__play">' + PLAY + '</span><span class="yt__over"><span class="h-lg">Film <em>title</em></span></span></button></div>')],
      ["sec-gallery", "Sections", "Photo grid", ico('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
        wrap('<div class="gallery-grid">' + ["colin-amanda-2", "lexi-lucas-6", "ethan-gwyn-3", "roseleina-cameron-1", "quinn-charlotte-1", "brian-tori"].map(function (n) { return media(n, "Wedding photo", ""); }).join("") + "</div>")],
      ["sec-banner", "Sections", "Full-width photo", ico('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 15l6-5 5 4 3-2 6 4"/>'),
        '<div class="frame">' + media("chicago-skyline-couple", "Describe this photo", "ratio-cinema") + "</div>"],
      ["sec-cta", "Sections", "Call to action", ico('<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M9 12h6"/>'),
        wrap('<a class="tile tile--gold" href="contact.html" style="min-height:0;flex-direction:row;flex-wrap:wrap;align-items:center"><div><span class="label">Limited dates</span><p class="h-lg mt-s">Let\'s tell <em>your story.</em></p></div><span class="circle-btn">' + ARROW_UR + "</span></a>")],
      ["sec-marquee", "Sections", "Scrolling words", ico('<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>'),
        '<div class="marquee marquee--words" aria-hidden="true"><div class="marquee__track"><span>Authentic</span><span>Cinematic</span><span>Timeless</span><span>Authentic</span><span>Cinematic</span><span>Timeless</span></div></div>'],
      // ---- Layout
      ["lay-2", "Layout", "2 columns", ico('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>'),
        '<div class="ed-cols ed-cols--2"><div class="stack"><p class="body">Column one. Drag elements in here.</p></div><div class="stack"><p class="body">Column two.</p></div></div>'],
      ["lay-3", "Layout", "3 columns", ico('<rect x="2" y="4" width="6" height="16" rx="1.5"/><rect x="9" y="4" width="6" height="16" rx="1.5"/><rect x="16" y="4" width="6" height="16" rx="1.5"/>'),
        '<div class="ed-cols ed-cols--3"><div class="stack"><p class="body">Column one.</p></div><div class="stack"><p class="body">Column two.</p></div><div class="stack"><p class="body">Column three.</p></div></div>'],
      ["lay-section", "Layout", "Section", ico('<rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3"/>'),
        '<section class="section"><div class="container"><p class="body">New section. Drag headings, text, photos and buttons in here.</p></div></section>'],
      ["lay-section-h", "Layout", "Section with heading", ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>'),
        '<section class="section"><div class="container stack"><span class="label label--dot">Small label</span><h2 class="h-xl">Section title</h2><p class="lede">A sentence or two introducing this section.</p></div></section>'],
      ["lay-html", "Layout", "Custom HTML", ico('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>'),
        '<div class="custom-html"><p class="body">Custom HTML: select this block and paste your code in the panel on the left.</p></div>'],
      ["lay-spacer", "Layout", "Spacer", ico('<path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>'), '<div class="spacer"></div>'],
      ["lay-divider", "Layout", "Divider", ico('<path d="M3 12h18"/>'), '<hr class="divider">'],
      // ---- Elements
      ["el-heading", "Elements", "Heading", ico('<path d="M6 5v14M18 5v14M6 12h12"/>'), '<h2 class="h-lg">A heading with an <em>accent</em></h2>'],
      ["el-text", "Elements", "Paragraph", ico('<path d="M4 7h16M4 12h16M4 17h10"/>'), '<p class="body">Write something here. Select text to make it bold, italic or a link.</p>'],
      ["el-label", "Elements", "Small label", ico('<path d="M4 12h3M10 12h10"/>'), '<span class="label label--dot">Small label</span>'],
      ["el-button", "Elements", "Gold button", ico('<rect x="3" y="8" width="18" height="8" rx="4"/>'), btn("Check your date", "contact.html")],
      ["el-button2", "Elements", "Outline button", ico('<rect x="3" y="8" width="18" height="8" rx="4" stroke-dasharray="2 2"/>'), btn("See the work", "portfolio.html", "btn--ghost")],
      ["el-link", "Elements", "Text link", ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'), '<a class="link" href="about.html">Read more ' + ARROW + "</a>"],
      ["el-image", "Elements", "Photo", ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-4 4 3 3-2 6 4"/>'), media("golden-hour-portrait", "Describe this photo", "ratio-land")],
      ["el-video", "Elements", "YouTube film", ico('<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M10 9.5l4.5 2.5-4.5 2.5z"/>'),
        '<button class="yt" type="button" data-id="k7mlTdWmj0o" aria-label="Play film"><img src="https://i.ytimg.com/vi/k7mlTdWmj0o/maxresdefault.jpg" alt=""><span class="yt__play">' + PLAY + "</span></button>"],
      ["el-videofile", "Elements", "Video file", ico('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
        { tagName: "div", classes: ["media", "ratio-wide"], components: [{ type: "video", src: "", autoplay: true, loop: true, controls: false, attributes: { muted: "", playsinline: "", preload: "metadata" } }] }],
      ["el-quote", "Elements", "Quote", ico('<path d="M6 9h4v5H6zM14 9h4v5h-4z"/>'), '<blockquote class="statement" style="font-size:clamp(1.4rem,1rem + 2vw,2.6rem)">“A memorable quote goes here.”</blockquote>'],
      ["el-stat", "Elements", "Stat tile", ico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), '<div class="tile"><span class="label">Label</span><div><div class="tile__num foil">18<sup>months</sup></div><p class="mt-s">Explain the number.</p></div></div>'],
      ["el-pill", "Elements", "Pill", ico('<rect x="4" y="9" width="16" height="6" rx="3"/>'), '<span class="pill">Pill text</span>'],
      ["el-list", "Elements", "Checklist", ico('<path d="M4 7l2 2 3-3M4 14l2 2 3-3M12 8h8M12 15h8"/>'), '<ul class="checklist"><li>First item</li><li>Second item</li><li>Third item</li></ul>']
    ];
    return BLOCKS;
  }
};
