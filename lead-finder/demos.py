"""Build a personalised demo website for each lead from your own template repos.

Each lead gets a copy of the right template (dentist, doctor, salon, interior design,
furniture) with their business name, phone, email, address and city swapped in, at
its own address: demo-site/<slug>/ -> https://demo.yourdomain.com/<slug>/

Every demo also gets:
- a "noindex" tag, so Google never lists it as the business's site
- a small "Preview made for <business>" label, so nobody mistakes it for their live site
- your "Love this site? Make it yours" WhatsApp button, with a message that says which
  business is claiming it

Images, CSS and scripts are stored once per template (demo-site/_t/<template>/) and
shared by every demo, so 100 demos stay small.
"""

import html
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from outreach import _business, demo_slug

CACHE = Path(__file__).with_name(".template-cache")

# What each template contains, so it can be swapped for the lead's details.
TEMPLATES = {
    "dentist": {
        "repo": "https://github.com/bhavansh-arora/dentist",
        "matches": ["dentist", "dental", "orthodont", "endodont", "periodont"],
        "brand_full": ["Dentava Dental Studio"],
        "brand_short": ["Dentava"],
        "phones": ["(800) 555-0123"],
        "tels": ["+18005550123"],
        "emails": ["hello@dentava.com"],
        "addresses": ["128 Maple Avenue, Suite 4, Austin, TX 78701", "128 Maple Avenue, Suite 4"],
        "city_lines": ["Austin, TX 78701", "Austin, TX"],
        "cities": ["Austin"],
    },
    "doctor": {
        "repo": "https://github.com/bhavansh-arora/doctor",
        "matches": ["doctor", "clinic", "physician", "medical", "physio", "chiropract", "pediatric", "family practice",
                    "urgent care", "health", "med spa", "dermatolog", "therap"],
        "brand_full": ["Meridian Care Clinic"],
        "brand_short": ["Meridian"],
        "phones": ["(555) 010-2938"],
        "tels": ["+15550102938"],
        "emails": ["hello@meridiancare.example"],
        "addresses": ["123 Health Avenue, Suite 200, Springfield, ST 62704", "123 Health Avenue, Suite 200, Springfield",
                      "123 Health Avenue, Suite 200"],
        "city_lines": ["Springfield, ST 62704"],
        "cities": ["Springfield"],
    },
    "salon": {
        "repo": "https://github.com/bhavansh-arora/salon",
        "matches": ["salon", "barber", "hair", "beauty", "spa", "groom", "nail", "tattoo", "lash", "brow"],
        "brand_full": ["CROWN & BLADE Barber Co.", "CROWN &amp; BLADE Barber Co."],
        "brand_short": ["CROWN & BLADE", "CROWN &amp; BLADE"],
        "upper": True,
        "phones": ["+1 (718) 555-0142"],
        "tels": ["+17185550142"],
        "emails": [],
        "addresses": ["118 Bedford Avenue, Brooklyn, NY 11249"],
        "city_lines": ["Brooklyn, NY 11249"],
        "cities": ["Brooklyn"],
    },
    "interior": {
        "repo": "https://github.com/bhavansh-arora/atelier-interior-design-studio",
        "matches": ["interior", "architect", "home decor", "renovation", "remodel", "design studio", "kitchen"],
        "brand_full": ["Atelier Interiors"],
        "brand_short": ["Atelier"],
        "phones": ["+91 70179 05835"],
        "tels": [],
        "emails": ["hello@atelier-interiors.com"],
        "addresses": ["402, Ivory Terrace, Linking Road, Bandra West, Mumbai 400050"],
        "city_lines": ["Mumbai 400050"],
        "cities": ["Mumbai"],
        "js_keep": ["window.Atelier"],  # a script name, not the brand; leave it alone
    },
    "furniture": {
        "repo": "https://github.com/bhavansh-arora/furniture",
        "matches": ["furniture", "sofa", "mattress", "cabinet", "woodwork", "carpent", "upholster"],
        "brand_full": ["VEL<span>MORA</span>"],
        "brand_short": ["VELMORA"],
        "upper": True,
        "phones": ["+91 70179 05835"],
        "tels": [],
        "emails": ["hello@velmora.example"],
        "addresses": ["12 Artisan Lane, Jaipur, RJ 302001"],
        "city_lines": ["Jaipur, RJ 302001"],
        "cities": ["Jaipur"],
    },
}

