import { MongoClient } from "mongodb";
import { getEnv } from "./utils/env";

const uri = getEnv("MONGODB_URI", "mongodb://localhost:27017");
const dbName = getEnv("MONGODB_DB", "mentra");

let client: MongoClient | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to MongoDB");
  return client;
}

export function getDb() {
  if (!client) throw new Error("Database not connected. Call connectToDatabase first.");
  return client.db(dbName);
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    console.log("MongoDB connection closed");
  }
}
