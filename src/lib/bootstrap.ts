import { nanoid } from "nanoid";
import { hashPassword } from "./auth";
import { mutate } from "./db";

/**
 * Creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD on first boot. If the account
 * already exists it is promoted and reactivated, but its password is left alone so
 * an admin who changed it in the UI isn't reset on every restart.
 */
export async function ensureAdmin(email: string, password: string, name: string) {
  if (password.length < 8) {
    console.warn("[admin] ADMIN_PASSWORD must be at least 8 characters; skipping admin bootstrap");
    return;
  }
  const passwordHash = await hashPassword(password);
  const outcome = await mutate((d) => {
    const existing = d.coaches.find((c) => c.email === email);
    if (existing) {
      if (existing.role === "admin" && existing.status === "active") return "exists";
      existing.role = "admin";
      existing.status = "active";
      return "promoted";
    }
    d.coaches.push({ id: nanoid(), email, name, passwordHash, role: "admin", status: "active", createdAt: new Date().toISOString() });
    return "created";
  });
  if (outcome !== "exists") console.log(`[admin] ${outcome} admin account ${email}`);
}
