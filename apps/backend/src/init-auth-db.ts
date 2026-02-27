import { closeDatabase, connectToDatabase, getDb } from "./db";

async function initAuthDatabase() {
  try {
    await connectToDatabase();
    const db = getDb();

    // Create users collection with unique email index
    const usersCollection = db.collection("users");

    console.log("Creating indexes for users collection...");

    // Create unique index on email field
    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, name: "email_unique" }
    );

    // Create unique index on username field
    await usersCollection.createIndex(
      { username: 1 },
      { unique: true, name: "username_unique" }
    );

    // Create index on emailVerificationToken for faster lookups
    await usersCollection.createIndex(
      { emailVerificationToken: 1 },
      { sparse: true, name: "email_verification_token" }
    );

    // Create index on emailVerificationExpires for TTL (automatic cleanup)
    await usersCollection.createIndex(
      { emailVerificationExpires: 1 },
      { expireAfterSeconds: 0, sparse: true, name: "email_verification_expiry" }
    );

    console.log("✅ Auth database initialized successfully!");
    console.log("Indexes created:");
    console.log("  - email (unique)");
    console.log("  - username (unique)");
    console.log("  - emailVerificationToken (sparse)");
    console.log("  - emailVerificationExpires (TTL)");

  } catch (error) {
    console.error("Failed to initialize auth database:", error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

initAuthDatabase();
