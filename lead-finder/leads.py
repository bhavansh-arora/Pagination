#!/usr/bin/env python3
"""Lead Finder: find local businesses, their emails, and how good their websites look.

Examples
  python leads.py run dentist "Austin, Texas"            find + emails + website check, all in one
  python leads.py run "roofer, hvac, plumber" "Tampa, Florida"   several business types in one go
  python leads.py run dentist "Austin, Texas" --ai       also have Claude rate each design
  python leads.py find "hair salon" "Leeds, UK"          just build a list of businesses
  python leads.py emails brightsmile.com another.com     just find emails on these sites
  python leads.py emails --file my-list.csv              ...or on every site in a file
  python leads.py audit brightsmile.com --ai             just check how these sites look
  python leads.py types                                  list the business types you can search
"""

import argparse
import csv
import datetime
import os
import re
import sys
from pathlib import Path


def _load_env_file():
    """Read API keys from a private .env file next to this script (KEY=value per line), if there is one."""
    env = Path(__file__).with_name(".env")
    try:
        lines = env.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().removeprefix("export ").strip()
        os.environ.setdefault(key, value.strip().strip('"').strip("'"))


def _say(msg):
    print(msg, flush=True)


def _out_dir(args, label):
    if args.out:
        d = Path(args.out)
    else:
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")[:50]
        d = Path("results") / f"{slug}-{datetime.date.today().isoformat()}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _load_sites(args):
    """Websites from the command line and/or a CSV/text file, as list of lead dicts."""
    leads = [{"name": "", "website": u} for u in args.sites]
    if args.file:
        path = Path(args.file)
        if not path.exists():
            sys.exit(f"Can't find the file {path}")
        text = path.read_text(encoding="utf-8-sig")
        if path.suffix.lower() == ".csv":
            rows = list(csv.DictReader(text.splitlines()))
            col = next((c for c in (rows[0].keys() if rows else []) if c and c.strip().lower() in
                        ("website", "url", "site", "web", "domain")), None)
            if not col:
                sys.exit("The CSV needs a column called website (or url).")
            name_col = next((c for c in rows[0].keys() if c and c.strip().lower() in ("name", "business", "company")), None)
            for r in rows:
                if r.get(col, "").strip():
                    leads.append({**{k.lower(): v for k, v in r.items() if k},
                                  "name": r.get(name_col, "") if name_col else "", "website": r[col].strip()})
        else:
            leads += [{"name": "", "website": line.strip()} for line in text.splitlines() if line.strip()]
    if not leads:
        sys.exit("Give me at least one website, or a file with --file.")
    return leads


def _make_rater(enabled):
    if not enabled:
        return None
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        _say("! --ai needs an Anthropic API key. Set ANTHROPIC_API_KEY (see README). Continuing without Claude's rating.")
        return None
    from ai_rating import DesignRater
    return DesignRater()


def step_find(business_types, city, limit, sources=None, grid=2, all_places=False):
    """Collect businesses of one or more types (comma separated) from every source, one entry per business."""
    from sources import merge
    types = [t.strip() for t in business_types.split(",") if t.strip()]
    found = [_find_one_type(t, city, limit, sources, grid, all_places) for t in types]
    leads = merge(*found)
    if len(types) > 1:
        with_site = sum(1 for l in leads if l.get("website"))
        _say(f"All types together: {len(leads)} businesses, {with_site} with a website.")
    return leads


def _find_one_type(business_type, city, limit, sources=None, grid=2, all_places=False):
    from find import BUSINESS_TYPES, find_businesses
    from sources import available_sources, google_places, merge, web_footprints
    have = available_sources()
    last = {"n": -1}

    def progress(n):
        if n != last["n"]:
            last["n"] = n
            _say(f"  ...{n} so far")

    wanted = sources or [name for name, ok in have.items() if ok]
    found = []

    for name in wanted:
        if name not in have:
            sys.exit(f'Unknown source "{name}". Use osm, google or web.')
        if not have[name]:
            key = {"google": "GOOGLE_PLACES_API_KEY", "web": "BRAVE_API_KEY"}[name]
            _say(f"! Skipping {name}: set {key} first (see README).")
            continue
        osm_knows = business_type.strip().lower() in BUSINESS_TYPES or "=" in business_type
        if name == "osm" and not osm_knows and len([n for n in wanted if have.get(n)]) > 1:
            _say(f'  (OpenStreetMap has no "{business_type}" category, so it is skipped for this type.)')
            continue
        try:
            if name == "osm":
                _say(f"Looking up {business_type} businesses in {city} on OpenStreetMap...")
                leads = find_businesses(business_type, city, limit=limit, include_without_website=all_places)
            elif name == "google":
                _say(f"Looking up {business_type} businesses in {city} on Google...")
                leads = google_places(business_type, city, os.environ["GOOGLE_PLACES_API_KEY"], limit=limit, grid=grid,
                                      progress=progress)
            else:
                _say(f"Searching the web for outdated {business_type} websites in {city}...")
                leads = web_footprints(business_type, city, os.environ["BRAVE_API_KEY"], limit=limit,
                                       progress=progress)
        except (ValueError, RuntimeError, OSError) as e:
            _say(f"! {name} search failed: {e}")
            continue
        _say(f"  {len(leads)} found.")
        found.append(leads)

    leads = merge(*found)
    for l in leads:
        if not l.get("website") and (l.get("phone") or all_places):
            l["no_website"] = True
    leads = [l for l in leads if l.get("website") or l.get("no_website")]
    with_site = sum(1 for l in leads if l.get("website"))
    _say(f"Total: {len(leads)} businesses, {with_site} with a website"
         + (f", {len(leads) - with_site} with no website at all." if len(leads) > with_site else "."))
    return leads


