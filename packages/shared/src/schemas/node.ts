import { z } from "zod";
import { sectionSchema } from "./section";

export const nodeTypeSchema = z.enum(["lesson", "practice", "quiz"]);

export const nodeSettingsSchema = z.object({
  maxAttempts: z.number().int().min(1).optional(),
  timeLimit: z.number().int().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  showCorrectAnswers: z.enum(["immediately", "after-grading", "never"]).optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  passingScore: z.number().min(0).max(100).optional(),
});

/**
 * Node schema
 */
export const nodeMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
});

export const nodeSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: nodeTypeSchema.default("lesson"),
  sections: z.array(sectionSchema),
  order: z.number().int().min(0),
  estimatedDuration: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  settings: nodeSettingsSchema.optional(),
  metadata: nodeMetadataSchema.optional(),
});

/**
 * DTOs for node operations
 */
export const createNodeSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: nodeTypeSchema.default("lesson"),
  sections: z.array(sectionSchema).default([]),
  order: z.number().int().min(0).default(0),
  estimatedDuration: z.number().int().min(0).optional(),
  settings: nodeSettingsSchema.optional(),
  metadata: nodeMetadataSchema.optional(),
});

export const updateNodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(1000).optional(),
  type: nodeTypeSchema.optional(),
  sections: z.array(sectionSchema).optional(),
  order: z.number().int().min(0).optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  settings: nodeSettingsSchema.optional(),
  metadata: nodeMetadataSchema.optional(),
});

export type CreateNodeDto = z.infer<typeof createNodeSchema>;
export type UpdateNodeDto = z.infer<typeof updateNodeSchema>;
