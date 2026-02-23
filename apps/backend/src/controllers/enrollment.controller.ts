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
 * Get all courses the current user is enrolled in
 * GET /courses/enrolled
 */
export async function getEnrolledCourses(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!._id;
    const db = getDb();
    const enrollmentCollection = getEnrollmentCollection(db);
    const courseCollection = getCourseCollection(db);

    const enrollments = await enrollmentCollection
      .find({ userId: new ObjectId(userId), status: { $in: ["active", "completed"] } })
      .sort({ lastAccessedAt: -1 })
      .toArray();

    const courseIds = enrollments.map((e) => e.courseId);
    const courses =
      courseIds.length > 0
        ? await courseCollection.find({ _id: { $in: courseIds } }).toArray()
        : [];

    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const result = enrollments.map((enrollment) => ({
      enrollment,
      course: courseMap.get(enrollment.courseId.toString()) ?? null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ success: false, error: "Failed to fetch enrolled courses" });
  }
}

/**
 * Mark a node as complete / update progress
 * PATCH /courses/:id/enrollment/progress
 */
export async function updateProgress(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid course ID" });
      return;
    }

    const userId = req.user!._id;
    const { nodeId } = req.body as { nodeId?: string };

    if (!nodeId || !ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "nodeId is required" });
      return;
    }

    const db = getDb();
    const enrollmentCollection = getEnrollmentCollection(db);

    const enrollment = await enrollmentCollection.findOne({
      courseId: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    if (!enrollment) {
      res.status(404).json({ success: false, error: "Not enrolled in this course" });
      return;
    }

    const alreadyDone = enrollment.progress.completedNodes.some(
      (n) => n.toString() === nodeId
    );

    if (!alreadyDone) {
      const nodeCollection = db.collection("nodes");
      const courseNodeCount = await nodeCollection.countDocuments({
        moduleId: { $in: (await db.collection("modules").find({ courseId: new ObjectId(id) }).toArray()).map((m) => m._id) },
      });

      const newCompleted = [...enrollment.progress.completedNodes, new ObjectId(nodeId)];
      const overallPercentage = courseNodeCount > 0 ? Math.round((newCompleted.length / courseNodeCount) * 100) : 0;

      await enrollmentCollection.updateOne(
        { courseId: new ObjectId(id), userId: new ObjectId(userId) },
        {
          $addToSet: { "progress.completedNodes": new ObjectId(nodeId) },
          $set: {
            "progress.overallPercentage": overallPercentage,
            lastAccessedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }

    const updated = await enrollmentCollection.findOne({
      courseId: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ success: false, error: "Failed to update progress" });
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
