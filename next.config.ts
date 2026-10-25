import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mammoth", "undici"],
};

export default nextConfig;
