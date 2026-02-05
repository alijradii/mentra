import type { Section } from "./section";

/**
 * Node - A page containing multiple sections (like a Jupyter Notebook)
 */
export interface Node<TId = string> {
  _id: TId;
  moduleId: TId;
  title: string;
  description?: string;
  sections: Section[];
  order: number;
  estimatedDuration?: number; // in minutes
  status: "draft" | "published" | "archived";
  metadata?: {
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    prerequisites?: string[]; // Node IDs
    learningObjectives?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
