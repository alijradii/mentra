import type {
  AuthResponse,
  CreateCourseDto,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateCourseDto,
  UpdateProfileInput,
  UserDTO
} from "shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || "An error occurred",
      data.details
    );
  }

  return data;
}

async function fetchWithAuth<T>(
  token: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/** Course list item / detail from API (ids as strings) */
export interface CourseDTO {
  _id: string;
  title: string;
  description: string;
  ownerId: string;
  mentorIds: string[];
  status: string;
  visibility: string;
  author?: { id: string; name: string; avatar?: string };
  metadata?: {
    category?: string;
    tags?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    estimatedDuration?: number;
    enrollmentCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CourseMemberDTO {
  _id: string;
  name: string;
  avatar?: string;
  role: "owner" | "mentor";
}

export interface CourseStudentDTO {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  enrolledAt: string;
  progress?: number;
}

export interface EnrollmentDTO {
  _id: string;
  userId: string;
  courseId: string;
  status: "active" | "completed" | "paused" | "dropped";
  progress: {
    completedNodes: string[];
    currentModuleId?: string;
    currentNodeId?: string;
    overallPercentage: number;
  };
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDTO {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  nodes: string[];
  createdAt: string;
  updatedAt: string;
}

// Section types as returned by the API (dates are ISO strings)
export type SectionType = "text" | "image" | "video" | "embedding" | "code" | "quiz";

export type QuizType =
  | "mcq"
  | "sequence"
  | "short-answer"
  | "matching"
  | "fill-blank"
  | "math-input"
  | "classification"
  | "true-false";

export interface BaseSectionDTO {
  id: string;
  type: SectionType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TextSectionDTO extends BaseSectionDTO {
  type: "text";
  content: string;
  format: "markdown" | "html" | "plain";
}

export interface ImageSectionDTO extends BaseSectionDTO {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
}

export interface VideoSectionDTO extends BaseSectionDTO {
  type: "video";
  url: string;
  caption?: string;
}

export interface EmbeddingSectionDTO extends BaseSectionDTO {
  type: "embedding";
  url: string;
  embedType: "youtube" | "vimeo" | "codepen" | "codesandbox" | "other";
  title?: string;
}

export interface CodeSectionDTO extends BaseSectionDTO {
  type: "code";
  code: string;
  language: string;
  isExecutable?: boolean;
}

// --- Quiz section DTO variants ---

interface QuizSectionBaseDTO extends BaseSectionDTO {
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

export interface MCQQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "mcq";
  options: QuizOption[];
  correctAnswers: string[];
}

export interface SequenceItemDTO {
  id: string;
  text: string;
}

export interface PrefilledPositionDTO {
  position: number;
  itemId: string;
}

export interface SequenceQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "sequence";
  items: SequenceItemDTO[];
  correctOrder: string[];
  prefilledPositions?: PrefilledPositionDTO[];
}

export interface ShortAnswerQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "short-answer";
  acceptedAnswers: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}

export interface MatchingPairDTO {
  id: string;
  left: string;
  right: string;
}

export interface MatchingQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "matching";
  pairs: MatchingPairDTO[];
}

export interface BlankDefinitionDTO {
  id: string;
  acceptedAnswers: string[];
}

export interface FillBlankQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "fill-blank";
  template: string;
  blanks: BlankDefinitionDTO[];
  wordBank?: string[];
  language?: string;
}

export interface MathInputQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "math-input";
  acceptedAnswers: string[];
  inputFormat: "latex" | "asciimath";
  comparisonMode?: "exact" | "symbolic";
}

export interface QuizCategoryDTO {
  id: string;
  label: string;
}

export interface ClassificationItemDTO {
  id: string;
  text: string;
  categoryId: string;
}

export interface ClassificationQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "classification";
  categories: QuizCategoryDTO[];
  items: ClassificationItemDTO[];
}

export interface TrueFalseQuizSectionDTO extends QuizSectionBaseDTO {
  quizType: "true-false";
  correctAnswer: boolean;
}

export type QuizSectionDTO =
  | MCQQuizSectionDTO
  | SequenceQuizSectionDTO
  | ShortAnswerQuizSectionDTO
  | MatchingQuizSectionDTO
  | FillBlankQuizSectionDTO
  | MathInputQuizSectionDTO
  | ClassificationQuizSectionDTO
  | TrueFalseQuizSectionDTO;

export type SectionDTO =
  | TextSectionDTO
  | ImageSectionDTO
  | VideoSectionDTO
  | EmbeddingSectionDTO
  | CodeSectionDTO
  | QuizSectionDTO;

