import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { splitText } from "@/lib/ingestion/splitter";

describe("Splitter - Property Tests", () => {
  // Property 1: Chunk size invariant
  it("Property 1: All chunks should be <= chunkSize", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 5000 }),
        fc.integer({ min: 10, max: 300 }),
        async (text, chunkSize) => {
          // Overlap must be < chunkSize
          const overlap = Math.floor(chunkSize / 2);
          const chunks = await splitText(text, chunkSize, overlap);
          for (const chunk of chunks) {
            expect(chunk.length).toBeLessThanOrEqual(chunkSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Chunk count should be >= 1 for non-empty text
  it("Property 2: Chunk count should be >= 1 for non-empty text", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 5000 }),
        fc.integer({ min: 10, max: 300 }),
        async (text, chunkSize) => {
          const overlap = Math.floor(chunkSize / 2);
          const chunks = await splitText(text, chunkSize, overlap);
          expect(chunks.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Empty text should return empty array
  it("Property 3: Empty text should return empty array", async () => {
    const chunks = await splitText("", 100, 10);
    expect(chunks).toEqual([]);
  });
});
