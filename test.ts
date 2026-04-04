import { ensureCollection } from "./lib/vectorstore/qdrant-client";

async function test() {
  await ensureCollection("test_collection", 384);
  console.log("Collection created 🚀");
}

test();
