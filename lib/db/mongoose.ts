import mongoose from "mongoose";

declare global {
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn ?? null;

export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  if (cached) return cached;

  cached = await mongoose.connect(mongoUri, {
    bufferCommands: false,
  });

  global._mongooseConn = cached;
  return cached;
}
