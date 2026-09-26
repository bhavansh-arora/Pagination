"""Write the results: a spreadsheet, an outreach dashboard, and one audit page per website."""

import csv
import datetime
import html
import os
import re
from pathlib import Path

from outreach import build as build_outreach

CSV_FIELDS = [
    "name", "website", "grade", "score", "verdict", "best_email", "all_emails", "phone", "contact_page",
    "facebook", "instagram", "linkedin", "top_problems", "first_channel", "first_to", "subject", "first_message",
    "address", "rating", "reviews", "category", "lead_type", "source", "found_because", "listed_website",
    "built_with", "marketing_tools", "domain_created", "domain_expires", "review_quote", "review_complaints", "error",
]

BAD_GRADES = ("C", "D", "F")


def _e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def _rel(path, base):
    return os.path.relpath(path, base).replace(os.sep, "/") if path else ""


def _slug(lead):
    s = re.sub(r"^https?://(www\.)?", "", lead.get("website", "")).strip("/") or "nosite-" + lead.get("name", "")
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-")[:60].lower() or "site"


def _name(lead):
    return lead.get("name") or (lead.get("title") or "").split(" | ")[0][:60] or lead.get("website", "")


def _kind(lead):
    if lead.get("no_website"):
        return "nosite"
    if lead.get("site_down"):
        return "down"
    return "bad"


def _kind_label(lead):
    if not (lead.get("grade") or lead.get("no_website")):
        return ""
    if _kind(lead) == "bad" and lead.get("grade") not in BAD_GRADES:
        return "Good website"
    return {"nosite": "No website", "down": "Website down", "bad": "Bad website"}[_kind(lead)]


def _priority(lead):
    """Worst websites first, nudged up for busy businesses (lots of Google reviews) that can afford a new site."""
    return (lead.get("opportunity") or (100 if lead.get("no_website") else 0)) + min(lead.get("reviews") or 0, 200) / 10


def attach_outreach(leads, me):
    for lead in leads:
        if lead.get("grade") or lead.get("website") or lead.get("no_website"):
            lead["outreach"] = build_outreach(lead, me)


