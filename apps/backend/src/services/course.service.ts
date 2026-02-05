import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { getCourseCollection, getEnrollmentCollection } from "../models/course.js";

/**
 * Service for course-related business logic and permission checks
 */

/**
 * Check if user is the course owner
 */
export async function isCourseOwner(courseId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const collection = getCourseCollection(db);
  const course = await collection.findOne({ _id: new ObjectId(courseId) });
  return course?.ownerId.toString() === userId;
}

/**
 * Check if user is a mentor of the course (owner or added mentor)
 */
export async function isCourseMentor(courseId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const collection = getCourseCollection(db);
  const course = await collection.findOne({ _id: new ObjectId(courseId) });
  if (!course) return false;
  return (
    course.ownerId.toString() === userId ||
    course.mentorIds.some((id) => id.toString() === userId)
  );
}

/**
 * Check if user is enrolled in the course
 */
export async function isEnrolled(courseId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const collection = getEnrollmentCollection(db);
  const enrollment = await collection.findOne({
    courseId: new ObjectId(courseId),
    userId: new ObjectId(userId),
    status: { $in: ["active", "completed"] },
  });
  return !!enrollment;
}

/**
 * Check if user can view the course
 */
export async function canViewCourse(courseId: string, userId: string): Promise<boolean> {
  const db = getDb();
  const collection = getCourseCollection(db);
  const course = await collection.findOne({ _id: new ObjectId(courseId) });
  
  if (!course) return false;
  
  // Mentors can always view
  if (course.ownerId.toString() === userId || 
      course.mentorIds.some((id) => id.toString() === userId)) {
    return true;
  }
  
  // Public courses can be viewed by anyone
  if (course.visibility === "public") {
    return true;
  }
  
  // Private courses require enrollment
  return await isEnrolled(courseId, userId);
}

/**
 * Get course by ID with ownership check
 */
export async function getCourseWithPermissionCheck(courseId: string, userId: string) {
  const db = getDb();
  const collection = getCourseCollection(db);
  const course = await collection.findOne({ _id: new ObjectId(courseId) });
  
  if (!course) {
    return { course: null, error: "Course not found", status: 404 };
  }

  const hasPermission = await canViewCourse(courseId, userId);
  if (!hasPermission) {
    return { course: null, error: "You don't have permission to view this course", status: 403 };
  }

  return { course, error: null, status: 200 };
}

/**
 * Get module's course ID
 */
export async function getModuleCourseId(moduleId: string): Promise<string | null> {
  const db = getDb();
  const moduleCollection = db.collection("modules");
  const module = await moduleCollection.findOne({ _id: new ObjectId(moduleId) });
  return module?.courseId.toString() || null;
}

/**
 * Get node's course ID (via module)
 */
export async function getNodeCourseId(nodeId: string): Promise<string | null> {
  const db = getDb();
  const nodeCollection = db.collection("nodes");
  const node = await nodeCollection.findOne({ _id: new ObjectId(nodeId) });
  
  if (!node) return null;
  
  return await getModuleCourseId(node.moduleId.toString());
}
