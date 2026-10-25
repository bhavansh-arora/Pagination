import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { read } from "./db";

const g = globalThis as unknown as { __mailer?: Transporter };

/** SMTP_URL like smtps://user:pass@smtp.example.com:465 — works with Resend, Postmark, SES, Gmail, etc. */
export const mailEnabled = () => !!process.env.SMTP_URL && !!process.env.MAIL_FROM;

function transporter() {
  return (g.__mailer ??= nodemailer.createTransport(process.env.SMTP_URL!));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface MailContent {
  subject: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footnote?: string;
}

async function brand() {
  const s = (await read()).settings;
  return s.companyName || "Sagely";
}

function render(c: MailContent, name: string) {
  const p = c.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3a4b">${esc(t)}</p>`).join("");
  const btn = c.button
    ? `<p style="margin:24px 0"><a href="${esc(c.button.url)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${esc(c.button.label)}</a></p>
       <p style="margin:0 0 14px;font-size:12px;color:#8a8496">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(c.button.url)}</span></p>`
    : "";
  const foot = c.footnote ? `<p style="margin:24px 0 0;font-size:12px;color:#8a8496">${esc(c.footnote)}</p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f6f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #ebe8f0" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
  <div style="font-weight:700;font-size:16px;color:#7c3aed;margin-bottom:20px">${esc(name)}</div>
  <h1 style="margin:0 0 16px;font-size:22px;color:#16131f">${esc(c.heading)}</h1>${p}${btn}${foot}
  </td></tr></table></td></tr></table></body></html>`;
  const text = [c.heading, "", ...c.paragraphs, ...(c.button ? ["", `${c.button.label}: ${c.button.url}`] : []), ...(c.footnote ? ["", c.footnote] : [])].join("\n");
  return { html, text };
}

/** Sends an email. Returns false (and logs) when email isn't configured or sending fails. */
export async function sendMail(to: string | string[], content: MailContent): Promise<boolean> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return false;
  if (!mailEnabled()) {
    console.info(`[mail] not configured — would send "${content.subject}" to ${recipients.join(", ")}`);
    return false;
  }
  const name = await brand();
  try {
    await transporter().sendMail({ from: process.env.MAIL_FROM, to: recipients, subject: content.subject, ...render(content, name) });
    return true;
  } catch (err) {
    console.error("[mail] send failed", err);
    return false;
  }
}

export async function adminEmails() {
  return (await read()).coaches.filter((c) => c.role === "admin" && c.status === "active").map((c) => c.email);
}
