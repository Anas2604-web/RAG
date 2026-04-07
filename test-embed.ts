import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import { createEmbedder } from "./lib/embeddings/embedder";

async function run() {
  const embedder = createEmbedder();

  const vector = await embedder.embedQuery("apple is a fruit");


  console.log("Dimension:", vector.length);
  console.log("Sample:", vector.slice(0, 5));
}

run();

  