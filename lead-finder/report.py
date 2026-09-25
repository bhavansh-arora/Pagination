"""Write the results as a CSV and a visual HTML report."""

import csv
import datetime
import html
import os
from pathlib import Path

CSV_FIELDS = [
    "name", "website", "grade", "score", "verdict", "best_email", "all_emails", "phone", "contact_form",
    "facebook", "instagram", "linkedin", "top_problems", "pitch_line", "address", "error",
]


def pitch_line(lead):
    ai = lead.get("ai") or {}
    if ai.get("pitch_line"):
        return ai["pitch_line"]
    issues = lead.get("issues") or []
    if not issues:
        return ""
    return f"When I opened your website on my phone, I noticed {issues[0]['pitch']}."


def write_csv(leads, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        w.writeheader()
        for lead in leads:
            socials = lead.get("socials") or {}
            w.writerow({
                "name": lead.get("name", ""),
                "website": lead.get("website", ""),
                "grade": lead.get("grade", ""),
                "score": lead.get("score", ""),
                "verdict": lead.get("verdict", ""),
                "best_email": lead.get("best_email", ""),
                "all_emails": "; ".join(lead.get("emails") or []),
                "phone": lead.get("phone") or "; ".join(lead.get("phones") or []),
                "contact_form": "yes" if lead.get("contact_form") else "",
                "facebook": socials.get("facebook", ""),
                "instagram": socials.get("instagram", ""),
                "linkedin": socials.get("linkedin", ""),
                "top_problems": " | ".join(i["finding"] for i in (lead.get("issues") or [])[:3]),
                "pitch_line": pitch_line(lead),
                "address": lead.get("address", ""),
                "error": lead.get("error") or lead.get("email_error", ""),
            })


def _e(s):
    return html.escape(str(s or ""), quote=True)


def _rel(path, base):
    return os.path.relpath(path, base).replace(os.sep, "/") if path else ""


def _card(lead, base):
    name = lead.get("name") or lead.get("title") or lead.get("website", "")
    site = lead.get("website", "")
    grade = lead.get("grade", "")
    emails = lead.get("emails") or []
    phones = [lead["phone"]] if lead.get("phone") else (lead.get("phones") or [])
    socials = lead.get("socials") or {}
    ai = lead.get("ai") or {}
    issues = lead.get("issues") or []
    pitch = pitch_line(lead)

    if lead.get("error") and not grade:
        return (
            f'<article class="card failed" data-grade="X" data-email="{1 if emails else 0}">'
            f'<header class="card-head"><div><h2>{_e(name)}</h2>'
            f'<a class="site" href="{_e(site)}" target="_blank" rel="noopener">{_e(site)}</a></div>'
            f'<span class="grade g-X">?</span></header>'
            f'<p class="muted">Couldn\'t check this site: {_e(lead["error"])}</p></article>'
        )

    shots = ""
    if lead.get("mobile_shot"):
        shots = (
            '<div class="shots">'
            f'<figure class="phone"><img loading="lazy" src="{_e(_rel(lead["mobile_shot"], base))}" alt="Phone view of {_e(name)}"><figcaption>Phone</figcaption></figure>'
            f'<figure class="laptop"><img loading="lazy" src="{_e(_rel(lead["desktop_shot"], base))}" alt="Laptop view of {_e(name)}"><figcaption>Laptop</figcaption></figure>'
            "</div>"
        )

    ai_html = ""
    if ai:
        bars = "".join(
            f'<div class="bar"><span>{label}</span><i style="--v:{ai[k] * 10}%"></i><b>{ai[k]}</b></div>'
            for k, label in [("overall", "Overall"), ("modern", "Modern"), ("mobile", "Phone"), ("trust", "Trust"), ("clarity", "Clarity")]
        )
        ai_problems = "".join(f"<li>{_e(p)}</li>" for p in ai.get("problems", []))
        ai_html = f'<div class="ai"><h3>Designer\'s eye <small>rated by Claude, out of 10</small></h3>{bars}' + (
            f"<ul>{ai_problems}</ul>" if ai_problems else "") + "</div>"

    issue_html = "".join(f"<li>{_e(i['finding'])}</li>" for i in issues) or "<li>No obvious problems found.</li>"

    contact = []
    if emails:
        contact.append(
            f'<div class="row"><span class="k">Email</span><span><b class="copyable">{_e(emails[0])}</b>'
            + (f' <span class="muted">+ {_e(", ".join(emails[1:4]))}</span>' if len(emails) > 1 else "")
            + f'</span><button type="button" class="copy" data-text="{_e(emails[0])}">Copy</button></div>'
        )
    else:
        contact.append('<div class="row"><span class="k">Email</span><span class="muted">None found on the site'
                       + (". It has a contact form." if lead.get("contact_form") else ".") + "</span></div>")
    if phones:
        contact.append(f'<div class="row"><span class="k">Phone</span><span>{_e(phones[0])}</span></div>')
    if socials:
        links = " · ".join(f'<a href="{_e(u)}" target="_blank" rel="noopener">{_e(n.title())}</a>' for n, u in socials.items())
        contact.append(f'<div class="row"><span class="k">Social</span><span>{links}</span></div>')

    pitch_html = ""
    if pitch:
        pitch_html = (f'<div class="pitch"><span class="k">Opening line</span><p>{_e(pitch)}</p>'
                      f'<button type="button" class="copy" data-text="{_e(pitch)}">Copy</button></div>')

    return (
        f'<article class="card" data-grade="{_e(grade)}" data-email="{1 if emails else 0}">'
        f'<header class="card-head"><div><h2>{_e(name)}</h2>'
        f'<a class="site" href="{_e(site)}" target="_blank" rel="noopener">{_e(site)}</a>'
        f'<p class="verdict">{_e(lead.get("verdict"))}</p></div>'
        f'<div class="score"><span class="grade g-{_e(grade)}">{_e(grade)}</span><small>{lead.get("score")}/100</small></div></header>'
        f'{shots}<div class="body"><div><h3>What a customer would notice</h3><ul class="issues">{issue_html}</ul>{ai_html}</div>'
        f'<div class="contact">{"".join(contact)}{pitch_html}</div></div></article>'
    )


def write_html(leads, path, title):
    base = Path(path).parent
    ordered = sorted(leads, key=lambda l: (l.get("score") is None, -(l.get("opportunity") or 0)))
    graded = [l for l in leads if l.get("grade")]
    with_email = sum(1 for l in leads if l.get("emails"))
    hot = sum(1 for l in graded if l["grade"] in "DF")
    cards = "\n".join(_card(l, base) for l in ordered)
    today = datetime.date.today().strftime("%d %b %Y")

    page = TEMPLATE.replace("{{TITLE}}", _e(title)).replace("{{DATE}}", today) \
        .replace("{{TOTAL}}", str(len(leads))).replace("{{EMAILS}}", str(with_email)) \
        .replace("{{HOT}}", str(hot)).replace("{{CARDS}}", cards)
    Path(path).write_text(page, encoding="utf-8")


TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root {
  --bg: #f1f4f3; --surface: #fff; --surface-2: #e8eeec; --ink: #16211f; --muted: #5a6966; --line: #d5dedb;
  --accent: #0f6e6a; --accent-ink: #fff;
  --gA: #2f7d4a; --gB: #6a8a2a; --gC: #b07b12; --gD: #c0561b; --gF: #b3261e; --gX: #7b8784;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; --bg: #0e1514; --surface: #16201f; --surface-2: #1d2a28; --ink: #e5eeec; --muted: #93a5a1;
    --line: #2a3735; --accent: #4bb7ac; --accent-ink: #06201e;
    --gA: #6cc38b; --gB: #a8c45a; --gC: #e3b04a; --gD: #ef8a4f; --gF: #f07167; --gX: #93a5a1; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); padding: 0 16px; }
.wrap { max-width: 1120px; margin: 0 auto; padding-block: 32px 64px; display: grid; gap: 24px; }
h1, h2, h3 { font-family: var(--display); margin: 0; text-wrap: balance; }
h1 { font-size: clamp(28px, 4.5vw, 40px); line-height: 1.1; }
h2 { font-size: 20px; line-height: 1.25; }
h3 { font-size: 14px; margin-bottom: 8px; }
h3 small { font: 400 12px var(--body); color: var(--muted); }
.eyebrow { font: 500 12px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.muted { color: var(--muted); }
.summary { display: flex; flex-wrap: wrap; gap: 10px 28px; color: var(--muted); }
.summary b { color: var(--ink); font: 700 22px var(--display); margin-right: 4px; font-variant-numeric: tabular-nums; }
.filters { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.filters button { font: 500 13px var(--body); padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--surface); color: var(--ink); cursor: pointer; }
.filters button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.card-head { display: flex; justify-content: space-between; gap: 16px; padding: 18px 20px; align-items: flex-start; }
.site { font: 500 13px var(--mono); color: var(--accent); word-break: break-all; }
.verdict { margin: 6px 0 0; font-size: 14px; }
.score { display: grid; justify-items: center; gap: 2px; }
.score small { font: 500 12px var(--mono); color: var(--muted); font-variant-numeric: tabular-nums; }
.grade { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 10px; color: #fff;
  font: 700 26px var(--display); }
.g-A { background: var(--gA); } .g-B { background: var(--gB); } .g-C { background: var(--gC); }
.g-D { background: var(--gD); } .g-F { background: var(--gF); } .g-X { background: var(--gX); }
.shots { display: grid; grid-template-columns: 180px 1fr; gap: 16px; padding: 16px 20px; background: var(--surface-2);
  align-items: start; }
.shots figure { margin: 0; display: grid; gap: 6px; }
.shots img { width: 100%; display: block; border-radius: 8px; border: 1px solid var(--line); background: #fff; }
.shots .phone img { border-radius: 18px; border: 6px solid var(--ink); max-height: 380px; object-fit: cover; object-position: top; }
.shots .laptop img { max-height: 380px; object-fit: cover; object-position: top; }
.shots figcaption { font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.body { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; padding: 18px 20px 20px; }
.issues { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
.ai { margin-top: 16px; display: grid; gap: 6px; }
.ai ul { margin: 6px 0 0; padding-left: 18px; color: var(--muted); font-size: 14px; }
.bar { display: grid; grid-template-columns: 64px 1fr 24px; gap: 10px; align-items: center; font-size: 13px; }
.bar i { height: 8px; border-radius: 4px; background: linear-gradient(to right, var(--accent) var(--v), var(--surface-2) var(--v)); }
.bar b { font: 500 13px var(--mono); text-align: right; font-variant-numeric: tabular-nums; }
.contact { display: grid; gap: 10px; align-content: start; }
.row { display: grid; grid-template-columns: 56px 1fr auto; gap: 10px; align-items: baseline; font-size: 14px; word-break: break-word; }
.k { font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.pitch { display: grid; gap: 6px; padding: 12px; border-radius: 8px; background: var(--surface-2); }
.pitch p { margin: 0; font-size: 14px; }
.pitch .copy { justify-self: start; }
.copy { font: 600 12px var(--body); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--accent);
  color: var(--accent); background: transparent; cursor: pointer; }
.card.failed { padding-bottom: 16px; } .card.failed p { padding: 0 20px; margin: 0; }
a { color: var(--accent); }
button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (max-width: 760px) {
  .body { grid-template-columns: 1fr; }
  .shots { grid-template-columns: 120px 1fr; }
}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="eyebrow">Prospect report · {{DATE}}</span>
    <h1>{{TITLE}}</h1>
  </header>
  <div class="summary">
    <span><b>{{TOTAL}}</b>websites checked</span>
    <span><b>{{HOT}}</b>graded D or F (best prospects)</span>
    <span><b>{{EMAILS}}</b>with an email address</span>
  </div>
  <div class="filters" role="group" aria-label="Filter">
    <button type="button" data-f="all" aria-pressed="true">All</button>
    <button type="button" data-f="hot" aria-pressed="false">Best prospects (D, F)</button>
    <button type="button" data-f="C" aria-pressed="false">C</button>
    <button type="button" data-f="good" aria-pressed="false">Good sites (A, B)</button>
    <button type="button" data-f="email" aria-pressed="false">Has email</button>
  </div>
  <p class="muted">Sorted with the weakest websites first. Those owners have the most to gain from a new site.</p>
  {{CARDS}}
</div>
<script>
document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  const f = b.dataset.f;
  document.querySelectorAll('.card').forEach((c) => {
    const g = c.dataset.grade, e = c.dataset.email === '1';
    c.hidden = !(f === 'all' || (f === 'hot' && (g === 'D' || g === 'F')) || (f === 'good' && (g === 'A' || g === 'B'))
      || f === g || (f === 'email' && e));
  });
}));
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('.copy');
  if (!b) return;
  const done = () => { const t = b.textContent; b.textContent = 'Copied'; setTimeout(() => b.textContent = t, 1200); };
  if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.text).then(done, () => {});
});
</script>
</body>
</html>
"""
