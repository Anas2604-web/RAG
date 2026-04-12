import 'dotenv/config';
import fs from "node:fs/promises";
import path from "node:path";
import { ingest } from "./lib/ingestion/pipeline.js"; 

async function run() {
  const fileName = "knowledge.txt"; 
  const filePath = path.join(process.cwd(), fileName);
  
  try {
    const buffer = await fs.readFile(filePath);
    console.log(`🚀 Uploading ${fileName} to Qdrant Cloud...`);
    
    await ingest(buffer, fileName, "text/plain");
    
    console.log("✅ Data successfully pushed to Cloud!");
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
  }
}

run();