export interface NodeDTO {
  _id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  sections: SectionDTO[];
  estimatedDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export const coursesApi = {
  async getMine(token: string): Promise<{ success: true; data: CourseDTO[] }> {
    return fetchWithAuth(token, "/api/courses/mine");
  },

  async getAll(token: string): Promise<{ success: true; data: CourseDTO[] }> {
    return fetchWithAuth(token, "/api/courses");
  },

  async getById(token: string, id: string): Promise<{ success: true; data: CourseDTO }> {
    return fetchWithAuth(token, `/api/courses/${id}`);
  },

  async create(token: string, input: CreateCourseDto): Promise<{ success: true; data: CourseDTO }> {
    return fetchWithAuth(token, "/api/courses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(
    token: string,
    id: string,
    input: UpdateCourseDto
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async delete(token: string, id: string): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/${id}`, {
      method: "DELETE",
    });
  },

  async reorderModules(
    token: string,
    courseId: string,
    moduleIds: string[]
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/modules/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ moduleIds }),
    });
  },
};

export const modulesApi = {
  async list(token: string, courseId: string): Promise<{ success: true; data: ModuleDTO[] }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/modules`);
  },

  async getById(token: string, id: string): Promise<{ success: true; data: ModuleDTO }> {
    return fetchWithAuth(token, `/api/courses/modules/${id}`);
  },

  async create(
    token: string,
    courseId: string,
    input: { title: string; description?: string }
  ): Promise<{ success: true; data: ModuleDTO }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/modules`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(
    token: string,
    id: string,
    input: { title?: string; description?: string; status?: string }
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async delete(token: string, id: string): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/modules/${id}`, {
      method: "DELETE",
    });
  },

  async reorderNodes(
    token: string,
    moduleId: string,
    nodeIds: string[]
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/modules/${moduleId}/nodes/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ nodeIds }),
    });
  },
};

export const nodesApi = {
  async list(token: string, moduleId: string): Promise<{ success: true; data: NodeDTO[] }> {
    return fetchWithAuth(token, `/api/courses/modules/${moduleId}/nodes`);
  },

  async getById(token: string, id: string): Promise<{ success: true; data: NodeDTO }> {
    return fetchWithAuth(token, `/api/courses/nodes/${id}`);
  },

  async create(
    token: string,
    moduleId: string,
    input: { title: string; description?: string }
  ): Promise<{ success: true; data: NodeDTO }> {
    return fetchWithAuth(token, `/api/courses/modules/${moduleId}/nodes`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async update(
    token: string,
    id: string,
    input: { title?: string; description?: string; status?: string; sections?: SectionDTO[] }
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/nodes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async delete(token: string, id: string): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/nodes/${id}`, {
      method: "DELETE",
    });
  },
};

export const enrollmentApi = {
  async enroll(
    token: string,
    courseId: string
  ): Promise<{ success: true; data: EnrollmentDTO; message: string }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/enroll`, { method: "POST" });
  },

  async getMyEnrollment(
    token: string,
    courseId: string
  ): Promise<{ success: true; data: EnrollmentDTO }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/enrollment`);
  },

  async getEnrolled(
    token: string
  ): Promise<{ success: true; data: { enrollment: EnrollmentDTO; course: CourseDTO }[] }> {
    return fetchWithAuth(token, "/api/courses/enrolled");
  },

  async updateProgress(
    token: string,
    courseId: string,
    nodeId: string
  ): Promise<{ success: true; data: EnrollmentDTO }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/enrollment/progress`, {
      method: "PATCH",
      body: JSON.stringify({ nodeId }),
    });
  },
};

export const mentorsApi = {
  async list(
    token: string,
    courseId: string
  ): Promise<{ success: true; data: CourseMemberDTO[] }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/mentors`);
  },

  async add(
    token: string,
    courseId: string,
    mentorEmail: string
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/mentors`, {
      method: "POST",
      body: JSON.stringify({ mentorEmail }),
    });
  },

  async remove(
    token: string,
    courseId: string,
    mentorId: string
  ): Promise<{ success: true; message: string }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/mentors/${mentorId}`, {
      method: "DELETE",
    });
  },
};

export const studentsApi = {
  async list(
    token: string,
    courseId: string
  ): Promise<{ success: true; data: CourseStudentDTO[] }> {
    return fetchWithAuth(token, `/api/courses/${courseId}/students`);
  },
};

export const authApi = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return fetchApi<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getCurrentUser(token: string): Promise<{ user: UserDTO }> {
    return fetchApi<{ user: UserDTO }>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async verifyEmail(token: string): Promise<{ message: string; user: UserDTO }> {
    return fetchApi<{ message: string; user: UserDTO }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification(authToken: string): Promise<{ message: string }> {
    return fetchApi<{ message: string }>("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    return fetchApi<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    return fetchApi<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateProfile(
    token: string,
    input: UpdateProfileInput
  ): Promise<{ user: UserDTO }> {
    return fetchWithAuth(token, "/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};

export { ApiError };
