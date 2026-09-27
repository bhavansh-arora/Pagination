#!/usr/bin/env python3
"""Lead Finder control panel: run searches, read reports, track contacts and build demos in the browser.

    PANEL_PASSWORD=... python panel.py          # http://localhost:3200

Settings (environment variables, or the .env file next to this script):
    PANEL_USER        login name (default: admin)
    PANEL_PASSWORD    login password (required)
    PORT              port to listen on (default 3200)
    HOST              address to listen on (default 127.0.0.1; use 0.0.0.0 when a proxy in Docker needs to reach it)
    LEADS_DIR         where searches are saved (default: ./results)
    DEMO_SITE_DIR     where demo websites are written (optional)
    DEMO_BASE_URL     the public address of DEMO_SITE_DIR, e.g. https://demo.codebunny.net (optional)
"""

import base64
import datetime
import hmac
import html
import json
import mimetypes
import os
import re
import secrets
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from leads import _load_env_file  # noqa: E402

_load_env_file()

from outreach import DETAILS_FILE, load_details  # noqa: E402
from report import CSS  # noqa: E402

USER = os.environ.get("PANEL_USER", "admin")
PASSWORD = os.environ.get("PANEL_PASSWORD", "")
LEADS_DIR = Path(os.environ.get("LEADS_DIR", HERE / "results")).resolve()
DEMO_SITE_DIR = os.environ.get("DEMO_SITE_DIR", "")
DEMO_BASE_URL = os.environ.get("DEMO_BASE_URL", "").rstrip("/")
JOBS_DIR = LEADS_DIR / "_jobs"
STATUS_FILE = LEADS_DIR / "_status.json"

STATUS_LABELS = {"new": "Not contacted", "sent": "Sent", "followup": "Follow up", "replied": "Replied",
                 "no": "Not interested"}

SESSION_DAYS = 30
COOKIE = "lf_session"
_failed = {}      # ip -> [timestamps of failed sign-ins]

_lock = threading.Lock()
_jobs = {}        # id -> {"id", "kind", "label", "search", "cmd", "state", "started", "ended", "code"}
_queue = []       # job ids waiting; one job runs at a time (the browser that takes screenshots needs ~1 GB)


def _e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def _slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60] or "search"


# ---------------------------------------------------------------- sign-in

def _secret():
    """Key that signs the sign-in cookie. Kept in LEADS_DIR, so sessions survive a restart."""
    path = LEADS_DIR / "_secret"
    try:
        return path.read_bytes()
    except OSError:
        key = secrets.token_bytes(32)
        LEADS_DIR.mkdir(parents=True, exist_ok=True)
        path.write_bytes(key)
        os.chmod(path, 0o600)
        return key


def make_session(user):
    expires = int(datetime.datetime.now().timestamp()) + SESSION_DAYS * 86400
    # The password is part of the signature, so changing it signs everyone out.
    payload = f"{user}|{expires}"
    sig = hmac.new(_secret() + PASSWORD.encode(), payload.encode(), "sha256").hexdigest()
    return base64.urlsafe_b64encode(f"{payload}|{sig}".encode()).decode()


def check_session(token):
    try:
        user, expires, sig = base64.urlsafe_b64decode(token.encode()).decode().rsplit("|", 2)
    except (ValueError, UnicodeDecodeError):
        return False
    good = hmac.new(_secret() + PASSWORD.encode(), f"{user}|{expires}".encode(), "sha256").hexdigest()
    return (hmac.compare_digest(sig, good) and hmac.compare_digest(user, USER)
            and int(expires) > datetime.datetime.now().timestamp())


def too_many_attempts(ip):
    now = datetime.datetime.now().timestamp()
    recent = [t for t in _failed.get(ip, []) if now - t < 15 * 60]
    _failed[ip] = recent
    return len(recent) >= 8


def login_page(error="", next_url="/"):
    err = f'<p class="login-error">{_e(error)}</p>' if error else ""
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Sign in · Lead Finder</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>{CSS}
body {{ min-height: 100vh; display: grid; place-items: center; padding-block: 24px; }}
.login {{ width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
  padding: 28px; display: grid; gap: 18px; box-shadow: 0 10px 30px rgba(0,0,0,.06); }}
