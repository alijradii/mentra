import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { ObjectId } from "mongodb";
import { CourseModel } from "../../models/course.js";
import {
  clearTestDatabase,
  getTestDb,
  setupTestDatabase,
  teardownTestDatabase,
} from "../setup.js";
import { createMockCourse, createMockEnrollment, createMockModule, createMockNode } from "../utils/test-helpers.js";

describe("CourseModel", () => {
  let courseModel: CourseModel;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    const db = getTestDb();
    courseModel = new CourseModel(db);
  });

  describe("createCourse", () => {
    it("should create a new course", async () => {
      const courseData = createMockCourse();
      const { _id, createdAt, updatedAt, ...dataWithoutId } = courseData;

      const result = await courseModel.createCourse(dataWithoutId);

      expect(result._id).toBeDefined();
      expect(result.title).toBe(courseData.title);
      expect(result.status).toBe(courseData.status);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getCourseById", () => {
    it("should get course by ObjectId", async () => {
      const course = createMockCourse();
      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const result = await courseModel.getCourseById(course._id);

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(course._id.toString());
    });

    it("should get course by string ID", async () => {
      const course = createMockCourse();
      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const result = await courseModel.getCourseById(course._id.toString());

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(course._id.toString());
    });

    it("should return null for non-existent course", async () => {
      const result = await courseModel.getCourseById(new ObjectId());

      expect(result).toBeNull();
    });
  });

  describe("updateCourse", () => {
    it("should update course successfully", async () => {
      const course = createMockCourse();
      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const result = await courseModel.updateCourse(course._id, {
        title: "Updated Title",
        description: "Updated Description",
      });

      expect(result).toBe(true);

      const updated = await db.collection("courses").findOne({ _id: course._id });
      expect(updated?.title).toBe("Updated Title");
      expect(updated?.description).toBe("Updated Description");
    });

    it("should return false for non-existent course", async () => {
      const result = await courseModel.updateCourse(new ObjectId(), {
        title: "Updated Title",
      });

      expect(result).toBe(false);
    });
  });

  describe("deleteCourse", () => {
    it("should delete course without cascade", async () => {
      const course = createMockCourse();
      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const result = await courseModel.deleteCourse(course._id, false);

      expect(result).toBe(true);

      const deleted = await db.collection("courses").findOne({ _id: course._id });
      expect(deleted).toBeNull();
    });

    it("should delete course with cascade (modules and nodes)", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);
      const node = createMockNode(module._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);
      await db.collection("nodes").insertOne(node);

      const result = await courseModel.deleteCourse(course._id, true);

      expect(result).toBe(true);

      const deletedCourse = await db.collection("courses").findOne({ _id: course._id });
      const deletedModule = await db.collection("modules").findOne({ _id: module._id });
      const deletedNode = await db.collection("nodes").findOne({ _id: node._id });

      expect(deletedCourse).toBeNull();
      expect(deletedModule).toBeNull();
      expect(deletedNode).toBeNull();
    });

    it("should return false for non-existent course", async () => {
      const result = await courseModel.deleteCourse(new ObjectId());

      expect(result).toBe(false);
    });
  });

  describe("Module operations", () => {
    it("should create a module", async () => {
      const course = createMockCourse();
      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const moduleData = createMockModule(course._id);
      const { _id, createdAt, updatedAt, ...dataWithoutId } = moduleData;

      const result = await courseModel.createModule(dataWithoutId);

      expect(result._id).toBeDefined();
      expect(result.courseId.toString()).toBe(course._id.toString());
    });

    it("should get modules by course ID", async () => {
      const course = createMockCourse();
      const module1 = createMockModule(course._id, { order: 1 });
      const module2 = createMockModule(course._id, { order: 2 });

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertMany([module1, module2]);

      const result = await courseModel.getModulesByCourseId(course._id);

      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it("should update a module", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);

      const result = await courseModel.updateModule(module._id, {
        title: "Updated Module Title",
      });

      expect(result).toBe(true);

      const updated = await db.collection("modules").findOne({ _id: module._id });
      expect(updated?.title).toBe("Updated Module Title");
    });

    it("should delete a module", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);

      const result = await courseModel.deleteModule(module._id);

      expect(result).toBe(true);

      const deleted = await db.collection("modules").findOne({ _id: module._id });
      expect(deleted).toBeNull();
    });
  });

  describe("Node operations", () => {
    it("should create a node", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);

      const nodeData = createMockNode(module._id);
      const { _id, createdAt, updatedAt, ...dataWithoutId } = nodeData;

      const result = await courseModel.createNode(dataWithoutId);

      expect(result._id).toBeDefined();
      expect(result.moduleId.toString()).toBe(module._id.toString());
    });

    it("should get nodes by module ID", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);
      const node1 = createMockNode(module._id, { order: 1 });
      const node2 = createMockNode(module._id, { order: 2 });

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);
      await db.collection("nodes").insertMany([node1, node2]);

      const result = await courseModel.getNodesByModuleId(module._id);

      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
    });

    it("should update a node", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);
      const node = createMockNode(module._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);
      await db.collection("nodes").insertOne(node);

      const result = await courseModel.updateNode(node._id, {
        title: "Updated Node Title",
      });

      expect(result).toBe(true);

      const updated = await db.collection("nodes").findOne({ _id: node._id });
      expect(updated?.title).toBe("Updated Node Title");
    });

    it("should delete a node", async () => {
      const course = createMockCourse();
      const module = createMockModule(course._id);
      const node = createMockNode(module._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("modules").insertOne(module);
      await db.collection("nodes").insertOne(node);

      const result = await courseModel.deleteNode(node._id);

      expect(result).toBe(true);

      const deleted = await db.collection("nodes").findOne({ _id: node._id });
      expect(deleted).toBeNull();
    });
  });

  describe("Enrollment operations", () => {
    it("should create an enrollment", async () => {
      const userId = new ObjectId();
      const course = createMockCourse();

      const db = getTestDb();
      await db.collection("courses").insertOne(course);

      const enrollmentData = createMockEnrollment(userId, course._id);
      const { _id, createdAt, updatedAt, ...dataWithoutId } = enrollmentData;

      const result = await courseModel.createEnrollment(dataWithoutId);

      expect(result._id).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.courseId.toString()).toBe(course._id.toString());
    });

    it("should update enrollment progress", async () => {
      const userId = new ObjectId();
      const course = createMockCourse();
      const enrollment = createMockEnrollment(userId, course._id);

      const db = getTestDb();
      await db.collection("courses").insertOne(course);
      await db.collection("enrollments").insertOne(enrollment);

      const nodeId = new ObjectId();
      const result = await courseModel.updateEnrollmentProgress(userId, course._id, {
        completedNodes: [nodeId],
        overallPercentage: 50,
      });

      expect(result).toBe(true);

      const updated = await db.collection("enrollments").findOne({ _id: enrollment._id });
      expect(updated?.progress.completedNodes).toHaveLength(1);
      expect(updated?.progress.overallPercentage).toBe(50);
    });
  });
});
