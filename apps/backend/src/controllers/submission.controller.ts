import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  startSubmissionSchema,
  saveAnswersSchema,
  gradeSubmissionSchema,
} from "shared";
import { getDb } from "../db.js";
import { CourseModel } from "../models/course.js";
import {
  canViewCourse,
  getNodeCourseId,
  isCourseMentor,
  isEnrolled,
} from "../services/course.service.js";
import { autoGradeSubmission } from "../services/grading.service.js";

// ── Student endpoints ──

/**
 * POST /api/courses/nodes/:nodeId/submissions
 * Start a new attempt for a practice/quiz node.
 */
export async function startSubmission(req: Request, res: Response): Promise<void> {
  try {
    const nodeId = String(req.params.nodeId);
    if (!ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "Invalid node ID" });
      return;
    }

    const validation = startSubmissionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: validation.error.errors });
      return;
    }

    const userId = req.user!._id;
    const { courseId } = validation.data;

    if (!(await isEnrolled(courseId, userId))) {
      const isMentor = await isCourseMentor(courseId, userId);
      if (!isMentor) {
        res.status(403).json({ success: false, error: "You must be enrolled to submit" });
        return;
      }
    }

    const db = getDb();
    const model = new CourseModel(db);
    const node = await model.getNodeById(nodeId);
    if (!node) {
      res.status(404).json({ success: false, error: "Node not found" });
      return;
    }

    const nodeType = (node as any).type ?? "lesson";
    if (nodeType === "lesson") {
      res.status(400).json({ success: false, error: "Lesson nodes do not accept submissions" });
      return;
    }

    const existingCount = await model.countSubmissions(nodeId, userId);
    const maxAttempts = (node as any).settings?.maxAttempts;

    if (nodeType === "quiz" && maxAttempts && existingCount >= maxAttempts) {
      res.status(400).json({ success: false, error: "Maximum attempts reached" });
      return;
    }

    // Check for in-progress submission
    const existing = await model.getSubmissionsByNodeAndUser(nodeId, userId);
    const inProgress = existing.find((s) => s.status === "in-progress");
    if (inProgress) {
      res.json({ success: true, data: inProgress });
      return;
    }

    const now = new Date();
    const submission = await model.createSubmission({
      nodeId: new ObjectId(nodeId),
      userId: new ObjectId(userId),
      courseId: new ObjectId(courseId),
      attemptNumber: existingCount + 1,
      answers: [],
      autoScore: 0,
      maxScore: 0,
      status: "in-progress",
      startedAt: now,
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("Error starting submission:", error);
    res.status(500).json({ success: false, error: "Failed to start submission" });
  }
}

/**
 * PATCH /api/courses/nodes/:nodeId/submissions/:submissionId
 * Save answers while in-progress (auto-save).
 */
export async function saveAnswers(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(submissionId)) {
      res.status(400).json({ success: false, error: "Invalid submission ID" });
      return;
    }

    const validation = saveAnswersSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: validation.error.errors });
      return;
    }

    const userId = req.user!._id;
    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }
    if (submission.userId.toString() !== userId) {
      res.status(403).json({ success: false, error: "Not your submission" });
      return;
    }
    if (submission.status !== "in-progress") {
      res.status(400).json({ success: false, error: "Submission already finalized" });
      return;
    }

    await model.updateSubmission(submissionId, { answers: validation.data.answers as any });
    res.json({ success: true, message: "Answers saved" });
  } catch (error) {
    console.error("Error saving answers:", error);
    res.status(500).json({ success: false, error: "Failed to save answers" });
  }
}

/**
 * POST /api/courses/nodes/:nodeId/submissions/:submissionId/submit
 * Finalize and auto-grade the submission.
 */
