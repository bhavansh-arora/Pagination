/* Sign-in for the site editor.

   The editor publishes through the GitHub API, which needs a GitHub token. This site is static,
   so everything in /admin is public: the token is never stored in plain text. Instead:
     - a random 256-bit master key encrypts the token (AES-GCM);
     - each editor's password, stretched with PBKDF2-SHA256 (600,000 rounds), unlocks the master key.
   admin/auth.json holds only these encrypted pieces. Signing in decrypts the token in the browser.
   Adding people, changing passwords and replacing the token re-wrap keys; the token itself is never
   written anywhere but this browser's session. Security rests on strong passwords, so they're enforced. */
(function () {
  "use strict";
  var SESSION = "dr-auth-session", ITER = 600000, enc = new TextEncoder(), dec = new TextDecoder();
  var DEFAULTS = { owner: "bhavansh-arora", repo: "danreynoldsphotography", branch: "main" };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var conf = null, session = null;

  /* ------------------------------ Crypto ------------------------------ */
  var subtle = window.crypto && window.crypto.subtle;
  function b64(buf) { var b = new Uint8Array(buf), s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function pwKey(password, salt, iter) {
    return subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function aesKey(raw) { return subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]); }
  function seal(key, bytes) { var iv = rand(12); return subtle.encrypt({ name: "AES-GCM", iv: iv }, key, bytes).then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; }); }
  function open(key, box) { return subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct)); }
  function wrapMaster(master, name, password) {
    var salt = rand(16);
    return pwKey(password, salt, ITER).then(function (k) { return seal(k, master); }).then(function (box) {
      return { name: name.toLowerCase(), salt: b64(salt), iter: ITER, iv: box.iv, key: box.ct, added: new Date().toISOString().slice(0, 10) };
    });
  }
  function unwrapMaster(user, password) {
    return pwKey(password, unb64(user.salt), user.iter || ITER).then(function (k) { return open(k, { iv: user.iv, ct: user.key }); }).then(function (raw) { return new Uint8Array(raw); });
  }
  function sealToken(master, token) { return aesKey(master).then(function (k) { return seal(k, enc.encode(token)); }); }
  function openToken(master, box) { return aesKey(master).then(function (k) { return open(k, box); }).then(function (b) { return dec.decode(b); }); }

  /* ------------------------------ Passwords ------------------------------ */
  var COMMON = ["password", "admin", "qwerty", "letmein", "welcome", "123456", "111111", "abc123", "iloveyou", "monkey", "dragon", "sunshine", "photography", "wedding", "reynolds", "editor", "changeme"];
  function weakness(pw, name) {
    if (pw.length < 12) return "Use at least 12 characters.";
    var low = pw.toLowerCase(), kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(pw); }).length;
    if (COMMON.some(function (w) { return low.indexOf(w) >= 0; })) return "Avoid common words like \"password\", \"admin\" or the business name.";
    if (name && low.indexOf(name.toLowerCase()) >= 0) return "Don't include the username.";
    if (/^(.)\1+$/.test(pw) || /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw)) return "Avoid repeated or sequential characters.";
    if (pw.length < 16 && kinds < 3) return "Mix upper and lower case, numbers and symbols, or use 16+ characters.";
    return "";
  }
  function generate() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789", r = rand(16), out = "";
    for (var i = 0; i < 16; i++) { out += chars[r[i] % chars.length]; if (i % 4 === 3 && i < 15) out += "-"; }
    return out;
  }

  /* ------------------------------ GitHub ------------------------------ */
  function gh(repoConf, token, path, opts) {
    opts = opts || {};
    return fetch("https://api.github.com/repos/" + repoConf.owner + "/" + repoConf.repo + path, {
      method: opts.method || "GET", cache: "no-store", body: opts.body,
      headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + token, "Content-Type": "application/json" }
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(
          r.status === 401 ? "GitHub didn't accept that token. Check you copied all of it." :
          r.status === 404 ? "The token can't see " + repoConf.owner + "/" + repoConf.repo + ". On GitHub, edit the token and under Repository access choose this repository." :
          r.status === 403 ? "The token isn't allowed to save changes. On GitHub, edit the token → Repository permissions → Contents → choose \"Read and write\" → Update, then try again (the token itself stays the same)." :
          "GitHub " + r.status + ": " + (j.message || r.statusText));
        return j;
      });
    });
  }
  // GitHub reports the account's access on the repository, not the token's, so actually try a write:
  // creating a tiny unreferenced blob needs Contents: Read and write and changes nothing on the site.
  function checkToken(repoConf, token) {
    return gh(repoConf, token, "").then(function (repo) {
      if (repo.permissions && !repo.permissions.push) throw new Error("Your GitHub account can only read this repository; it needs write access.");
      return gh(repoConf, token, "/git/blobs", { method: "POST", body: JSON.stringify({ content: "editor access check", encoding: "utf-8" }) }).then(function () { return repo; });
    });
  }
  function saveConf(repoConf, token, data, message) {
    var path = "/contents/admin/auth.json";
    var body = JSON.stringify(data, null, 2) + "\n";
    var bytes = enc.encode(body), s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return gh(repoConf, token, path + "?ref=" + encodeURIComponent(repoConf.branch)).then(function (f) { return f.sha; }, function () { return null; }).then(function (sha) {
      var payload = { message: message, content: btoa(s), branch: repoConf.branch };
      if (sha) payload.sha = sha;
      return gh(repoConf, token, path, { method: "PUT", body: JSON.stringify(payload) });
    }).then(function () { conf = data; });
  }

  /* ------------------------------ Session ------------------------------ */
  function store(sess, remember) {
    var json = JSON.stringify(sess);
    try { sessionStorage.setItem(SESSION, json); } catch (e) {}
    try { if (remember) localStorage.setItem(SESSION, json); else localStorage.removeItem(SESSION); } catch (e) {}
  }
  function stored() {
    var raw = null;
    try { raw = sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION); } catch (e) {}
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function signOut() {
    try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); } catch (e) {}
    location.reload();
  }

  /* ------------------------------ Start the editor ------------------------------ */
  var started = false;
  function startEditor(sess) {
    if (started) return; started = true;
    document.documentElement.classList.remove("auth-open");
    session = sess;
    window.__editorAuth = sess ? { owner: sess.owner, repo: sess.repo, branch: sess.branch, token: sess.token, user: sess.user } : null;
    $("#auth").classList.add("is-done");
    setTimeout(function () { $("#auth").hidden = true; }, 400);
    ["vendor/grapes.min.js", "editor.js", "media.js", "inspector.js", "seo.js"].forEach(function (src) {
      var s = document.createElement("script"); s.src = src; s.async = false; document.body.appendChild(s);
    });
  }

  /* ------------------------------ UI kit ------------------------------ */
  var I = {
    eye: "<svg viewBox='0 0 24 24'><path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z'/><circle cx='12' cy='12' r='3'/></svg>",
    eyeOff: "<svg viewBox='0 0 24 24'><path d='M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2'/></svg>",
    spark: "<svg viewBox='0 0 24 24'><path d='M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8'/></svg>",
    copy: "<svg viewBox='0 0 24 24'><rect x='9' y='9' width='11' height='11' rx='2'/><path d='M5 15V6a2 2 0 0 1 2-2h9'/></svg>",
    check: "<svg viewBox='0 0 24 24'><path d='M5 12.5l4.5 4.5L19 7.5'/></svg>",
    x: "<svg viewBox='0 0 24 24'><path d='M6 6l12 12M18 6L6 18'/></svg>",
    ext: "<svg viewBox='0 0 24 24'><path d='M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'/></svg>",
    arrow: "<svg viewBox='0 0 24 24'><path d='M5 12h14M13 6l6 6-6 6'/></svg>",
    back: "<svg viewBox='0 0 24 24'><path d='M19 12H5M11 6l-6 6 6 6'/></svg>",
    lock: "<svg viewBox='0 0 24 24'><rect x='4.5' y='10.5' width='15' height='10' rx='2.5'/><path d='M8 10.5V7.5a4 4 0 0 1 8 0v3'/></svg>",
    gh: "<svg viewBox='0 0 24 24' class='is-fill'><path d='M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z'/></svg>",
    user: "<svg viewBox='0 0 24 24'><circle cx='12' cy='8' r='4'/><path d='M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'/></svg>",
    key: "<svg viewBox='0 0 24 24'><circle cx='8' cy='15' r='4'/><path d='M11 12l9-9M17 6l3 3M15 8l2 2'/></svg>",
    team: "<svg viewBox='0 0 24 24'><circle cx='9' cy='8' r='3.5'/><path d='M2.5 20c1-3.6 3.5-5.5 6.5-5.5s5.5 1.9 6.5 5.5'/><circle cx='17' cy='9' r='2.5'/><path d='M16.5 14.5c2.6.2 4.2 1.9 5 4.5'/></svg>"
  };
  function card(html) { $("#auth-card").innerHTML = html; $("#auth-card").scrollTop = 0; }
  function field(id, label, opts) {
    opts = opts || {};
    var type = opts.type || "text", pw = type === "password";
    return "<div class='a-field" + (opts.cls ? " " + opts.cls : "") + "'><label for='" + id + "'>" + label + (opts.aside ? "<span class='a-aside'>" + opts.aside + "</span>" : "") + "</label>" +
      "<div class='a-input" + (opts.icon ? " has-icon" : "") + (pw ? " is-pw" + (opts.gen ? " has-gen" : "") : "") + "'>" + (opts.icon ? "<span class='a-input__icon'>" + I[opts.icon] + "</span>" : "") +
      "<input id='" + id + "' type='" + type + "'" + (opts.value ? " value='" + esc(opts.value) + "'" : "") + (opts.placeholder ? " placeholder='" + esc(opts.placeholder) + "'" : "") +
      " autocomplete='" + (opts.ac || "off") + "' autocapitalize='off' spellcheck='false'" + (opts.required === false ? "" : " required") + ">" +
      (pw ? "<span class='a-input__tools'>" + (opts.gen ? "<button type='button' class='a-tool' data-gen='" + id + "' title='Generate a strong password' aria-label='Generate a strong password'>" + I.spark + "</button>" : "") +
        "<button type='button' class='a-tool' data-eye='" + id + "' title='Show password' aria-label='Show password'>" + I.eye + "</button></span>" : "") + "</div>" +
      (opts.meter ? "<div class='a-meter' id='" + id + "-m' data-score='0'><i></i><i></i><i></i><i></i></div><p class='a-hint' id='" + id + "-s'>Use 12+ characters, or tap " + I.spark + " to generate one.</p>" : "") +
      (opts.hint ? "<p class='a-hint'>" + opts.hint + "</p>" : "") + "</div>";
  }
  function btn(label, cls, attrs) { return "<button class='a-btn " + (cls || "") + "' " + (attrs || "type='button'") + "><span>" + label + "</span></button>"; }
  function score(pw, name) {
    if (!pw) return 0;
    if (!weakness(pw, name)) return 4;
    var kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(pw); }).length;
    return Math.max(1, Math.min(3, (pw.length >= 8 ? 1 : 0) + (pw.length >= 12 ? 1 : 0) + (kinds >= 3 ? 1 : 0)));
  }
  function wirePw(root, nameSel) {
    root.querySelectorAll("[data-eye]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = $("#" + b.getAttribute("data-eye")), show = i.type === "password";
        i.type = show ? "text" : "password"; b.innerHTML = show ? I.eyeOff : I.eye; b.title = show ? "Hide password" : "Show password";
      });
    });
    root.querySelectorAll("[data-gen]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-gen"), i = $("#" + id), pw = generate();
        i.value = pw; i.type = "text"; i.dispatchEvent(new Event("input", { bubbles: true }));
        var eye = root.querySelector("[data-eye='" + id + "']"); if (eye) eye.innerHTML = I.eyeOff;
        var c = $("#" + id + "-confirm"); if (c) { c.value = pw; c.type = "text"; c.dispatchEvent(new Event("input", { bubbles: true })); }
        var out = $("#" + id + "-s");
        if (out) {
          out.innerHTML = "<span class='a-ok'>" + I.check + "Strong password generated.</span> <button type='button' class='a-link' data-copy='" + id + "'>" + I.copy + "Copy</button><br>Save it in a password manager: it can't be recovered.";
          out.className = "a-hint is-good";
          out.querySelector("[data-copy]").addEventListener("click", function (e) {
            var t = e.currentTarget;
            (navigator.clipboard ? navigator.clipboard.writeText(i.value) : Promise.reject()).then(function () { t.innerHTML = I.check + "Copied"; }, function () { i.select(); document.execCommand("copy"); t.innerHTML = I.check + "Copied"; });
          });
        }
      });
    });
    root.querySelectorAll("[id$='-m']").forEach(function (m) {
      var id = m.id.slice(0, -2), i = $("#" + id), out = $("#" + id + "-s");
      i.addEventListener("input", function (e) {
        var name = nameSel ? ($(nameSel) || {}).value : "", sc = score(i.value, name), w = i.value ? weakness(i.value, name) : "";
        m.setAttribute("data-score", sc);
        if (e.isTrusted) { out.textContent = !i.value ? "Use 12+ characters, or tap the sparkle to generate one." : w || "Strong password."; out.className = "a-hint " + (!i.value ? "" : w ? "is-bad" : "is-good"); }
      });
    });
  }
  // A stale error disappears as soon as the person edits the form.
  document.addEventListener("input", function (e) { var f = e.target.closest && e.target.closest("form"); var m = f && f.querySelector(".a-msg"); if (m) { m.textContent = ""; m.hidden = true; } });
  function say(el, text) { el.textContent = text; el.hidden = !text; }
  function busy(b, on, text) {
    b.disabled = on; b.classList.toggle("is-busy", on);
    if (text) b.querySelector("span").textContent = text;
  }
  function host() { return location.host.replace(/^www\./, "") || "this site"; }

  /* ------------------------------ Sign in ------------------------------ */
  function showLogin(note) {
    card("<header class='a-head'><span class='a-kicker'>" + I.lock + "Site editor</span><h1>Welcome back</h1><p>Sign in to edit " + esc(host()) + ".</p></header>" +
      (note ? "<p class='a-msg is-shown'>" + esc(note) + "</p>" : "") +
      "<form id='a-login' class='a-form' autocomplete='on' novalidate>" +
      field("a-user", "Username", { icon: "user", ac: "username" }) +
      field("a-pass", "Password", { type: "password", icon: "key", ac: "current-password" }) +
      "<label class='a-check'><input type='checkbox' id='a-remember'><span class='a-box'>" + I.check + "</span><span>Keep me signed in on this computer</span></label>" +
      "<p class='a-msg' id='a-msg' role='alert' hidden></p>" +
      btn("Sign in", "a-btn--primary a-btn--block", "type='submit'") + "</form>" +
      "<details class='a-help'><summary>Forgot your password?</summary><p>Ask another editor to set a new one for you from <b>⚙ Account → Team</b> (adding your username again resets it). If nobody can sign in, the site owner can delete <code>admin/auth.json</code> on GitHub and run setup again.</p></details>");
    var root = $("#auth-card");
    wirePw(root);
    setTimeout(function () { $("#a-user").focus(); }, 50);
    $("#a-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#a-user").value.trim().toLowerCase(), pw = $("#a-pass").value, b = e.target.querySelector("button[type=submit]"), msg = $("#a-msg");
      if (!name || !pw) { say(msg, "Enter your username and password."); return; }
      var user = (conf.users || []).find(function (u) { return u.name === name; });
      busy(b, true, "Signing in…"); say(msg, "");
      // Same work whether or not the user exists, so the response doesn't reveal valid usernames.
      var attempt = user ? unwrapMaster(user, pw) : pwKey(pw, rand(16), ITER).then(function () { throw new Error("no user"); });
      attempt.then(function (master) { return openToken(master, conf.token); }).then(function (token) {
        var sess = { owner: conf.owner, repo: conf.repo, branch: conf.branch, token: token, user: name };
        store(sess, $("#a-remember").checked);
        busy(b, true, "Opening the editor…");
        startEditor(sess);
      }).catch(function () {
        busy(b, false, "Sign in"); say(msg, "That username and password don't match. Check for typos and try again.");
        root.querySelector(".a-form").classList.remove("is-shake"); void root.offsetWidth; root.querySelector(".a-form").classList.add("is-shake");
        $("#a-pass").select();
      });
    });
  }

  /* ------------------------------ Setup (two steps) ------------------------------ */
  var setup = { token: "", repo: null, verified: false };
  function stepper(n) {
    return "<ol class='a-steps' aria-label='Setup progress'><li class='" + (n > 1 ? "is-done" : "is-on") + "'><b>" + (n > 1 ? I.check : "1") + "</b>Connect GitHub</li><li class='" + (n === 2 ? "is-on" : "") + "'><b>2</b>Create your login</li></ol>";
  }
  function showSetup() {
    var legacy = {};
    try { legacy = JSON.parse(localStorage.getItem("dr-site-editor") || "{}"); } catch (e) {}
    var rc = setup.repo || { owner: legacy.owner || DEFAULTS.owner, repo: legacy.repo || DEFAULTS.repo, branch: legacy.branch || DEFAULTS.branch };
    var pill = function (t, copy) { return "<span class='a-pill'>" + esc(t) + (copy ? "<button type='button' class='a-pill__copy' data-copytext='" + esc(t) + "' title='Copy'>" + I.copy + "</button>" : "") + "</span>"; };
    card(stepper(1) +
      "<header class='a-head'><h1>Connect GitHub</h1><p>A one-time setup by the repository owner. The editor publishes through a GitHub access token, which is stored encrypted.</p></header>" +
      "<section class='a-guide'><div class='a-guide__top'><span>" + I.gh + "Create a token on GitHub</span><a class='a-btn a-btn--dark a-btn--sm' href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener'><span>Open GitHub</span>" + I.ext + "</a></div>" +
      "<ol>" +
      "<li><span>Token name</span><span class='a-g'>" + pill("Site editor", true) + "</span></li>" +
      "<li><span>Expiration</span><span class='a-g'>The longest offered</span></li>" +
      "<li><span>Repository access</span><span class='a-g'>Only select repositories" + I.arrow + pill(rc.repo) + "</span></li>" +
      "<li><span>Repository permissions</span><span class='a-g'>Contents" + I.arrow + pill("Read and write") + "</span></li>" +
      "<li><span>Generate token</span><span class='a-g'>Copy it, then paste it below</span></li></ol></section>" +
      "<form id='a-s1' class='a-form' novalidate>" +
      field("s-token", "GitHub token", { type: "password", icon: "key", placeholder: "github_pat_…", value: setup.token || legacy.token || "", cls: "a-field--mono" }) +
      "<div class='a-verify' id='s-verify' hidden></div>" +
      "<details class='a-more'><summary>Repository settings</summary><div class='a-row3'>" +
      field("s-owner", "Owner", { value: rc.owner }) + field("s-repo", "Repository", { value: rc.repo }) + field("s-branch", "Branch", { value: rc.branch }) + "</div></details>" +
      btn("Continue", "a-btn--primary a-btn--block", "type='submit'") + "</form>" +
      "<p class='a-foot'>" + I.lock + "The token never appears in the website's files in readable form. Only a correct username and password can unlock it.</p>");
    var root = $("#auth-card"), tokenEl = $("#s-token"), verify = $("#s-verify");
    root.querySelectorAll("[data-copytext]").forEach(function (b) {
      b.addEventListener("click", function () { var t = b.getAttribute("data-copytext"); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.innerHTML = I.check; setTimeout(function () { b.innerHTML = I.copy; }, 1400); }, function () {}); });
    });
    function repoConf() { return { owner: $("#s-owner").value.trim(), repo: $("#s-repo").value.trim(), branch: $("#s-branch").value.trim() || "main" }; }
    function setVerify(state, html) { verify.hidden = !state; verify.className = "a-verify is-" + state; verify.innerHTML = html || ""; }
    var seq = 0, timer;
    function check() {
      if (!document.body.contains(tokenEl)) return Promise.resolve(false); // the person already moved on
      var t = tokenEl.value.trim(), my = ++seq, rcNow = repoConf();
      setup.verified = false;
      if (!t) { setVerify(""); return Promise.resolve(false); }
      if (!/^(github_pat_|ghp_|gho_|ghs_)/.test(t) && t.length < 30) { setVerify("bad", I.x + "<span>That doesn't look like a GitHub token. It should start with <code>github_pat_</code>.</span>"); return Promise.resolve(false); }
      setVerify("busy", "<i class='a-spin'></i><span>Checking the token with GitHub…</span>");
      return checkToken(rcNow, t).then(function () {
        if (my !== seq) return false;
        setup.verified = true; setup.token = t; setup.repo = rcNow;
        setVerify("ok", I.check + "<span>Connected. This token can publish to <b>" + esc(rcNow.owner + "/" + rcNow.repo) + "</b>.</span>");
        return true;
      }, function (err) {
        if (my !== seq) return false;
        setVerify("bad", I.x + "<span>" + esc(err.message) + "</span>");
        return false;
      });
    }
    tokenEl.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(check, 500); });
    ["#s-owner", "#s-repo", "#s-branch"].forEach(function (s) { $(s).addEventListener("change", check); });
    if (tokenEl.value) check();
    setTimeout(function () { tokenEl.focus(); }, 50);
    $("#a-s1").addEventListener("submit", function (e) {
      e.preventDefault();
      var b = e.target.querySelector("button[type=submit]");
      clearTimeout(timer);
      if (!tokenEl.value.trim()) { setVerify("bad", I.x + "<span>Paste the token you created on GitHub.</span>"); tokenEl.focus(); return; }
      busy(b, true, "Checking…");
      (setup.verified && setup.token === tokenEl.value.trim() ? Promise.resolve(true) : check()).then(function (ok) {
        busy(b, false, "Continue");
        if (ok) showSetup2();
      });
    });
  }
  function showSetup2() {
    var rc = setup.repo;
    card(stepper(2) +
      "<header class='a-head'><h1>Create your login</h1><p>You'll use this to sign in at <b>" + esc(host()) + "/admin</b>. You can add more people afterwards.</p></header>" +
      "<div class='a-connected'>" + I.gh + "<span>Connected to <b>" + esc(rc.owner + "/" + rc.repo) + "</b></span><button type='button' class='a-link' id='s-back'>" + I.back + "Change</button></div>" +
      "<form id='a-s2' class='a-form' novalidate>" +
      field("s-user", "Username", { icon: "user", value: "admin", ac: "username", hint: "Letters, numbers, dots or dashes." }) +
      field("s-pass", "Password", { type: "password", icon: "key", ac: "new-password", gen: true, meter: true }) +
      field("s-pass-confirm", "Confirm password", { type: "password", icon: "key", ac: "new-password" }) +
      "<p class='a-msg' id='s-msg' role='alert' hidden></p>" +
      btn("Save &amp; open the editor", "a-btn--primary a-btn--block", "type='submit'") + "</form>" +
      "<p class='a-foot'>" + I.lock + "Your password unlocks the encrypted token in your browser. Nobody, including the developer, can recover it, so keep it somewhere safe.</p>");
    var root = $("#auth-card");
    wirePw(root, "#s-user");
    $("#s-back").addEventListener("click", showSetup);
    setTimeout(function () { $("#s-pass").focus(); }, 50);
    $("#a-s2").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#s-msg"), b = e.target.querySelector("button[type=submit]");
      var name = $("#s-user").value.trim().toLowerCase(), pw = $("#s-pass").value;
      if (!/^[a-z0-9._-]{3,32}$/.test(name)) { say(msg, "Usernames use 3–32 letters, numbers, dots, dashes or underscores."); return; }
      var w = weakness(pw, name); if (w) { say(msg, w); return; }
      if (pw !== $("#s-pass-confirm").value) { say(msg, "The two passwords don't match."); return; }
      busy(b, true, "Encrypting…"); say(msg, "");
      var master = rand(32);
      checkToken(rc, setup.token).then(function () {
        return Promise.all([sealToken(master, setup.token), wrapMaster(master, name, pw)]);
      }).then(function (r) {
        busy(b, true, "Saving…");
        var data = { v: 1, about: "Encrypted sign-in for the site editor. Contains no readable secrets.", kdf: "PBKDF2-SHA256", owner: rc.owner, repo: rc.repo, branch: rc.branch, token: r[0], users: [r[1]] };
        return saveConf(rc, setup.token, data, "Set up site editor sign-in");
      }).then(function () {
        try { localStorage.removeItem("dr-site-editor"); } catch (e) {}
        var sess = { owner: rc.owner, repo: rc.repo, branch: rc.branch, token: setup.token, user: name };
        store(sess, false);
        busy(b, true, "Opening the editor…");
        startEditor(sess);
      }).catch(function (err) { busy(b, false, "Save & open the editor"); say(msg, err.message); });
    });
  }

  /* ------------------------------ Account panel (inside the editor) ------------------------------ */
  function needMaster(pw) {
    var me = conf && (conf.users || []).find(function (u) { return u.name === session.user; });
    if (!me) return Promise.reject(new Error("Your account wasn't found."));
    return unwrapMaster(me, pw).catch(function () { throw new Error("Your current password isn't right."); });
  }
  function repoOf() { return { owner: session.owner, repo: session.repo, branch: session.branch }; }
  function reloadConf() { return fetch("auth.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { conf = j; }).catch(function () {}); }
  function avatar(name) { return "<span class='a-avatar' data-h='" + (name.split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0) % 5) + "'>" + esc(name.charAt(0).toUpperCase()) + "</span>"; }
  var acctTab = "team";

  function openAccount(note) {
    var box = $("#acct-box"), modal = $("#m-settings");
    modal.hidden = false;
    box.classList.add("a-acct");
    if (!session) {
      box.innerHTML = "<header class='a-acct__head'><div><h2>Preview mode</h2><p>You can try everything in the editor. Publishing needs a sign-in." + (note ? " " + esc(note) : "") + "</p></div><button type='button' class='a-close' data-close aria-label='Close'>" + I.x + "</button></header>" +
        "<div class='a-acct__foot'>" + btn("Close", "a-btn--ghost", "type='button' data-close") + btn("Sign in", "a-btn--primary", "type='button' id='ac-signin'") + "</div>";
      $("#ac-signin").addEventListener("click", function () { location.href = location.pathname; });
      return;
    }
    if (note) acctTab = "token";
    var users = (conf && conf.users) || [];
    box.innerHTML =
      "<header class='a-acct__head'><div class='a-me'>" + avatar(session.user) + "<div><h2>" + esc(session.user) + "</h2><p>" + I.gh + esc(session.owner + "/" + session.repo) + " · " + esc(session.branch) + "</p></div></div>" +
      "<div class='a-acct__actions'>" + btn("Sign out", "a-btn--ghost a-btn--sm", "type='button' id='ac-out'") + "<button type='button' class='a-close' data-close aria-label='Close'>" + I.x + "</button></div></header>" +
      (note ? "<p class='a-msg is-shown'>" + esc(note) + "</p>" : "") +
      "<nav class='a-tabs' role='tablist'>" +
      [["team", I.team + "Team<em>" + users.length + "</em>"], ["password", I.key + "My password"], ["token", I.gh + "GitHub token"]].map(function (t) {
        return "<button type='button' role='tab' data-acct='" + t[0] + "' class='" + (acctTab === t[0] ? "is-on" : "") + "'>" + t[1] + "</button>";
      }).join("") + "</nav>" +
      "<section class='a-pane' data-pane='team'" + (acctTab === "team" ? "" : " hidden") + ">" +
      "<ul class='a-users'>" + users.map(function (u) {
        return "<li>" + avatar(u.name) + "<div><strong>" + esc(u.name) + (u.name === session.user ? "<span class='a-you'>You</span>" : "") + "</strong><small>Added " + esc(u.added || "") + "</small></div>" +
          (u.name !== session.user ? btn("Remove", "a-btn--danger a-btn--sm", "type='button' data-remove='" + esc(u.name) + "'") : "") + "</li>";
      }).join("") + "</ul>" +
      "<form id='ac-add' class='a-form a-sub' novalidate><h3>Add a person</h3>" +
      "<div class='a-row2'>" + field("n-user", "Their username", { icon: "user" }) + field("n-pass", "Their password", { type: "password", icon: "key", ac: "new-password", gen: true, meter: true }) + "</div>" +
      field("n-me", "Your password, to confirm", { type: "password", icon: "lock", ac: "current-password" }) +
      "<p class='a-msg' id='n-msg' role='alert' hidden></p>" +
      "<div class='a-formfoot'><p class='a-hint'>Share the username and password privately. Re-adding an existing username resets that person's password.</p>" + btn("Add person", "a-btn--primary", "type='submit'") + "</div></form></section>" +
      "<section class='a-pane' data-pane='password'" + (acctTab === "password" ? "" : " hidden") + "><form id='ac-pw' class='a-form' novalidate>" +
      field("c-old", "Current password", { type: "password", icon: "lock", ac: "current-password" }) +
      field("c-new", "New password", { type: "password", icon: "key", ac: "new-password", gen: true, meter: true }) +
      "<p class='a-msg' id='c-msg' role='alert' hidden></p><div class='a-formfoot'><span></span>" + btn("Change password", "a-btn--primary", "type='submit'") + "</div></form></section>" +
      "<section class='a-pane' data-pane='token'" + (acctTab === "token" ? "" : " hidden") + "><form id='ac-token' class='a-form' novalidate>" +
      "<p class='a-lede'>Replace the token when it expires or if it may have leaked; then delete the old one on GitHub. Everyone keeps their own password.</p>" +
      "<a class='a-btn a-btn--dark a-btn--sm a-self' href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener'><span>Create a token on GitHub</span>" + I.ext + "</a>" +
      "<p class='a-hint'>Repository access: <b>" + esc(session.repo) + "</b> only · Repository permissions: <b>Contents → Read and write</b></p>" +
      field("t-new", "New token", { type: "password", icon: "key", placeholder: "github_pat_…", cls: "a-field--mono" }) +
      field("t-me", "Your password, to confirm", { type: "password", icon: "lock", ac: "current-password" }) +
      "<p class='a-msg' id='t-msg' role='alert' hidden></p><div class='a-formfoot'><span></span>" + btn("Replace token", "a-btn--primary", "type='submit'") + "</div></form></section>";
    wirePw(box, "#n-user");
    box.querySelectorAll("[data-acct]").forEach(function (t) {
      t.addEventListener("click", function () {
        acctTab = t.getAttribute("data-acct");
        box.querySelectorAll("[data-acct]").forEach(function (x) { x.classList.toggle("is-on", x === t); });
        box.querySelectorAll("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== acctTab; });
      });
    });
    $("#ac-out").addEventListener("click", function () { if (!window.__siteEditor || !window.__siteEditor.state.dirty || confirm("You have unpublished changes. They're kept as a draft on this computer. Sign out anyway?")) signOut(); });
    box.querySelectorAll("[data-remove]").forEach(function (b) {
      b.addEventListener("click", function () {
        var who = b.getAttribute("data-remove");
        if (!confirm("Remove " + who + "? They won't be able to sign in any more.")) return;
        busy(b, true);
        var data = Object.assign({}, conf, { users: conf.users.filter(function (u) { return u.name !== who; }) });
        saveConf(repoOf(), session.token, data, "Remove editor " + who).then(function () { openAccount(); toast(who + " removed."); }).catch(function (e) { busy(b, false); toast(e.message, true); });
      });
    });
    $("#ac-add").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#n-msg"), name = $("#n-user").value.trim().toLowerCase(), pw = $("#n-pass").value, b = e.target.querySelector("button[type=submit]");
      if (!/^[a-z0-9._-]{3,32}$/.test(name)) { say(msg, "Usernames use 3–32 letters, numbers, dots, dashes or underscores."); return; }
      var w = weakness(pw, name); if (w) { say(msg, w); return; }
      busy(b, true, "Adding…");
      needMaster($("#n-me").value).then(function (master) { return wrapMaster(master, name, pw); }).then(function (u) {
        var data = Object.assign({}, conf, { users: conf.users.filter(function (x) { return x.name !== name; }).concat([u]) });
        return saveConf(repoOf(), session.token, data, "Add editor " + name);
      }).then(function () { openAccount(); toast(name + " can now sign in at /admin with the password you set."); })
        .catch(function (err) { busy(b, false, "Add person"); say(msg, err.message); });
    });
    $("#ac-pw").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#c-msg"), pw = $("#c-new").value, b = e.target.querySelector("button[type=submit]");
      var w = weakness(pw, session.user); if (w) { say(msg, w); return; }
      busy(b, true, "Saving…");
      needMaster($("#c-old").value).then(function (master) { return wrapMaster(master, session.user, pw); }).then(function (u) {
        var data = Object.assign({}, conf, { users: conf.users.map(function (x) { return x.name === session.user ? u : x; }) });
        return saveConf(repoOf(), session.token, data, "Change password for " + session.user);
      }).then(function () { openAccount(); toast("Password changed."); })
        .catch(function (err) { busy(b, false, "Change password"); say(msg, err.message); });
    });
    $("#ac-token").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#t-msg"), token = $("#t-new").value.trim(), b = e.target.querySelector("button[type=submit]"), master;
      busy(b, true, "Checking…");
      needMaster($("#t-me").value).then(function (m) { master = m; return checkToken(repoOf(), token); }).then(function () { return sealToken(master, token); }).then(function (sealed) {
        return saveConf(repoOf(), token, Object.assign({}, conf, { token: sealed }), "Replace site editor GitHub token");
      }).then(function () {
        session.token = token; store(session, !!localStorage.getItem(SESSION));
        if (window.__siteEditor) { window.__siteEditor.cfg.token = token; window.__siteEditor.updateUI(); }
        acctTab = "team"; openAccount(); toast("Token replaced for everyone. You can delete the old token on GitHub now.");
      }).catch(function (err) { busy(b, false, "Replace token"); say(msg, err.message); });
    });
  }
  function tokenRejected() {}
  function toast(m, err) { if (window.__siteEditor) window.__siteEditor.toast(m, err); }

  /* ------------------------------ Boot ------------------------------ */
  function boot() {
    document.documentElement.classList.add("auth-open");
    if (!subtle) { card("<header class='a-head'><h1>Secure sign-in unavailable</h1><p>Open the editor over https (for example on the live site) in an up-to-date browser.</p></header>"); return; }
    var preview = /[?&]preview\b/.test(location.search);
    fetch("auth.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
      conf = j;
      var sess = stored();
      if (sess && sess.token) { startEditor(sess); return; }
      if (preview) { startEditor(null); return; }
      if (!conf || !conf.users || !conf.users.length) showSetup(); else showLogin();
    });
  }

  window.__auth = {
    openAccount: openAccount, signOut: signOut,
    get user() { return session && session.user; },
    tokenRejected: function () {
      if (!session || tokenRejected.shown) return; tokenRejected.shown = true;
      reloadConf().then(function () { openAccount("GitHub rejected the token. If someone replaced it recently, sign out and back in. If it expired, replace it below."); });
    },
    _test: { weakness: weakness, generate: generate, wrapMaster: wrapMaster, unwrapMaster: unwrapMaster, sealToken: sealToken, openToken: openToken }
  };
  boot();
})();
