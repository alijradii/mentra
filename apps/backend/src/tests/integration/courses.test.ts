import { describe, it, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import request from "supertest";
import express from "express";
import { ObjectId, type Db } from "mongodb";
import courseRoutes from "../../routes/courses.js";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
  getTestDb,
} from "../setup.js";
import { generateTestToken, createMockUser, createMockCourse } from "../utils/test-helpers.js";

let testDb: Db;

// Mock db module to return our test database
mock.module("../../db.js", () => ({
  getDb: () => testDb,
  connectToDatabase: async () => {},
  closeDatabase: async () => {},
}));

describe("Course API Integration Tests", () => {
  let app: express.Application;
  let authToken: string;
  let userId: ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
    testDb = getTestDb();

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/courses", courseRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create test user and token
    userId = new ObjectId();
    const user = createMockUser({ _id: userId.toString() });
    await testDb.collection("users").insertOne({
      _id: userId,
      email: user.email,
      name: user.name,
      password: "hashed_password",
      isEmailVerified: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    authToken = generateTestToken(userId.toString(), user.email);
  });

  describe("POST /api/courses", () => {
    it("should create a new course", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test Description",
        visibility: "public",
        metadata: {
          category: "Technology",
          tags: ["test"],
          difficulty: "beginner",
          estimatedDuration: 60,
          prerequisites: [],
          learningObjectives: [],
        },
      };

      const response = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(courseData.title);
      expect(response.body.data.status).toBe("draft");
    });

    it("should return 400 for invalid course data", async () => {
      const invalidData = {
        title: "", // Empty title should fail validation
      };

      const response = await request(app)
        .post("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation failed");
    });

    it("should return 401 without authentication", async () => {
      const courseData = {
        title: "Test Course",
        description: "Test Description",
        visibility: "public",
      };

      await request(app)
        .post("/api/courses")
        .send(courseData)
        .expect(401);
    });
  });

  describe("GET /api/courses", () => {
    it("should get all accessible courses", async () => {
      const course1 = createMockCourse({
        ownerId: userId,
        visibility: "public",
        status: "published",
      });
      const course2 = createMockCourse({
        ownerId: userId,
        visibility: "private",
        status: "draft",
      });

      await testDb.collection("courses").insertMany([course1, course2]);

      const response = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 401 without authentication", async () => {
      await request(app)
        .get("/api/courses")
        .expect(401);
    });
  });

  describe("GET /api/courses/:id", () => {
    it("should get course by ID", async () => {
      const course = createMockCourse({
        ownerId: userId,
        visibility: "public",
      });

      await testDb.collection("courses").insertOne(course);

      const response = await request(app)
        .get(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(course._id.toString());
    });

    it("should return 403 for non-existent course (permission check first)", async () => {
      const nonExistentId = new ObjectId();

      const response = await request(app)
        .get(`/api/courses/${nonExistentId.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("You don't have permission to view this course");
    });

    it("should return 400 for invalid course ID", async () => {
      const response = await request(app)
        .get("/api/courses/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid course ID");
    });

    it("should return 403 for unauthorized access to private course", async () => {
      const otherUserId = new ObjectId();
      const course = createMockCourse({
        ownerId: otherUserId,
        visibility: "private",
      });

      await testDb.collection("courses").insertOne(course);

      const response = await request(app)
        .get(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("You don't have permission to view this course");
    });
  });

  describe("PATCH /api/courses/:id", () => {
    it("should update course as owner", async () => {
      const course = createMockCourse({ ownerId: userId });

      await testDb.collection("courses").insertOne(course);

      const updates = {
        title: "Updated Title",
        description: "Updated Description",
      };

      const response = await request(app)
        .patch(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Course updated successfully");
    });

    it("should update course as mentor", async () => {
      const ownerId = new ObjectId();
      const course = createMockCourse({
        ownerId,
        mentorIds: [userId],
      });

      await testDb.collection("courses").insertOne(course);

      const updates = {
        title: "Updated Title",
      };

      const response = await request(app)
        .patch(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should return 403 for non-mentor", async () => {
      const otherUserId = new ObjectId();
      const course = createMockCourse({ ownerId: otherUserId });

      await testDb.collection("courses").insertOne(course);

      const updates = {
        title: "Updated Title",
      };

      const response = await request(app)
        .patch(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Only course mentors can update the course");
    });
  });

  describe("DELETE /api/courses/:id", () => {
    it("should delete course as owner", async () => {
      const course = createMockCourse({ ownerId: userId });

      await testDb.collection("courses").insertOne(course);

      const response = await request(app)
        .delete(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Course deleted successfully");

      const deleted = await testDb.collection("courses").findOne({ _id: course._id });
      expect(deleted).toBeNull();
    });

    it("should return 403 for non-owner", async () => {
      const otherUserId = new ObjectId();
      const course = createMockCourse({ ownerId: otherUserId });

      await testDb.collection("courses").insertOne(course);

      const response = await request(app)
        .delete(`/api/courses/${course._id.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Only the course owner can delete the course");
    });

    it("should return 403 for non-existent course (not owner)", async () => {
      const nonExistentId = new ObjectId();

      const response = await request(app)
        .delete(`/api/courses/${nonExistentId.toString()}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Only the course owner can delete the course");
    });
  });
});