GENERIC_WORDS = {
    "dental", "dentistry", "dentist", "dentists", "clinic", "studio", "studios", "salon", "barbershop", "barber", "co",
    "co.", "llc", "inc", "inc.", "ltd", "pllc", "pc", "dds", "dmd", "md", "care", "medical", "family", "center",
    "centre", "interiors", "interior", "design", "furniture", "group", "the", "and", "&", "spa", "services",
    "associates", "practice", "office", "shop", "store", "house",
}

CLAIM_TEXT_RE = re.compile(r"(api\.whatsapp\.com/send/?\?phone=\d+(?:&amp;|&)text=)[^&\"'`]*")
ASSET_ATTR_RE = re.compile(r'''((?:src|href|poster|data-src|data-bg)\s*=\s*["'])(?!https?:|//|#|mailto:|tel:|data:|javascript:|/)([^"']+)(["'])''', re.I)
SRCSET_RE = re.compile(r'''(srcset\s*=\s*["'])([^"']+)(["'])''', re.I)
CSS_URL_RE = re.compile(r'''(url\(\s*["']?)(?!https?:|//|data:|#|/)([^"')]+)(["']?\s*\))''', re.I)


def pick_template(lead):
    text = " ".join(str(lead.get(k) or "") for k in ("type", "category", "name")).lower()
    for key, t in TEMPLATES.items():
        if any(m in text for m in t["matches"]):
            return key
    return ""


def fetch_template(key, refresh=False):
    """Clone (or update) the template repo into a local cache."""
    CACHE.mkdir(exist_ok=True)
    dest = CACHE / key
    if dest.exists() and not refresh:
        return dest
    if dest.exists():
        shutil.rmtree(dest)
    subprocess.run(["git", "clone", "-q", "--depth", "1", TEMPLATES[key]["repo"], str(dest)], check=True,
                   env={**os.environ, "GIT_LFS_SKIP_SMUDGE": "1"})
    return dest


def short_name(name):
    words = name.replace(",", " ").split()
    while len(words) > 1 and words[-1].lower().strip(".") in GENERIC_WORDS:
        words.pop()
    while len(words) > 1 and words[0].lower() == "the":
        words.pop(0)
    return " ".join(words[:3]) or name


def _tel(lead):
    raw = lead.get("phone_intl") or lead.get("phone") or ""
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    if raw.strip().startswith("+"):
        return "+" + digits
    if len(digits) == 10:  # assume North America for a bare 10-digit number
        return "+1" + digits
    return "+" + digits


def _address(lead):
    return re.sub(r",\s*(USA|United States|India|UK|United Kingdom)$", "", (lead.get("address") or "").strip())


def _city(lead, address):
    area = (lead.get("area") or "").split(",")[0].strip()
    if area:
        return area
    parts = [p.strip() for p in address.split(",")]
    return parts[-2] if len(parts) >= 3 else ""


def _email(lead):
    if lead.get("best_email"):
        return lead["best_email"]
    site = lead.get("website") or ""
    host = urlparse(site if "://" in site else "http://" + site).netloc.lower().removeprefix("www.") if site else ""
    return f"hello@{host}" if host else ""


def lead_details(lead, me):
    name = _business(lead)
    short = short_name(name)
    address = _address(lead)
    return {
        "name": name, "short": short, "address": address, "city": _city(lead, address),
        "phone": lead.get("phone") or "", "tel": _tel(lead), "email": _email(lead),
        "slug": demo_slug(lead), "studio": me.get("studio") or me.get("name") or "",
    }


