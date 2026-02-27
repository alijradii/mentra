import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { createModuleSchema, reorderNodesSchema, updateModuleSchema, type CreateModuleDto } from "shared";
import { getDb } from "../db.js";
import { CourseModel } from "../models/course.js";
import { canViewCourse, getModuleCourseId, isCourseMentor, isCourseOwner } from "../services/course.service.js";
import { broadcastToCourse } from "../websocket/course-ws.js";

/**
 * Module CRUD Controller
 */

/**
 * Get a single module by ID
 * GET /courses/modules/:id
 */
export async function getModuleById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid module ID" });
      return;
    }

    const courseId = await getModuleCourseId(id);
    if (!courseId) {
      res.status(404).json({ success: false, error: "Module not found" });
      return;
    }

    const userId = req.user!._id;
    if (!(await canViewCourse(courseId, userId))) {
      res.status(403).json({ success: false, error: "You don't have permission to view this module" });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const module = await courseModel.getModuleById(id);
    if (!module) {
      res.status(404).json({ success: false, error: "Module not found" });
      return;
    }

    res.json({ success: true, data: module });
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ success: false, error: "Failed to fetch module" });
  }
}

/**
 * Create a module within a course
 * POST /courses/:courseId/modules
 */
export async function createModule(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    if (!ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only mentors can create modules
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can create modules",
      });
      return;
    }

    const validation = createModuleSchema.safeParse({
      ...req.body,
      courseId,
    });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);

    const moduleData: CreateModuleDto = validation.data;
    const module = await courseModel.createModule({
      ...moduleData,
      status: "draft",
      courseId: new ObjectId(courseId),
      nodes: [],
    });

    broadcastToCourse(courseId, "module:created", module, undefined, {
      id: userId,
      name: req.user!.name,
    });

    res.status(201).json({
      success: true,
      data: module,
      message: "Module created successfully",
    });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create module",
    });
  }
}

/**
 * Get modules for a course
 * GET /courses/:courseId/modules
 */
export async function getModulesByCourse(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    if (!ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user can view this course
    if (!(await canViewCourse(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to view this course",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const modules = await courseModel.getModulesByCourseId(courseId);

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch modules",
    });
  }
}

/**
 * Update a module
 * PATCH /modules/:id
 */
export async function updateModule(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid module ID",
      });
      return;
    }

    const validation = updateModuleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    // Get module's course ID
    const courseId = await getModuleCourseId(id);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user is a mentor of the course
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can update modules",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const updated = await courseModel.updateModule(id, validation.data);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: "Module not updated",
      });
      return;
    }

    broadcastToCourse(
      courseId,
      "module:updated",
      { moduleId: id, ...validation.data },
      undefined,
      { id: userId, name: req.user!.name }
    );

    res.json({
      success: true,
      message: "Module updated successfully",
    });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update module",
    });
  }
}

/**
 * Delete a module
 * DELETE /modules/:id
 */
export async function deleteModule(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid module ID",
      });
      return;
    }

    // Get module's course ID
    const courseId = await getModuleCourseId(id);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user is a mentor of the course
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can delete modules",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const deleted = await courseModel.deleteModule(id, true);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Module not deleted",
      });
      return;
    }

    broadcastToCourse(courseId, "module:deleted", { moduleId: id }, undefined, {
      id: userId,
      name: req.user!.name,
    });

    res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete module",
    });
  }
}

/**
 * Reorder nodes within a module
 * PATCH /courses/modules/:id/nodes/reorder
 */
export async function reorderNodes(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid module ID",
      });
      return;
    }

    const courseId = await getModuleCourseId(id);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can reorder nodes",
      });
      return;
    }

    const validation = reorderNodesSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const ok = await courseModel.reorderNodes(id, validation.data.nodeIds);
    if (!ok) {
      res.status(400).json({
        success: false,
        error: "Invalid node list (must match module nodes)",
      });
      return;
    }

    broadcastToCourse(
      courseId,
      "nodes:reordered",
      { moduleId: id, nodeIds: validation.data.nodeIds },
      undefined,
      { id: userId, name: req.user!.name }
    );

    res.json({
      success: true,
      message: "Nodes reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering nodes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reorder nodes",
    });
  }
}
