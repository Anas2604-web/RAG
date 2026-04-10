import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseFile, UnsupportedFormatError } from "@/lib/ingestion/parser";

describe("Parser", () => {
  it("should parse TXT files", async () => {
    const buffer = readFileSync("__tests__/fixtures/sample.txt");
    const text = await parseFile(buffer, "sample.txt");
    expect(text).toContain("sample text file");
    expect(text.length).toBeGreaterThan(0);
  });

  it("should parse MD files", async () => {
    const buffer = readFileSync("__tests__/fixtures/sample.md");
    const text = await parseFile(buffer, "sample.md");
    expect(text).toContain("Sample Markdown");
    expect(text.length).toBeGreaterThan(0);
  });

  it("should throw UnsupportedFormatError for unsupported extensions", async () => {
    const buffer = Buffer.from("test content");
    await expect(parseFile(buffer, "file.xyz")).rejects.toThrow(
      UnsupportedFormatError
    );
  });

  it("should throw UnsupportedFormatError with descriptive message", async () => {
    const buffer = Buffer.from("test content");
    try {
      await parseFile(buffer, "file.xyz");
      expect.fail("Should have thrown UnsupportedFormatError");
    } catch (error) {
      expect(error).toBeInstanceOf(UnsupportedFormatError);
      expect((error as Error).message).toContain("Unsupported file type");
      expect((error as Error).message).toContain("file.xyz");
    }
  });

  it("should handle empty files", async () => {
    const buffer = Buffer.from("");
    const text = await parseFile(buffer, "empty.txt");
    expect(text).toBe("");
  });

  it("should preserve text encoding for UTF-8 files", async () => {
    const content = "Hello, 世界! 🌍";
    const buffer = Buffer.from(content, "utf-8");
    const text = await parseFile(buffer, "unicode.txt");
    expect(text).toBe(content);
  });
});
