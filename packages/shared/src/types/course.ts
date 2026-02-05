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
  modules: TId[]; // References to Module documents
  thumbnail?: string;
  coverImage?: string;
  status: "draft" | "published" | "archived";
  visibility: "public" | "private" | "unlisted";
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
}
