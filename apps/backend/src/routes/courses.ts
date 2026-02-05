import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

// Course controllers
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";

// Mentor controllers
import {
  addMentor,
  removeMentor,
} from "../controllers/mentor.controller.js";

// Student controllers
import {
  addStudent,
  removeStudent,
  getEnrolledStudents,
} from "../controllers/student.controller.js";

// Enrollment controllers
import {
  enrollInCourse,
  getMyEnrollment,
} from "../controllers/enrollment.controller.js";

// Module controllers
import {
  createModule,
  getModulesByCourse,
  updateModule,
  deleteModule,
} from "../controllers/module.controller.js";

// Node controllers
import {
  createNode,
  getNodesByModule,
  updateNode,
  deleteNode,
} from "../controllers/node.controller.js";

const router = Router();

// ==================== Course Routes ====================

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Authenticated users)
 */
router.post("/", authenticate, createCourse);

/**
 * @route   GET /api/courses
 * @desc    Get all public courses and user's courses
 * @access  Private (Authenticated users)
 */
router.get("/", authenticate, getAllCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Private (Authenticated users with view permission)
 */
router.get("/:id", authenticate, getCourseById);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update course
 * @access  Private (Course mentors only)
 */
router.patch("/:id", authenticate, updateCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Course owner only)
 */
router.delete("/:id", authenticate, deleteCourse);

// ==================== Mentor Routes ====================

/**
 * @route   POST /api/courses/:id/mentors
 * @desc    Add a mentor to course
 * @access  Private (Course owner only)
 */
router.post("/:id/mentors", authenticate, addMentor);

/**
 * @route   DELETE /api/courses/:id/mentors/:mentorId
 * @desc    Remove a mentor from course
 * @access  Private (Course owner only)
 */
router.delete("/:id/mentors/:mentorId", authenticate, removeMentor);

// ==================== Student Routes ====================

/**
 * @route   POST /api/courses/:id/students
 * @desc    Add a student to private course
 * @access  Private (Course mentors only)
 */
router.post("/:id/students", authenticate, addStudent);

/**
 * @route   DELETE /api/courses/:id/students/:studentId
 * @desc    Remove a student from private course
 * @access  Private (Course mentors only)
 */
router.delete("/:id/students/:studentId", authenticate, removeStudent);

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get enrolled students for course
 * @access  Private (Users who can view the course)
 */
router.get("/:id/students", authenticate, getEnrolledStudents);

// ==================== Enrollment Routes ====================

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in a course
 * @access  Private (Authenticated users)
 */
router.post("/:id/enroll", authenticate, enrollInCourse);

/**
 * @route   GET /api/courses/:id/enrollment
 * @desc    Get user's enrollment in course
 * @access  Private (Authenticated users)
 */
router.get("/:id/enrollment", authenticate, getMyEnrollment);

// ==================== Module Routes ====================

/**
 * @route   POST /api/courses/:courseId/modules
 * @desc    Create a module in course
 * @access  Private (Course mentors only)
 */
router.post("/:courseId/modules", authenticate, createModule);

/**
 * @route   GET /api/courses/:courseId/modules
 * @desc    Get modules for course
 * @access  Private (Users who can view the course)
 */
router.get("/:courseId/modules", authenticate, getModulesByCourse);

/**
 * @route   PATCH /api/courses/modules/:id
 * @desc    Update a module
 * @access  Private (Course mentors only)
 */
router.patch("/modules/:id", authenticate, updateModule);

/**
 * @route   DELETE /api/courses/modules/:id
 * @desc    Delete a module
 * @access  Private (Course mentors only)
 */
router.delete("/modules/:id", authenticate, deleteModule);

// ==================== Node Routes ====================

/**
 * @route   POST /api/courses/modules/:moduleId/nodes
 * @desc    Create a node in module
 * @access  Private (Course mentors only)
 */
router.post("/modules/:moduleId/nodes", authenticate, createNode);

/**
 * @route   GET /api/courses/modules/:moduleId/nodes
 * @desc    Get nodes for module
 * @access  Private (Users who can view the course)
 */
router.get("/modules/:moduleId/nodes", authenticate, getNodesByModule);

/**
 * @route   PATCH /api/courses/nodes/:id
 * @desc    Update a node
 * @access  Private (Course mentors only)
 */
router.patch("/nodes/:id", authenticate, updateNode);

/**
 * @route   DELETE /api/courses/nodes/:id
 * @desc    Delete a node
 * @access  Private (Course mentors only)
 */
router.delete("/nodes/:id", authenticate, deleteNode);

export default router;
