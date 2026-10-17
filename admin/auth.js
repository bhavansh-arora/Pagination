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
        if (!r.ok) throw new Error(r.status === 401 ? "GitHub didn't accept that token. Check you copied all of it." : r.status === 404 ? "The token can't see " + repoConf.owner + "/" + repoConf.repo + ". Give it access to that repository." : "GitHub " + r.status + ": " + (j.message || r.statusText));
        return j;
      });
    });
  }
  function checkToken(repoConf, token) {
    return gh(repoConf, token, "").then(function (repo) {
      if (repo.permissions && !repo.permissions.push) throw new Error("This token can only read the repository. Give it Contents: Read and write.");
      return repo;
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
    session = sess;
    window.__editorAuth = sess ? { owner: sess.owner, repo: sess.repo, branch: sess.branch, token: sess.token, user: sess.user } : null;
    $("#auth").classList.add("is-done");
    setTimeout(function () { $("#auth").hidden = true; }, 400);
    ["vendor/grapes.min.js", "editor.js", "media.js", "inspector.js", "seo.js"].forEach(function (src) {
      var s = document.createElement("script"); s.src = src; s.async = false; document.body.appendChild(s);
    });
  }

  /* ------------------------------ Screens ------------------------------ */
  function card(html) { $("#auth-card").innerHTML = "<div class='auth__logo'>DR</div>" + html; }
  function pwField(id, label, withGen) {
    return "<label class='auth__f'>" + label + "<span class='auth__pw'><input id='" + id + "' type='password' autocomplete='new-password' required>" +
      "<button type='button' class='auth__eye' data-eye='" + id + "' title='Show'>Show</button>" + (withGen ? "<button type='button' class='auth__gen' data-gen='" + id + "'>Generate</button>" : "") + "</span>" +
      "<small class='auth__strength' id='" + id + "-s'></small></label>";
  }
  function wirePw(root, nameSel) {
    root.querySelectorAll("[data-eye]").forEach(function (b) { b.addEventListener("click", function () { var i = $("#" + b.getAttribute("data-eye")); i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? "Show" : "Hide"; }); });
    root.querySelectorAll("[data-gen]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-gen"), i = $("#" + id), pw = generate();
        i.value = pw; i.type = "text"; i.dispatchEvent(new Event("input"));
        var c = $("#" + id + "-confirm"); if (c) { c.value = pw; c.type = "text"; }
        root.querySelectorAll("[data-eye='" + id + "']").forEach(function (e) { e.textContent = "Hide"; });
      });
    });
    root.querySelectorAll("input[type=password][id]").forEach(function (i) {
      var out = $("#" + i.id + "-s"); if (!out) return;
      i.addEventListener("input", function () {
        var w = weakness(i.value, nameSel ? ($(nameSel) || {}).value : "");
        out.textContent = !i.value ? "" : w || "Strong password ✓";
        out.className = "auth__strength " + (!i.value ? "" : w ? "is-bad" : "is-good");
      });
    });
  }
  // A stale error disappears as soon as the person edits the form.
  document.addEventListener("input", function (e) { var f = e.target.closest && e.target.closest("form"); var m = f && f.querySelector(".auth__msg"); if (m) m.textContent = ""; });
  function busy(btn, on, text) { btn.disabled = on; if (text) btn.textContent = text; }

  function showLogin(note) {
    card("<h1>Sign in to edit the site</h1>" + (note ? "<p class='auth__note'>" + esc(note) + "</p>" : "") +
      "<form id='a-login' class='auth__form' autocomplete='on'>" +
      "<label class='auth__f'>Username<input id='a-user' autocomplete='username' required autocapitalize='off' spellcheck='false'></label>" +
      "<label class='auth__f'>Password<span class='auth__pw'><input id='a-pass' type='password' autocomplete='current-password' required><button type='button' class='auth__eye' data-eye='a-pass'>Show</button></span></label>" +
      "<label class='auth__check'><input type='checkbox' id='a-remember'><span>Keep me signed in on this computer</span></label>" +
      "<p class='auth__msg' id='a-msg' role='alert'></p>" +
      "<button class='ed-btn ed-btn--gold auth__go' type='submit'>Sign in</button></form>" +
      "<p class='auth__foot'>Forgot your password? Ask another editor to reset it, or the site owner can re-run setup with a new GitHub token.</p>");
    wirePw($("#auth-card"));
    $("#a-user").focus();
    $("#a-login").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#a-user").value.trim().toLowerCase(), pw = $("#a-pass").value, btn = e.target.querySelector("button[type=submit]"), msg = $("#a-msg");
      var user = (conf.users || []).find(function (u) { return u.name === name; });
      busy(btn, true, "Signing in…"); msg.textContent = "";
      // Same work whether or not the user exists, so the response doesn't reveal valid usernames.
      var attempt = user ? unwrapMaster(user, pw) : pwKey(pw, rand(16), ITER).then(function () { throw new Error("no user"); });
      attempt.then(function (master) { return openToken(master, conf.token); }).then(function (token) {
        var sess = { owner: conf.owner, repo: conf.repo, branch: conf.branch, token: token, user: name };
        store(sess, $("#a-remember").checked);
        startEditor(sess);
      }).catch(function () {
        busy(btn, false, "Sign in"); msg.textContent = "Wrong username or password."; $("#a-pass").select();
      });
    });
  }

  function showSetup() {
    var legacy = {};
    try { legacy = JSON.parse(localStorage.getItem("dr-site-editor") || "{}"); } catch (e) {}
    card("<h1>Set up the site editor</h1><p class='auth__lede'>This is done once, by whoever owns the GitHub repository. You'll create the first login; you can add more people afterwards.</p>" +
      "<ol class='auth__steps'><li>Open <a href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener'>GitHub → New fine-grained token</a> (sign in as the repository owner).</li>" +
      "<li><b>Token name:</b> Site editor. <b>Expiration:</b> the longest offered.</li>" +
      "<li><b>Repository access:</b> Only select repositories → <b>" + esc(DEFAULTS.owner + "/" + DEFAULTS.repo) + "</b>.</li>" +
      "<li><b>Permissions → Repository permissions → Contents:</b> Read and write. Leave everything else as is.</li>" +
      "<li>Click <b>Generate token</b>, copy it (it starts with <code>github_pat_</code>) and paste it below.</li></ol>" +
      "<form id='a-setup' class='auth__form'>" +
      "<label class='auth__f'>GitHub token<input id='s-token' type='password' required placeholder='github_pat_…' autocomplete='off' spellcheck='false' value='" + esc(legacy.token || "") + "'></label>" +
      "<details class='auth__more'><summary>Repository (change only if the site moved)</summary><div class='auth__row'>" +
      "<label class='auth__f'>Owner<input id='s-owner' value='" + esc(legacy.owner || DEFAULTS.owner) + "'></label><label class='auth__f'>Repository<input id='s-repo' value='" + esc(legacy.repo || DEFAULTS.repo) + "'></label><label class='auth__f'>Branch<input id='s-branch' value='" + esc(legacy.branch || DEFAULTS.branch) + "'></label></div></details>" +
      "<label class='auth__f'>Your username<input id='s-user' value='admin' required autocapitalize='off' spellcheck='false' autocomplete='username'></label>" +
      pwField("s-pass", "Your password", true) +
      "<label class='auth__f'>Confirm password<input id='s-pass-confirm' type='password' required autocomplete='new-password'></label>" +
      "<p class='auth__msg' id='s-msg' role='alert'></p>" +
      "<button class='ed-btn ed-btn--gold auth__go' type='submit'>Save &amp; sign in</button></form>" +
      "<p class='auth__foot'>The token is stored encrypted in <code>admin/auth.json</code>; only a correct username and password can unlock it. Keep your password somewhere safe, like a password manager.</p>");
    wirePw($("#auth-card"), "#s-user");
    $("#s-token").focus();
    $("#a-setup").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#s-msg"), btn = e.target.querySelector("button[type=submit]");
      var repoConf = { owner: $("#s-owner").value.trim(), repo: $("#s-repo").value.trim(), branch: $("#s-branch").value.trim() || "main" };
      var token = $("#s-token").value.trim(), name = $("#s-user").value.trim().toLowerCase(), pw = $("#s-pass").value;
      if (!/^[a-z0-9._-]{3,32}$/.test(name)) { msg.textContent = "Usernames use 3–32 letters, numbers, dots, dashes or underscores."; return; }
      var w = weakness(pw, name); if (w) { msg.textContent = w; return; }
      if (pw !== $("#s-pass-confirm").value) { msg.textContent = "The two passwords don't match."; return; }
      busy(btn, true, "Checking the token…"); msg.textContent = "";
      var master = rand(32);
      checkToken(repoConf, token).then(function () {
        busy(btn, true, "Encrypting…");
        return Promise.all([sealToken(master, token), wrapMaster(master, name, pw)]);
      }).then(function (r) {
        busy(btn, true, "Saving…");
        var data = { v: 1, about: "Encrypted sign-in for the site editor. Contains no readable secrets.", kdf: "PBKDF2-SHA256", owner: repoConf.owner, repo: repoConf.repo, branch: repoConf.branch, token: r[0], users: [r[1]] };
        return saveConf(repoConf, token, data, "Set up site editor sign-in");
      }).then(function () {
        try { localStorage.removeItem("dr-site-editor"); } catch (e) {}
        var sess = { owner: repoConf.owner, repo: repoConf.repo, branch: repoConf.branch, token: token, user: name };
        store(sess, false);
        startEditor(sess);
      }).catch(function (err) { busy(btn, false, "Save & sign in"); msg.textContent = err.message; });
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

  function openAccount(note) {
    var box = $("#acct-box"), modal = $("#m-settings");
    modal.hidden = false;
    if (!session) {
      box.innerHTML = "<h2>Preview mode</h2><p class='ed-muted'>You can try the editor, but publishing needs a sign-in." + (note ? " " + esc(note) : "") + "</p>" +
        "<div class='ed-actions'><button class='ed-btn ed-btn--ghost' type='button' data-close>Close</button><button class='ed-btn ed-btn--gold' type='button' id='ac-signin'>Sign in</button></div>";
      $("#ac-signin").addEventListener("click", function () { try { sessionStorage.removeItem("dr-auth-preview"); } catch (e) {} location.href = location.pathname; });
      return;
    }
    var users = (conf && conf.users) || [];
    box.innerHTML = "<h2>Account</h2>" + (note ? "<p class='ed-msg'>" + esc(note) + "</p>" : "") +
      "<div class='acct-me'><div><strong>Signed in as " + esc(session.user) + "</strong><span class='ed-muted ed-small'>Publishing to " + esc(session.owner + "/" + session.repo) + " (" + esc(session.branch) + ")</span></div><button class='ed-btn' type='button' id='ac-out'>Sign out</button></div>" +
      "<details class='acct-sec' open><summary>Team (" + users.length + ")</summary><ul class='acct-users'>" + users.map(function (u) {
        return "<li><span><strong>" + esc(u.name) + "</strong>" + (u.name === session.user ? " <em>(you)</em>" : "") + "<small>added " + esc(u.added || "") + "</small></span>" +
          (u.name !== session.user ? "<button class='ed-btn ed-btn--danger' type='button' data-remove='" + esc(u.name) + "'>Remove</button>" : "") + "</li>";
      }).join("") + "</ul>" +
      "<form id='ac-add' class='acct-form'><p class='seo-label'>Add a person</p><div class='auth__row'><label class='auth__f'>Username<input id='n-user' required autocapitalize='off' spellcheck='false'></label></div>" +
      pwField("n-pass", "Their password", true) +
      "<label class='auth__f'>Your current password (to confirm)<input id='n-me' type='password' required autocomplete='current-password'></label>" +
      "<p class='auth__msg' id='n-msg'></p><button class='ed-btn ed-btn--gold' type='submit'>Add person</button>" +
      "<small class='ed-muted ed-small'>Share their username and password with them privately. Adding someone with an existing username resets that person's password.</small></form></details>" +
      "<details class='acct-sec'><summary>Change my password</summary><form id='ac-pw' class='acct-form'>" +
      "<label class='auth__f'>Current password<input id='c-old' type='password' required autocomplete='current-password'></label>" + pwField("c-new", "New password", true) +
      "<p class='auth__msg' id='c-msg'></p><button class='ed-btn ed-btn--gold' type='submit'>Change password</button></form></details>" +
      "<details class='acct-sec'" + (note ? " open" : "") + "><summary>GitHub token</summary><form id='ac-token' class='acct-form'>" +
      "<p class='ed-muted ed-small'>Replace the token when it expires or if it may have leaked (then delete the old one on GitHub). Everyone keeps their own password. <a href='https://github.com/settings/personal-access-tokens/new' target='_blank' rel='noopener'>Create a token ↗</a> with access to " + esc(session.owner + "/" + session.repo) + " and Contents: Read and write.</p>" +
      "<label class='auth__f'>New token<input id='t-new' type='password' required placeholder='github_pat_…' autocomplete='off'></label>" +
      "<label class='auth__f'>Your password<input id='t-me' type='password' required autocomplete='current-password'></label>" +
      "<p class='auth__msg' id='t-msg'></p><button class='ed-btn ed-btn--gold' type='submit'>Replace token</button></form></details>" +
      "<div class='ed-actions'><button class='ed-btn ed-btn--gold' type='button' data-close>Done</button></div>";
    wirePw(box, "#n-user");
    $("#ac-out").addEventListener("click", function () { if (!window.__siteEditor || !window.__siteEditor.state.dirty || confirm("You have unpublished changes. They're kept as a draft on this computer. Sign out anyway?")) signOut(); });
    box.querySelectorAll("[data-remove]").forEach(function (b) {
      b.addEventListener("click", function () {
        var who = b.getAttribute("data-remove");
        if (!confirm("Remove " + who + "? They won't be able to sign in any more.")) return;
        var data = Object.assign({}, conf, { users: conf.users.filter(function (u) { return u.name !== who; }) });
        saveConf(repoOf(), session.token, data, "Remove editor " + who).then(function () { openAccount(); toast(who + " removed."); }).catch(function (e) { toast(e.message, true); });
      });
    });
    $("#ac-add").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#n-msg"), name = $("#n-user").value.trim().toLowerCase(), pw = $("#n-pass").value, btn = e.target.querySelector("button[type=submit]");
      if (!/^[a-z0-9._-]{3,32}$/.test(name)) { msg.textContent = "Usernames use 3–32 letters, numbers, dots, dashes or underscores."; return; }
      var w = weakness(pw, name); if (w) { msg.textContent = w; return; }
      busy(btn, true, "Adding…");
      needMaster($("#n-me").value).then(function (master) { return wrapMaster(master, name, pw); }).then(function (u) {
        var data = Object.assign({}, conf, { users: conf.users.filter(function (x) { return x.name !== name; }).concat([u]) });
        return saveConf(repoOf(), session.token, data, "Add editor " + name);
      }).then(function () { openAccount(); toast(name + " can now sign in at /admin with the password you set."); })
        .catch(function (err) { busy(btn, false, "Add person"); msg.textContent = err.message; });
    });
    $("#ac-pw").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#c-msg"), pw = $("#c-new").value, btn = e.target.querySelector("button[type=submit]");
      var w = weakness(pw, session.user); if (w) { msg.textContent = w; return; }
      busy(btn, true, "Saving…");
      needMaster($("#c-old").value).then(function (master) { return wrapMaster(master, session.user, pw); }).then(function (u) {
        var data = Object.assign({}, conf, { users: conf.users.map(function (x) { return x.name === session.user ? u : x; }) });
        return saveConf(repoOf(), session.token, data, "Change password for " + session.user);
      }).then(function () { openAccount(); toast("Password changed."); })
        .catch(function (err) { busy(btn, false, "Change password"); msg.textContent = err.message; });
    });
    $("#ac-token").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = $("#t-msg"), token = $("#t-new").value.trim(), btn = e.target.querySelector("button[type=submit]"), master;
      busy(btn, true, "Checking…");
      needMaster($("#t-me").value).then(function (m) { master = m; return checkToken(repoOf(), token); }).then(function () { return sealToken(master, token); }).then(function (box) {
        return saveConf(repoOf(), token, Object.assign({}, conf, { token: box }), "Replace site editor GitHub token");
      }).then(function () {
        session.token = token; store(session, !!localStorage.getItem(SESSION));
        if (window.__siteEditor) { window.__siteEditor.cfg.token = token; window.__siteEditor.updateUI(); }
        openAccount(); toast("Token replaced for everyone. You can delete the old token on GitHub now.");
      }).catch(function (err) { busy(btn, false, "Replace token"); msg.textContent = err.message; });
    });
  }
  function tokenRejected() {}
  function toast(m, err) { if (window.__siteEditor) window.__siteEditor.toast(m, err); }

  /* ------------------------------ Boot ------------------------------ */
  function boot() {
    if (!subtle) { card("<h1>Secure sign-in unavailable</h1><p>Open the editor over https (for example on the live site) in an up-to-date browser.</p>"); return; }
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
