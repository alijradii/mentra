import express from "express";
import { connectToDatabase } from "./db";
import exampleRoutes from "./routes/example";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