def step_signals(leads):
    """Fake websites, review insights and domain records: data that's already out there but rarely used."""
    from signals import domain_info_many, placeholder_kind, review_insights
    fake = 0
    for lead in leads:
        kind = placeholder_kind(lead.get("website", ""))
        if kind:
            fake += 1
            url = lead["website"]
            lead.update({"placeholder_site": kind, "listed_website": url, "website": "", "no_website": True})
            socials = lead.setdefault("socials", {})
            if "facebook" in kind.lower():
                socials.setdefault("facebook", url)
            elif "instagram" in kind.lower():
                socials.setdefault("instagram", url)
        if lead.get("google_reviews"):
            insights = review_insights(lead["google_reviews"])
            lead["review_quote"] = insights["quote"]
            lead["review_complaints"] = insights["complaints"]
    if fake:
        _say(f"  {fake} listed 'website(s)' are really a Facebook page, link-in-bio or free subdomain. "
             "Counted as no website.")

    targets = [l for l in leads if l.get("website")]
    if targets:
        _say(f"Looking up domain records for {len(targets)} websites...")
        for lead, info in zip(targets, domain_info_many([l["website"] for l in targets])):
            if info:
                lead["domain"] = info
        expiring = sum(1 for l in targets if 0 <= (l.get("domain") or {}).get("expires_in_days", 999) <= 60)
        if expiring:
            _say(f"  {expiring} domain(s) expire within 60 days.")
    return leads


def step_emails(leads):
    from emails import scrape_many
    targets = [l for l in leads if l.get("website")]
    _say(f"Looking for emails on {len(targets)} websites...")

    def progress(n, total, r):
        found = r["best_email"] or ("error: " + r["error"] if r["error"] else "no email")
        _say(f"  [{n}/{total}] {r['website'][:60]}  ->  {found}")

    results = scrape_many([l["website"] for l in targets], progress=progress)
    for lead, r in zip(targets, results):
        known = [lead["email"]] if lead.get("email") else []
        emails = list(dict.fromkeys(known + r["emails"]))
        lead.update({
            "emails": emails, "best_email": emails[0] if emails else "",
            "phones": r["phones"], "socials": r["socials"], "contact_form": r["contact_form"],
            "contact_page": r["contact_page"],
            "email_error": r["error"],
        })
        if r["error"] == "" and r["website"]:
            lead["website"] = r["website"]
    return leads


def step_audit(leads, out_dir, rater):
    from audit import Auditor
    targets = [l for l in leads if l.get("website")]
    _say(f"Checking how {len(targets)} websites look on a phone and a laptop" + (" (with Claude's rating)" if rater else "") + "...")
    from audit import looks_down, mark_down
    with Auditor(out_dir / "screenshots", ai=rater) as auditor:
        for n, lead in enumerate(targets, 1):
            r = auditor.audit(lead["website"])
            if r.get("error") and looks_down(r["error"]):
                r = auditor.audit(lead["website"])  # try once more before calling it down
            if r.get("error"):
                if looks_down(r["error"]):
                    mark_down(lead, r["error"])
                    _say(f"  [{n}/{len(targets)}] {lead['website'][:60]}  ->  WEBSITE DOWN ({r['error'][:60]})")
                else:
                    _say(f"  [{n}/{len(targets)}] {lead['website'][:60]}  ->  {r['error']}")
                    lead["error"] = r["error"]
                continue
            website = lead["website"]
            lead.update(r)
            lead["website"] = website
            _say(f"  [{n}/{len(targets)}] {website[:60]}  ->  {r['grade']} ({r['score']}/100)")
    return leads


