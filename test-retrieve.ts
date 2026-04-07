import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { retrieve } from "./lib/vectorstore/retreival";

async function run() {
  const results = await retrieve("library for making user interfaces");

  console.log("Results:", results);
}

run();

  