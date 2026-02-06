import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import * as path from "path";

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

/**
 * Connect to in-memory MongoDB for testing
 */
export async function setupTestDatabase() {
  // Configure MongoDB Memory Server to use a local cache directory
  const cacheDir = path.join(process.cwd(), ".mongodb-binaries");
  
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: "mentra-test",
    },
    binary: {
      downloadDir: cacheDir,
    },
  });
  const uri = mongoServer.getUri();
  
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  
  return { uri, client: mongoClient, db: mongoClient.db() };
}

/**
 * Clear all collections in the test database
 */
export async function clearTestDatabase() {
  if (!mongoClient) return;
  
  const db = mongoClient.db();
  const collections = await db.collections();
  
  await Promise.all(
    collections.map((collection) => collection.deleteMany({}))
  );
}

/**
 * Close database connection and stop MongoDB server
 */
export async function teardownTestDatabase() {
  if (mongoClient) {
    await mongoClient.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Get test database instance
 */
export function getTestDb() {
  if (!mongoClient) {
    throw new Error("Test database not connected. Call setupTestDatabase first.");
  }
  return mongoClient.db();
}