def _finish(leads, out_dir, title, args):
    from outreach import load_details
    from report import attach_outreach, write_csv, write_html
    me = load_details({k: getattr(args, k, None) for k in ("name", "studio", "portfolio")})
    if not me.get("name"):
        _say('\nTip: add --name "Your Name" --portfolio yoursite.com so messages are signed properly. '
             "It's remembered for next time.")
    attach_outreach(leads, me)
    csv_path = out_dir / "leads.csv"
    html_path = out_dir / "report.html"
    write_csv(leads, csv_path)
    if any(l.get("grade") or l.get("error") or l.get("no_website") for l in leads):
        write_html(leads, html_path, title, show_all=getattr(args, "show_all", False))
        _say(f"\nDone. Open this in your browser:\n  {html_path.resolve()}")
    _say(f"Spreadsheet: {csv_path.resolve()}")


def _sources(args):
    return [x.strip().lower() for x in args.sources.split(",") if x.strip()] if args.sources else None


def main():
    parser = argparse.ArgumentParser(
        description="Find local businesses, their emails, and how good their websites look.",
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__.split("Examples", 1)[1])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_run = sub.add_parser("run", help="find businesses, their emails and grade their websites")
    p_find = sub.add_parser("find", help="list businesses of a type in a city")
    for p in (p_run, p_find):
        p.add_argument("business_type", help='e.g. dentist, "med spa", or several at once: "dentist, chiropractor"')
        p.add_argument("city", help='e.g. "Austin, Texas" or "Leeds, UK"')
        p.add_argument("--limit", type=int, default=40, help="most businesses per source (default 40)")
        p.add_argument("--out", help="folder to save results in")
        p.add_argument("--sources", help="where to look: osm, google, web, comma separated "
                                         "(default: every source you have a key for)")
        p.add_argument("--grid", type=int, default=2,
                       help="Google only: split the city into GRID x GRID areas to get past Google's 60-per-search cap "
                            "(default 2; use 3-4 for big cities)")
    p_find.add_argument("--all", action="store_true", help="also include OpenStreetMap businesses with no website")
    p_run.add_argument("--ai", action="store_true", help="have Claude rate each design (needs an API key)")

    p_emails = sub.add_parser("emails", help="find emails on websites you give it")
    p_audit = sub.add_parser("audit", help="check how websites you give it look")
    for p in (p_emails, p_audit):
        p.add_argument("sites", nargs="*", help="website addresses")
        p.add_argument("--file", help="a .csv with a website column, or a .txt with one site per line")
        p.add_argument("--out", help="folder to save results in")
    p_audit.add_argument("--ai", action="store_true", help="have Claude rate each design (needs an API key)")
    p_audit.add_argument("--no-emails", action="store_true", help="skip looking for emails")

    for p in (p_run, p_find, p_emails, p_audit):
        me = p.add_argument_group("your details for the messages (remembered after the first time)")
        me.add_argument("--name", help='your name, e.g. "Bhavansh"')
        me.add_argument("--studio", help='your business name, e.g. "Bhavansh Studio"')
        me.add_argument("--portfolio", help="your website, e.g. bhavansh.com")
    for p in (p_run, p_audit):
        p.add_argument("--show-all", action="store_true", help="also list sites that already look good (A, B)")

    sub.add_parser("types", help="list business types you can search for")
    args = parser.parse_args()
    _load_env_file()

    if args.cmd == "types":
        from find import business_type_names
        _say("With a Google key (or Brave key), any business type works, in your own words:\n"
             '  "med spa", "roofing contractor", "personal injury lawyer", "wedding photographer"...\n')
        _say("OpenStreetMap only knows these types:\n  " + "\n  ".join(business_type_names()))
        _say('Or use an OpenStreetMap tag, e.g. "shop=bicycle" or "amenity=kindergarten".')
        return

    try:
        if args.cmd == "find":
            leads = step_find(args.business_type, args.city, args.limit, _sources(args), args.grid, args.all)
            out = _out_dir(args, f"{args.business_type} {args.city}")
            _finish(leads, out, f"{args.business_type.title()} in {args.city}", args)
        elif args.cmd == "run":
            rater = _make_rater(args.ai)
            leads = step_find(args.business_type, args.city, args.limit, _sources(args), args.grid)
            if not leads:
                sys.exit("No businesses found. Try a bigger area, another business type, or another source.")
            out = _out_dir(args, f"{args.business_type} {args.city}")
            step_signals(leads)
            step_emails(leads)
            step_audit(leads, out, rater)
            _finish(leads, out, f"{args.business_type.title()} in {args.city}", args)
        elif args.cmd == "emails":
            leads = _load_sites(args)
            out = _out_dir(args, "emails")
            step_emails(leads)
            _finish(leads, out, "Email search", args)
        elif args.cmd == "audit":
            rater = _make_rater(args.ai)
            leads = _load_sites(args)
            out = _out_dir(args, "website-check")
            step_signals(leads)
            if not args.no_emails:
                step_emails(leads)
            step_audit(leads, out, rater)
            _finish(leads, out, "Website check", args)
    except (ValueError, RuntimeError) as e:
        sys.exit(f"\n{e}")
    except KeyboardInterrupt:
        sys.exit("\nStopped.")


if __name__ == "__main__":
    main()
