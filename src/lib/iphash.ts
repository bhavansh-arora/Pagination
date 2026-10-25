import "server-only";
import crypto from "node:crypto";
import { read } from "./db";
import { clientIp } from "./api";

export async function ipHashFor(req: Request) {
  const secret = (await read()).instanceSecret;
  return crypto.createHash("sha256").update(`${secret}:${clientIp(req)}`).digest("base64url").slice(0, 22);
}
