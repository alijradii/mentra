import { z } from "zod";
import { sectionSchema } from "./section";

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
  sections: z.array(sectionSchema),
  order: z.number().int().min(0),
  estimatedDuration: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  metadata: nodeMetadataSchema.optional(),
});
