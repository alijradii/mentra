/**
 * Section types for Node content (similar to Jupyter Notebook cells)
 */
export type SectionType = "text" | "embedding" | "quiz" | "code" | "image" | "video";

export type QuizType =
  | "mcq"
  | "sequence"
  | "short-answer"
  | "matching"
  | "fill-blank"
  | "math-input"
  | "classification"
  | "true-false";

export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextSection extends BaseSection {
  type: "text";
  content: string;
  format?: "markdown" | "html" | "plain";
}

export interface EmbeddingSection extends BaseSection {
  type: "embedding";
  url: string;
  embedType: "youtube" | "vimeo" | "codepen" | "codesandbox" | "other";
  title?: string;
  metadata?: Record<string, unknown>;
}

// --- Quiz Section variants ---

export interface QuizSectionBase extends BaseSection {
  type: "quiz";
  quizType: QuizType;
  question: string;
  explanation?: string;
  points?: number;
}

export interface QuizOption {
  id: string;
  text: string;
  order: number;
}

export interface MCQQuizSection extends QuizSectionBase {
  quizType: "mcq";
  options: QuizOption[];
  correctAnswers: string[];
}

export interface SequenceItem {
  id: string;
  text: string;
}

export interface PrefilledPosition {
  position: number;
  itemId: string;
}

export interface SequenceQuizSection extends QuizSectionBase {
  quizType: "sequence";
  items: SequenceItem[];
  correctOrder: string[];
  prefilledPositions?: PrefilledPosition[];
}

export interface ShortAnswerQuizSection extends QuizSectionBase {
  quizType: "short-answer";
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingQuizSection extends QuizSectionBase {
  quizType: "matching";
  pairs: MatchingPair[];
}

export interface BlankDefinition {
  id: string;
  acceptedAnswers: string[];
}

export interface FillBlankQuizSection extends QuizSectionBase {
  quizType: "fill-blank";
  template: string;
  blanks: BlankDefinition[];
  wordBank?: string[];
  language?: string;
}

export interface MathInputQuizSection extends QuizSectionBase {
  quizType: "math-input";
  acceptedAnswers: string[];
  inputFormat: "latex" | "asciimath";
  comparisonMode?: "exact" | "symbolic";
}

export interface QuizCategory {
  id: string;
  label: string;
}

export interface ClassificationItem {
  id: string;
  text: string;
  categoryId: string;
}

export interface ClassificationQuizSection extends QuizSectionBase {
  quizType: "classification";
  categories: QuizCategory[];
  items: ClassificationItem[];
}

export interface TrueFalseQuizSection extends QuizSectionBase {
  quizType: "true-false";
  correctAnswer: boolean;
}

export type QuizSection =
  | MCQQuizSection
  | SequenceQuizSection
  | ShortAnswerQuizSection
  | MatchingQuizSection
  | FillBlankQuizSection
  | MathInputQuizSection
  | ClassificationQuizSection
  | TrueFalseQuizSection;

// --- Non-quiz sections ---

export interface CodeSection extends BaseSection {
  type: "code";
  code: string;
  language: string;
  isExecutable?: boolean;
  expectedOutput?: string;
}

export interface ImageSection extends BaseSection {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
}

export interface VideoSection extends BaseSection {
  type: "video";
  url: string;
  thumbnail?: string;
  duration?: number;
  caption?: string;
}

export type Section =
  | TextSection
  | EmbeddingSection
  | QuizSection
  | CodeSection
  | ImageSection
  | VideoSection;
