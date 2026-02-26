import type { Section } from "./section";

export type NodeType = "lesson" | "practice" | "quiz";

export interface NodeSettings {
  maxAttempts?: number;
  timeLimit?: number; // minutes
  dueDate?: Date;
  showCorrectAnswers?: "immediately" | "after-grading" | "never";
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passingScore?: number; // 0-100 percentage
}

/**
 * Node - A page containing multiple sections (like a Jupyter Notebook)
 */
export interface Node<TId = string> {
  _id: TId;
  moduleId: TId;
  title: string;
  description?: string;
  type: NodeType;
  sections: Section[];
  order: number;
  estimatedDuration?: number; // in minutes
  status: "draft" | "published" | "archived";
  settings?: NodeSettings;
  metadata?: {
    learningOutcomes?: string[];
    estimatedDuration?: number;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    prerequisites?: string[]; // Node IDs
    learningObjectives?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