.login h1 {{ font-size: 28px; }}
.login label {{ display: grid; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); }}
.login input[type=text], .login input[type=password] {{ font: 15px var(--body); padding: 11px 12px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--bg); color: var(--ink); width: 100%; }}
.login input:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 1px; }}
.login .remember {{ display: flex; gap: 8px; align-items: center; font-weight: 500; color: var(--ink); }}
.login button {{ font: 600 15px var(--body); padding: 11px; border-radius: 8px; border: 0; background: var(--accent);
  color: var(--accent-ink); cursor: pointer; }}
.login-error {{ margin: 0; padding: 10px 12px; border-radius: 8px; background: color-mix(in srgb, var(--bad) 12%, transparent);
  color: var(--bad); font-size: 14px; font-weight: 500; }}
</style></head>
<body><form class="login" method="post" action="/login">
<div><span class="eyebrow">Lead Finder</span><h1>Sign in</h1></div>{err}
<input type="hidden" name="next" value="{_e(next_url)}">
<label>Email or username<input type="text" name="user" autocomplete="username" autofocus required></label>
<label>Password<input type="password" name="password" autocomplete="current-password" required></label>
<label class="remember"><input type="checkbox" name="remember" value="1" checked> Keep me signed in for {SESSION_DAYS} days</label>
<button type="submit">Sign in</button>
</form></body></html>"""


# ---------------------------------------------------------------- jobs

def _load_jobs():
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    for f in JOBS_DIR.glob("*.json"):
        try:
            job = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        if job.get("state") in ("running", "queued"):
            job["state"] = "stopped"  # the panel restarted while it was running
        _jobs[job["id"]] = job


def _save_job(job):
    (JOBS_DIR / f"{job['id']}.json").write_text(json.dumps(job, indent=1), encoding="utf-8")


def _start_next():
    with _lock:
        if any(j["state"] == "running" for j in _jobs.values()) or not _queue:
            return
        job = _jobs[_queue.pop(0)]
        job["state"], job["started"] = "running", datetime.datetime.now().isoformat(timespec="seconds")
        _save_job(job)
    threading.Thread(target=_run, args=(job,), daemon=True).start()


def _run(job):
    log = open(JOBS_DIR / f"{job['id']}.log", "w", encoding="utf-8")
    env = {**os.environ, "PYTHONUNBUFFERED": "1"}
    try:
        proc = subprocess.run([sys.executable, str(HERE / "leads.py")] + job["cmd"], cwd=str(HERE), env=env,
                              stdout=log, stderr=subprocess.STDOUT)
        code = proc.returncode
    except OSError as e:
        log.write(f"\nCouldn't start: {e}\n")
        code = -1
    log.close()
    with _lock:
        job.update(state="done" if code == 0 else "failed", code=code,
                   ended=datetime.datetime.now().isoformat(timespec="seconds"))
        _save_job(job)
    _start_next()


def add_job(kind, label, search, cmd):
    job_id = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-") + secrets.token_hex(2)
    job = {"id": job_id, "kind": kind, "label": label, "search": search, "cmd": cmd, "state": "queued",
           "started": "", "ended": "", "code": None}
    with _lock:
        _jobs[job_id] = job
        _queue.append(job_id)
        _save_job(job)
    _start_next()
    return job_id


def job_log(job_id, tail=400):
    path = JOBS_DIR / f"{job_id}.log"
    if not path.exists():
        return ""
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[-tail:])


# ---------------------------------------------------------------- searches and status

def _read_status():
    try:
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def set_status(search, site, value):
    with _lock:
        data = _read_status()
        data.setdefault(search, {})[site] = value
        STATUS_FILE.write_text(json.dumps(data, indent=1), encoding="utf-8")


def searches():
    out = []
    status = _read_status()
    for d in sorted(LEADS_DIR.iterdir() if LEADS_DIR.exists() else [], key=lambda p: p.stat().st_mtime,
                    reverse=True):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        info = {"name": d.name, "title": d.name, "created": "", "total": 0, "bad": 0, "down": 0, "nosite": 0,
                "emails": 0, "demos": 0, "has_report": (d / "report.html").exists(), "status": {}}
        try:
            data = json.loads((d / "leads.json").read_text(encoding="utf-8"))
            leads = data.get("leads", [])
            info.update(title=data.get("title", d.name), created=data.get("created", ""), total=len(leads),
                        bad=sum(1 for l in leads if l.get("grade") in ("C", "D", "F") and not l.get("site_down")),
                        down=sum(1 for l in leads if l.get("site_down")),
                        nosite=sum(1 for l in leads if l.get("no_website")),
                        emails=sum(1 for l in leads if l.get("emails") or l.get("best_email")),
                        demos=sum(1 for l in leads if l.get("demo_url")))
        except (OSError, ValueError):
            pass
        for v in status.get(d.name, {}).values():
            info["status"][v] = info["status"].get(v, 0) + 1
        out.append(info)
    return out


def _safe_search(name):
    path = (LEADS_DIR / name).resolve()
    if path.parent != LEADS_DIR or not path.is_dir() or name.startswith("_"):
        return None
    return path


# ---------------------------------------------------------------- pages

PANEL_CSS = """
.top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.nav { display: flex; gap: 6px; flex-wrap: wrap; }
.nav a { padding: 6px 12px; border-radius: 999px; text-decoration: none; color: var(--ink); border: 1px solid var(--line);
  background: var(--surface); font-weight: 500; font-size: 14px; }
