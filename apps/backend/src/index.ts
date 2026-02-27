import http from "http";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { connectToDatabase } from "./db.js";
import exampleRoutes from "./routes/example.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import { getEnvNumber, getEnv } from "./utils/env.js";
import { swaggerSpec } from "./swagger.js";
import { attachCourseWebSocket } from "./websocket/course-ws.js";

const app = express();
const PORT = getEnvNumber("PORT", 3020);
const FRONTEND_URL = getEnv("FRONTEND_URL", "http://localhost:3021");

app.use(express.json());

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_URL);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Mentra API Documentation",
}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/examples", exampleRoutes);
app.use("/api/courses", courseRoutes);

async function main() {
  try {
    await connectToDatabase();

    const httpServer = http.createServer(app);
    attachCourseWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
