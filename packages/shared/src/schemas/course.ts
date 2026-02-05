import { z } from "zod";

/**
 * Course schema
 */
export const courseAuthorSchema = z.object({
  id: z.string().min(1, "Author ID is required"),
  name: z.string().min(1, "Author name is required"),
  avatar: z.string().url().optional(),
});

export const coursePricingSchema = z.object({
  type: z.enum(["free", "paid"]),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(), // ISO 4217 currency code
});

export const courseMetadataSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  language: z.string().optional(),
  estimatedDuration: z.number().int().min(0).optional(),
  moduleCount: z.number().int().min(0).optional(),
  nodeCount: z.number().int().min(0).optional(),
  enrollmentCount: z.number().int().min(0).optional(),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().min(0),
  }).optional(),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
});

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  author: courseAuthorSchema,
  modules: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  pricing: coursePricingSchema.optional(),
  metadata: courseMetadataSchema.optional(),
});
