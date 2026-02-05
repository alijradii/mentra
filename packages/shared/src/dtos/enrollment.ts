import { z } from "zod";
import { enrollmentSchema } from "../schemas/enrollment";

/**
 * Enrollment DTOs
 */
export const createEnrollmentSchema = enrollmentSchema.pick({
  userId: true,
  courseId: true,
});

export const updateEnrollmentProgressSchema = z.object({
  completedNodes: z.array(z.string()).optional(),
  currentModuleId: z.string().optional(),
  currentNodeId: z.string().optional(),
  overallPercentage: z.number().min(0).max(100).optional(),
});

export type CreateEnrollmentDto = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentProgressDto = z.infer<typeof updateEnrollmentProgressSchema>;

/**
 * Query/filter DTOs
 */
export const enrollmentFilterSchema = z.object({
  userId: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(["active", "completed", "paused", "dropped"]).optional(),
});

export type EnrollmentFilterDto = z.infer<typeof enrollmentFilterSchema>;
