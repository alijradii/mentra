/**
 * Module - A chapter within a course
 */
export interface Module<TId = string> {
  _id: TId;
  courseId: TId;
  title: string;
  description?: string;
  order: number;
  nodes: TId[]; // References to Node documents
  status: "draft" | "published" | "archived";
  metadata?: {
    estimatedDuration?: number; // Total duration in minutes
    nodeCount?: number;
    completionRate?: number; // Percentage of learners who complete this module
  };
  createdAt: Date;
  updatedAt: Date;
}
