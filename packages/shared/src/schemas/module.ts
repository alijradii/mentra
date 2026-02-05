import { z } from "zod";

/**
 * Module schema
 */
export const moduleMetadataSchema = z.object({
  estimatedDuration: z.number().int().min(0).optional(),
  nodeCount: z.number().int().min(0).optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

export const moduleSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0),
  nodes: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  metadata: moduleMetadataSchema.optional(),
});
