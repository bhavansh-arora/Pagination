#!/usr/bin/env python3
"""Lead Finder: find local businesses, their emails, and how good their websites look.

Examples
  python leads.py run dentist "Austin, Texas"            find + emails + website check, all in one
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


def step_find(business_type, city, limit, all_places=False):
    from find import find_businesses
    _say(f"Looking up {business_type} businesses in {city} on OpenStreetMap...")
    leads = find_businesses(business_type, city, limit=limit, include_without_website=all_places)
    with_site = sum(1 for l in leads if l["website"])
    _say(f"  Found {len(leads)} businesses, {with_site} with a website.")
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
            "email_error": r["error"],
        })
        if r["error"] == "" and r["website"]:
            lead["website"] = r["website"]
    return leads


def step_audit(leads, out_dir, rater):
    from audit import Auditor
    targets = [l for l in leads if l.get("website")]
    _say(f"Checking how {len(targets)} websites look on a phone and a laptop" + (" (with Claude's rating)" if rater else "") + "...")
    with Auditor(out_dir / "screenshots", ai=rater) as auditor:
        for n, lead in enumerate(targets, 1):
            r = auditor.audit(lead["website"])
            if r.get("error"):
                _say(f"  [{n}/{len(targets)}] {lead['website'][:60]}  ->  {r['error']}")
                lead["error"] = r["error"]
                continue
            website = lead["website"]
            lead.update(r)
            lead["website"] = website
            _say(f"  [{n}/{len(targets)}] {website[:60]}  ->  {r['grade']} ({r['score']}/100)")
    return leads


def _finish(leads, out_dir, title):
    from report import write_csv, write_html
    csv_path = out_dir / "leads.csv"
    html_path = out_dir / "report.html"
    write_csv(leads, csv_path)
    if any(l.get("grade") or l.get("error") for l in leads):
        write_html(leads, html_path, title)
        _say(f"\nDone. Open this in your browser:\n  {html_path.resolve()}")
    _say(f"Spreadsheet: {csv_path.resolve()}")


def main():
    parser = argparse.ArgumentParser(
        description="Find local businesses, their emails, and how good their websites look.",
        formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__.split("Examples", 1)[1])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_run = sub.add_parser("run", help="find businesses, their emails and grade their websites")
    p_find = sub.add_parser("find", help="list businesses of a type in a city")
    for p in (p_run, p_find):
        p.add_argument("business_type", help='e.g. dentist, "hair salon", plumber (see: python leads.py types)')
        p.add_argument("city", help='e.g. "Austin, Texas" or "Leeds, UK"')
        p.add_argument("--limit", type=int, default=40, help="most businesses to include (default 40)")
        p.add_argument("--out", help="folder to save results in")
    p_find.add_argument("--all", action="store_true", help="also include businesses with no website")
    p_run.add_argument("--ai", action="store_true", help="have Claude rate each design (needs an API key)")

    p_emails = sub.add_parser("emails", help="find emails on websites you give it")
    p_audit = sub.add_parser("audit", help="check how websites you give it look")
    for p in (p_emails, p_audit):
        p.add_argument("sites", nargs="*", help="website addresses")
        p.add_argument("--file", help="a .csv with a website column, or a .txt with one site per line")
        p.add_argument("--out", help="folder to save results in")
    p_audit.add_argument("--ai", action="store_true", help="have Claude rate each design (needs an API key)")
    p_audit.add_argument("--no-emails", action="store_true", help="skip looking for emails")

    sub.add_parser("types", help="list business types you can search for")
    args = parser.parse_args()

    if args.cmd == "types":
        from find import business_type_names
        _say("Business types:\n  " + "\n  ".join(business_type_names()))
        _say('\nAnything else: use an OpenStreetMap tag, e.g. "shop=bicycle" or "amenity=kindergarten".')
        return

    try:
        if args.cmd == "find":
            leads = step_find(args.business_type, args.city, args.limit, args.all)
            out = _out_dir(args, f"{args.business_type} {args.city}")
            _finish(leads, out, f"{args.business_type.title()} in {args.city}")
        elif args.cmd == "run":
            rater = _make_rater(args.ai)
            leads = step_find(args.business_type, args.city, args.limit)
            if not leads:
                sys.exit("No businesses with websites found. Try a bigger area or another business type.")
            out = _out_dir(args, f"{args.business_type} {args.city}")
            step_emails(leads)
            step_audit(leads, out, rater)
            _finish(leads, out, f"{args.business_type.title()} in {args.city}")
        elif args.cmd == "emails":
            leads = _load_sites(args)
            out = _out_dir(args, "emails")
            step_emails(leads)
            _finish(leads, out, "Email search")
        elif args.cmd == "audit":
            rater = _make_rater(args.ai)
            leads = _load_sites(args)
            out = _out_dir(args, "website-check")
            if not args.no_emails:
                step_emails(leads)
            step_audit(leads, out, rater)
            _finish(leads, out, "Website check")
    except (ValueError, RuntimeError) as e:
        sys.exit(f"\n{e}")
    except KeyboardInterrupt:
        sys.exit("\nStopped.")


if __name__ == "__main__":
    main()
