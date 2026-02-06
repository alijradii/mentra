import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { ObjectId, type Db } from "mongodb";
import {
  clearTestDatabase,
  getTestDb,
  setupTestDatabase,
  teardownTestDatabase,
} from "../setup.js";
import { createMockCourse, createMockEnrollment, createMockModule, createMockNode } from "../utils/test-helpers.js";

let testDb: Db;

// Mock db module to return our test database
mock.module("../../db.js", () => ({
  getDb: () => testDb,
  connectToDatabase: async () => { },
  closeDatabase: async () => { },
}));

describe("Course Service", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    testDb = getTestDb();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe("isCourseOwner", () => {
    it("should return true when user is the course owner", async () => {
      const { isCourseOwner } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const course = createMockCourse({ ownerId: userId });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await isCourseOwner(course._id.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return false when user is not the course owner", async () => {
      const { isCourseOwner } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const userId = new ObjectId();
      const course = createMockCourse({ ownerId });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await isCourseOwner(course._id.toString(), userId.toString());
      expect(result).toBe(false);
    });

    it("should return false when course does not exist", async () => {
      const { isCourseOwner } = await import("../../services/course.service.js");

      const courseId = new ObjectId();
      const userId = new ObjectId();

      const result = await isCourseOwner(courseId.toString(), userId.toString());
      expect(result).toBe(false);
    });
  });

  describe("isCourseMentor", () => {
    it("should return true when user is the course owner", async () => {
      const { isCourseMentor } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const course = createMockCourse({ ownerId: userId });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await isCourseMentor(course._id.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return true when user is added as a mentor", async () => {
      const { isCourseMentor } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const mentorId = new ObjectId();
      const course = createMockCourse({ ownerId, mentorIds: [mentorId] });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await isCourseMentor(course._id.toString(), mentorId.toString());
      expect(result).toBe(true);
    });

    it("should return false when user is neither owner nor mentor", async () => {
      const { isCourseMentor } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const userId = new ObjectId();
      const course = createMockCourse({ ownerId });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await isCourseMentor(course._id.toString(), userId.toString());
      expect(result).toBe(false);
    });

    it("should return false when course does not exist", async () => {
      const { isCourseMentor } = await import("../../services/course.service.js");

      const courseId = new ObjectId();
      const userId = new ObjectId();

      const result = await isCourseMentor(courseId.toString(), userId.toString());
      expect(result).toBe(false);
    });
  });

  describe("isEnrolled", () => {
    it("should return true when user has active enrollment", async () => {
      const { isEnrolled } = await import("../../services/course.service.js");
      const { getEnrollmentCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const courseId = new ObjectId();
      const enrollment = createMockEnrollment(userId, courseId, { status: "active" });

      const collection = getEnrollmentCollection(testDb);
      await collection.insertOne(enrollment);

      const result = await isEnrolled(courseId.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return true when user has completed enrollment", async () => {
      const { isEnrolled } = await import("../../services/course.service.js");
      const { getEnrollmentCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const courseId = new ObjectId();
      const enrollment = createMockEnrollment(userId, courseId, { status: "completed" });

      const collection = getEnrollmentCollection(testDb);
      await collection.insertOne(enrollment);

      const result = await isEnrolled(courseId.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return false when enrollment is cancelled", async () => {
      const { isEnrolled } = await import("../../services/course.service.js");
      const { getEnrollmentCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const courseId = new ObjectId();
      const enrollment = createMockEnrollment(userId, courseId, { status: "dropped" });

      const collection = getEnrollmentCollection(testDb);
      await collection.insertOne(enrollment);

      const result = await isEnrolled(courseId.toString(), userId.toString());
      expect(result).toBe(false);
    });

    it("should return false when user is not enrolled", async () => {
      const { isEnrolled } = await import("../../services/course.service.js");

      const userId = new ObjectId();
      const courseId = new ObjectId();

      const result = await isEnrolled(courseId.toString(), userId.toString());
      expect(result).toBe(false);
    });
  });

  describe("canViewCourse", () => {
    it("should return true for course owner", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const userId = new ObjectId();
      const course = createMockCourse({ ownerId: userId, visibility: "private" });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await canViewCourse(course._id.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return true for course mentor", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const mentorId = new ObjectId();
      const course = createMockCourse({ ownerId, mentorIds: [mentorId], visibility: "private" });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await canViewCourse(course._id.toString(), mentorId.toString());
      expect(result).toBe(true);
    });

    it("should return true for public course", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const userId = new ObjectId();
      const course = createMockCourse({ ownerId, visibility: "public" });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await canViewCourse(course._id.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return true for enrolled student in private course", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");
      const { getCourseCollection, getEnrollmentCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const userId = new ObjectId();
      const course = createMockCourse({ ownerId, visibility: "private" });
      const enrollment = createMockEnrollment(userId, course._id, { status: "active" });

      const courseCollection = getCourseCollection(testDb);
      const enrollmentCollection = getEnrollmentCollection(testDb);
      await courseCollection.insertOne(course);
      await enrollmentCollection.insertOne(enrollment);

      const result = await canViewCourse(course._id.toString(), userId.toString());
      expect(result).toBe(true);
    });

    it("should return false for non-enrolled student in private course", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");
      const { getCourseCollection } = await import("../../models/course.js");

      const ownerId = new ObjectId();
      const userId = new ObjectId();
      const course = createMockCourse({ ownerId, visibility: "private" });

      const collection = getCourseCollection(testDb);
      await collection.insertOne(course);

      const result = await canViewCourse(course._id.toString(), userId.toString());
      expect(result).toBe(false);
    });

    it("should return false when course does not exist", async () => {
      const { canViewCourse } = await import("../../services/course.service.js");

      const courseId = new ObjectId();
      const userId = new ObjectId();

      const result = await canViewCourse(courseId.toString(), userId.toString());
      expect(result).toBe(false);
    });
  });

  describe("getModuleCourseId", () => {
    it("should return course ID for valid module", async () => {
      const { getModuleCourseId } = await import("../../services/course.service.js");

      const courseId = new ObjectId();
      const module = createMockModule(courseId);

      const collection = testDb.collection("modules");
      await collection.insertOne(module);

      const result = await getModuleCourseId(module._id.toString());
      expect(result).toBe(courseId.toString());
    });

    it("should return null for non-existent module", async () => {
      const { getModuleCourseId } = await import("../../services/course.service.js");

      const moduleId = new ObjectId();

      const result = await getModuleCourseId(moduleId.toString());
      expect(result).toBe(null);
    });
  });

  describe("getNodeCourseId", () => {
    it("should return course ID for valid node", async () => {
      const { getNodeCourseId } = await import("../../services/course.service.js");

      const courseId = new ObjectId();
      const module = createMockModule(courseId);
      const node = createMockNode(module._id);

      await testDb.collection("modules").insertOne(module);
      await testDb.collection("nodes").insertOne(node);

      const result = await getNodeCourseId(node._id.toString());
      expect(result).toBe(courseId.toString());
    });

    it("should return null for non-existent node", async () => {
      const { getNodeCourseId } = await import("../../services/course.service.js");

      const nodeId = new ObjectId();

      const result = await getNodeCourseId(nodeId.toString());
      expect(result).toBe(null);
    });

    it("should return null for node with non-existent module", async () => {
      const { getNodeCourseId } = await import("../../services/course.service.js");

      const moduleId = new ObjectId();
      const node = createMockNode(moduleId);

      await testDb.collection("nodes").insertOne(node);

      const result = await getNodeCourseId(node._id.toString());
      expect(result).toBe(null);
    });
  });
});
