import { Collection, ObjectId, type Db } from "mongodb";
import type { Course as CourseBase, Enrollment as EnrollmentBase, Module as ModuleBase, Node as NodeBase } from "shared";

// MongoDB-specific type aliases with ObjectId
export type Course = CourseBase<ObjectId>;
export type Module = ModuleBase<ObjectId>;
export type Node = NodeBase<ObjectId>;
export type Enrollment = EnrollmentBase<ObjectId>;

/**
 * Collection names
 */
export const COLLECTIONS = {
  COURSES: "courses",
  MODULES: "modules",
  NODES: "nodes",
  ENROLLMENTS: "enrollments",
} as const;

/**
 * Get typed MongoDB collections
 */
export function getCourseCollection(db: Db): Collection<Course> {
  return db.collection<Course>(COLLECTIONS.COURSES);
}

export function getModuleCollection(db: Db): Collection<Module> {
  return db.collection<Module>(COLLECTIONS.MODULES);
}

export function getNodeCollection(db: Db): Collection<Node> {
  return db.collection<Node>(COLLECTIONS.NODES);
}

export function getEnrollmentCollection(db: Db): Collection<Enrollment> {
  return db.collection<Enrollment>(COLLECTIONS.ENROLLMENTS);
}

/**
 * Create indexes for better query performance
 */
export async function createCourseIndexes(db: Db): Promise<void> {
  const courses = getCourseCollection(db);
  const modules = getModuleCollection(db);
  const nodes = getNodeCollection(db);
  const enrollments = getEnrollmentCollection(db);

  // Course indexes
  await courses.createIndexes([
    { key: { "author.id": 1 } },
    { key: { ownerId: 1 } },
    { key: { mentorIds: 1 } },
    { key: { allowedStudentIds: 1 } },
    { key: { status: 1 } },
    { key: { visibility: 1 } },
    { key: { "metadata.category": 1 } },
    { key: { "metadata.tags": 1 } },
    { key: { "metadata.difficulty": 1 } },
    { key: { createdAt: -1 } },
    { key: { publishedAt: -1 } },
    { key: { "metadata.rating.average": -1 } },
    { key: { "metadata.enrollmentCount": -1 } },
  ]);

  // Module indexes
  await modules.createIndexes([
    { key: { courseId: 1, order: 1 } },
    { key: { status: 1 } },
    { key: { createdAt: -1 } },
  ]);

  // Node indexes
  await nodes.createIndexes([
    { key: { moduleId: 1, order: 1 } },
    { key: { status: 1 } },
    { key: { "metadata.difficulty": 1 } },
    { key: { "metadata.tags": 1 } },
    { key: { createdAt: -1 } },
  ]);

  // Enrollment indexes
  await enrollments.createIndexes([
    { key: { userId: 1, courseId: 1 }, unique: true },
    { key: { userId: 1, status: 1 } },
    { key: { courseId: 1, status: 1 } },
    { key: { lastAccessedAt: -1 } },
    { key: { createdAt: -1 } },
  ]);

  console.log("Course-related indexes created successfully");
}

/**
 * Helper functions for common database operations
 */
export class CourseModel {
  constructor(private db: Db) { }

