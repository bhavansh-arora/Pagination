import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image builds a self-contained server; `npm start` installs use the regular build.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  outputFileTracingExcludes: { "*": ["./data/**", "./backups/**", "./src/**"] },
  serverExternalPackages: ["unpdf", "mammoth", "undici"],
};

export default nextConfig;
