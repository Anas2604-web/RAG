import { promises as fs } from "fs";
import path from "path";
import { logger } from "@/lib/logger/logger";
import type { DocumentMetaData } from "@/types/index";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCUMENTS_FILE = path.join(DATA_DIR, "documents.json");

class DocumentStore {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(DATA_DIR, { recursive: true });

      // Create documents.json if it doesn't exist
      try {
        await fs.access(DOCUMENTS_FILE);
      } catch {
        await fs.writeFile(DOCUMENTS_FILE, JSON.stringify([], null, 2));
        logger.info({ event: "docstore.initialized", path: DOCUMENTS_FILE });
      }

      this.initialized = true;
    } catch (error) {
      logger.error(
        { event: "docstore.init_error", error: String(error) },
        "Failed to initialize document store"
      );
      throw error;
    }
  }

  async saveDocument(meta: DocumentMetaData): Promise<void> {
    await this.initialize();

    try {
      const docs = await this.readDocuments();
      docs.push(meta);
      await this.writeDocuments(docs);

      logger.debug({
        event: "docstore.save",
        documentId: meta.id,
        filename: meta.filename,
      });
    } catch (error) {
      logger.error(
        { event: "docstore.save_error", documentId: meta.id, error: String(error) },
        "Failed to save document"
      );
      throw error;
    }
  }

  async getDocument(id: string): Promise<DocumentMetaData | null> {
    await this.initialize();

    try {
      const docs = await this.readDocuments();
      return docs.find((doc) => doc.id === id) || null;
    } catch (error) {
      logger.error(
        { event: "docstore.get_error", documentId: id, error: String(error) },
        "Failed to get document"
      );
      throw error;
    }
  }

  async listDocuments(): Promise<DocumentMetaData[]> {
    await this.initialize();

    try {
      return await this.readDocuments();
    } catch (error) {
      logger.error(
        { event: "docstore.list_error", error: String(error) },
        "Failed to list documents"
      );
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    await this.initialize();

    try {
      const docs = await this.readDocuments();
      const filtered = docs.filter((doc) => doc.id !== id);

      if (filtered.length === docs.length) {
        throw new Error(`Document not found: ${id}`);
      }

      await this.writeDocuments(filtered);

      logger.debug({
        event: "docstore.delete",
        documentId: id,
      });
    } catch (error) {
      logger.error(
        { event: "docstore.delete_error", documentId: id, error: String(error) },
        "Failed to delete document"
      );
      throw error;
    }
  }

  private async readDocuments(): Promise<DocumentMetaData[]> {
    const content = await fs.readFile(DOCUMENTS_FILE, "utf-8");
    return JSON.parse(content);
  }

  private async writeDocuments(docs: DocumentMetaData[]): Promise<void> {
    await fs.writeFile(DOCUMENTS_FILE, JSON.stringify(docs, null, 2));
  }
}

// Singleton instance
const docStore = new DocumentStore();

export { docStore };
