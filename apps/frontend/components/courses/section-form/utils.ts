import type {
  SectionDTO,
  SectionType,
  QuizType,
  QuizSectionDTO,
  MCQQuizSectionDTO,
  SequenceQuizSectionDTO,
  ShortAnswerQuizSectionDTO,
  MatchingQuizSectionDTO,
  FillBlankQuizSectionDTO,
  MathInputQuizSectionDTO,
  ClassificationQuizSectionDTO,
  TrueFalseQuizSectionDTO,
} from "@/lib/api";

export function genId(): string {
  return crypto.randomUUID();
}

export const QUIZ_TYPE_LABELS: { type: QuizType; label: string }[] = [
  { type: "mcq", label: "Multiple Choice" },
  { type: "true-false", label: "True / False" },
  { type: "short-answer", label: "Short Answer" },
  { type: "sequence", label: "Sequence" },
  { type: "matching", label: "Matching" },
  { type: "fill-blank", label: "Fill in the Blank" },
  { type: "math-input", label: "Math Input" },
  { type: "classification", label: "Classification" },
];

export function createEmptyQuizData(
  quizType: QuizType,
  base: { id: string; order: number; createdAt: string; updatedAt: string }
): QuizSectionDTO {
  const shared = {
    ...base,
    type: "quiz" as const,
    question: "",
    explanation: "",
    points: 10,
  };
  switch (quizType) {
    case "mcq":
      return {
        ...shared,
        quizType: "mcq",
        options: [
          { id: genId(), text: "", order: 0 },
          { id: genId(), text: "", order: 1 },
        ],
        correctAnswers: [],
      };
    case "true-false":
      return { ...shared, quizType: "true-false", correctAnswer: true };
    case "short-answer":
      return {
        ...shared,
        quizType: "short-answer",
        acceptedAnswers: [""],
        caseSensitive: false,
        trimWhitespace: true,
      };
    case "sequence":
      return {
        ...shared,
        quizType: "sequence",
        items: [
          { id: genId(), text: "" },
          { id: genId(), text: "" },
        ],
        correctOrder: [],
      };
    case "matching":
      return {
        ...shared,
        quizType: "matching",
        pairs: [
          { id: genId(), left: "", right: "" },
          { id: genId(), left: "", right: "" },
        ],
      };
    case "fill-blank":
      return {
        ...shared,
        quizType: "fill-blank",
        template: "",
        blanks: [],
        wordBank: [],
      };
    case "math-input":
      return {
        ...shared,
        quizType: "math-input",
        acceptedAnswers: [""],
        inputFormat: "latex",
        comparisonMode: "exact",
      };
    case "classification":
      return {
        ...shared,
        quizType: "classification",
        categories: [
          { id: genId(), label: "" },
          { id: genId(), label: "" },
        ],
        items: [
          { id: genId(), text: "", categoryId: "" },
        ],
      };
  }
}

export function createEmptySection(type: SectionType, order: number): SectionDTO {
  const base = {
    id: genId(),
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  switch (type) {
    case "text":
      return { ...base, type, content: "", format: "markdown" };
    case "image":
      return { ...base, type, url: "", alt: "", caption: "" };
    case "video":
      return { ...base, type, url: "", caption: "" };
    case "embedding":
      return { ...base, type, url: "", embedType: "youtube", title: "" };
    case "code":
      return { ...base, type, code: "", language: "javascript" };
    case "quiz":
      return createEmptyQuizData("mcq", base);
  }
}

export function sectionSummary(s: SectionDTO): string {
  switch (s.type) {
    case "text":
      return s.content ? s.content.slice(0, 80) + (s.content.length > 80 ? "\u2026" : "") : "(empty)";
    case "image":
      return s.url || "(no URL)";
    case "video":
      return s.url || "(no URL)";
    case "embedding":
      return s.url || "(no URL)";
    case "code":
      return s.language || "(no language)";
    case "quiz": {
      const qt = ("quizType" in s ? s.quizType : "mcq") as QuizType;
      const label = QUIZ_TYPE_LABELS.find((l) => l.type === qt)?.label ?? qt;
      return s.question ? `[${label}] ${s.question}` : `[${label}] (no question)`;
    }
  }
}

export const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "embedding", label: "Embed" },
  { type: "code", label: "Code" },
  { type: "quiz", label: "Quiz" },
];

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
