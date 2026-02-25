import { z } from "zod";

/**
 * Section schemas
 */
const baseSectionSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
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

// --- Quiz schemas ---

const quizBaseFields = {
  type: z.literal("quiz"),
  question: z.string().min(1, "Question is required"),
  explanation: z.string().optional(),
  points: z.number().int().min(0).default(10),
};

export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Option text is required"),
  order: z.number().int().min(0),
});

export const mcqQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("mcq"),
  options: z.array(quizOptionSchema).min(2, "At least 2 options required"),
  correctAnswers: z.array(z.string()).min(1, "At least 1 correct answer required"),
});

export const sequenceItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
});

export const prefilledPositionSchema = z.object({
  position: z.number().int().min(0),
  itemId: z.string(),
});

export const sequenceQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("sequence"),
  items: z.array(sequenceItemSchema).min(2, "At least 2 items required"),
  correctOrder: z.array(z.string()).min(2, "At least 2 items in correct order"),
  prefilledPositions: z.array(prefilledPositionSchema).optional(),
});

export const shortAnswerQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("short-answer"),
  acceptedAnswers: z.array(z.string()).min(1, "At least 1 accepted answer required"),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
});

export const matchingPairSchema = z.object({
  id: z.string(),
  left: z.string().min(1),
  right: z.string().min(1),
});

export const matchingQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("matching"),
  pairs: z.array(matchingPairSchema).min(2, "At least 2 pairs required"),
});

export const blankDefinitionSchema = z.object({
  id: z.string(),
  acceptedAnswers: z.array(z.string()).min(1),
});

export const fillBlankQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("fill-blank"),
  template: z.string().min(1, "Template is required"),
  blanks: z.array(blankDefinitionSchema).min(1, "At least 1 blank required"),
  wordBank: z.array(z.string()).optional(),
  language: z.string().optional(),
});

export const mathInputQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("math-input"),
  acceptedAnswers: z.array(z.string()).min(1, "At least 1 accepted answer required"),
  inputFormat: z.enum(["latex", "asciimath"]).default("latex"),
  comparisonMode: z.enum(["exact", "symbolic"]).default("exact"),
});

export const quizCategorySchema = z.object({
  id: z.string(),
  label: z.string().min(1),
});

export const classificationItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  categoryId: z.string(),
});

export const classificationQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("classification"),
  categories: z.array(quizCategorySchema).min(2, "At least 2 categories required"),
  items: z.array(classificationItemSchema).min(2, "At least 2 items required"),
});

export const trueFalseQuizSchema = baseSectionSchema.extend({
  ...quizBaseFields,
  quizType: z.literal("true-false"),
  correctAnswer: z.boolean(),
});

const quizDiscriminatedUnion = z.discriminatedUnion("quizType", [
  mcqQuizSchema,
  sequenceQuizSchema,
  shortAnswerQuizSchema,
  matchingQuizSchema,
  fillBlankQuizSchema,
  mathInputQuizSchema,
  classificationQuizSchema,
  trueFalseQuizSchema,
]);

// Backward compat: old MCQ docs lack quizType — default to "mcq"
export const quizSectionSchema = z.preprocess(
  (val) => {
    if (typeof val === "object" && val !== null && !("quizType" in val)) {
      return { ...(val as Record<string, unknown>), quizType: "mcq" };
    }
    return val;
  },
  quizDiscriminatedUnion,
);

// --- Non-quiz section schemas ---

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

// Use z.union because the quiz branch is a z.preprocess (ZodEffects),
// which can't participate in z.discriminatedUnion.
export const sectionSchema = z.union([
  textSectionSchema,
  embeddingSectionSchema,
  quizSectionSchema,
  codeSectionSchema,
  imageSectionSchema,
  videoSectionSchema,
]);
