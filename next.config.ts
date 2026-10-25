import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image builds a self-contained server; `npm start` installs use the regular build.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  outputFileTracingExcludes: { "*": ["./data/**", "./backups/**", "./src/**"] },
  serverExternalPackages: ["unpdf", "mammoth", "undici"],
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [
      // Everything except the public chat may only be framed by this site (clickjacking protection).
      { source: "/((?!c/).*)", headers: [...base, { key: "Content-Security-Policy", value: "frame-ancestors 'self'" }, { key: "X-Frame-Options", value: "SAMEORIGIN" }] },
      // Public chats can be embedded on coaches' websites.
      { source: "/c/:path*", headers: base },
    ];
  },
};

export default nextConfig;
