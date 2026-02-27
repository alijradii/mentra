import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { createNodeSchema, updateNodeSchema, type CreateNodeDto } from "shared";
import { getDb } from "../db.js";
import { CourseModel } from "../models/course.js";
import { canViewCourse, getModuleCourseId, getNodeCourseId, isCourseMentor } from "../services/course.service.js";
import { broadcastToCourse } from "../websocket/course-ws.js";

/**
 * Node CRUD Controller
 */

/**
 * Get a single node by ID
 * GET /courses/nodes/:id
 */
export async function getNodeById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid node ID" });
      return;
    }

    const courseId = await getNodeCourseId(id);
    if (!courseId) {
      res.status(404).json({ success: false, error: "Node not found" });
      return;
    }

    const userId = req.user!._id;
    if (!(await canViewCourse(courseId, userId))) {
      res.status(403).json({ success: false, error: "You don't have permission to view this node" });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const node = await courseModel.getNodeById(id);
    if (!node) {
      res.status(404).json({ success: false, error: "Node not found" });
      return;
    }

    res.json({ success: true, data: node });
  } catch (error) {
    console.error("Error fetching node:", error);
    res.status(500).json({ success: false, error: "Failed to fetch node" });
  }
}

/**
 * Create a node within a module
 * POST /modules/:moduleId/nodes
 */
export async function createNode(req: Request, res: Response): Promise<void> {
  try {
    const moduleId = String(req.params.moduleId);
    if (!ObjectId.isValid(moduleId)) {
      res.status(400).json({
        success: false,
        error: "Invalid module ID",
      });
      return;
    }

    // Get module's course ID
    const courseId = await getModuleCourseId(moduleId);
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
        error: "Only course mentors can create nodes",
      });
      return;
    }

    const validation = createNodeSchema.safeParse({
      ...req.body,
      moduleId,
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

    const nodeData: CreateNodeDto = validation.data;
    const node = await courseModel.createNode({
      ...nodeData,
      status: "draft",
      moduleId: new ObjectId(moduleId),
      sections: nodeData.sections as any,
    });

    broadcastToCourse(courseId, "node:created", node, undefined, {
      id: userId,
      name: req.user!.name,
    });

    res.status(201).json({
      success: true,
      data: node,
      message: "Node created successfully",
    });
  } catch (error) {
    console.error("Error creating node:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create node",
    });
  }
}

/**
 * Get nodes for a module
 * GET /modules/:moduleId/nodes
 */
export async function getNodesByModule(req: Request, res: Response): Promise<void> {
  try {
    const moduleId = String(req.params.moduleId);
    if (!ObjectId.isValid(moduleId)) {
      res.status(400).json({
        success: false,
        error: "Invalid module ID",
      });
      return;
    }

    // Get module's course ID
    const courseId = await getModuleCourseId(moduleId);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Module not found",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user can view the course
    if (!(await canViewCourse(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to view this module",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const nodes = await courseModel.getNodesByModuleId(moduleId);

    res.json({
      success: true,
      data: nodes,
    });
  } catch (error) {
    console.error("Error fetching nodes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch nodes",
    });
  }
}

/**
 * Update a node
 * PATCH /nodes/:id
 */
export async function updateNode(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid node ID",
      });
      return;
    }

    const validation = updateNodeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    // Get node's course ID
    const courseId = await getNodeCourseId(id);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Node not found",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user is a mentor of the course
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can update nodes",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const updated = await courseModel.updateNode(id, validation.data);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: "Node not updated",
      });
      return;
    }

    broadcastToCourse(
      courseId,
      "node:updated",
      { nodeId: id, ...validation.data },
      undefined,
      { id: userId, name: req.user!.name }
    );

    res.json({
      success: true,
      message: "Node updated successfully",
    });
  } catch (error) {
    console.error("Error updating node:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update node",
    });
  }
}

/**
 * Delete a node
 * DELETE /nodes/:id
 */
export async function deleteNode(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid node ID",
      });
      return;
    }

    // Get node's course ID
    const courseId = await getNodeCourseId(id);
    if (!courseId) {
      res.status(404).json({
        success: false,
        error: "Node not found",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user is a mentor of the course
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can delete nodes",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const deleted = await courseModel.deleteNode(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Node not deleted",
      });
      return;
    }

    broadcastToCourse(courseId, "node:deleted", { nodeId: id }, undefined, {
      id: userId,
      name: req.user!.name,
    });

    res.json({
      success: true,
      message: "Node deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting node:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete node",
    });
  }
}
