import * as dotenv from "dotenv";
dotenv.config();

import { QdrantClient } from "@qdrant/js-client-rest";

async function addIndex() {
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collection = process.env.QDRANT_COLLECTION || "agentic_rag";

    console.log(`Adding payload index for documentId in collection: ${collection}`);

    await client.createPayloadIndex(collection, {
      field_name: "documentId",
      field_schema: "keyword",
    });

    console.log("✓ Index created successfully!");
    console.log("\nYou can now filter by documentId in your queries.");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("✓ Index already exists, no action needed.");
    } else {
      console.error("✗ Failed to create index:", error.message || error);
    }
  }
}

addIndex();