def _replacements(t, d, for_js=False):
    """Ordered (old, new) pairs: longest first so 'Dentava Dental Studio' goes before 'Dentava'."""
    esc = html.escape
    name, short = d["name"], d["short"]
    if t.get("upper"):
        name, short = name.upper(), short.upper()
    pairs = []
    for old in t["brand_full"]:
        if "<span>" in old:  # a logo split across tags, e.g. VEL<span>MORA</span>
            first, _, rest = short.partition(" ")
            if not rest:
                first, rest = short[: max(1, len(short) // 2)], short[max(1, len(short) // 2):]
            pairs.append((old, f"{esc(first)}<span>{esc(rest)}</span>"))
        else:
            pairs.append((old, name if for_js else esc(name)))
    if not for_js:
        for old in t["brand_short"]:
            pairs.append((old, esc(short)))
    if d["phone"]:
        pairs += [(p, esc(d["phone"])) for p in t["phones"]]
    if d["tel"]:
        pairs += [("tel:" + p, "tel:" + d["tel"]) for p in t["tels"]]
    if d["email"]:
        pairs += [(e, esc(d["email"])) for e in t["emails"]]
    if d["address"]:
        pairs += [(a, esc(d["address"])) for a in t["addresses"]]
        # The template's "City, ST 00000" line goes, since the lead's full address already includes it.
        pairs += [(sep + c, "") for c in t["city_lines"] for sep in (", ", ",<br>", "<br>", " ")] if not for_js else []
    if d["city"] and not for_js:
        pairs += [(c, esc(d["city"])) for c in t["cities"]]
    pairs.sort(key=lambda p: -len(p[0]))
    return pairs


def _apply(text, pairs, keep=()):
    protected = {}
    for i, k in enumerate(keep):
        token = f"\x00KEEP{i}\x00"
        protected[token] = k
        text = text.replace(k, token)
    for old, new in pairs:
        if old in ("",):
            continue
        if re.fullmatch(r"[A-Za-z]+", old):  # a single word: replace whole words only
            text = re.sub(rf"\b{re.escape(old)}\b", lambda _m, n=new: n, text)
        else:
            text = text.replace(old, new)
    for token, k in protected.items():
        text = text.replace(token, k)
    return text


def _claim_text(d):
    msg = (f"Hi! I'm from {d['name']} and I'd like to claim the website you built for us.\n\n"
           f"Demo: {d['slug']}")
    return quote_plus(msg)


def _rewrite_assets(page, shared_prefix):
    page = ASSET_ATTR_RE.sub(lambda m: m.group(1) + (m.group(2) if m.group(2).endswith(".html") or
                                                     m.group(2).split("#")[0].endswith(".html")
                                                     else shared_prefix + m.group(2)) + m.group(3), page)
    page = SRCSET_RE.sub(lambda m: m.group(1) + ", ".join(
        (shared_prefix + part.strip() if part.strip() and not re.match(r"https?:|//|/|data:", part.strip()) else part.strip())
        for part in m.group(2).split(",")) + m.group(3), page)
    return CSS_URL_RE.sub(lambda m: m.group(1) + shared_prefix + m.group(2) + m.group(3), page)


def _head_extras(d):
    title = html.escape(f"{d['name']}: new website preview")
    return ('<meta name="robots" content="noindex, nofollow">'
            f'<meta property="og:title" content="{title}">'
            f'<meta property="og:description" content="{html.escape("A new website, made for " + d["name"] + ".")}">')


def _preview_label(d):
    by = f" by {html.escape(d['studio'])}" if d["studio"] else ""
    return ('<div style="position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:2147483646;'
            'background:rgba(17,17,17,.82);color:#fff;font:600 12px/1.2 system-ui,sans-serif;padding:7px 14px;'
            'border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap;'
            f'max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis">Preview made for '
            f'{html.escape(d["name"])}{by}</div>')


def build_demo(lead, me, site_dir, template_key=None):
    """Write demo-site/<slug>/ for one lead. Returns the slug and template used, or None."""
    key = template_key or pick_template(lead)
    if not key:
        return None
    t = TEMPLATES[key]
    src = fetch_template(key)
    site_dir = Path(site_dir)
    shared = site_dir / "_t" / key
    if not shared.exists():
        shutil.copytree(src, shared, ignore=shutil.ignore_patterns(".git", ".github", "*.html", "CNAME", "README.md"))
    d = lead_details(lead, me)
    out = site_dir / d["slug"]
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    html_pairs = _replacements(t, d)
    js_pairs = _replacements(t, d, for_js=True)
    claim = _claim_text(d)
    personal_js = {}
    for js in src.rglob("*.js"):
        if ".git" in js.parts:
            continue
        text = js.read_text(encoding="utf-8", errors="ignore")
        new = CLAIM_TEXT_RE.sub(lambda m: m.group(1) + claim, _apply(text, js_pairs, t.get("js_keep", ())))
        if new != text:
            rel = js.relative_to(src).as_posix()
            (out / rel).parent.mkdir(parents=True, exist_ok=True)
            (out / rel).write_text(new, encoding="utf-8")
            personal_js[rel] = True

    prefix = f"../_t/{key}/"
    for page in src.glob("*.html"):
        text = page.read_text(encoding="utf-8", errors="ignore")
        text = _apply(text, html_pairs, t.get("js_keep", ()))
        text = CLAIM_TEXT_RE.sub(lambda m: m.group(1) + claim, text)
        text = _rewrite_assets(text, prefix)
        for rel in personal_js:  # scripts with personal details live next to the page, not in the shared folder
            text = text.replace(prefix + rel, rel)
        text = re.sub(r"(<head[^>]*>)", lambda m: m.group(1) + _head_extras(d), text, count=1, flags=re.I)
        text = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + _preview_label(d), text, count=1, flags=re.I)
        (out / page.name).write_text(text, encoding="utf-8")
    return {"slug": d["slug"], "template": key}


def finish_site(site_dir, domain=""):
    """Root files for the demo site: no index of prospects, no search engines, optional custom domain."""
    site_dir = Path(site_dir)
    site_dir.mkdir(parents=True, exist_ok=True)
    (site_dir / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    (site_dir / "index.html").write_text(
        '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">'
        "<title>Website previews</title><p style=\"font-family:system-ui;margin:40px\">Nothing to see here.</p>",
        encoding="utf-8")
    (site_dir / ".nojekyll").write_text("", encoding="utf-8")
    if domain:
        (site_dir / "CNAME").write_text(domain + "\n", encoding="utf-8")


def build_demos(leads, me, site_dir, base_url="", template_key=None, progress=print, index_file=None):
    """Build demos for every lead a template fits. Sets lead['demo_url'] when base_url is given."""
    built = skipped = 0
    for lead in leads:
        if not (lead.get("name") or lead.get("title")):
            continue
        result = build_demo(lead, me, site_dir, template_key)
        if not result:
            skipped += 1
            continue
        built += 1
        lead["demo_template"] = result["template"]
        if base_url:
            lead["demo_url"] = base_url.rstrip("/") + f"/{result['slug']}/"
        progress(f"  {_business(lead)[:40]:40} -> {result['slug']}/  ({result['template']} template)")
    domain = urlparse(base_url).netloc if base_url else ""
    finish_site(site_dir, domain if domain and not domain.endswith("github.io") else "")
    # The list of demos is kept outside the published folder, so the site never lists your prospects.
    index_file = Path(index_file) if index_file else Path(site_dir).with_name(Path(site_dir).name + "-index.json")
    index_file.write_text(json.dumps(
        [{"name": _business(l), "slug": demo_slug(l), "template": l.get("demo_template")}
         for l in leads if l.get("demo_template")], indent=2), encoding="utf-8")
    return built, skipped
