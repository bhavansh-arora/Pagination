export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const { ensureAdmin } = await import("./lib/bootstrap");
  await ensureAdmin(email, password, process.env.ADMIN_NAME?.trim() || "Admin");
}
