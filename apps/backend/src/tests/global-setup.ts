/**
 * Global test setup
 * This runs once before all tests
 */

// Set test environment variables
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
process.env.JWT_EXPIRES_IN = "7d";
process.env.MONGODB_URI = "mongodb://localhost:27017";
process.env.MONGODB_DB = "mentra-test";
process.env.PORT = "3020";
process.env.FRONTEND_URL = "http://localhost:3021";

console.log("Global test setup complete");
