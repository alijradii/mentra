import type { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { CourseModel } from "../models/course.js";
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  updateModuleSchema,
  createNodeSchema,
  updateNodeSchema,
  type CreateCourseDto,
  type CreateModuleDto,
  type CreateNodeDto,
} from "shared";

/**
 * Example routes for Course, Module, and Node operations
 * This demonstrates how to use the CourseModel with the DTOs and schemas
 */
export function setupCourseRoutes(router: Router) {
  /**
   * Create a new course
   * POST /courses
   */
  router.post("/courses", async (req: Request, res: Response) => {
    try {
      const validation = createCourseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);

      const courseData: CreateCourseDto = validation.data;
      const course = await courseModel.createCourse({
        ...courseData,
        modules: [],
        author: {
          id: new ObjectId(courseData.author.id),
          name: courseData.author.name,
          avatar: courseData.author.avatar,
        },
      });

      res.status(201).json({
        success: true,
        data: course,
        message: "Course created successfully",
      });
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create course",
      });
    }
  });

  /**
   * Get course by ID
   * GET /courses/:id
   */
  router.get("/courses/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);
      const course = await courseModel.getCourseById(id, true);

      if (!course) {
        return res.status(404).json({
          success: false,
          error: "Course not found",
        });
      }

      res.json({
        success: true,
        data: course,
      });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch course",
      });
    }
  });

  /**
   * Update course
   * PATCH /courses/:id
   */
  router.patch("/courses/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
      }

      const validation = updateCourseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);
      
      // Convert author.id to ObjectId if present
      const updateData: any = validation.data.author
        ? {
            ...validation.data,
            author: {
              ...validation.data.author,
              id: new ObjectId(validation.data.author.id),
            },
          }
        : validation.data;

      const updated = await courseModel.updateCourse(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Course not found or not updated",
        });
      }

      res.json({
        success: true,
        message: "Course updated successfully",
      });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update course",
      });
    }
  });

  /**
   * Delete course
   * DELETE /courses/:id
   */
  router.delete("/courses/:id", async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);
      const deleted = await courseModel.deleteCourse(id, true);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Course not found",
        });
      }

      res.json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete course",
      });
    }
  });

  /**
   * Create a module within a course
   * POST /courses/:courseId/modules
   */
  router.post("/courses/:courseId/modules", async (req: Request, res: Response) => {
    try {
      const courseId = String(req.params.courseId);
      if (!ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
      }

      const validation = createModuleSchema.safeParse({
        ...req.body,
        courseId,
      });

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);

      const moduleData: CreateModuleDto = validation.data;
      const module = await courseModel.createModule({
        ...moduleData,
        courseId: new ObjectId(courseId),
        nodes: [],
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
  });

  /**
   * Get modules for a course
   * GET /courses/:courseId/modules
   */
  router.get("/courses/:courseId/modules", async (req: Request, res: Response) => {
    try {
      const courseId = String(req.params.courseId);
      if (!ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid course ID",
        });
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
  });

  /**
   * Create a node within a module
   * POST /modules/:moduleId/nodes
   */
  router.post("/modules/:moduleId/nodes", async (req: Request, res: Response) => {
    try {
      const moduleId = String(req.params.moduleId);
      if (!ObjectId.isValid(moduleId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid module ID",
        });
      }

      const validation = createNodeSchema.safeParse({
        ...req.body,
        moduleId,
      });

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const db = getDb();
      const courseModel = new CourseModel(db);

      const nodeData = validation.data;
      const node = await courseModel.createNode({
        ...nodeData,
        moduleId: new ObjectId(moduleId),
        sections: nodeData.sections as any, // Zod defaults handle the dates
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
  });

  /**
   * Get nodes for a module
   * GET /modules/:moduleId/nodes
   */
  router.get("/modules/:moduleId/nodes", async (req: Request, res: Response) => {
    try {
      const moduleId = String(req.params.moduleId);
      if (!ObjectId.isValid(moduleId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid module ID",
        });
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
  });
}
