/* Site settings for the visual editor (admin/).
   This is the ONLY file you change per site. The engine files (editor.js, inspector.js, media.js,
   seo.js, auth.js, editor.css, vendor/) stay identical everywhere, so you can update them on every
   site at once. Paths are from the site root. Every option is optional unless marked REQUIRED. */
window.SITE_EDITOR_CONFIG = {
  name: "Example Studio",                      // shown on the sign-in screen and browser tab
  initials: "ES",                              // little logo (sign-in screen and editor top bar)
  siteName: "Example Studio",                  // shown in the Google search preview
  signInImage: "",                             // e.g. "assets/img/hero.jpg": photo beside the sign-in form

  // REQUIRED: the GitHub repository the site is published from (GitHub Pages).
  repo: { owner: "your-github-user", repo: "your-site-repo", branch: "main" },
  origin: "https://www.example.com",           // the live address (used for SEO previews)

  storageKey: "example-site-editor",           // browser storage keys: make these unique per site
  sessionKey: "example-site-editor-session",

  // Friendly names in the page picker. Other .html files in the repo root are listed automatically.
  pages: { "index.html": "Home", "about.html": "About" },

  // Stylesheets the editor loads so pages look exactly like the live site (fonts first).
  stylesheets: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
    "assets/css/styles.css"
  ],
  globalCss: "assets/css/editor-global.css",   // the editor saves site colours, custom CSS and header/footer styles here
  uploadsDir: "assets/uploads/",               // where uploaded photos and videos are committed
  brandDir: "assets/brand/",                   // where the favicon files are saved
  pageTemplate: "index.html",                  // copied (with new content) when "Add page" is used
  titleSuffix: " — Example Studio",            // added to new pages' titles
  altSuffix: " — Example Studio",              // added to suggested alt text for photos
  altDefault: "Photo by Example Studio",

  // Fonts offered in the Style panel (common web fonts are always added after these).
  fonts: [{ id: '"Inter", Arial, sans-serif', label: "Inter (site font)" }],

  // Quick colour swatches in the text toolbar: [name, CSS value, preview hex].
  swatches: [["Brand", "var(--brand)", "#2f6fed"], ["Text", "var(--text)", "#1d1d1f"], ["Muted", "#6e6e73", "#6e6e73"], ["White", "#ffffff", "#ffffff"]],

  // Site colours editable under Site → Colours: CSS variables your stylesheet uses on :root.
  theme: {
    vars: [["--brand", "Brand colour (buttons, links)", "#2f6fed"], ["--bg", "Page background", "#ffffff"], ["--text", "Main text", "#1d1d1f"]],
    groups: [["Background", [["--bg", "Page background"]]], ["Text", [["--text", "Main text"]]], ["Accent", [["--brand", "Brand colour"]]]]
    // extraCss: function (theme) { return ""; }  // optional CSS to add when colours change
  },

  // Editor-only CSS (never published): show things the live site animates or hides, so they can be edited.
  canvasBackground: "",                        // e.g. "var(--bg,#fff)"
  editModeCss: [".reveal{opacity:1!important;transform:none!important}"],
  headerEditCss: "",                           // extra editor-only CSS while editing the shared header
  eagerImages: "",                             // selector for lazy images in sideways-scrolling strips
  slideshow: "",                               // selector for a group of photos edited together, e.g. ".hero__slides"

  // Starter content for "Add page" (esc() escapes the page name).
  newPage: function (name, esc) {
    return '<section class="section"><div class="container"><h1>' + esc(name) + '</h1><p>Introduce this page here. Drag elements in from the Add panel.</p></div></section>';
  },

  // The Add panel. Leave this out to get plain-HTML building blocks. Each block:
  // [id, category ("Layout" | "Elements" | "Sections"), label, icon, HTML or component definition].
  // H.SITE is the site root URL; H.ico(svgPaths) makes a 24px outline icon.
  // Keep the ids lay-section, lay-2, lay-3, lay-html, el-heading, el-text, el-button, el-image if you can:
  // the editor treats "lay-html" (class custom-html) and "el-image" specially.
  blocks: function (H) {
    var ico = H.ico;
    return [
      ["lay-section", "Layout", "Section", ico('<rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3"/>'), '<section class="section"><div class="container"></div></section>'],
      ["lay-2", "Layout", "2 columns", ico('<rect x="3" y="4" width="8" height="16" rx="1.5"/><rect x="13" y="4" width="8" height="16" rx="1.5"/>'), '<div class="ed-cols grid-2"><div></div><div></div></div>'],
      ["lay-3", "Layout", "3 columns", ico('<rect x="2" y="4" width="6" height="16" rx="1.5"/><rect x="9" y="4" width="6" height="16" rx="1.5"/><rect x="16" y="4" width="6" height="16" rx="1.5"/>'), '<div class="ed-cols grid-3"><div></div><div></div><div></div></div>'],
      ["lay-html", "Layout", "Custom HTML", ico('<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/>'), '<div class="custom-html"><p>Custom HTML: edit it in the panel on the right.</p></div>'],
      ["el-heading", "Elements", "Heading", ico('<path d="M6 5v14M18 5v14M6 12h12"/>'), '<h2>A heading with an <em>accent</em></h2>'],
      ["el-text", "Elements", "Paragraph", ico('<path d="M4 7h16M4 12h16M4 17h10"/>'), '<p>Write something here. Select text to make it bold, italic or a link.</p>'],
      ["el-button", "Elements", "Button", ico('<rect x="3" y="8" width="18" height="8" rx="4"/>'), '<a class="button" href="#">Get in touch</a>'],
      ["el-image", "Elements", "Photo", ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-4 4 3 3-2 6 4"/>'), { type: "image" }],
      ["sec-hero", "Sections", "Hero", ico('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 10h8M6 14h5"/>'),
        '<section class="section hero"><div class="container"><h1>A bold headline, <em>beautifully said.</em></h1><p>One or two sentences that say what you do.</p><a class="button" href="#">Get in touch</a></div></section>']
    ];
  }
};
