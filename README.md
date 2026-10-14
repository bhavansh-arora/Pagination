# Code Bunny

Redesign of [codebunny.net](https://www.codebunny.net/): a static site with no build step and no dependencies.

- `index.html`: home (services, recent work, marketplace teaser, testimonials)
- `about.html`: founder, capabilities, timeline
- `marketplace.html`: all 9 templates for sale, with niche filters
- `contact.html`: contact form (FormSubmit.co), WhatsApp, FAQ. `?site=beauty.codebunny.net` preselects the listing.
- `assets/css/style.css`, `assets/js/main.js`, `assets/img/`

Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.
