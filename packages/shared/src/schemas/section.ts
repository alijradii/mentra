import { z } from "zod";

/**
 * Section schemas
 */
const baseSectionSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const textSectionSchema = baseSectionSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  format: z.enum(["markdown", "html", "plain"]).default("markdown"),
});

export const embeddingSectionSchema = baseSectionSchema.extend({
  type: z.literal("embedding"),
  url: z.string().url(),
  embedType: z.enum(["youtube", "vimeo", "codepen", "codesandbox", "other"]),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Option text is required"),
  order: z.number().int().min(0),
});

export const quizSectionSchema = baseSectionSchema.extend({
  type: z.literal("quiz"),
  question: z.string().min(1, "Question is required"),
  options: z.array(quizOptionSchema).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.string()).min(1, "At least 1 correct answer required"),
  explanation: z.string().optional(),
  points: z.number().int().min(0).default(10),
});

export const codeSectionSchema = baseSectionSchema.extend({
  type: z.literal("code"),
  code: z.string(),
  language: z.string().min(1, "Programming language is required"),
  isExecutable: z.boolean().default(false),
  expectedOutput: z.string().optional(),
});

export const imageSectionSchema = baseSectionSchema.extend({
  type: z.literal("image"),
  url: z.string().url(),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const videoSectionSchema = baseSectionSchema.extend({
  type: z.literal("video"),
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  duration: z.number().int().min(0).optional(),
  caption: z.string().optional(),
});

export const sectionSchema = z.discriminatedUnion("type", [
  textSectionSchema,
  embeddingSectionSchema,
  quizSectionSchema,
  codeSectionSchema,
  imageSectionSchema,
  videoSectionSchema,
]);
