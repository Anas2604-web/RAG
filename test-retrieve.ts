import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { retrieve } from "./lib/vectorstore/retriever";

async function run() {
  const results = await retrieve("library for making user interfaces");

  console.log("Results:", results);
}

run();

  