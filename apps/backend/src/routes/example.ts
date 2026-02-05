import { Router } from "express";
import { createExampleSchema } from "shared";
import { getDb } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const db = getDb();
    const items = await db.collection("examples").find({}).toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post("/", async (req, res) => {
  const parsed = createExampleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten(),
    });
  }
  try {
    const db = getDb();
    const result = await db.collection("examples").insertOne({
      ...parsed.data,
      createdAt: new Date(),
    });
    res.status(201).json({
      success: true,
      data: { id: result.insertedId, ...parsed.data },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
