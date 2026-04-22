import * as dotenv from "dotenv";
dotenv.config();

import { QdrantClient } from "@qdrant/js-client-rest";

async function testFilter() {
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL!,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collection = process.env.QDRANT_COLLECTION || "agentic_rag";

    console.log("Testing Qdrant filter formats...\n");

    // Create a dummy vector (384 dimensions for bge-small)
    const dummyVector = new Array(384).fill(0.1);

    // Test 1: No filter
    console.log("Test 1: No filter");
    try {
      const results1 = await client.search(collection, {
        vector: dummyVector,
        limit: 1,
      });
      console.log("✓ No filter works, found", results1.length, "results\n");
    } catch (e: any) {
      console.log("✗ No filter failed:", e.message, "\n");
    }

    // Test 2: Simple must filter
    console.log("Test 2: Simple must filter");
    try {
      const results2 = await client.search(collection, {
        vector: dummyVector,
        limit: 1,
        filter: {
          must: [
            {
              key: "documentId",
              match: { value: "test-doc-id" },
            },
          ],
        },
      });
      console.log("✓ Must filter works, found", results2.length, "results\n");
    } catch (e: any) {
      console.log("✗ Must filter failed:", e.message, "\n");
    }

    // Test 3: Should filter (OR logic)
    console.log("Test 3: Should filter (OR logic)");
    try {
      const results3 = await client.search(collection, {
        vector: dummyVector,
        limit: 1,
        filter: {
          should: [
            {
              key: "documentId",
              match: { value: "test-doc-id-1" },
            },
            {
              key: "documentId",
              match: { value: "test-doc-id-2" },
            },
          ],
        },
      });
      console.log("✓ Should filter works, found", results3.length, "results\n");
    } catch (e: any) {
      console.log("✗ Should filter failed:", e.message, "\n");
      console.log("Full error:", JSON.stringify(e, null, 2));
    }

    // Test 4: Get actual document IDs from collection
    console.log("Test 4: Checking actual documents in collection");
    try {
      const scrollResult = await client.scroll(collection, {
        limit: 5,
        with_payload: true,
      });
      console.log("Found", scrollResult.points?.length || 0, "points");
      if (scrollResult.points && scrollResult.points.length > 0) {
        console.log("Sample documentIds:");
        scrollResult.points.slice(0, 3).forEach((point) => {
          console.log("  -", point.payload?.documentId);
        });
      }
    } catch (e: any) {
      console.log("✗ Scroll failed:", e.message);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

testFilter();