def write_csv(leads, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        w.writeheader()
        for lead in leads:
            socials = lead.get("socials") or {}
            first = (lead.get("outreach") or {}).get("first") or {}
            w.writerow({
                "name": _name(lead),
                "website": lead.get("website", ""),
                "grade": lead.get("grade", ""),
                "score": lead.get("score", ""),
                "verdict": lead.get("verdict", ""),
                "best_email": lead.get("best_email", ""),
                "all_emails": "; ".join(lead.get("emails") or []),
                "phone": lead.get("phone") or "; ".join(lead.get("phones") or []),
                "contact_page": lead.get("contact_page", ""),
                "facebook": socials.get("facebook", ""),
                "instagram": socials.get("instagram", ""),
                "linkedin": socials.get("linkedin", ""),
                "top_problems": " | ".join(i["finding"] for i in (lead.get("issues") or [])[:3]),
                "first_channel": first.get("label", ""),
                "first_to": first.get("to", ""),
                "subject": first.get("subject", ""),
                "first_message": first.get("message", ""),
                "address": lead.get("address", ""),
                "rating": lead.get("rating") or "",
                "reviews": lead.get("reviews") or "",
                "lead_type": _kind_label(lead),
                "source": lead.get("source", ""),
                "found_because": lead.get("found_because", ""),
                "built_with": lead.get("built_with", ""),
                "category": lead.get("category", ""),
                "listed_website": lead.get("listed_website", ""),
                "marketing_tools": ", ".join(lead.get("marketing") or []),
                "domain_created": (lead.get("domain") or {}).get("created", ""),
                "domain_expires": (lead.get("domain") or {}).get("expires", ""),
                "review_quote": lead.get("review_quote", ""),
                "review_complaints": " | ".join(c["text"] for c in lead.get("review_complaints") or []),
                "error": lead.get("error") or lead.get("email_error", ""),
            })


# ---------------------------------------------------------------- shared pieces

def _message_block(opt, key, primary=False):
    """One copy-and-paste message with its recipient, subject and action button."""
    subject = ""
    if opt.get("subject"):
        subject = (
            f'<div class="field"><span class="k">Subject</span><input id="{key}-subject" class="subject" '
            f'value="{_e(opt["subject"])}" aria-label="Subject"><button type="button" class="btn ghost" '
            f'data-copy="#{key}-subject">Copy</button></div>'
        )
    to = ""
    if opt.get("to"):
        to = (f'<div class="field"><span class="k">To</span><span class="to">{_e(opt["to"])}</span>'
              f'<button type="button" class="btn ghost" data-copy-text="{_e(opt["to"])}">Copy</button></div>')
    action = ""
    if opt.get("action_url"):
        action = (f'<a class="btn ghost" href="{_e(opt["action_url"])}" target="_blank" rel="noopener" '
                  f'data-channel="{_e(opt["channel"])}" data-to="{_e(opt.get("to", ""))}" '
                  f'data-body="#{key}-body" data-subject="#{key}-subject">{_e(opt["action_label"])} ↗</a>')
    rows = max(5, opt["message"].count("\n") + len(opt["message"]) // 70 + 1)
    return (
        f'<div class="msg{" primary" if primary else ""}">'
        f'<div class="msg-top"><span class="chip ch-{_e(opt["channel"])}">{_e(opt["label"])}</span></div>'
        f'{to}{subject}'
        f'<textarea id="{key}-body" rows="{min(rows, 18)}" aria-label="{_e(opt["label"])} message">{_e(opt["message"])}</textarea>'
        f'<div class="msg-actions"><button type="button" class="btn" data-copy="#{key}-body">Copy message</button>{action}</div>'
        f"</div>"
    )


SCRIPT = r"""
<script>
function flash(btn, text) {
  const old = btn.textContent; btn.textContent = text;
  setTimeout(() => { btn.textContent = old; }, 1300);
}
function copyText(text, btn, node) {
  const fallback = () => {
    if (node && node.select) { node.focus(); node.select(); flash(btn, 'Press Ctrl+C'); }
  };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => flash(btn, 'Copied'), fallback);
  else fallback();
}
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-copy], [data-copy-text]');
  if (b) {
    const node = b.dataset.copy ? document.querySelector(b.dataset.copy) : null;
    copyText(node ? node.value : b.dataset.copyText, b, node);
    return;
  }
  // Rebuild the Gmail link from whatever is in the boxes now, so edits carry over.
  const a = ev.target.closest('a[data-channel="email"]');
  if (a) {
    const body = document.querySelector(a.dataset.body), subj = document.querySelector(a.dataset.subject);
    a.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(a.dataset.to)
      + '&su=' + encodeURIComponent(subj ? subj.value : '') + '&body=' + encodeURIComponent(body ? body.value : '');
  } else {
    // For forms and DMs, copy the message on the way out so it's ready to paste.
    const o = ev.target.closest('a[data-body]');
    if (o) { const body = document.querySelector(o.dataset.body); if (body && navigator.clipboard) navigator.clipboard.writeText(body.value).catch(() => {}); }
  }
});
// Contact status, remembered in this browser.
const STORE = 'leadfinder-status';
let status = {};
try { status = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) {}
document.querySelectorAll('select.status').forEach((s) => {
  const k = s.dataset.site;
  if (status[k]) s.value = status[k];
  s.closest('[data-status]') && (s.closest('[data-status]').dataset.status = s.value);
  s.addEventListener('change', () => {
    status[k] = s.value;
    const card = s.closest('[data-status]'); if (card) card.dataset.status = s.value;
    try { localStorage.setItem(STORE, JSON.stringify(status)); } catch (e) {}
    if (window.applyFilter) window.applyFilter();
  });
});
</script>
"""

STATUS_OPTIONS = [("new", "Not contacted"), ("sent", "Message sent"), ("followup", "Follow up"),
                  ("replied", "Replied"), ("no", "Not interested")]


def _status_select(site):
    opts = "".join(f'<option value="{v}">{l}</option>' for v, l in STATUS_OPTIONS)
    return f'<select class="status" data-site="{_e(site)}" aria-label="Contact status">{opts}</select>'


# ---------------------------------------------------------------- business signals

def _signal_badges(lead):
    badges = []
    if lead.get("placeholder_site"):
        kind = lead["placeholder_site"].split(",")[0]
        badges.append(f'<span class="badge hot">Google listing links to {_e(kind)}</span>')
    marketing = lead.get("marketing") or []
    if "Google Ads" in marketing:
        badges.append('<span class="badge hot">Runs Google Ads</span>')
    if "Facebook Pixel" in marketing:
        badges.append('<span class="badge">Facebook Pixel</span>')
    dom = lead.get("domain") or {}
    days = dom.get("expires_in_days")
    if days is not None and 0 <= days <= 60:
        badges.append(f'<span class="badge hot">Domain expires in {days} days</span>')
    if dom.get("age_years") is not None and dom["age_years"] >= 8:
        badges.append(f'<span class="badge">Domain {int(dom["age_years"])} years old</span>')
    if lead.get("review_complaints"):
        badges.append('<span class="badge hot">Reviews mention website or booking trouble</span>'
                      if any(c["kind"] in ("website", "booking") for c in lead["review_complaints"])
                      else '<span class="badge">Reviews mention phone or hours trouble</span>')
    if lead.get("maps_url") and lead.get("photo_count") is not None and lead["photo_count"] < 3:
        n = lead["photo_count"]
        badges.append('<span class="badge">No photos on Google</span>' if n == 0 else
                      f'<span class="badge">Only {n} photo{"s" if n != 1 else ""} on Google</span>')
    return badges


def _signals_panel(lead):
    rows = []
    if lead.get("category"):
        rows.append(("Google category", lead["category"]))
    if lead.get("reviews"):
        rows.append(("Google rating", f"{lead.get('rating') or '?'} stars from {lead['reviews']} reviews"))
    if lead.get("listed_website"):
        rows.append(("Listed website", f"{lead['listed_website']} ({lead.get('placeholder_site', '')})"))
    if lead.get("maps_url"):
        n = lead.get("photo_count", 0)
        rows.append(("Photos on Google", "10 or more" if n >= 10 else str(n)))
    if lead.get("summary"):
        rows.append(("Google summary", lead["summary"]))
    if lead.get("address"):
        rows.append(("Address", lead["address"]))
    dom = lead.get("domain") or {}
    if dom.get("created"):
        rows.append(("Domain registered", f"{dom['created']} ({dom.get('age_years')} years ago)"))
    if dom.get("expires"):
        rows.append(("Domain expires", f"{dom['expires']} (in {dom.get('expires_in_days')} days)"))
    if lead.get("built_with"):
        rows.append(("Built with", lead["built_with"]))
    if lead.get("marketing"):
        rows.append(("Marketing & booking tools", ", ".join(lead["marketing"])))
    if lead.get("found_because"):
        rows.append(("Found because", "the site " + lead["found_because"]))
    if lead.get("source"):
        rows.append(("Found on", lead["source"]))
    html_rows = "".join(f'<div class="kv"><span class="k">{_e(k)}</span><span>{_e(v)}</span></div>' for k, v in rows)
    if lead.get("hours"):
        html_rows += ('<div class="kv"><span class="k">Opening hours</span><span>'
                      + "<br>".join(_e(h) for h in lead["hours"]) + "</span></div>")
    reviews = ""
    if lead.get("review_quote"):
        reviews += f'<blockquote class="quote">“{_e(lead["review_quote"])}”</blockquote>'
    for c in lead.get("review_complaints") or []:
        reviews += (f'<p class="complaint"><span class="k">Complaint about {_e(c["kind"])}</span>'
                    f'“{_e(c["text"])}” {("<span class=muted>" + _e(c["when"]) + "</span>") if c.get("when") else ""}</p>')
    if not (html_rows or reviews):
        return ""
    return (f'<section class="panel"><h2>Google listing & business signals</h2>{html_rows}'
            + (f'<h3>From their Google reviews</h3>{reviews}' if reviews else "") + "</section>")


# ---------------------------------------------------------------- audit page

def _audit_page(lead, path, assets_rel, dashboard_rel):
    base = Path(path).parent
    name = _name(lead)
    out = lead.get("outreach") or {}
    checks = lead.get("checks") or []
    passed = sum(1 for c in checks if c["passed"])
    areas = []
    for area in ("Phone", "Speed", "Trust", "Looks"):
        items = [c for c in checks if c["area"] == area]
        if not items:
            continue
        rows = "".join(
            f'<li class="{"pass" if c["passed"] else "fail"}"><span class="mark" aria-label="{"Passed" if c["passed"] else "Problem"}"></span>'
            f'<div><b>{_e(c["label"])}</b><p>{_e(c["finding"])}</p>'
            + ("" if c["passed"] else f'<p class="fix"><span class="k">Fix</span>{_e(c["fix"])}</p>')
            + "</div></li>"
            for c in sorted(items, key=lambda c: (c["passed"], -c["points"]))
        )
        bad = sum(1 for c in items if not c["passed"])
        areas.append(
            f'<section class="area"><h3>{area} <small>{bad} problem{"s" if bad != 1 else ""}</small></h3><ul class="checks">{rows}</ul></section>'
        )

    ai = lead.get("ai") or {}
    ai_html = ""
    if ai:
        bars = "".join(
            f'<div class="bar"><span>{label}</span><i style="--v:{ai[k] * 10}%"></i><b>{ai[k]}/10</b></div>'
            for k, label in [("overall", "Overall"), ("modern", "Modern"), ("mobile", "Phone"), ("trust", "Trust"), ("clarity", "Clarity")]
        )
        probs = "".join(f"<li>{_e(p)}</li>" for p in ai.get("problems", []))
        ai_html = f'<section class="panel"><h2>Designer\'s eye <small>rated by Claude</small></h2>{bars}<ul>{probs}</ul></section>'

    msgs = ""
    if out:
        blocks = [_message_block(out["first"], "m0", primary=True)]
        blocks += [_message_block(o, f"m{i + 1}") for i, o in enumerate(out.get("others", []))]
        msgs = f'<section class="panel"><h2>Outreach messages</h2><div class="msgs">{"".join(blocks)}</div></section>'

    emails = lead.get("emails") or []
    phones = [lead["phone"]] if lead.get("phone") else (lead.get("phones") or [])
    socials = lead.get("socials") or {}
    contact_rows = [
        ("Emails", ", ".join(emails) or "None found on the site"),
        ("Phone", ", ".join(phones) or "None found"),
        ("Contact form", lead.get("contact_page") or ("On the site" if lead.get("contact_form") else "None found")),
    ] + [(n.title(), u) for n, u in socials.items()]
    contact_html = "".join(f'<div class="kv"><span class="k">{_e(k)}</span><span>{_e(v)}</span></div>' for k, v in contact_rows)

    shots = ""
    if lead.get("mobile_shot"):
        full = lead.get("mobile_full_shot")
        shots = (
            '<section class="shots-big">'
            f'<figure class="phone"><img src="{_e(_rel(lead["mobile_shot"], base))}" alt="Phone view of {_e(name)}"><figcaption>Phone, first screen</figcaption></figure>'
            f'<figure class="laptop"><img src="{_e(_rel(lead["desktop_shot"], base))}" alt="Laptop view of {_e(name)}"><figcaption>Laptop, first screen</figcaption></figure>'
            + (f'<figure class="phone-full"><div class="scroll"><img loading="lazy" src="{_e(_rel(full, base))}" alt="Whole page on a phone"></div><figcaption>Whole page on a phone (scroll)</figcaption></figure>' if full else "")
            + "</section>"
        )

    nosite = lead.get("no_website")
    if nosite:
        link, link_text = lead.get("maps_url", ""), ("Google listing" if lead.get("maps_url") else "")
        verdict = ("Their Google listing links to " + lead["placeholder_site"] + ", not a real website."
                   if lead.get("placeholder_site") else "No website at all.") + " Best prospect."
        score_html = '<div class="score big"><span class="grade g-F">—</span><small>no site</small></div>'
        checks_html = ""
    else:
        link, link_text = lead.get("website"), lead.get("website")
        verdict = f"{lead.get('verdict')} {passed} of {len(checks)} checks passed."
        score_html = (f'<div class="score big"><span class="grade g-{_e(lead.get("grade"))}">{_e(lead.get("grade"))}</span>'
                      f'<small>{_e(lead.get("score"))}/100</small></div>')
        checks_html = f'<section class="panel"><h2>What a customer would notice</h2>{"".join(areas)}</section>'
    body = f"""
<div class="wrap">
  <a class="back" href="{_e(dashboard_rel)}">← All leads</a>
  <header class="audit-head">
    <div>
      <span class="eyebrow">{"Lead details" if nosite else "Website audit"}</span>
      <h1>{_e(name)}</h1>
      <a class="site" href="{_e(link)}" target="_blank" rel="noopener">{_e(link_text)}</a>
      <p class="verdict">{_e(verdict)}</p>
    </div>
    {score_html}
  </header>
  {shots}
  <div class="audit-grid">
    <div class="stack">
      {checks_html}
      {_signals_panel(lead)}
      {ai_html}
    </div>
    <div class="stack">
      {msgs}
      <section class="panel"><h2>Contact details</h2>{contact_html}
        <div class="kv"><span class="k">Status</span>{_status_select(lead.get('website') or lead.get('name', ''))}</div></section>
    </div>
  </div>
</div>"""
    Path(path).write_text(_page(f"{name} {'details' if nosite else 'audit'}", body, assets_rel), encoding="utf-8")


# ---------------------------------------------------------------- dashboard

def _row(lead, base, audit_rel):
    name = _name(lead)
    out = lead.get("outreach") or {}
    first = out.get("first")
    issues = lead.get("issues") or []
    grade = lead.get("grade", "")
    emails = lead.get("emails") or []
    slug = _slug(lead)
    chips = "".join(
        f'<span class="chip ch-{_e(o["channel"])}">{_e(o["label"])}</span>'
        for o in ([first] if first else []) + out.get("others", [])
    )
    kind = _kind(lead)
    if kind == "nosite":
        thumb = '<div class="thumb empty"><span>No website</span></div>'
    elif lead.get("mobile_shot"):
        thumb = f'<img class="thumb" loading="lazy" src="{_e(_rel(lead["mobile_shot"], base))}" alt="">'
    else:
        thumb = '<div class="thumb empty"><span>Site down</span></div>'
    if kind == "nosite" and lead.get("placeholder_site"):
        problems = (f"<li>Their Google listing links to {_e(lead['placeholder_site'])}, not a real website.</li>")
    elif kind == "nosite":
        problems = "<li>No website. People who find them on Google have nowhere to click through to.</li>"
    else:
        problems = "".join(f"<li>{_e(i['finding'])}</li>" for i in issues[:3]) or "<li>No obvious problems found.</li>"
    badges = []
    if lead.get("reviews"):
        stars = f"\u2605 {lead['rating']} \u00b7 " if lead.get("rating") else ""
        badges.append(f'<span class="badge">{stars}{lead["reviews"]} Google reviews</span>')
    if lead.get("found_because"):
        badges.append(f'<span class="badge">Found because the site {_e(lead["found_because"])}</span>')
    if lead.get("built_with"):
        badges.append(f'<span class="badge">Built with {_e(lead["built_with"])}</span>')
    badges += _signal_badges(lead)
    if lead.get("source"):
        badges.append(f'<span class="badge muted">Source: {_e(lead["source"])}</span>')
    badge_html = f'<div class="badges">{"".join(badges)}</div>' if badges else ""
    link = lead.get("website") or lead.get("maps_url", "")
    link_text = lead.get("website") or ("Google listing" if lead.get("maps_url") else "")
    grade_badge = ('<span class="grade g-F" title="No website">\u2014</span>' if kind == "nosite"
                   else f'<span class="grade g-{_e(grade)}">{_e(grade)}</span>')
    audit_btn = (f'<a class="btn" href="{_e(audit_rel)}">{"View details" if kind == "nosite" else "View audit report"}</a>'
                 if audit_rel else "")
    status_key = lead.get("website") or lead.get("name", "")
    greet = ""
    if out.get("greeting_name"):
        greet = f'<p class="note">Greeting uses "{_e(out["greeting_name"])}", guessed from the email address. Check it.</p>'
    message = _message_block(first, f"r-{slug}", primary=True) if first else ""
    search = " ".join([name, lead.get("website", ""), " ".join(emails)]).lower()
    return f"""
<article class="lead" data-grade="{_e(grade or 'F')}" data-kind="{kind}" data-email="{1 if emails else 0}" data-status="new" data-search="{_e(search)}">
  <div class="lead-main">
    {thumb}
    <div class="lead-info">
      <div class="lead-title">{grade_badge}<div><h2>{_e(name)}</h2>
        <a class="site" href="{_e(link)}" target="_blank" rel="noopener">{_e(link_text)}</a></div></div>
      {badge_html}
      <ul class="problems">{problems}</ul>
      <div class="contact-line"><span class="k">Email</span>{('<b>' + _e(emails[0]) + '</b>' + (f' <span class="muted">+{len(emails) - 1} more</span>' if len(emails) > 1 else '')) if emails else '<span class="muted">none found</span>'}</div>
      {f'<div class="contact-line"><span class="k">Phone</span><b>{_e(lead["phone"])}</b></div>' if lead.get("phone") else ""}
      <div class="chips">{chips}</div>
      <div class="lead-actions">{audit_btn}{_status_select(status_key)}</div>
    </div>
  </div>
  <div class="lead-msg"><h3>First message <small>edit if you like, then copy</small></h3>{greet}{message}</div>
</article>"""


def write_html(leads, path, title, show_all=False):
    out_dir = Path(path).parent
    audits_dir = out_dir / "audits"
    audits_dir.mkdir(exist_ok=True)
    (out_dir / "style.css").write_text(CSS, encoding="utf-8")

    graded = [l for l in leads if l.get("grade")]
    no_site = [l for l in leads if l.get("no_website")]
    failed = [l for l in leads if l.get("error") and not l.get("grade") and not l.get("no_website")]
    bad = [l for l in graded if l["grade"] in BAD_GRADES]
    shown = sorted((graded if show_all else bad) + no_site, key=lambda l: -_priority(l))

    rows = []
    for lead in shown:
        audit_path = audits_dir / f"{_slug(lead)}.html"
        _audit_page(lead, audit_path, "../style.css", "../" + Path(path).name)
        audit_rel = _rel(audit_path, out_dir)
        rows.append(_row(lead, out_dir, audit_rel))

    hidden_good = len(graded) - len([l for l in shown if l.get("grade")])
    failed_html = ""
    if failed:
        items = "".join(f"<li><b>{_e(_name(l))}</b> <span class=\"muted\">{_e(l.get('error'))}</span></li>" for l in failed)
        failed_html = f'<details class="failed"><summary>{len(failed)} site(s) couldn\'t be checked</summary><ul>{items}</ul></details>'

    with_email = sum(1 for l in shown if l.get("emails"))
    down = sum(1 for l in shown if l.get("site_down"))
    today = datetime.date.today().strftime("%d %b %Y")
    body = f"""
<div class="wrap">
  <header class="dash-head">
    <span class="eyebrow">Lead Finder · {today}</span>
    <h1>{_e(title)}</h1>
    <div class="summary">
      <span><b>{len(graded)}</b>websites checked</span>
      <span><b>{len(bad) - down}</b>with a bad website (C, D or F)</span>
      <span><b>{down}</b>with a website that's down</span>
      <span><b>{len(no_site)}</b>with no website</span>
      <span><b>{with_email}</b>leads with an email</span>
    </div>
  </header>
  <div class="toolbar">
    <input type="search" id="q" placeholder="Search by name, site or email" aria-label="Search">
    <div class="filters" role="group" aria-label="Filter">
      <button type="button" data-f="all" aria-pressed="true">All ({len(shown)})</button>
      <button type="button" data-f="DF" aria-pressed="false">Worst (D, F)</button>
      <button type="button" data-f="down" aria-pressed="false">Site down</button>
      <button type="button" data-f="nosite" aria-pressed="false">No website</button>
      <button type="button" data-f="email" aria-pressed="false">Has email</button>
      <button type="button" data-f="new" aria-pressed="false">Not contacted</button>
      <button type="button" data-f="followup" aria-pressed="false">Follow up</button>
    </div>
  </div>
  <p class="muted">Best prospects first: no website, site down, then the worst websites, with busy businesses (lots of Google reviews) moved up. {f"{hidden_good} site(s) that already look good are left out." if hidden_good else ""}
  Click <b>View audit report</b> for the full breakdown and screenshots.</p>
  <div class="leads">{''.join(rows) or '<p>No bad websites found in this batch.</p>'}</div>
  {failed_html}
</div>
<script>
(function () {{
  let f = 'all';
  const q = document.getElementById('q');
  window.applyFilter = function () {{
    const term = q.value.trim().toLowerCase();
    document.querySelectorAll('.lead').forEach((c) => {{
      const g = c.dataset.grade, st = c.dataset.status;
      const ok = f === 'all' || (f === 'DF' && (g === 'D' || g === 'F')) || (f === 'email' && c.dataset.email === '1')
        || f === st || f === c.dataset.kind;
      c.hidden = !(ok && (!term || c.dataset.search.includes(term)));
    }});
  }};
  document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {{
    document.querySelectorAll('.filters button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    f = b.dataset.f; window.applyFilter();
  }}));
  q.addEventListener('input', window.applyFilter);
}})();
</script>"""
    Path(path).write_text(_page(title, body, "style.css"), encoding="utf-8")


def _page(title, body, css_href):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_e(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="{css_href}">
</head>
<body>
{body}
{SCRIPT}
</body>
</html>
"""


CSS = """
:root {
  --bg: #f1f4f3; --surface: #fff; --surface-2: #e8eeec; --ink: #16211f; --muted: #5a6966; --line: #d5dedb;
  --accent: #0f6e6a; --accent-ink: #fff; --good: #2f7d4a; --bad: #b3261e;
  --gA: #2f7d4a; --gB: #6a8a2a; --gC: #b07b12; --gD: #c0561b; --gF: #b3261e;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; --bg: #0e1514; --surface: #16201f; --surface-2: #1d2a28; --ink: #e5eeec; --muted: #93a5a1;
    --line: #2a3735; --accent: #4bb7ac; --accent-ink: #06201e; --good: #6cc38b; --bad: #f07167;
    --gA: #3d9a5c; --gB: #7f9f35; --gC: #c28a1c; --gD: #d06426; --gF: #c9362c; }
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); padding: 0 16px; }
.wrap { max-width: 1200px; margin: 0 auto; padding-block: 28px 64px; display: grid; gap: 20px; }
h1, h2, h3 { font-family: var(--display); margin: 0; text-wrap: balance; }
h1 { font-size: clamp(26px, 4.5vw, 38px); line-height: 1.1; }
h2 { font-size: 19px; line-height: 1.25; }
h3 { font-size: 14px; }
h2 small, h3 small { font: 400 12px var(--body); color: var(--muted); margin-left: 6px; }
p { margin: 0; }
a { color: var(--accent); }
.eyebrow, .k { font: 500 11px var(--mono); letter-spacing: .07em; text-transform: uppercase; color: var(--muted); }
.eyebrow { color: var(--accent); font-size: 12px; }
.muted { color: var(--muted); }
.site { font: 500 13px var(--mono); word-break: break-all; }
.dash-head { display: grid; gap: 10px; }
.summary { display: flex; flex-wrap: wrap; gap: 8px 28px; color: var(--muted); }
.summary b { color: var(--ink); font: 700 22px var(--display); margin-right: 5px; font-variant-numeric: tabular-nums; }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.toolbar input { flex: 1 1 240px; font: 14px var(--body); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line);
  background: var(--surface); color: var(--ink); }
.filters { display: flex; flex-wrap: wrap; gap: 6px; }
.filters button { font: 500 13px var(--body); padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--surface); color: var(--ink); cursor: pointer; }
.filters button[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.grade { display: inline-grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 9px; color: #fff;
  font: 700 22px var(--display); }
.g-A { background: var(--gA); } .g-B { background: var(--gB); } .g-C { background: var(--gC); }
.g-D { background: var(--gD); } .g-F { background: var(--gF); }
.leads { display: grid; gap: 16px; }
.lead { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 0; background: var(--surface);
  border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
.lead[data-status="sent"], .lead[data-status="no"] { opacity: .6; }
.lead-main { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 16px; padding: 18px; }
.thumb { width: 110px; aspect-ratio: 390 / 844; object-fit: cover; object-position: top; border-radius: 14px;
  border: 5px solid var(--ink); background: var(--surface-2); max-width: 100%; }
.lead-info { display: grid; gap: 10px; align-content: start; min-width: 0; }
.lead-title { display: flex; gap: 12px; align-items: flex-start; }
.problems { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: 14px; }
.contact-line { display: flex; gap: 10px; align-items: baseline; font-size: 14px; word-break: break-all; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.badges { display: flex; flex-wrap: wrap; gap: 6px; }
.badge { font: 500 12px var(--body); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--line); }
.badge.hot { border-color: var(--gD); color: var(--gD); }
.quote { margin: 0; padding: 10px 14px; border-left: 3px solid var(--accent); background: var(--surface-2); border-radius: 0 8px 8px 0; font-size: 14px; }
.complaint { font-size: 14px; display: grid; gap: 2px; }
.thumb.empty { display: grid; place-items: center; text-align: center; font: 600 12px var(--body); color: var(--muted); }
.chip { font: 500 12px var(--body); padding: 2px 9px; border-radius: 999px; background: var(--surface-2); color: var(--ink); }
.lead-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.lead-msg { padding: 18px; background: var(--surface-2); display: grid; gap: 10px; align-content: start; }
.note { font-size: 12px; color: var(--muted); }
.msg { display: grid; gap: 8px; }
.msgs { display: grid; gap: 22px; }
.msg-top { display: flex; justify-content: space-between; }
.msg.primary .chip { background: var(--accent); color: var(--accent-ink); }
.field { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 14px; }
.to { font-family: var(--mono); font-size: 13px; word-break: break-all; }
textarea, input.subject, select.status { font: 14px/1.55 var(--body); color: var(--ink); background: var(--surface);
  border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; width: 100%; }
textarea { resize: vertical; white-space: pre-wrap; }
select.status { width: auto; padding: 6px 8px; font-size: 13px; }
.msg-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13px var(--body); padding: 7px 13px; border-radius: 7px;
  background: var(--accent); color: var(--accent-ink); border: 1px solid var(--accent); cursor: pointer; text-decoration: none; }
.btn.ghost { background: transparent; color: var(--accent); }
button:focus-visible, a:focus-visible, textarea:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.failed { color: var(--muted); }
.failed ul { padding-left: 18px; }
/* audit page */
.back { font-weight: 600; text-decoration: none; }
.audit-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.audit-head > div:first-child { display: grid; gap: 6px; }
.score { display: grid; justify-items: center; gap: 4px; }
.score small { font: 500 12px var(--mono); color: var(--muted); }
.score.big .grade { width: 64px; height: 64px; font-size: 36px; border-radius: 14px; }
.shots-big { display: grid; grid-template-columns: 220px minmax(0, 1fr) 220px; gap: 16px; align-items: start;
  background: var(--surface-2); padding: 16px; border-radius: 12px; }
.shots-big figure { margin: 0; display: grid; gap: 6px; }
.shots-big img { width: 100%; display: block; border-radius: 8px; border: 1px solid var(--line); background: #fff; }
.shots-big .phone img { border-radius: 22px; border: 7px solid var(--ink); }
.shots-big .scroll { max-height: 470px; overflow-y: auto; border-radius: 8px; border: 1px solid var(--line); }
.shots-big .scroll img { border: 0; border-radius: 0; }
figcaption { font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.audit-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.stack { display: grid; gap: 20px; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: grid; gap: 14px; }
.area { display: grid; gap: 8px; }
.checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.checks li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; font-size: 14px; }
.checks li p { color: var(--muted); }
.checks li.fail p:first-of-type { color: var(--ink); }
.mark { width: 16px; height: 16px; margin-top: 3px; border-radius: 50%; }
.pass .mark { background: var(--good); }
.fail .mark { background: var(--bad); }
.fix { display: flex; gap: 8px; align-items: baseline; margin-top: 2px; }
.bar { display: grid; grid-template-columns: 70px minmax(0, 1fr) 44px; gap: 10px; align-items: center; font-size: 13px; }
.bar i { height: 8px; border-radius: 4px; background: linear-gradient(to right, var(--accent) var(--v), var(--surface-2) var(--v)); }
.bar b { font: 500 12px var(--mono); text-align: right; }
.panel ul { margin: 0; padding-left: 18px; }
.kv { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 10px; font-size: 14px; align-items: baseline; }
.kv > span:last-child { overflow-wrap: anywhere; }
@media (max-width: 900px) {
  .lead, .audit-grid { grid-template-columns: 1fr; }
  .shots-big { grid-template-columns: 1fr 1fr; }
  .shots-big .laptop { grid-column: 1 / -1; order: -1; }
}
@media (max-width: 520px) {
  .lead-main { grid-template-columns: 1fr; }
  .thumb { width: 90px; }
  .shots-big { grid-template-columns: 1fr; }
  .audit-head { flex-direction: column; }
}
"""
