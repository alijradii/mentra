/**
 * Section types for Node content (similar to Jupyter Notebook cells)
 */
export type SectionType = "text" | "embedding" | "quiz" | "code" | "image" | "video";

export interface BaseSection {
  id: string;
  type: SectionType;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextSection extends BaseSection {
  type: "text";
  content: string; // Markdown or rich text
  format?: "markdown" | "html" | "plain";
}

export interface EmbeddingSection extends BaseSection {
  type: "embedding";
  url: string;
  embedType: "youtube" | "vimeo" | "codepen" | "codesandbox" | "other";
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface QuizOption {
  id: string;
  text: string;
  order: number;
}

export interface QuizSection extends BaseSection {
  type: "quiz";
  question: string;
  options: QuizOption[];
  correctAnswers: string[]; // IDs of correct options (supports multiple for multi-select)
  explanation?: string;
  points?: number;
}

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
  duration?: number; // in seconds
  caption?: string;
}

export type Section =
  | TextSection
  | EmbeddingSection
  | QuizSection
  | CodeSection
  | ImageSection
  | VideoSection;
