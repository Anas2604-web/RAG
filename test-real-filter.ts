import * as dotenv from "dotenv";
dotenv.config();

import { QdrantClient } from "@qdrant/js-client-rest";

async function testRealFilter() {
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collection = process.env.QDRANT_COLLECTION || "agentic_rag";

    // Get actual document IDs
    const scrollResult = await client.scroll(collection, {
      limit: 10,
      with_payload: true,
    });

    const docIds = [...new Set(scrollResult.points?.map(p => p.payload?.documentId).filter(Boolean))];
    console.log("Found document IDs:", docIds);
    console.log("");

    if (docIds.length === 0) {
      console.log("No documents in collection");
      return;
    }

    // Create a dummy vector (384 dimensions for bge-small)
    const dummyVector = new Array(384).fill(0.1);

    // Test with real document ID
    console.log(`Testing filter with real documentId: ${docIds[0]}`);
    const results = await client.search(collection, {
      vector: dummyVector,
      limit: 5,
      filter: {
        must: [
          {
            key: "documentId",
            match: { value: docIds[0] },
          },
        ],
      },
    });

    console.log(`✓ Found ${results.length} results for documentId: ${docIds[0]}`);
    
    // Test with multiple document IDs using should (OR)
    if (docIds.length > 1) {
      console.log(`\nTesting filter with multiple documentIds (OR logic)`);
      const results2 = await client.search(collection, {
        vector: dummyVector,
        limit: 10,
        filter: {
          should: docIds.slice(0, 2).map(docId => ({
            key: "documentId",
            match: { value: docId },
          })),
        },
      });

      console.log(`✓ Found ${results2.length} results for ${docIds.slice(0, 2).length} documents`);
      console.log("Document IDs in results:");
      const resultDocIds = [...new Set(results2.map(r => r.payload?.documentId))];
      resultDocIds.forEach(id => console.log(`  - ${id}`));
    }
  } catch (error: any) {
    console.error("Test error:", error.message || error);
  }
}

testRealFilter();
