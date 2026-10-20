# Site editor (reusable admin panel)

A visual, Elementor-style editor for static websites hosted on **GitHub Pages**. Clients open
`yoursite.com/admin/`, sign in with a username and password, edit text, photos, videos, sections,
colours and SEO directly on the page, and press **Publish**. Every publish is one Git commit, so
every version is kept and can be restored.

The engine is identical on every site. Each site has **one settings file**,
`admin/site-config.js`, for its name, repo, colours, fonts and blocks.

```
admin/
  index.html          editor page (don't edit)
  editor.js           engine: canvas, blocks, publishing, history
  inspector.js        engine: Content / Style / Advanced panel, Site panel
  media.js            engine: photo & video library (upload, replace, delete)
  seo.js              engine: titles, descriptions, alt text, favicon, Google checklist
  auth.js             engine: sign-in (token stored encrypted in auth.json)
  editor.css          engine: editor look
  vendor/             GrapesJS 0.21.13
  site-config.js      ← THE ONLY FILE YOU CHANGE PER SITE
  assets.json         optional photo library list (see below)
example-site/         a tiny demo site with the markers already in place
```

## What a site needs

1. **Static HTML pages in the repository root** (`index.html`, `about.html`, …), published with GitHub Pages.
2. **Marker comments** around the editable parts of each page:

   ```html
   <!-- editor:header -->  …shared header…  <!-- /editor:header -->
   <main>
   <!-- editor:main -->    …this page's content…  <!-- /editor:main -->
   </main>
   <!-- editor:footer -->  …shared footer…  <!-- /editor:footer -->
   ```

   `main` is required on every page. `header` and `footer` are optional; when present, editing them
   updates every page at once.
3. **Images and other files under `assets/`** (e.g. `assets/img/…`). Uploads go to `assets/uploads/`.
4. **A global editor stylesheet** linked on every page **after** your main CSS (recommended):
   `<link rel="stylesheet" href="assets/css/editor-global.css">`. The editor saves site colours,
   custom CSS and header/footer styles into it. Start it with:

   ```css
   /* editor:theme */
   /* /editor:theme */
   /* editor:custom */
   /* /editor:custom */
   /* editor:header */
   /* /editor:header */
   /* editor:footer */
   /* /editor:footer */
   ```
5. For the **Site → Colours** panel: your CSS should use CSS variables on `:root`
   (e.g. `--brand`, `--bg`), listed in `theme.vars` in the config.

The editor adds a `<style id="page-styles">` to each page's `<head>` for per-element styling, and
keeps titles, descriptions, canonical links and `sitemap.xml` up to date.

## Set up a new site (about 15 minutes)

1. Copy the `admin/` folder into the site's repository root.
2. Edit `admin/site-config.js`: at minimum `name`, `repo` (owner, repo, branch), `origin`,
   `storageKey` / `sessionKey` (unique per site), `pages`, `stylesheets`, and `theme.vars`.
3. Add the marker comments and `editor-global.css` to the pages (see above). The `example-site/`
   folder shows a complete minimal setup.
4. Commit and push. Wait for GitHub Pages to deploy.
5. Try it without signing in: open `https://yoursite.com/admin/?preview`. Everything works except Publish.
6. **One-time sign-in setup (site owner):**
   - On GitHub, create a **fine-grained personal access token** limited to this one repository, with
     **Contents: Read and write** permission.
   - Open `https://yoursite.com/admin/?setup`, paste the token, and create the first editor account
     (username and a strong password).
   - The token is encrypted with that password (AES-GCM, PBKDF2 600k) and saved to
     `admin/auth.json` in the repo. It is never stored in plain text, and editors never see it.
   - More editors can be added later from ⚙ Account.
7. Give the client `yoursite.com/admin/` with their username and password.

## Updating the editor on every site

The engine files don't contain anything site-specific. To update a site, copy in the new engine
files and **keep its `site-config.js`, `auth.json` and `assets.json`**.

## Config reference (`admin/site-config.js`)

| Option | What it does |
|---|---|
| `name`, `initials`, `siteName` | Branding on the sign-in screen and top bar; name in the Google preview |
| `signInImage`, `signInImageSet` | Photo beside the sign-in form (optional) |
| `repo` | **Required.** `{ owner, repo, branch }` the site publishes from |
| `origin` | Live address, used for SEO previews |
| `storageKey`, `sessionKey` | Browser storage keys; unique per site so sessions don't mix |
| `pages` | Friendly names for the page picker (other root `.html` files appear automatically) |
| `stylesheets` | CSS (and font) URLs the editor loads so pages look like the live site |
| `globalCss`, `uploadsDir`, `brandDir` | Where colours/custom CSS, uploads and favicon files are saved |
| `pageTemplate`, `newPage(name, esc)`, `titleSuffix` | How "Add page" builds a new page |
| `fonts` | Font choices in the Style panel |
| `swatches` | Quick colours in the text toolbar `[name, css value, hex]` |
| `theme.vars`, `theme.groups`, `theme.extraCss` | Site colours editable under Site → Colours |
| `editModeCss`, `headerEditCss`, `canvasBackground`, `eagerImages` | Editor-only CSS (never published), e.g. show elements the live site animates in |
| `slideshow` | Selector for a photo group edited together (e.g. a hero slideshow) |
| `altSuffix`, `altDefault`, `altText(words, fileName)`, `videoAltSuffix` | Suggested alt text for photos |
| `blocks(H)` | The Add panel: `[id, "Layout" \| "Elements" \| "Sections", label, icon, html]`. `H.ico(paths)` makes an icon, `H.SITE` is the site root URL. Leave it out for plain-HTML blocks. |

### Photo library (`admin/assets.json`, optional)

Lists the site's own photos for the Media panel: `[{ "src": "assets/img/photo.jpg", "name": "photo" }]`.
Photos exported in responsive sizes named `name-1600.webp` / `name-800.webp` are grouped as one photo.
Uploaded photos and videos appear automatically, even without this file.

## Notes

- Works on any static host whose files live in a GitHub repository; publishing uses the GitHub
  Git Data API (one commit per publish), and the live-site check waits until the new version is served.
- Pages must be plain HTML. Sites generated by a build tool (Next.js, Hugo, …) need their output
  committed, or a different approach.