  /**
   * Create a new course
   */
  async createCourse(courseData: Omit<Course, "_id" | "createdAt" | "updatedAt">): Promise<Course> {
    const collection = getCourseCollection(this.db);
    const now = new Date();
    const course: Course = {
      _id: new ObjectId(),
      ...courseData,
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(course);
    return course;
  }

  /**
   * Get course by ID with optional module and node population
   */
  async getCourseById(id: ObjectId | string, populate = false): Promise<Course | null> {
    const collection = getCourseCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const course = await collection.findOne({ _id });

    if (!course || !populate) return course;

    // Populate modules and nodes
    const modules = await this.getModulesByCourseId(course._id);
    return { ...course, modules: modules.map((m) => m._id) };
  }

  /**
   * Update course
   */
  async updateCourse(
    id: ObjectId | string,
    updates: Partial<Omit<Course, "_id" | "createdAt">>
  ): Promise<boolean> {
    const collection = getCourseCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const result = await collection.updateOne(
      { _id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete course (and optionally cascade delete modules and nodes)
   */
  async deleteCourse(id: ObjectId | string, cascade = true): Promise<boolean> {
    const collection = getCourseCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;

    if (cascade) {
      // Delete all modules and nodes
      const modules = await this.getModulesByCourseId(_id);
      for (const module of modules) {
        await this.deleteModule(module._id, true);
      }
    }

    const result = await collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }

  /**
   * Get a single module by ID
   */
  async getModuleById(id: ObjectId | string): Promise<Module | null> {
    const collection = getModuleCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return await collection.findOne({ _id });
  }

  /**
   * Get a single node by ID
   */
  async getNodeById(id: ObjectId | string): Promise<Node | null> {
    const collection = getNodeCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return await collection.findOne({ _id });
  }

  /**
   * Get modules by course ID
   */
  async getModulesByCourseId(courseId: ObjectId | string): Promise<Module[]> {
    const collection = getModuleCollection(this.db);
    const _courseId = typeof courseId === "string" ? new ObjectId(courseId) : courseId;
    return await collection.find({ courseId: _courseId }).sort({ order: 1 }).toArray();
  }

  /**
   * Create a new module
   */
  async createModule(moduleData: Omit<Module, "_id" | "createdAt" | "updatedAt">): Promise<Module> {
    const collection = getModuleCollection(this.db);
    const now = new Date();
    const module: Module = {
      _id: new ObjectId(),
      ...moduleData,
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(module);

    // Add module reference to course
    const courseCollection = getCourseCollection(this.db);
    await courseCollection.updateOne(
      { _id: module.courseId },
      { $push: { modules: module._id }, $set: { updatedAt: now } }
    );

    return module;
  }

  /**
   * Update module
   */
  async updateModule(
    id: ObjectId | string,
    updates: Partial<Omit<Module, "_id" | "createdAt" | "courseId">>
  ): Promise<boolean> {
    const collection = getModuleCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const result = await collection.updateOne(
      { _id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete module (and optionally cascade delete nodes)
   */
  async deleteModule(id: ObjectId | string, cascade = true): Promise<boolean> {
    const collection = getModuleCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;

    const module = await collection.findOne({ _id });
    if (!module) return false;

    if (cascade) {
      // Delete all nodes
      const nodes = await this.getNodesByModuleId(_id);
      const nodeCollection = getNodeCollection(this.db);
      if (nodes.length > 0) {
        await nodeCollection.deleteMany({ _id: { $in: nodes.map((n) => n._id) } });
      }
    }

    // Remove module reference from course
    const courseCollection = getCourseCollection(this.db);
    await courseCollection.updateOne(
      { _id: module.courseId },
      { $pull: { modules: _id }, $set: { updatedAt: new Date() } }
    );

    const result = await collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }

  /**
   * Get nodes by module ID
   */
  async getNodesByModuleId(moduleId: ObjectId | string): Promise<Node[]> {
    const collection = getNodeCollection(this.db);
    const _moduleId = typeof moduleId === "string" ? new ObjectId(moduleId) : moduleId;
    return await collection.find({ moduleId: _moduleId }).sort({ order: 1 }).toArray();
  }

  /**
   * Create a new node
   */
  async createNode(nodeData: Omit<Node, "_id" | "createdAt" | "updatedAt">): Promise<Node> {
    const collection = getNodeCollection(this.db);
    const now = new Date();
    const node: Node = {
      _id: new ObjectId(),
      ...nodeData,
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(node);

    // Add node reference to module
    const moduleCollection = getModuleCollection(this.db);
    await moduleCollection.updateOne(
      { _id: node.moduleId },
      { $push: { nodes: node._id }, $set: { updatedAt: now } }
    );

    return node;
  }

  /**
   * Update node
   */
  async updateNode(
    id: ObjectId | string,
    updates: Partial<Omit<Node, "_id" | "createdAt" | "moduleId">>
  ): Promise<boolean> {
    const collection = getNodeCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const result = await collection.updateOne(
      { _id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete node
   */
  async deleteNode(id: ObjectId | string): Promise<boolean> {
    const collection = getNodeCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;

    const node = await collection.findOne({ _id });
    if (!node) return false;

    // Remove node reference from module
    const moduleCollection = getModuleCollection(this.db);
    await moduleCollection.updateOne(
      { _id: node.moduleId },
      { $pull: { nodes: _id }, $set: { updatedAt: new Date() } }
    );

    const result = await collection.deleteOne({ _id });
    return result.deletedCount > 0;
  }

  /**
   * Create enrollment
   */
  async createEnrollment(
    enrollmentData: Omit<Enrollment, "_id" | "createdAt" | "updatedAt">
  ): Promise<Enrollment> {
    const collection = getEnrollmentCollection(this.db);
    const now = new Date();
    const enrollment: Enrollment = {
      _id: new ObjectId(),
      ...enrollmentData,
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(enrollment);

    // Update course enrollment count
    const courseCollection = getCourseCollection(this.db);
    await courseCollection.updateOne(
      { _id: enrollment.courseId },
      { $inc: { "metadata.enrollmentCount": 1 } }
    );

    return enrollment;
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(
    userId: ObjectId | string,
    courseId: ObjectId | string,
    progress: Partial<Enrollment["progress"]>
  ): Promise<boolean> {
    const collection = getEnrollmentCollection(this.db);
    const _userId = typeof userId === "string" ? new ObjectId(userId) : userId;
    const _courseId = typeof courseId === "string" ? new ObjectId(courseId) : courseId;

    const result = await collection.updateOne(
      { userId: _userId, courseId: _courseId },
      {
        $set: {
          ...Object.fromEntries(
            Object.entries(progress).map(([key, value]) => [`progress.${key}`, value])
          ),
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }
}
