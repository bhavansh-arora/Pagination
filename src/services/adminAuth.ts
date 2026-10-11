import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { config } from "../config";

let warned = false;

/** Constant-time string compare so a token check can't leak correctness via response-time differences. */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // same-shape comparison so length isn't leaked either
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** True if `supplied` matches ADMIN_TOKEN, or no token is configured (local-dev default). */
export function isAuthorized(supplied: string | null | undefined): boolean {
  if (!config.adminToken) {
    if (!warned) {
      warned = true;
      console.warn(
        "WARNING: ADMIN_TOKEN is not set - the dashboard and admin API have no auth. " +
          "Fine for localhost-only use; set ADMIN_TOKEN before exposing this on a VPS."
      );
    }
    return true;
  }
  return timingSafeEqual(supplied ?? "", config.adminToken);
}

/** Express middleware gating every /api/* route behind the same token as the dashboard WebSocket. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const supplied = bearer ?? (req.query.token as string | undefined) ?? null;
  if (!isAuthorized(supplied)) {
    res.status(401).json({ error: "Unauthorized - missing or invalid admin token" });
    return;
  }
  next();
}
