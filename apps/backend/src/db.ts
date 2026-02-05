import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "mentra";

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
