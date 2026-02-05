/**
 * Enrollment - Tracks user progress through a course
 */
export interface Enrollment<TId = string> {
  _id: TId;
  userId: TId;
  courseId: TId;
  status: "active" | "completed" | "paused" | "dropped";
  progress: {
    completedNodes: TId[];
    currentModuleId?: TId;
    currentNodeId?: TId;
    overallPercentage: number;
  };
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
