import { z } from "zod";

/**
 * Enrollment schema
 */
export const enrollmentProgressSchema = z.object({
  completedNodes: z.array(z.string()).default([]),
  currentModuleId: z.string().optional(),
  currentNodeId: z.string().optional(),
  overallPercentage: z.number().min(0).max(100).default(0),
});

export const enrollmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  courseId: z.string().min(1, "Course ID is required"),
  status: z.enum(["active", "completed", "paused", "dropped"]).default("active"),
  progress: enrollmentProgressSchema.default({
    completedNodes: [],
    overallPercentage: 0,
  }),
  startedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  lastAccessedAt: z.date().default(() => new Date()),
});
