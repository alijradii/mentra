import { Router } from "express";
import { createExampleSchema } from "shared";
import { getDb } from "../db";

const router = Router();

/**
 * @swagger
 * /api/examples:
 *   get:
 *     summary: Get all examples
 *     tags: [Examples]
 *     security: []
 *     responses:
 *       200:
 *         description: List of examples
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get("/", async (_req, res) => {
  try {
    const db = getDb();
    const items = await db.collection("examples").find({}).toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * @swagger
 * /api/examples:
 *   post:
 *     summary: Create a new example
 *     tags: [Examples]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Example Title
 *               description:
 *                 type: string
 *                 example: Example description
 *     responses:
 *       201:
 *         description: Example created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
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
