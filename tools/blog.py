"""Blog engine for codebunny.net: parses tools/articles/*.md and renders article HTML.

Article file format (several articles per file):

    === url-slug
    title: Article title
    desc: Meta description (<= 155 chars)
    cat: strategy | coaches | photographers | solar | local | seo | design | tech
    kw: primary keyword, secondary keyword
    takeaways: First point | Second point | Third point
    date: 2026-11-16            (optional)
    ---
    Markdown body. Supports ## / ###, paragraphs, - lists, 1. lists, > callouts,
    **bold**, *italic*, [links](/url), `code`, | tables |, and shortcodes:
      [[cta]]                 inline free-preview call to action
      [[audit]]               inline free SEO audit call to action
      [[work:slug,slug]]      embed live portfolio projects
    A final "## Frequently asked questions" section with ### questions becomes FAQ schema.
"""
import glob
import html
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
LAUNCH = "2026-11-16"

CATEGORIES = {
    "strategy": {"name": "Website Strategy & Costs", "short": "Strategy", "desc": "Planning, budgeting and hiring for a small business website, without the jargon.", "link": ("/services/website-design/", "Website design & development"), "hue": "#f29228", "shots": ["dan-reynolds-photography", "mdj-mortgages", "carolest-pierre"]},
    "coaches": {"name": "Websites for Coaches", "short": "Coaches", "desc": "How coaches and consultants turn their website into a steady stream of discovery calls.", "link": ("/industries/coaches/", "Website design for coaches"), "hue": "#c58bff", "shots": ["highfifteen", "co-allies", "polish", "liveinflowcoaching", "takerootlifecoaching", "sharontabak"]},
    "photographers": {"name": "Photographers & Filmmakers", "short": "Photographers", "desc": "Portfolio sites, SEO and enquiry funnels for wedding photographers and videographers.", "link": ("/industries/photographers/", "Websites for wedding photographers"), "hue": "#ffb565", "shots": ["dan-reynolds-photography", "aristafilms", "capturedbykatherine", "jackalbert", "thethingsthatisee", "alphavisuals"]},
    "solar": {"name": "Solar & Energy", "short": "Solar", "desc": "Lead generation, local SEO and trust-building content for solar, battery and EV-charging installers.", "link": ("/industries/solar/", "Website design for solar companies"), "hue": "#ffd25e", "shots": ["ecohorizon", "sunflow", "lisolarenergy", "watthaus", "tpl-solar"]},
    "local": {"name": "Local Business", "short": "Local", "desc": "Websites, bookings and Google Maps visibility for salons, clinics, brokers, trades and other local businesses.", "link": ("/industries/local-business/", "Website design for local businesses"), "hue": "#7fcf9a", "shots": ["carolest-pierre", "mdj-mortgages", "ibrefrigeration", "tpl-dentist", "tpl-salon", "tpl-doctor"]},
    "seo": {"name": "SEO & AI Search", "short": "SEO", "desc": "Practical SEO for small businesses, from technical foundations to showing up in ChatGPT and Google AI Overviews.", "link": ("/services/seo/", "SEO services"), "hue": "#6fc3ff", "shots": ["ecohorizon", "mdj-mortgages", "vinc-lab"]},
    "design": {"name": "Design & Conversion", "short": "Design", "desc": "Web design, copywriting and conversion techniques that turn more visitors into leads.", "link": ("/services/website-redesign/", "Website redesign"), "hue": "#ff7a6b", "shots": ["thrill-lands", "aristafilms", "beneaththemuscle", "launchmint"]},
    "tech": {"name": "Apps, AI & E-commerce", "short": "Apps & AI", "desc": "AI chatbots, automation, mobile apps, online stores and payments for growing businesses.", "link": ("/services/software-development/", "Custom software & AI"), "hue": "#9ad0c2", "shots": ["custombotify", "dancecart", "launchmint", "tpl-furniture"]},
}


def slugify(s):
    s = re.sub(r"<[^>]+>", "", s).lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    return re.sub(r"[\s-]+", "-", s).strip("-")[:60]


