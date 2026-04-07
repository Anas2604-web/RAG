import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

export function createEmbedder() {
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_API_KEY!,
    model: "BAAI/bge-small-en-v1.5",
  });

  return embeddings;
}
  