export async function submitSubmission(req: Request, res: Response): Promise<void> {
  try {
    const nodeId = String(req.params.nodeId);
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(submissionId) || !ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }
    if (submission.userId.toString() !== userId) {
      res.status(403).json({ success: false, error: "Not your submission" });
      return;
    }
    if (submission.status !== "in-progress") {
      res.status(400).json({ success: false, error: "Submission already finalized" });
      return;
    }

    const node = await model.getNodeById(nodeId);
    if (!node) {
      res.status(404).json({ success: false, error: "Node not found" });
      return;
    }

    // Merge any final answers from request body
    let finalAnswers = submission.answers;
    if (req.body.answers && Array.isArray(req.body.answers)) {
      finalAnswers = req.body.answers;
    }

    const gradeResult = autoGradeSubmission(node.sections as any, finalAnswers as any);

    const nodeType = (node as any).type ?? "lesson";
    const now = new Date();

    await model.updateSubmission(submissionId, {
      answers: gradeResult.answers as any,
      autoScore: gradeResult.autoScore,
      maxScore: gradeResult.maxScore,
      status: nodeType === "practice" ? "released" : "submitted",
      submittedAt: now,
    });

    // Auto-mark node as complete in enrollment
    const courseId = submission.courseId.toString();
    const enrollmentCollection = db.collection("enrollments");
    await enrollmentCollection.updateOne(
      {
        courseId: new ObjectId(courseId),
        userId: new ObjectId(userId),
        "progress.completedNodes": { $ne: new ObjectId(nodeId) },
      },
      {
        $addToSet: { "progress.completedNodes": new ObjectId(nodeId) },
        $set: { lastAccessedAt: now, updatedAt: now },
      }
    );

    const updated = await model.getSubmissionById(submissionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error submitting:", error);
    res.status(500).json({ success: false, error: "Failed to submit" });
  }
}

/**
 * GET /api/courses/nodes/:nodeId/submissions/mine
 * Get own submissions for a node.
 */
export async function getMySubmissions(req: Request, res: Response): Promise<void> {
  try {
    const nodeId = String(req.params.nodeId);
    if (!ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "Invalid node ID" });
      return;
    }

    const userId = req.user!._id;
    const courseId = await getNodeCourseId(nodeId);
    if (!courseId) {
      res.status(404).json({ success: false, error: "Node not found" });
      return;
    }

    if (!(await canViewCourse(courseId, userId))) {
      res.status(403).json({ success: false, error: "No permission" });
      return;
    }

    const db = getDb();
    const model = new CourseModel(db);
    const submissions = await model.getSubmissionsByNodeAndUser(nodeId, userId);

    // For quiz submissions that haven't been released, hide grading details
    const sanitized = submissions.map((s) => {
      if (s.status === "submitted" || s.status === "graded") {
        const { grading, autoScore, ...rest } = s as any;
        return { ...rest, autoScore: undefined };
      }
      return s;
    });

    res.json({ success: true, data: sanitized });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch submissions" });
  }
}

/**
 * GET /api/courses/nodes/:nodeId/submissions/:submissionId
 * Get a specific submission (student view, respects release status).
 */
export async function getSubmission(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(submissionId)) {
      res.status(400).json({ success: false, error: "Invalid submission ID" });
      return;
    }

    const userId = req.user!._id;
    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }
    if (submission.userId.toString() !== userId) {
      res.status(403).json({ success: false, error: "Not your submission" });
      return;
    }

    // Hide grading/score if not released for quiz
    if (submission.status === "submitted" || submission.status === "graded") {
      const { grading, autoScore, ...rest } = submission as any;
      res.json({ success: true, data: { ...rest, autoScore: undefined } });
      return;
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ success: false, error: "Failed to fetch submission" });
  }
}

// ── Mentor endpoints ──

/**
 * GET /api/courses/:courseId/nodes/:nodeId/submissions
 * List all student submissions for a node (mentor only).
 */
