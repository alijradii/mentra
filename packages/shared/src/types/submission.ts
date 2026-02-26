export type SubmissionStatus = "in-progress" | "submitted" | "graded" | "released";

export interface QuestionAnswer {
  sectionId: string;
  answer: unknown;
  isCorrect?: boolean;
  autoScore?: number;
  maxScore?: number;
}

export interface GradeOverride {
  sectionId: string;
  score: number;
  feedback?: string;
}

export interface SubmissionGrading<TId = string> {
  gradedBy: TId;
  overrides: GradeOverride[];
  overallFeedback?: string;
  finalScore: number;
  gradedAt: Date;
}

export interface NodeSubmission<TId = string> {
  _id: TId;
  nodeId: TId;
  userId: TId;
  courseId: TId;
  attemptNumber: number;

  answers: QuestionAnswer[];

  autoScore: number;
  maxScore: number;

  grading?: SubmissionGrading<TId>;

  status: SubmissionStatus;

  startedAt: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
