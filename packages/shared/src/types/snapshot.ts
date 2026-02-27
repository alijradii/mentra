import type { Course } from "./course";
import type { Module } from "./module";
import type { Node } from "./node";

/**
 * CourseSnapshot - A point-in-time capture of an entire course (course + modules + nodes).
 * Snapshots form a tree via parentId. The course document tracks currentSnapshotId.
 */
export interface CourseSnapshot<TId = string> {
  _id: TId;
  courseId: TId;
  /** Parent snapshot ID — null for the root (first ever snapshot) */
  parentId: TId | null;
  label: string;
  description?: string;
  createdBy: {
    id: TId;
    name: string;
  };
  createdAt: Date;
  data: {
    course: Omit<Course<TId>, "modules">;
    modules: Module<TId>[];
    nodes: Node<TId>[];
  };
}

/** Lightweight version returned in list endpoints (no data payload) */
export type CourseSnapshotMeta<TId = string> = Omit<CourseSnapshot<TId>, "data">;
