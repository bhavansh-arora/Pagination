// Static site generator — no dependencies. Run: node src/build.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { films, site } from "./data.mjs";
import * as P from "./pages.mjs";

const out = join(dirname(fileURLToPath(import.meta.url)), "..");
const write = (file, html) => {
  const p = join(out, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html.replace(/\n\s*\n\s*\n/g, "\n\n"));
  console.log("  ✓", file);
};

write("index.html", P.home());
write("about.html", P.about());
write("films.html", P.filmsPage());
films.forEach((f, i) => write(`films/${f.slug}.html`, P.filmPage(f, i)));
write("experience.html", P.experience());
write("contact.html", P.contact());
write("404.html", P.notFound());

const pages = ["", "about.html", "films.html", "experience.html", "contact.html", ...films.map((f) => `films/${f.slug}.html`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site.url}/${p}</loc></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
