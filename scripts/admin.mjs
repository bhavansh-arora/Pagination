#!/usr/bin/env node
// Account recovery from the server shell. Uses only Node built-ins so it also runs
// inside the Docker image. Usage:
//   node scripts/admin.mjs create-admin <email> <password> [name]
//   node scripts/admin.mjs reset-password <email> <new-password>
//   node scripts/admin.mjs list
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "./data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function load() {
  if (!fs.existsSync(DB_FILE)) return { coaches: [], sessions: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function save(d) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.cli.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d));
  fs.renameSync(tmp, DB_FILE);
}
function hash(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
function die(msg) {
  console.error(msg);
  process.exit(1);
}

const [cmd, emailArg, pw, ...nameParts] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
const d = load();
d.coaches ??= [];
d.sessions ??= [];

if (cmd === "list") {
  for (const c of d.coaches) console.log(`${(c.role ?? "coach").padEnd(6)} ${(c.status ?? "active").padEnd(10)} ${c.email}  ${c.name}`);
} else if (cmd === "create-admin") {
  if (!email || !pw) die("Usage: node scripts/admin.mjs create-admin <email> <password> [name]");
  if (pw.length < 8) die("Password must be at least 8 characters");
  const existing = d.coaches.find((c) => c.email === email);
  if (existing) {
    Object.assign(existing, { role: "admin", status: "active", passwordHash: hash(pw) });
    d.sessions = d.sessions.filter((s) => s.coachId !== existing.id);
    console.log(`Promoted ${email} to admin and set the new password.`);
  } else {
    d.coaches.push({
      id: crypto.randomBytes(12).toString("base64url"),
      email,
      name: nameParts.join(" ") || "Admin",
      passwordHash: hash(pw),
      role: "admin",
      status: "active",
      createdAt: new Date().toISOString(),
    });
    console.log(`Created admin ${email}.`);
  }
  save(d);
} else if (cmd === "reset-password") {
  if (!email || !pw) die("Usage: node scripts/admin.mjs reset-password <email> <new-password>");
  if (pw.length < 8) die("Password must be at least 8 characters");
  const c = d.coaches.find((x) => x.email === email);
  if (!c) die(`No account with email ${email}`);
  c.passwordHash = hash(pw);
  d.sessions = d.sessions.filter((s) => s.coachId !== c.id);
  save(d);
  console.log(`Password reset for ${email}. Existing sessions were signed out.`);
} else {
  die("Commands: list | create-admin <email> <password> [name] | reset-password <email> <new-password>");
}
