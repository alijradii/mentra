import { z } from "zod";

export const questionAnswerSchema = z.object({
  sectionId: z.string().min(1),
  answer: z.unknown(),
  isCorrect: z.boolean().optional(),
  autoScore: z.number().optional(),
  maxScore: z.number().optional(),
});

export const gradeOverrideSchema = z.object({
  sectionId: z.string().min(1),
  score: z.number().min(0),
  feedback: z.string().optional(),
});

export const submissionGradingSchema = z.object({
  gradedBy: z.string().min(1),
  overrides: z.array(gradeOverrideSchema),
  overallFeedback: z.string().optional(),
  finalScore: z.number().min(0),
  gradedAt: z.coerce.date(),
});

export const nodeSubmissionSchema = z.object({
  nodeId: z.string().min(1),
  userId: z.string().min(1),
  courseId: z.string().min(1),
  attemptNumber: z.number().int().min(1),
  answers: z.array(questionAnswerSchema),
  autoScore: z.number().min(0),
  maxScore: z.number().min(0),
  grading: submissionGradingSchema.optional(),
  status: z.enum(["in-progress", "submitted", "graded", "released"]),
  startedAt: z.coerce.date(),
  submittedAt: z.coerce.date().optional(),
});

export const startSubmissionSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

export const saveAnswersSchema = z.object({
  answers: z.array(questionAnswerSchema),
});

export const gradeSubmissionSchema = z.object({
  overrides: z.array(gradeOverrideSchema),
  overallFeedback: z.string().optional(),
});

export type StartSubmissionDto = z.infer<typeof startSubmissionSchema>;
export type SaveAnswersDto = z.infer<typeof saveAnswersSchema>;
export type GradeSubmissionDto = z.infer<typeof gradeSubmissionSchema>;