export async function listNodeSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    const nodeId = String(req.params.nodeId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only mentors can view submissions" });
      return;
    }

    const statusFilter = req.query.status as string | undefined;
    const db = getDb();
    const model = new CourseModel(db);
    const submissions = await model.getSubmissionsByNode(nodeId, statusFilter);

    // Enrich with user names
    const userIds = [...new Set(submissions.map((s) => s.userId.toString()))];
    const users = userIds.length > 0
      ? await db.collection("users")
          .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
          .project({ _id: 1, name: 1, avatar: 1 })
          .toArray()
      : [];
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const enriched = submissions.map((s) => ({
      ...s,
      user: userMap.get(s.userId.toString()) ?? null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error listing submissions:", error);
    res.status(500).json({ success: false, error: "Failed to list submissions" });
  }
}

/**
 * GET /api/courses/:courseId/submissions/:submissionId
 * Get a specific student's submission (mentor view).
 */
export async function getMentorSubmission(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(submissionId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only mentors can view submissions" });
      return;
    }

    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission || submission.courseId.toString() !== courseId) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }

    // Get user info
    const user = await db.collection("users")
      .findOne(
        { _id: submission.userId },
        { projection: { _id: 1, name: 1, avatar: 1, email: 1 } }
      );

    res.json({ success: true, data: { ...submission, user } });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ success: false, error: "Failed to fetch submission" });
  }
}

/**
 * PATCH /api/courses/:courseId/submissions/:submissionId/grade
 * Save grade overrides and feedback (mentor only).
 */
export async function gradeSubmission(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(submissionId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only mentors can grade" });
      return;
    }

    const validation = gradeSubmissionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, error: "Validation failed", details: validation.error.errors });
      return;
    }

    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission || submission.courseId.toString() !== courseId) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }
    if (submission.status === "in-progress") {
      res.status(400).json({ success: false, error: "Submission not yet submitted" });
      return;
    }

    const { overrides, overallFeedback } = validation.data;

    // Calculate final score: start from autoScore, apply overrides
    const overrideMap = new Map(overrides.map((o) => [o.sectionId, o]));
    let finalScore = 0;
    for (const answer of submission.answers) {
      const override = overrideMap.get(answer.sectionId);
      finalScore += override ? override.score : (answer.autoScore ?? 0);
    }

    await model.updateSubmission(submissionId, {
      grading: {
        gradedBy: new ObjectId(userId),
        overrides: overrides as any,
        overallFeedback,
        finalScore,
        gradedAt: new Date(),
      },
      status: "graded",
    });

    const updated = await model.getSubmissionById(submissionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ success: false, error: "Failed to grade submission" });
  }
}

/**
 * POST /api/courses/:courseId/submissions/:submissionId/release
 * Release grades to student (mentor only).
 */
export async function releaseSubmission(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    const submissionId = String(req.params.submissionId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(submissionId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only mentors can release grades" });
      return;
    }

    const db = getDb();
    const model = new CourseModel(db);
    const submission = await model.getSubmissionById(submissionId);

    if (!submission || submission.courseId.toString() !== courseId) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }

    if (submission.status !== "graded" && submission.status !== "submitted") {
      res.status(400).json({ success: false, error: "Submission must be graded or submitted before release" });
      return;
    }

    // If releasing without explicit grading, use auto-grade as final score
    if (!submission.grading) {
      await model.updateSubmission(submissionId, {
        grading: {
          gradedBy: new ObjectId(userId),
          overrides: [],
          finalScore: submission.autoScore,
          gradedAt: new Date(),
        },
        status: "released",
      });
    } else {
      await model.updateSubmission(submissionId, { status: "released" });
    }

    const updated = await model.getSubmissionById(submissionId);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error releasing submission:", error);
    res.status(500).json({ success: false, error: "Failed to release submission" });
  }
}

/**
 * POST /api/courses/:courseId/nodes/:nodeId/submissions/release-all
 * Bulk release all graded submissions for a node (mentor only).
 */
export async function releaseAllSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const courseId = String(req.params.courseId);
    const nodeId = String(req.params.nodeId);
    if (!ObjectId.isValid(courseId) || !ObjectId.isValid(nodeId)) {
      res.status(400).json({ success: false, error: "Invalid ID" });
      return;
    }

    const userId = req.user!._id;
    if (!(await isCourseMentor(courseId, userId))) {
      res.status(403).json({ success: false, error: "Only mentors can release grades" });
      return;
    }

    const db = getDb();
    const model = new CourseModel(db);
    const count = await model.bulkReleaseSubmissions(nodeId);

    res.json({ success: true, message: `Released ${count} submissions` });
  } catch (error) {
    console.error("Error releasing submissions:", error);
    res.status(500).json({ success: false, error: "Failed to release submissions" });
  }
}
