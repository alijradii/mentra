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
  ownerId: z.string().min(1, "Owner ID is required"),
  mentorIds: z.array(z.string()).default([]),
  allowedStudentIds: z.array(z.string()).optional(),
  modules: z.array(z.string()).default([]),
  thumbnail: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  visibility: z.enum(["public", "private"]).default("public"),
  pricing: coursePricingSchema.optional(),
  metadata: courseMetadataSchema.optional(),
});

/**
 * DTOs for course operations
 */
export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().default(""),
  thumbnail: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  pricing: coursePricingSchema.optional(),
  metadata: courseMetadataSchema.optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().min(1, "Description is required").max(5000).optional(),
  thumbnail: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  pricing: coursePricingSchema.optional(),
  metadata: courseMetadataSchema.optional(),
});

export const addMentorSchema = z.object({
  mentorId: z.string().min(1, "Mentor ID is required"),
});

export const removeMentorSchema = z.object({
  mentorId: z.string().min(1, "Mentor ID is required"),
});

export const addStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

export const removeStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

export type CreateCourseDto = z.infer<typeof createCourseSchema>;
export type UpdateCourseDto = z.infer<typeof updateCourseSchema>;
export type AddMentorDto = z.infer<typeof addMentorSchema>;
export type RemoveMentorDto = z.infer<typeof removeMentorSchema>;
export type AddStudentDto = z.infer<typeof addStudentSchema>;
export type RemoveStudentDto = z.infer<typeof removeStudentSchema>;
