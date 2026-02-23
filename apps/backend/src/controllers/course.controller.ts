import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { createCourseSchema, updateCourseSchema, type CreateCourseDto } from "shared";
import { getDb } from "../db.js";
import { CourseModel, getCourseCollection } from "../models/course.js";
import { canViewCourse, isCourseOwner } from "../services/course.service.js";

/**
 * Course CRUD Controller
 */

/**
 * Create a new course
 * POST /courses
 */
export async function createCourse(req: Request, res: Response): Promise<void> {
  try {
    const validation = createCourseSchema.safeParse(req.body);
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
    const userId = req.user!._id;

    const courseData: CreateCourseDto = validation.data;
    const course = await courseModel.createCourse({
      ...courseData,
      description: courseData.description ?? "",
      status: "draft",
      ownerId: new ObjectId(userId),
      mentorIds: [],
      allowedStudentIds: courseData.visibility === "private" ? [] : undefined,
      modules: [],
      author: {
        id: new ObjectId(userId),
        name: req.user!.name,
        avatar: undefined,
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
}

/**
 * Get all public courses and user's enrolled/owned courses
 * GET /courses
 */
export async function getAllCourses(req: Request, res: Response): Promise<void> {
  try {
    const db = getDb();
    const collection = getCourseCollection(db);
    const userId = req.user!._id;

    // Get public courses and courses where user is owner or mentor
    const courses = await collection.find({
      $or: [
        { visibility: "public", status: "published" },
        { ownerId: new ObjectId(userId) },
        { mentorIds: new ObjectId(userId) },
      ],
    }).toArray();

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
    });
  }
}

/**
 * Get only courses owned by the current user
 * GET /courses/mine
 */
export async function getMyCourses(req: Request, res: Response): Promise<void> {
  try {
    const db = getDb();
    const collection = getCourseCollection(db);
    const userId = req.user!._id;

    const courses = await collection
      .find({ ownerId: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching my courses:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
    });
  }
}

/**
 * Get course by ID
 * GET /courses/:id
 */
export async function getCourseById(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Check if user can view this course
    if (!(await canViewCourse(id, userId))) {
      res.status(403).json({
        success: false,
        error: "You don't have permission to view this course",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const course = await courseModel.getCourseById(id, true);

    if (!course) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
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
}

/**
 * Update course
 * PATCH /courses/:id
 */
export async function updateCourse(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only the owner can update the course
    if (!(await isCourseOwner(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only the course owner can update the course",
      });
      return;
    }

    const validation = updateCourseSchema.safeParse(req.body);
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
    const updated = await courseModel.updateCourse(id, validation.data);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: "Course not found or not updated",
      });
      return;
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
}

/**
 * Delete course
 * DELETE /courses/:id
 */
export async function deleteCourse(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only the owner can delete the course
    if (!(await isCourseOwner(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only the course owner can delete the course",
      });
      return;
    }

    const db = getDb();
    const courseModel = new CourseModel(db);
    const deleted = await courseModel.deleteCourse(id, true);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
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
}
