import { randomUUIDv7 } from "bun";
import { z } from "zod";

const quizOptionInputSchema = z.object({
    text: z.string().min(1).describe("Visible text of the option shown to the learner."),
    order: z.number().int().min(0).describe("0-based order of the option in the list."),
});

const sequenceItemInputSchema = z.object({
    text: z.string().min(1).describe("Text of the item that will be reordered by the learner."),
});

const matchingPairInputSchema = z.object({
    left: z.string().min(1).describe("Left-hand text shown as the prompt."),
    right: z.string().min(1).describe("Right-hand text shown in the dropdown list."),
});

const blankDefinitionInputSchema = z.object({
    acceptedAnswers: z
        .array(z.string())
        .min(1)
        .describe("One or more textual answers that should be accepted for this blank."),
});

const quizCategoryInputSchema = z.object({
    label: z.string().min(1).describe("Human-readable label for the category, as shown to the learner."),
});

const classificationItemInputSchema = z.object({
    text: z.string().min(1).describe("Item text that the learner must classify."),
    categoryId: z
        .string()
        .describe(
            "For AI input, this should reference the category by LABEL, not by ID. The system will map this label to the actual category ID when hydrating."
        ),
});

export const aiSectionInputSchema = z.union([
    z
        .object({
            type: z.literal("text"),
            content: z.string().describe("Text content of the section. Markdown is recommended."),
            format: z
                .enum(["markdown", "html", "plain"])
                .default("markdown")
                .describe("Rendering format. Use 'markdown' unless you have a specific reason."),
        })
        .describe("Plain content section rendered as text/markdown."),
    z
        .object({
            type: z.literal("embedding"),
            url: z.url().describe("Public URL to embed (e.g. YouTube video URL)."),
            embedType: z
                .enum(["youtube", "vimeo", "codepen", "codesandbox", "other"])
                .describe("Type of external content. Must match the URL."),
            title: z.string().optional().describe("Optional short title shown above the embed."),
        })
        .describe("Embedded external content such as videos or sandboxes."),
    z
        .object({
            type: z.literal("code"),
            code: z.string().describe("Source code to display in the lesson."),
            language: z.string().min(1).describe("Programming language identifier, e.g. 'typescript', 'python'."),
            isExecutable: z
                .boolean()
                .default(false)
                .describe("Whether this code is intended to be executed/run in the UI."),
            expectedOutput: z
                .string()
                .optional()
                .describe("Optional expected output, used for explanation or comparison."),
        })
        .describe("Code snippet section."),
    z
        .object({
            type: z.literal("image"),
            url: z.url().describe("Public URL of the image."),
            alt: z.string().optional().describe("Short alternative text for accessibility."),
            caption: z.string().optional().describe("Optional caption shown under the image."),
        })
        .describe("Static image section."),
    z
        .object({
            type: z.literal("video"),
            url: z.url().describe("Public URL of the video."),
            duration: z
                .number()
                .int()
                .min(0)
                .optional()
                .describe("Optional duration in seconds, if known."),
            caption: z.string().optional().describe("Optional caption or transcript summary."),
        })
        .describe("Inline video section."),
    z
        .object({
            type: z.literal("page-break"),
        })
        .describe("Visual page break to split content across pages or slides. Use when you want to start a new page/section without adding content."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("mcq"),
            question: z
                .string()
                .min(1)
                .describe("The question text shown above the options."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after the learner answers."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            options: z
                .array(quizOptionInputSchema)
                .min(2)
                .describe(
                    "List of options shown to the learner. IDs will be generated automatically; you only provide text and order."
                ),
            correctAnswers: z
                .array(z.string())
                .min(1)
                .describe(
                    "For AI input, specify the CORRECT OPTIONS by their VISIBLE TEXT or by 0-based index as a string (e.g. '0', '1'). Do NOT attempt to use internal UUIDs; the system will map these to option IDs. If there is only one correct option, return a single-element array."
                ),
        })
        .describe(
            "Multiple choice question. On the frontend, learners select options by ID; this schema lets you specify correct answers by option text or index, and the system converts them to IDs."
        ),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("sequence"),
            question: z
                .string()
                .min(1)
                .describe("The instruction for the ordering task (e.g. 'Arrange the steps in the correct order')."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            items: z
                .array(sequenceItemInputSchema)
                .min(2)
                .describe("Items that the learner will reorder. IDs will be generated automatically."),
            correctOrder: z
                .array(z.string())
                .min(2)
                .describe(
                    "Desired correct order of the items. For AI input, provide either item TEXT values or 0-based indices as strings. The system will map these to item IDs."
                ),
        })
        .describe("Ordering question where the learner must arrange items into the correct sequence."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("short-answer"),
            question: z.string().min(1).describe("Short-answer prompt."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            acceptedAnswers: z
                .array(z.string())
                .min(1)
                .describe("List of textual answers that should count as correct."),
            caseSensitive: z
                .boolean()
                .default(false)
                .describe("Whether answer matching is case-sensitive. Default is false."),
            trimWhitespace: z
                .boolean()
                .default(true)
                .describe("Whether to trim leading/trailing whitespace before comparison."),
        })
        .describe("Free-form short text answer graded by string comparison."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("matching"),
            question: z.string().min(1).describe("Instruction for the matching task."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            pairs: z
                .array(matchingPairInputSchema)
                .min(2)
                .describe(
                    "List of left/right pairs. IDs will be generated automatically; learners will map left IDs to right-hand TEXT values."
                ),
        })
        .describe("Matching question where learners map each left-hand term to a right-hand option."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("fill-blank"),
            question: z
                .string()
                .min(1)
                .describe("High-level instruction for the fill-in-the-blank task."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            template: z
                .string()
                .min(1)
                .describe(
                    "Text containing one or more blanks, described in natural language. The UI will show this as context; blanks themselves are defined in the 'blanks' array."
                ),
            blanks: z
                .array(blankDefinitionInputSchema)
                .min(1)
                .describe(
                    "Definitions for each blank. IDs will be generated automatically and used to store the learner's answers."
                ),
            wordBank: z
                .array(z.string())
                .optional()
                .describe("Optional list of words shown as a word bank. Does not affect grading."),
            language: z.string().optional().describe("Language of the template/answers, if relevant."),
        })
        .describe("Fill-in-the-blank question with one or more blanks."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("math-input"),
            question: z.string().min(1).describe("Math question or prompt."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation or solution sketch."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            acceptedAnswers: z
                .array(z.string())
                .min(1)
                .describe(
                    "List of accepted math expressions as strings, in the chosen input format. Matching is currently string-based."
                ),
            inputFormat: z
                .enum(["latex", "asciimath"])
                .default("latex")
                .describe("Syntax expected from the learner's input."),
            comparisonMode: z
                .enum(["exact", "symbolic"])
                .default("exact")
                .describe(
                    "Comparison strategy. Currently used for hinting; auto-grading uses string-based comparison in the configured format."
                ),
        })
        .describe("Math input question where learners type an expression."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("classification"),
            question: z.string().min(1).describe("Instruction for the classification task."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            categories: z
                .array(quizCategoryInputSchema)
                .min(2)
                .describe(
                    "Categories the learner can assign items to. IDs are generated automatically; reference them by LABEL from 'items.categoryId' in AI output."
                ),
            items: z
                .array(classificationItemInputSchema)
                .min(2)
                .describe(
                    "Items to classify. For AI input, 'categoryId' should be the LABEL of one of the categories above. The system will map labels to real IDs."
                ),
        })
        .describe("Classification question where learners assign items to one of several categories."),
    z
        .object({
            type: z.literal("quiz"),
            quizType: z.literal("true-false"),
            question: z.string().min(1).describe("Statement that is either true or false."),
            explanation: z
                .string()
                .optional()
                .describe("Optional explanation shown after grading."),
            points: z
                .number()
                .int()
                .min(0)
                .default(10)
                .describe("Point value of this question."),
            correctAnswer: z
                .boolean()
                .describe("Whether the statement is factually true (true) or false (false)."),
        })
        .describe("Binary true/false question."),
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
            const { type: _type, ...quizFields } = section as Extract<AiSectionInput, { type: "quiz" }>;
            const quizType = quizFields.quizType;

            // Start from the raw quiz fields; we'll attach hydrated substructures below.
            let hydratedQuiz: any = { ...quizFields };

            if (quizType === "mcq") {
                const rawOptions = (quizFields as any).options as Array<{ text: string; order: number }>;
                const optionsWithIds = rawOptions.map((o) => ({
                    id: randomUUIDv7(),
                    ...o,
                }));

                const textToId = new Map<string, string>();
                optionsWithIds.forEach((o, idx) => {
                    textToId.set(o.text, o.id);
                    // Also allow referencing by 0-based index as string, e.g. "0", "1"
                    textToId.set(String(idx), o.id);
                });

                const rawCorrect = ((quizFields as any).correctAnswers ?? []) as string[];

                const normalizedCorrectIds = Array.from(
                    new Set(
                        rawCorrect
                            .map((val) => {
                                // If already matches an option ID, keep it.
                                const byId = optionsWithIds.find((o) => o.id === val);
                                if (byId) return byId.id;

                                // Otherwise try to resolve by text or index.
                                const mapped = textToId.get(val);
                                return mapped ?? null;
                            })
                            .filter((v): v is string => !!v),
                    ),
                );

                hydratedQuiz = {
                    ...hydratedQuiz,
                    options: optionsWithIds,
                    correctAnswers: normalizedCorrectIds,
                };
            } else if (quizType === "sequence") {
                const rawItems = (quizFields as any).items as Array<{ text: string }>;
                const itemsWithIds = rawItems.map((it) => ({
                    id: randomUUIDv7(),
                    ...it,
                }));

                const textToId = new Map<string, string>();
                itemsWithIds.forEach((it, idx) => {
                    textToId.set(it.text, it.id);
                    textToId.set(String(idx), it.id);
                });

                const rawOrder = ((quizFields as any).correctOrder ?? []) as string[];

                const normalizedOrderIds = rawOrder
                    .map((val) => {
                        const byId = itemsWithIds.find((it) => it.id === val);
                        if (byId) return byId.id;

                        const mapped = textToId.get(val);
                        return mapped ?? null;
                    })
                    .filter((v): v is string => !!v);

                hydratedQuiz = {
                    ...hydratedQuiz,
                    items: itemsWithIds,
                    correctOrder: normalizedOrderIds,
                };
            } else if (quizType === "matching") {
                const rawPairs = (quizFields as any).pairs as Array<{ left: string; right: string }>;
                const pairsWithIds = rawPairs.map((p) => ({
                    id: randomUUIDv7(),
                    ...p,
                }));

                hydratedQuiz = {
                    ...hydratedQuiz,
                    pairs: pairsWithIds,
                };
            } else if (quizType === "fill-blank") {
                const rawBlanks = (quizFields as any).blanks as Array<{ acceptedAnswers: string[] }>;
                const blanksWithIds = rawBlanks.map((b) => ({
                    id: randomUUIDv7(),
                    ...b,
                }));

                hydratedQuiz = {
                    ...hydratedQuiz,
                    blanks: blanksWithIds,
                };
            } else if (quizType === "math-input") {
                // Nothing ID-based to hydrate; acceptedAnswers are plain strings.
                hydratedQuiz = {
                    ...hydratedQuiz,
                };
            } else if (quizType === "classification") {
                const rawCategories = (quizFields as any).categories as Array<{ label: string }>;
                const categoriesWithIds = rawCategories.map((c) => ({
                    id: randomUUIDv7(),
                    ...c,
                }));

                const labelToCategoryId = new Map<string, string>();
                categoriesWithIds.forEach((c) => {
                    labelToCategoryId.set(c.label, c.id);
                });

                const rawItems = (quizFields as any).items as Array<{ text: string; categoryId: string }>;
                const itemsWithIds = rawItems.map((item) => {
                    let categoryKey = item.categoryId;

                    // If already an ID of a known category, keep it. Otherwise resolve by label.
                    const byId = categoriesWithIds.find((c) => c.id === categoryKey);
                    if (!byId) {
                        const mapped = labelToCategoryId.get(categoryKey);
                        if (mapped) {
                            categoryKey = mapped;
                        }
                    }

                    return {
                        id: randomUUIDv7(),
                        text: item.text,
                        categoryId: categoryKey,
                    };
                });

                hydratedQuiz = {
                    ...hydratedQuiz,
                    categories: categoriesWithIds,
                    items: itemsWithIds,
                };
            } else if (quizType === "true-false") {
                // No nested IDs to generate in this variant.
                hydratedQuiz = {
                    ...hydratedQuiz,
                };
            }

            return {
                ...base,
                type: "quiz" as const,
                ...hydratedQuiz,
            };
        }

        return { ...base, ...section };
    });
}
