import "server-only";
import dns from "node:dns";
import net from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 4;

function v4ToInt(ip: string) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (v4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      lower === "::" || lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") ||
      lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") ||
      lower.startsWith("feb") || lower.startsWith("ff")
    );
  }
  return true;
}

// The check runs inside the socket's DNS lookup, so a hostname can't resolve to a
// public IP during validation and a private one at connect time.
const guardedAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, "", 0);
        const list = addresses as dns.LookupAddress[];
        const bad = list.find((a) => isPrivateAddress(a.address));
        if (bad || list.length === 0) {
          return callback(new Error(`Blocked address for ${hostname}`), "", 0);
        }
        if ((options as dns.LookupOptions).all) return callback(null, list as never, 0);
        callback(null, list[0].address, list[0].family);
      });
    },
  },
});

export interface FetchedPage {
  url: string;
  contentType: string;
  body: Buffer;
}

export async function safeFetch(rawUrl: string): Promise<FetchedPage> {
  let url = new URL(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) links are supported");
    if (net.isIP(url.hostname.replace(/^\[|\]$/g, "")) && isPrivateAddress(url.hostname.replace(/^\[|\]$/g, ""))) {
      throw new Error("That address isn't reachable");
    }
    const res = await undiciFetch(url, {
      dispatcher: guardedAgent,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; MindcloneBot/1.0; +knowledge-import)",
        accept: "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5",
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (!res.ok) throw new Error(`The page responded with ${res.status}`);
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) throw new Error("That page is too large (8 MB max)");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of res.body ?? []) {
      size += chunk.length;
      if (size > MAX_BYTES) throw new Error("That page is too large (8 MB max)");
      chunks.push(Buffer.from(chunk));
    }
    return { url: url.toString(), contentType: res.headers.get("content-type") ?? "", body: Buffer.concat(chunks) };
  }
  throw new Error("Too many redirects");
}
