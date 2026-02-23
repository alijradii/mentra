import { Router } from "express";
import { authenticate } from "../middleware/auth.js";

// Course controllers
import {
  createCourse,
  getAllCourses,
  getMyCourses,
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
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Introduction to Programming
 *               description:
 *                 type: string
 *                 example: Learn the basics of programming
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, createCourse);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all public courses and user's courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, getAllCourses);

/**
 * @swagger
 * /api/courses/mine:
 *   get:
 *     summary: Get courses owned by the current user
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/mine", authenticate, getMyCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this course
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:id", authenticate, getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   patch:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", authenticate, updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course owner)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticate, deleteCourse);

// ==================== Mentor Routes ====================

/**
 * @swagger
 * /api/courses/{id}/mentors:
 *   post:
 *     summary: Add a mentor to course
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mentorId
 *             properties:
 *               mentorId:
 *                 type: string
 *                 description: User ID of the mentor to add
 *     responses:
 *       200:
 *         description: Mentor added successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course owner)
 *       404:
 *         description: Course or user not found
 *       500:
 *         description: Server error
 */
router.post("/:id/mentors", authenticate, addMentor);

/**
 * @swagger
 * /api/courses/{id}/mentors/{mentorId}:
 *   delete:
 *     summary: Remove a mentor from course
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: mentorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mentor user ID
 *     responses:
 *       200:
 *         description: Mentor removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course owner)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete("/:id/mentors/:mentorId", authenticate, removeMentor);

// ==================== Student Routes ====================

/**
 * @swagger
 * /api/courses/{id}/students:
 *   post:
 *     summary: Add a student to private course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: User ID of the student to add
 *     responses:
 *       200:
 *         description: Student added successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Course or user not found
 *       500:
 *         description: Server error
 */
router.post("/:id/students", authenticate, addStudent);

/**
 * @swagger
 * /api/courses/{id}/students/{studentId}:
 *   delete:
 *     summary: Remove a student from private course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student user ID
 *     responses:
 *       200:
 *         description: Student removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.delete("/:id/students/:studentId", authenticate, removeStudent);

/**
 * @swagger
 * /api/courses/{id}/students:
 *   get:
 *     summary: Get enrolled students for course
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of enrolled students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this course
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:id/students", authenticate, getEnrolledStudents);

// ==================== Enrollment Routes ====================

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       201:
 *         description: Enrolled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Already enrolled or invalid request
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to enroll
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post("/:id/enroll", authenticate, enrollInCourse);

/**
 * @swagger
 * /api/courses/{id}/enrollment:
 *   get:
 *     summary: Get user's enrollment in course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Server error
 */
router.get("/:id/enrollment", authenticate, getMyEnrollment);

// ==================== Module Routes ====================

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   post:
 *     summary: Create a module in course
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Week 1 - Introduction
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Module created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post("/:courseId/modules", authenticate, createModule);

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   get:
 *     summary: Get modules for course
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of modules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this course
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get("/:courseId/modules", authenticate, getModulesByCourse);

/**
 * @swagger
 * /api/courses/modules/{id}:
 *   patch:
 *     summary: Update a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Module updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.patch("/modules/:id", authenticate, updateModule);

/**
 * @swagger
 * /api/courses/modules/{id}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.delete("/modules/:id", authenticate, deleteModule);

// ==================== Node Routes ====================

/**
 * @swagger
 * /api/courses/modules/{moduleId}/nodes:
 *   post:
 *     summary: Create a node in module
 *     tags: [Nodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Variables and Data Types
 *               content:
 *                 type: string
 *                 example: Learn about different data types in programming
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Node created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Node'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.post("/modules/:moduleId/nodes", authenticate, createNode);

/**
 * @swagger
 * /api/courses/modules/{moduleId}/nodes:
 *   get:
 *     summary: Get nodes for module
 *     tags: [Nodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: List of nodes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Node'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this course
 *       404:
 *         description: Module not found
 *       500:
 *         description: Server error
 */
router.get("/modules/:moduleId/nodes", authenticate, getNodesByModule);

/**
 * @swagger
 * /api/courses/nodes/{id}:
 *   patch:
 *     summary: Update a node
 *     tags: [Nodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Node ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               content:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Node updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Node'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Node not found
 *       500:
 *         description: Server error
 */
router.patch("/nodes/:id", authenticate, updateNode);

/**
 * @swagger
 * /api/courses/nodes/{id}:
 *   delete:
 *     summary: Delete a node
 *     tags: [Nodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Node ID
 *     responses:
 *       200:
 *         description: Node deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (must be course mentor)
 *       404:
 *         description: Node not found
 *       500:
 *         description: Server error
 */
router.delete("/nodes/:id", authenticate, deleteNode);

export default router;
