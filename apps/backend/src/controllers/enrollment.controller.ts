import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { CourseModel, getCourseCollection, getEnrollmentCollection } from "../models/course.js";

/**
 * Enrollment Controller
 */

/**
 * Enroll in a course
 * POST /courses/:id/enroll
 */
export async function enrollInCourse(req: Request, res: Response): Promise<void> {
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

    const db = getDb();
    const collection = getCourseCollection(db);
    const course = await collection.findOne({ _id: new ObjectId(id) });

    if (!course) {
      res.status(404).json({
        success: false,
        error: "Course not found",
      });
      return;
    }

    // Check if course is published
    if (course.status !== "published") {
      res.status(400).json({
        success: false,
        error: "Cannot enroll in unpublished course",
      });
      return;
    }

    // Check visibility and permissions
    if (course.visibility === "private") {
      const isAllowed = course.allowedStudentIds?.some(
        (id) => id.toString() === userId
      );
      if (!isAllowed) {
        res.status(403).json({
          success: false,
          error: "You don't have permission to enroll in this private course",
        });
        return;
      }
    }

    // Check if already enrolled
    const enrollmentCollection = getEnrollmentCollection(db);
    const existing = await enrollmentCollection.findOne({
      userId: new ObjectId(userId),
      courseId: new ObjectId(id),
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: "Already enrolled in this course",
      });
      return;
    }

    const courseModel = new CourseModel(db);
    const enrollment = await courseModel.createEnrollment({
      userId: new ObjectId(userId),
      courseId: new ObjectId(id),
      status: "active",
      progress: {
        completedNodes: [],
        overallPercentage: 0,
      },
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: enrollment,
      message: "Enrolled successfully",
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({
      success: false,
      error: "Failed to enroll in course",
    });
  }
}

/**
 * Get user's enrollment in a course
 * GET /courses/:id/enrollment
 */
export async function getMyEnrollment(req: Request, res: Response): Promise<void> {
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

    const db = getDb();
    const enrollmentCollection = getEnrollmentCollection(db);
    
    const enrollment = await enrollmentCollection.findOne({
      courseId: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        error: "Not enrolled in this course",
      });
      return;
    }

    res.json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    console.error("Error fetching enrollment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch enrollment",
    });
  }
}
