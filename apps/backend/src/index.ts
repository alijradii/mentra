import express from "express";
import { connectToDatabase } from "./db";
import exampleRoutes from "./routes/example";
import authRoutes from "./routes/auth";
import { getEnvNumber, getEnv } from "./utils/env";

const app = express();
const PORT = getEnvNumber("PORT", 3010);
const FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:3011");

app.use(express.json());

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/examples", exampleRoutes);

async function main() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
