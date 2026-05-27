import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "pdf2json", "mammoth"],
  },
};

export default nextConfig;