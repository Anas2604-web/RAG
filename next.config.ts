import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "pdf2json", "mammoth"],
};

export default nextConfig;
