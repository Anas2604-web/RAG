import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createEmbedder } from "./lib/embeddings/embedder";
import { qdrantClient } from "./lib/vectorstore/qdrant-client";

async function run() {
  const embedder = createEmbedder();

  const docs = [
  "React is a frontend JavaScript library used for building user interfaces",
  "Node.js is a backend runtime used to build server-side applications",
  "MongoDB is a NoSQL database used for storing application data"
];

  const points = [];

  for (let i = 0; i < docs.length; i++) {
    const vector = await embedder.embedQuery(docs[i]);

    points.push({
      id: i + 1,
      vector,
      payload: { text: docs[i] }
    });
  }

  await qdrantClient.upsert("test_collection", {
    points
  });

  console.log("Stored all docs 🚀");
}

run();