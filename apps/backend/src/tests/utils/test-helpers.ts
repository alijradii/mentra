import { ObjectId } from "mongodb";
import type { User } from "shared";
import type { Course, Enrollment, Module, Node } from "../../models/course.js";
import { generateToken } from "../../utils/jwt.js";

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    _id: new ObjectId().toString(),
    email: "test@example.com",
    username: "testuser",
    name: "Test User",
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Generate a valid JWT token for testing
 */
export function generateTestToken(userId: string, email: string = "test@example.com"): string {
  return generateToken(userId, email);
}

/**
 * Create a mock course for testing
 */
export function createMockCourse(overrides?: Partial<Course>): Course {
  const ownerId = new ObjectId();
  return {
    _id: new ObjectId(),
    title: "Test Course",
    description: "A test course description",
    status: "draft",
    visibility: "public",
    ownerId,
    mentorIds: [],
    modules: [],
    author: {
      id: ownerId,
      name: "Test Author",
      avatar: undefined,
    },
    metadata: {
      category: "Technology",
      tags: ["test"],
      difficulty: "beginner",
      estimatedDuration: 60,
      learningOutcomes: [],
      prerequisites: [],
      rating: {
        average: 0,
        count: 0,
      },
      enrollmentCount: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock module for testing
 */
export function createMockModule(courseId: ObjectId, overrides?: Partial<Module>): Module {
  return {
    _id: new ObjectId(),
    courseId,
    title: "Test Module",
    description: "A test module description",
    order: 1,
    status: "draft",
    nodes: [],
    metadata: {
      estimatedDuration: 30,
      learningOutcomes: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock node for testing
 */
export function createMockNode(moduleId: ObjectId, overrides?: Partial<Node>): Node {
  return {
    _id: new ObjectId(),
    moduleId,
    title: "Test Node",
    type: "lesson" as const,
    order: 1,
    status: "draft",
    sections: [],
    metadata: {
      estimatedDuration: 15,
      difficulty: "beginner",
      tags: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock enrollment for testing
 */
export function createMockEnrollment(
  userId: ObjectId,
  courseId: ObjectId,
  overrides?: Partial<Enrollment>
): Enrollment {
  return {
    _id: new ObjectId(),
    userId,
    courseId,
    status: "active",

    progress: {
      completedNodes: [],
      currentNodeId: undefined,
      overallPercentage: 0,
    },
    startedAt: new Date(),
    lastAccessedAt: new Date(),
    completedAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Wait for a specified time (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate ObjectId string
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}
