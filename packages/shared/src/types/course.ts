import type { NodeType } from "./node";

/**
 * Concise per-node entry used in a course outline (for AI context).
 */
export interface CourseOutlineNode {
  _id: string;
  title: string;
  type: NodeType;
}

/**
 * Concise per-module entry used in a course outline (for AI context).
 */
export interface CourseOutlineModule {
  _id: string;
  title: string;
  order: number;
  nodes: CourseOutlineNode[];
}

/**
 * Lightweight, flat view of a course intended for AI prompt context.
 * Contains only the information needed to understand the structure of a course
 * without embedding full section/content data.
 */
export interface CourseOutline {
  _id: string;
  title: string;
  description: string;
  modules: CourseOutlineModule[];
}

/**
 * Course - Top-level learning content container
 */
export interface Course<TId = string> {
  _id: TId;
  title: string;
  description: string;
  author: {
    id: TId;
    name: string;
    avatar?: string;
  };
  ownerId: TId; // The course owner (creator)
  mentorIds: TId[]; // Mentors who can edit the course
  allowedStudentIds?: TId[]; // For private courses - students who can enroll
  modules: TId[]; // References to Module documents
  thumbnail?: string;
  coverImage?: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private";
  pricing?: {
    type: "free" | "paid";
    price?: number;
    currency?: string;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    language?: string;
    estimatedDuration?: number; // Total duration in minutes
    moduleCount?: number;
    nodeCount?: number;
    enrollmentCount?: number;
    rating?: {
      average: number;
      count: number;
    };
    prerequisites?: string[];
    learningOutcomes?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  /** ID of the snapshot currently checked out (set on restore, updated on create) */
  currentSnapshotId?: TId;
}