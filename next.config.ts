import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "mongoose",
    "pdf2json",
    "mammoth",
    "bcryptjs",
    "@qdrant/js-client-rest",
    "@langchain/core",
    "@langchain/community",
    "@langchain/groq",
    "@langchain/langgraph",
    "@langchain/ollama",
    "@langchain/openai",
    "langchain",
    "pino",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;