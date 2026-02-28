import { randomUUIDv7 } from "bun";
import { z } from "zod";

const quizOptionInputSchema = z.object({
    text: z.string().min(1),
    order: z.number().int().min(0),
});

const sequenceItemInputSchema = z.object({
    text: z.string().min(1),
});

const matchingPairInputSchema = z.object({
    left: z.string().min(1),
    right: z.string().min(1),
});

const blankDefinitionInputSchema = z.object({
    acceptedAnswers: z.array(z.string()).min(1),
});

const quizCategoryInputSchema = z.object({
    label: z.string().min(1),
});

const classificationItemInputSchema = z.object({
    text: z.string().min(1),
    categoryId: z.string(),
});

export const aiSectionInputSchema = z.union([
    z.object({
        type: z.literal("text"),
        content: z.string(),
        format: z.enum(["markdown", "html", "plain"]).default("markdown"),
    }),
    z.object({
        type: z.literal("embedding"),
        url: z.url(),
        embedType: z.enum(["youtube", "vimeo", "codepen", "codesandbox", "other"]),
        title: z.string().optional(),
    }),
    z.object({
        type: z.literal("code"),
        code: z.string(),
        language: z.string().min(1),
        isExecutable: z.boolean().default(false),
        expectedOutput: z.string().optional(),
    }),
    z.object({
        type: z.literal("image"),
        url: z.url(),
        alt: z.string().optional(),
        caption: z.string().optional(),
    }),
    z.object({
        type: z.literal("video"),
        url: z.url(),
        duration: z.number().int().min(0).optional(),
        caption: z.string().optional(),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("mcq"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        options: z.array(quizOptionInputSchema).min(2),
        correctAnswers: z.array(z.string()).min(1),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("sequence"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        items: z.array(sequenceItemInputSchema).min(2),
        correctOrder: z.array(z.string()).min(2),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("short-answer"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        acceptedAnswers: z.array(z.string()).min(1),
        caseSensitive: z.boolean().default(false),
        trimWhitespace: z.boolean().default(true),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("matching"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        pairs: z.array(matchingPairInputSchema).min(2),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("fill-blank"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        template: z.string().min(1),
        blanks: z.array(blankDefinitionInputSchema).min(1),
        wordBank: z.array(z.string()).optional(),
        language: z.string().optional(),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("math-input"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        acceptedAnswers: z.array(z.string()).min(1),
        inputFormat: z.enum(["latex", "asciimath"]).default("latex"),
        comparisonMode: z.enum(["exact", "symbolic"]).default("exact"),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("classification"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        categories: z.array(quizCategoryInputSchema).min(2),
        items: z.array(classificationItemInputSchema).min(2),
    }),
    z.object({
        type: z.literal("quiz"),
        quizType: z.literal("true-false"),
        question: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().min(0).default(10),
        correctAnswer: z.boolean(),
    }),
]);

export type AiSectionInput = z.infer<typeof aiSectionInputSchema>;

export function hydrateSections(sections: AiSectionInput[]) {
    const now = new Date();
    return sections.map((section, i) => {
        const base = {
            id: randomUUIDv7(),
            order: i,
            createdAt: now,
            updatedAt: now,
        };

        if (section.type === "quiz") {
            const { type: _type, ...quizFields } = section;
            const items = "items" in quizFields
                ? { items: (quizFields.items as Array<{ text: string }>).map((it) => ({ id: randomUUIDv7(), ...it })) }
                : {};
            const options = "options" in quizFields
                ? { options: (quizFields.options as Array<{ text: string; order: number }>).map((o) => ({ id: randomUUIDv7(), ...o })) }
                : {};
            const pairs = "pairs" in quizFields
                ? { pairs: (quizFields.pairs as Array<{ left: string; right: string }>).map((p) => ({ id: randomUUIDv7(), ...p })) }
                : {};
            const categories = "categories" in quizFields
                ? { categories: (quizFields.categories as Array<{ label: string }>).map((c) => ({ id: randomUUIDv7(), ...c })) }
                : {};
            const blanks = "blanks" in quizFields
                ? { blanks: (quizFields.blanks as Array<{ acceptedAnswers: string[] }>).map((b) => ({ id: randomUUIDv7(), ...b })) }
                : {};
            return { ...base, type: "quiz" as const, ...quizFields, ...items, ...options, ...pairs, ...categories, ...blanks };
        }

        return { ...base, ...section };
    });
}
