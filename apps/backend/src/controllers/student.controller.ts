import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { CourseModel, getCourseCollection, getEnrollmentCollection } from "../models/course.js";
import { findUserById } from "../models/user.js";
import { addStudentSchema } from "shared";
import { isCourseMentor, canViewCourse } from "../services/course.service.js";

/**
 * Student Management Controller (for private courses)
 */

/**
 * Add a student to a private course
 * POST /courses/:id/students
 */
export async function addStudent(req: Request, res: Response): Promise<void> {
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

    // Only mentors can add students
    if (!(await isCourseMentor(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can add students",
      });
      return;
    }

    const validation = addStudentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const { studentId } = validation.data;

    // Verify student exists
    const student = await findUserById(studentId);
    if (!student) {
      res.status(404).json({
        success: false,
        error: "Student not found",
      });
      return;
    }

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

    if (course.visibility !== "private") {
      res.status(400).json({
        success: false,
        error: "Can only add students to private courses",
      });
      return;
    }

    // Add to allowed students and automatically enroll them
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $addToSet: { allowedStudentIds: new ObjectId(studentId) },
        $set: { updatedAt: new Date() }
      }
    );

    // Create enrollment
    const courseModel = new CourseModel(db);
    const enrollmentCollection = getEnrollmentCollection(db);
    
    // Check if already enrolled
    const existing = await enrollmentCollection.findOne({
      userId: new ObjectId(studentId),
      courseId: new ObjectId(id),
    });

    if (!existing) {
      await courseModel.createEnrollment({
        userId: new ObjectId(studentId),
        courseId: new ObjectId(id),
        status: "active",
        progress: {
          completedNodes: [],
          overallPercentage: 0,
        },
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Student added and enrolled successfully",
    });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add student",
    });
  }
}

/**
 * Remove a student from a private course
 * DELETE /courses/:id/students/:studentId
 */
export async function removeStudent(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const studentId = String(req.params.studentId);
    
    if (!ObjectId.isValid(id) || !ObjectId.isValid(studentId)) {
      res.status(400).json({
        success: false,
        error: "Invalid ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only mentors can remove students
    if (!(await isCourseMentor(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only course mentors can remove students",
      });
      return;
    }

    const db = getDb();
    const collection = getCourseCollection(db);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id), visibility: "private" },
      { 
        $pull: { allowedStudentIds: new ObjectId(studentId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({
        success: false,
        error: "Course not found or not a private course",
      });
      return;
    }

    res.json({
      success: true,
      message: "Student removed successfully",
    });
  } catch (error) {
    console.error("Error removing student:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove student",
    });
  }
}

/**
 * Get enrolled students for a course
 * GET /courses/:id/students
 */
export async function getEnrolledStudents(req: Request, res: Response): Promise<void> {
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
    const enrollmentCollection = getEnrollmentCollection(db);
    
    const enrollments = await enrollmentCollection.find({
      courseId: new ObjectId(id),
      status: { $in: ["active", "completed"] },
    }).toArray();

    const requestingUserId = userId.toString();
    const isPrivileged = await isCourseMentor(id, userId);

    // Get user details for each enrollment
    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const user = await findUserById(enrollment.userId.toString());
        const base = {
          _id: user?._id.toString(),
          name: user?.name,
          avatar: user?.avatar,
          enrolledAt: enrollment.createdAt,
        };
        if (isPrivileged || enrollment.userId.toString() === requestingUserId) {
          return {
            ...base,
            email: user?.email,
            progress: enrollment.progress.overallPercentage,
          };
        }
        return base;
      })
    );

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
}