def load_articles():
    arts = []
    for f in sorted(glob.glob(os.path.join(ROOT, "articles", "*.md"))):
        text = open(f, encoding="utf-8").read()
        for chunk in re.split(r"^=== ", text, flags=re.M)[1:]:
            slug, rest = chunk.split("\n", 1)
            meta_txt, body = rest.split("\n---\n", 1)
            meta = {}
            for line in meta_txt.strip().splitlines():
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
            a = {"slug": slug.strip(), "title": meta["title"], "desc": meta["desc"], "cat": meta["cat"],
                 "kw": [k.strip() for k in meta.get("kw", "").split(",") if k.strip()],
                 "takeaways": [t.strip() for t in meta.get("takeaways", "").split("|") if t.strip()],
                 "date": meta.get("date", LAUNCH), "updated": meta.get("updated", meta.get("date", LAUNCH)), "body": body.strip()}
            assert a["cat"] in CATEGORIES, (a["slug"], a["cat"])
            a["words"] = len(re.findall(r"\w+", re.sub(r"\[\[.*?\]\]", "", body)))
            a["minutes"] = max(3, round(a["words"] / 230))
            arts.append(a)
    slugs = [a["slug"] for a in arts]
    dup = {s for s in slugs if slugs.count(s) > 1}
    assert not dup, dup
    return arts


# ---------------------------------------------------------------- markdown
def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)", r"<em>\1</em>", t)

    def link(m):
        label, url = m.group(1), m.group(2)
        ext = url.startswith("http") and "codebunny.net" not in url
        return f'<a href="{url}"{" target=\"_blank\" rel=\"noopener\"" if ext else ""}>{label}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, t)


def render(body, shortcode):
    """Return (html, toc[(id,text)], faqs[(q, a_html)])."""
    lines = body.split("\n")
    out, toc, faqs = [], [], []
    i, in_faq, cur_q = 0, False, None
    para = []

    def flush():
        nonlocal para
        if para:
            h = "<p>" + inline(" ".join(para)) + "</p>"
            if in_faq and cur_q is not None:
                faqs[-1][1].append(h)
            else:
                out.append(h)
            para = []

    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            flush(); i += 1; continue
        m = re.match(r"^\[\[(.+?)\]\]$", ln.strip())
        if m:
            flush(); out.append(shortcode(m.group(1))); i += 1; continue
        if ln.startswith("## "):
            flush()
            text = ln[3:].strip()
            hid = slugify(text)
            if text.lower().startswith("frequently asked"):
                in_faq = True
            toc.append((hid, text))
            out.append(f'<h2 id="{hid}">{inline(text)}</h2>')
            i += 1; continue
        if ln.startswith("### "):
            flush()
            text = ln[4:].strip()
            if in_faq:
                cur_q = text; faqs.append((text, []))
            else:
                out.append(f'<h3 id="{slugify(text)}">{inline(text)}</h3>')
            i += 1; continue
        if re.match(r"^(\s*)[-*] ", ln) or re.match(r"^\d+\. ", ln):
            flush()
            ordered = bool(re.match(r"^\d+\. ", ln))
            items = []
            while i < len(lines) and (re.match(r"^[-*] ", lines[i]) or re.match(r"^\d+\. ", lines[i])):
                items.append(re.sub(r"^([-*]|\d+\.) ", "", lines[i]).strip()); i += 1
            tag = "ol" if ordered else "ul"
            h = f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"
            (faqs[-1][1] if in_faq and cur_q else out).append(h)
            continue
        if ln.startswith("> "):
            flush()
            q = []
            while i < len(lines) and lines[i].startswith(">"):
                q.append(lines[i][1:].strip()); i += 1
            out.append('<aside class="callout">' + "".join(f"<p>{inline(x)}</p>" for x in " ".join(q).split(" // ")) + "</aside>")
            continue
        if ln.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            head, data = rows[0], [r for r in rows[1:] if not re.match(r"^:?-{2,}", r[0])]
            h = '<div class="table-wrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            h += "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in data) + "</tbody></table></div>"
            out.append(h)
            continue
        para.append(ln.strip()); i += 1
    flush()
    faqs = [(q, "".join(a)) for q, a in faqs]
    if faqs:
        # replace the FAQ h2 + loose content with an accordion
        idx = next(k for k, h in enumerate(out) if h.startswith('<h2 id="frequently-asked'))
        acc = "".join(f'<details><summary>{inline(q)}<span class="pm" aria-hidden="true"></span></summary><div class="ans">{a}</div></details>' for q, a in faqs)
        out = out[:idx + 1] + [f'<div class="faq article-faq">{acc}</div>'] + out[idx + 1:]
    return "\n".join(out), toc, faqs


def plain(body):
    """Markdown body -> clean text for llms-full.txt / RSS."""
    t = re.sub(r"\[\[.*?\]\]", "", body)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()