.nav a.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
form.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: end; }
label.f { display: grid; gap: 5px; font-size: 13px; font-weight: 600; color: var(--muted); }
label.f input, label.f select { font: 15px var(--body); padding: 9px 11px; border-radius: 8px; border: 1px solid var(--line);
  background: var(--bg); color: var(--ink); width: 100%; }
label.f small { font-weight: 400; }
.checks-row { display: flex; gap: 14px; flex-wrap: wrap; font-size: 14px; }
.checks-row label { display: flex; gap: 6px; align-items: center; }
table.list { width: 100%; border-collapse: collapse; font-size: 14px; }
table.list th, table.list td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
table.list th { font: 500 11px var(--mono); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
table.list td.num { font-variant-numeric: tabular-nums; }
.table-wrap { overflow-x: auto; }
.pill { display: inline-block; font: 600 12px var(--body); padding: 2px 9px; border-radius: 999px; background: var(--surface-2); }
.pill.running, .pill.queued { background: var(--gC); color: #fff; }
.pill.done { background: var(--good); color: #fff; }
.pill.failed, .pill.stopped { background: var(--bad); color: #fff; }
pre.log { background: #0e1514; color: #d7e3e0; padding: 14px; border-radius: 10px; font: 12.5px/1.5 var(--mono);
  max-height: 60vh; overflow: auto; white-space: pre-wrap; }
.row-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.row-actions form { margin: 0; }
button.btn { font: 600 13px var(--body); }
.btn.danger { background: transparent; color: var(--bad); border-color: var(--bad); }
.kv-list { display: grid; gap: 8px; }
.hint { font-size: 13px; color: var(--muted); }
.ok { color: var(--good); font-weight: 600; } .missing { color: var(--bad); font-weight: 600; }
"""


def page(title, body, active=""):
    nav = "".join(f'<a href="{href}" class="{"on" if key == active else ""}">{label}</a>'
                  for key, href, label in [("home", "/", "Searches"), ("new", "/new", "New search"),
                                           ("jobs", "/jobs", "Activity"), ("settings", "/settings", "Settings")])
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>{_e(title)} · Lead Finder</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>{CSS}{PANEL_CSS}</style></head>
<body><div class="wrap">
<header class="top"><div><span class="eyebrow">Lead Finder</span><h1>{_e(title)}</h1></div><nav class="nav">{nav}
<form method="post" action="/logout" style="margin:0"><button class="btn ghost" type="submit">Sign out</button></form></nav></header>
{body}
</div></body></html>"""


def home_page():
    rows = []
    for s in searches():
        st = s["status"]
        contacted = sum(v for k, v in st.items() if k != "new")
        demos_btn = ""
        if DEMO_SITE_DIR and DEMO_BASE_URL:
            demos_btn = (f'<form method="post" action="/searches/{quote(s["name"])}/demos">'
                         f'<button class="btn ghost" type="submit">{"Rebuild demos" if s["demos"] else "Build demos"}</button></form>')
        report = (f'<a class="btn" href="/r/{quote(s["name"])}/report.html">Open leads</a>' if s["has_report"]
                  else '<span class="hint">No report yet</span>')
        rows.append(f"""<tr>
<td><b>{_e(s['title'])}</b><br><span class="hint">{_e(s['created'].replace('T', ' ')[:16])}</span></td>
<td class="num">{s['total']}</td><td class="num">{s['nosite']}</td><td class="num">{s['down']}</td><td class="num">{s['bad']}</td>
<td class="num">{s['emails']}</td><td class="num">{s['demos']}</td>
<td class="num">{contacted}{f" · {st.get('replied', 0)} replied" if st.get('replied') else ""}</td>
<td><div class="row-actions">{report}
<a class="btn ghost" href="/r/{quote(s['name'])}/leads.csv">CSV</a>{demos_btn}
<form method="post" action="/searches/{quote(s['name'])}/delete" onsubmit="return confirm('Delete this search and its report?')">
<button class="btn danger" type="submit">Delete</button></form></div></td></tr>""")
    running = [j for j in _jobs.values() if j["state"] in ("running", "queued")]
    banner = ""
    if running:
        j = running[0]
        banner = (f'<div class="panel"><p><span class="pill {j["state"]}">{j["state"]}</span> '
                  f'{_e(j["label"])} · <a href="/jobs/{j["id"]}">watch progress</a></p></div>')
    table = ('<div class="panel table-wrap"><table class="list"><thead><tr><th>Search</th><th>Leads</th><th>No site</th>'
             '<th>Site down</th><th>Bad site</th><th>Emails</th><th>Demos</th><th>Contacted</th><th></th></tr></thead>'
             f'<tbody>{"".join(rows)}</tbody></table></div>') if rows else (
        '<div class="panel"><p>No searches yet.</p><p><a class="btn" href="/new">Start your first search</a></p></div>')
    return page("Searches", banner + table, "home")


def new_page(error=""):
    from sources import available_sources
    have = available_sources()
    src = "".join(
        f'<label><input type="checkbox" name="sources" value="{k}" {"checked" if ok else "disabled"}> {label}'
        f'{"" if ok else " (no key)"}</label>'
        for k, label, ok in [("google", "Google", have["google"]), ("web", "Outdated-site web search", have["web"]),
                             ("osm", "OpenStreetMap", True)])
    err = f'<p class="missing">{_e(error)}</p>' if error else ""
    body = f"""<div class="panel">{err}
<form class="grid" method="post" action="/new">
<label class="f">Business types <small>Separate with commas, e.g. dentist, med spa</small><input name="types" required placeholder="roofer, hvac, plumber"></label>
<label class="f">City <small>Add the state or country</small><input name="city" required placeholder="Tampa, Florida"></label>
<label class="f">Leads per type and source <small>Start small: 15–40</small><input name="limit" type="number" min="1" max="300" value="30"></label>
<label class="f">City size <small>Bigger cities need more areas on Google</small>
<select name="grid"><option value="1">Small town (1 area)</option><option value="2" selected>City (4 areas)</option><option value="3">Big city (9 areas)</option><option value="4">Huge city (16 areas)</option></select></label>
<div class="f" style="grid-column:1/-1"><span class="hint">Where to look</span><div class="checks-row">{src}</div></div>
<div class="checks-row" style="grid-column:1/-1">
<label><input type="checkbox" name="ai" value="1"> Claude's design rating (needs an Anthropic key, costs a little per site)</label>
<label><input type="checkbox" name="show_all" value="1"> Also list sites that already look good</label></div>
<div style="grid-column:1/-1"><button class="btn" type="submit">Start search</button>
<span class="hint">Searches run one at a time. A 30-lead search takes a few minutes.</span></div>
</form></div>"""
    return page("New search", body, "new")


def jobs_page():
    rows = "".join(
        f'<tr><td><span class="pill {j["state"]}">{j["state"]}</span></td><td>{_e(j["label"])}</td>'
        f'<td>{_e((j["started"] or "").replace("T", " ")[:16])}</td><td><a href="/jobs/{j["id"]}">Log</a></td></tr>'
        for j in sorted(_jobs.values(), key=lambda j: j["id"], reverse=True)[:50])
    body = (f'<div class="panel table-wrap"><table class="list"><thead><tr><th>State</th><th>What</th><th>Started</th><th></th>'
            f'</tr></thead><tbody>{rows}</tbody></table></div>') if rows else '<div class="panel"><p>Nothing yet.</p></div>'
    return page("Activity", body, "jobs")


def job_page(job):
    link = ""
    if job.get("search"):
        link = f'<a class="btn" id="open" href="/r/{quote(job["search"])}/report.html" hidden>Open leads</a>'
    body = f"""<div class="panel"><p><span class="pill {job['state']}" id="state">{job['state']}</span> {_e(job['label'])}</p>
<pre class="log" id="log">{_e(job_log(job['id']))}</pre>{link}</div>
<script>
const box = document.getElementById('log'), st = document.getElementById('state'), open = document.getElementById('open');
function tick() {{
  fetch('/api/jobs/{job['id']}').then((r) => r.json()).then((j) => {{
    const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
    box.textContent = j.log; if (atEnd) box.scrollTop = box.scrollHeight;
    st.textContent = j.state; st.className = 'pill ' + j.state;
    if (j.state === 'done' && open) open.hidden = false;
    if (j.state === 'running' || j.state === 'queued') setTimeout(tick, 2000);
  }}).catch(() => setTimeout(tick, 5000));
}}
box.scrollTop = box.scrollHeight; tick();
</script>"""
    return page("Progress", body, "jobs")


def settings_page(saved=False):
    from sources import available_sources
    me = load_details()
    have = available_sources()
    keys = [("GOOGLE_PLACES_API_KEY", "Google Places", have["google"]),
            ("BRAVE_API_KEY", "Brave Search", have["web"]),
            ("ANTHROPIC_API_KEY", "Anthropic (design rating)", bool(os.environ.get("ANTHROPIC_API_KEY")))]
    key_rows = "".join(f'<div class="kv"><span class="k">{_e(label)}</span><span class="{"ok" if ok else "missing"}">'
                       f'{"Set" if ok else "Not set"}</span></div>' for _, label, ok in keys)
    demo_rows = (f'<div class="kv"><span class="k">Demo folder</span><span>{_e(DEMO_SITE_DIR or "Not set")}</span></div>'
                 f'<div class="kv"><span class="k">Demo address</span><span>{_e(DEMO_BASE_URL or "Not set")}</span></div>')
    body = f"""{'<div class="panel"><p class="ok">Saved. New searches use these details.</p></div>' if saved else ''}
<div class="panel"><h2>Your details</h2><p class="hint">Used to sign every message.</p>
<form class="grid" method="post" action="/settings">
<label class="f">Your name<input name="name" value="{_e(me.get('name'))}"></label>
<label class="f">Studio name<input name="studio" value="{_e(me.get('studio'))}"></label>
<label class="f">Portfolio<input name="portfolio" value="{_e(me.get('portfolio'))}"></label>
<label class="f">Demo link pattern <small>Use {{slug}} for the business</small>
<input name="demo_url" value="{_e(me.get('demo_url') or (DEMO_BASE_URL + '/{slug}/' if DEMO_BASE_URL else ''))}"></label>
<div><button class="btn" type="submit">Save</button></div></form></div>
<div class="panel"><h2>API keys</h2><p class="hint">Set these in the .env file next to Lead Finder, then restart the panel.</p>
<div class="kv-list">{key_rows}</div></div>
<div class="panel"><h2>Demo websites</h2><p class="hint">Set DEMO_SITE_DIR and DEMO_BASE_URL in the .env file to turn on the Build demos button.</p>
<div class="kv-list">{demo_rows}</div></div>"""
    return page("Settings", body, "settings")


# ---------------------------------------------------------------- server

class Handler(BaseHTTPRequestHandler):
    server_version = "LeadFinderPanel"

    def log_message(self, fmt, *args):
        pass

    def _client_ip(self):
        # Caddy passes the visitor's address along; without a proxy, use the connection's.
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def _cookie(self, name):
        for part in (self.headers.get("Cookie") or "").split(";"):
            k, _, v = part.strip().partition("=")
            if k == name:
                return v
        return ""

    def _authorized(self):
        if check_session(self._cookie(COOKIE)):
            return True
        header = self.headers.get("Authorization", "")  # still accepted, for scripts
        if header.startswith("Basic "):
            try:
                user, _, pw = base64.b64decode(header[6:]).decode("utf-8").partition(":")
            except (ValueError, UnicodeDecodeError):
                return False
            return hmac.compare_digest(user, USER) and hmac.compare_digest(pw, PASSWORD)
        return False

    def _secure(self):
        return self.headers.get("X-Forwarded-Proto", "") == "https"

    def _send(self, code, body, ctype="text/html; charset=utf-8", headers=None):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    def _redirect(self, where):
        self._send(303, "", headers={"Location": where})

    def _form(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(min(length, 1_000_000)).decode("utf-8", errors="replace")
        if "json" in (self.headers.get("Content-Type") or ""):
            try:
                return json.loads(raw or "{}")
            except ValueError:
                return {}
        return {k: v if len(v) > 1 else v[0] for k, v in parse_qs(raw).items()}

    def _gate(self):
        if self._authorized():
            return True
        path = urlparse(self.path).path
        if path.startswith("/api/") or self.command == "POST":
            self._send(401, '{"error": "signed out"}', "application/json")
        else:
            self._redirect("/login?next=" + quote(self.path, safe=""))
        return False

    def _login(self, form):
        ip = self._client_ip()
        next_url = form.get("next") or "/"
        if not next_url.startswith("/") or next_url.startswith("//"):
            next_url = "/"
        if too_many_attempts(ip):
            return self._send(429, login_page("Too many attempts. Wait 15 minutes and try again.", next_url))
        user, pw = (form.get("user") or "").strip(), form.get("password") or ""
        if hmac.compare_digest(user, USER) and hmac.compare_digest(pw, PASSWORD):
            _failed.pop(ip, None)
            cookie = f"{COOKIE}={make_session(user)}; Path=/; HttpOnly; SameSite=Lax"
            if form.get("remember"):
                cookie += f"; Max-Age={SESSION_DAYS * 86400}"
            if self._secure():
                cookie += "; Secure"
            return self._send(303, "", headers={"Location": next_url, "Set-Cookie": cookie})
        _failed.setdefault(ip, []).append(datetime.datetime.now().timestamp())
        return self._send(401, login_page("That email or password isn't right.", next_url))

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        url = urlparse(self.path)
        path = unquote(url.path)
        if path == "/login":
            if self._authorized():
                return self._redirect("/")
            return self._send(200, login_page(next_url=parse_qs(url.query).get("next", ["/"])[0]))
        if not self._gate():
            return
        if path == "/":
            return self._send(200, home_page())
        if path == "/new":
            return self._send(200, new_page())
        if path == "/jobs":
            return self._send(200, jobs_page())
        if path == "/settings":
            return self._send(200, settings_page(saved="saved" in url.query))
        m = re.fullmatch(r"/jobs/([\w-]+)", path)
        if m and m.group(1) in _jobs:
            return self._send(200, job_page(_jobs[m.group(1)]))
        m = re.fullmatch(r"/api/jobs/([\w-]+)", path)
        if m and m.group(1) in _jobs:
            j = _jobs[m.group(1)]
            return self._send(200, json.dumps({"state": j["state"], "log": job_log(j["id"])}), "application/json")
        if path == "/api/status":
            search = parse_qs(url.query).get("search", [""])[0]
            return self._send(200, json.dumps(_read_status().get(search, {})), "application/json")
        if path.startswith("/r/"):
            return self._file(path[3:])
        self._send(404, page("Not found", '<div class="panel"><p>That page doesn\'t exist. <a href="/">Back to searches</a></p></div>'))

    def _file(self, rel):
        target = (LEADS_DIR / rel).resolve()
        if LEADS_DIR not in target.parents or not target.is_file() or "/_" in "/" + rel.split("/")[0]:
            return self._send(404, "Not found", "text/plain; charset=utf-8")
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
            ctype += "; charset=utf-8"
        self._send(200, target.read_bytes(), ctype)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == "/login":
            return self._login(self._form())
        if path == "/logout":
            return self._send(303, "", headers={"Location": "/login",
                                               "Set-Cookie": f"{COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"})
        if not self._gate():
            return
        form = self._form()
        if path == "/new":
            types = (form.get("types") or "").strip()
            city = (form.get("city") or "").strip()
            if not types or not city:
                return self._send(200, new_page("Enter at least one business type and a city."))
            sources = form.get("sources") or []
            sources = [sources] if isinstance(sources, str) else sources
            name = f"{_slug(types)}-{_slug(city)}-{datetime.date.today().isoformat()}"
            n, i = name, 2
            while (LEADS_DIR / n).exists():
                n, i = f"{name}-{i}", i + 1
            cmd = ["run", types, city, "--out", str(LEADS_DIR / n), "--limit", str(int(form.get("limit") or 30)),
                   "--grid", str(int(form.get("grid") or 2))]
            if sources:
                cmd += ["--sources", ",".join(sources)]
            if form.get("ai"):
                cmd.append("--ai")
            if form.get("show_all"):
                cmd.append("--show-all")
            me = load_details()
            if me.get("demo_url"):
                cmd += ["--demo-url", me["demo_url"]]
            job = add_job("search", f"{types} in {city}", n, cmd)
            return self._redirect(f"/jobs/{job}")
        m = re.fullmatch(r"/searches/([^/]+)/(delete|demos)", path)
        if m:
            target = _safe_search(m.group(1))
            if not target:
                return self._send(404, "Not found", "text/plain; charset=utf-8")
            if m.group(2) == "delete":
                import shutil
                shutil.rmtree(target)
                with _lock:
                    data = _read_status()
                    data.pop(target.name, None)
                    STATUS_FILE.write_text(json.dumps(data, indent=1), encoding="utf-8")
                return self._redirect("/")
            if not (DEMO_SITE_DIR and DEMO_BASE_URL):
                return self._redirect("/settings")
            job = add_job("demos", f"Demo websites for {target.name}", target.name,
                          ["demos", "--search", str(target), "--site-dir", DEMO_SITE_DIR, "--base-url", DEMO_BASE_URL])
            return self._redirect(f"/jobs/{job}")
        if path == "/settings":
            details = load_details()
            for k in ("name", "studio", "portfolio", "demo_url"):
                details[k] = (form.get(k) or "").strip()
            DETAILS_FILE.write_text(json.dumps(details, indent=2), encoding="utf-8")
            return self._redirect("/settings?saved=1")
        if path == "/api/status":
            search, site, value = form.get("search", ""), form.get("site", ""), form.get("status", "")
            if not (_safe_search(search) and site and value in STATUS_LABELS):
                return self._send(400, '{"error": "bad request"}', "application/json")
            set_status(search, site, value)
            return self._send(200, '{"ok": true}', "application/json")
        self._send(404, "Not found", "text/plain; charset=utf-8")


def main():
    if not PASSWORD:
        sys.exit("Set PANEL_PASSWORD (in the environment or the .env file) before starting the panel.")
    LEADS_DIR.mkdir(parents=True, exist_ok=True)
    _load_jobs()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "3200"))
    print(f"Lead Finder panel on http://{host}:{port}  (searches saved in {LEADS_DIR})", flush=True)
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
