import { connectToDatabase, getDb } from "./db.js";
import { createCourseIndexes } from "./models/course.js";

/**
 * Initialize database with indexes and any required setup
 */
async function initializeDatabase() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    
    const db = getDb();
    
    console.log("Creating indexes...");
    await createCourseIndexes(db);
    
    console.log("Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
