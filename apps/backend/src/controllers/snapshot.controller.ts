import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { SnapshotModel } from "../models/course.js";
import { isCourseOwner, isCourseMentor } from "../services/course.service.js";
import { broadcastToCourse } from "../websocket/course-ws.js";

/**
 * Create a snapshot of the current course state
 * POST /api/courses/:id/snapshots
 */
export async function createSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.id);
    if (!ObjectId.isValid(courseId)) {
      res.status(400).json({ success: false, error: "Invalid course ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseOwner(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only the course owner can create snapshots" });
      return;
    }

    const { label, description } = req.body as { label?: string; description?: string };
    if (!label || typeof label !== "string" || !label.trim()) {
      res.status(400).json({ success: false, error: "Snapshot label is required" });
      return;
    }

    const db = getDb();
    const snapshotModel = new SnapshotModel(db);
    const snapshot = await snapshotModel.createSnapshot(
      courseId,
      label.trim(),
      description?.trim(),
      userId,
      req.user!.name
    );

    broadcastToCourse(
      courseId,
      "snapshot:restored",
      { snapshotId: snapshot._id.toString(), label: snapshot.label, action: "created" },
      undefined,
      { id: userId, name: req.user!.name }
    );

    res.status(201).json({
      success: true,
      data: snapshot,
      message: "Snapshot created successfully",
    });
  } catch (error) {
    console.error("Error creating snapshot:", error);
    res.status(500).json({ success: false, error: "Failed to create snapshot" });
  }
}

/**
 * List all snapshots for a course (metadata only)
 * GET /api/courses/:id/snapshots
 */
export async function listSnapshots(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.id);
    if (!ObjectId.isValid(courseId)) {
      res.status(400).json({ success: false, error: "Invalid course ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only course mentors can view snapshots" });
      return;
    }

    const db = getDb();
    const snapshotModel = new SnapshotModel(db);
    const snapshots = await snapshotModel.getSnapshotsByCourse(courseId);

    res.json({ success: true, data: snapshots });
  } catch (error) {
    console.error("Error listing snapshots:", error);
    res.status(500).json({ success: false, error: "Failed to list snapshots" });
  }
}

/**
 * Get a single snapshot with full data
 * GET /api/courses/:id/snapshots/:snapshotId
 */
export async function getSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.id);
    const snapshotId = String(req.params.snapshotId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(snapshotId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only course mentors can view snapshots" });
      return;
    }

    const db = getDb();
    const snapshotModel = new SnapshotModel(db);
    const snapshot = await snapshotModel.getSnapshotById(snapshotId);

    if (!snapshot || snapshot.courseId.toString() !== courseId) {
      res.status(404).json({ success: false, error: "Snapshot not found" });
      return;
    }

    res.json({ success: true, data: snapshot });
  } catch (error) {
    console.error("Error fetching snapshot:", error);
    res.status(500).json({ success: false, error: "Failed to fetch snapshot" });
  }
}

/**
 * Restore a snapshot
 * POST /api/courses/:id/snapshots/:snapshotId/restore
 */
export async function restoreSnapshot(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.id);
    const snapshotId = String(req.params.snapshotId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(snapshotId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseOwner(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only the course owner can restore snapshots" });
      return;
    }

    const db = getDb();
    const snapshotModel = new SnapshotModel(db);

    // Verify snapshot belongs to this course
    const snapshot = await snapshotModel.getSnapshotById(snapshotId);
    if (!snapshot || snapshot.courseId.toString() !== courseId) {
      res.status(404).json({ success: false, error: "Snapshot not found" });
      return;
    }

    const restored = await snapshotModel.restoreSnapshot(snapshotId);
    if (!restored) {
      res.status(500).json({ success: false, error: "Failed to restore snapshot" });
      return;
    }

    broadcastToCourse(
      courseId,
      "snapshot:restored",
      { snapshotId, label: snapshot.label, action: "restored" },
      undefined,
      { id: userId, name: req.user!.name }
    );

    res.json({
      success: true,
      message: `Course restored to snapshot "${snapshot.label}"`,
    });
  } catch (error) {
    console.error("Error restoring snapshot:", error);
    res.status(500).json({ success: false, error: "Failed to restore snapshot" });
  }
}
