import { Collection, ObjectId, type Db } from "mongodb";
import type {
  Course as CourseBase,
  Enrollment as EnrollmentBase,
  Module as ModuleBase,
  Node as NodeBase,
  NodeSubmission as NodeSubmissionBase,
  CourseSnapshot as CourseSnapshotBase,
  CourseSnapshotMeta as CourseSnapshotMetaBase,
} from "shared";

// MongoDB-specific type aliases with ObjectId
export type Course = CourseBase<ObjectId>;
export type Module = ModuleBase<ObjectId>;
export type Node = NodeBase<ObjectId>;
export type Enrollment = EnrollmentBase<ObjectId>;
export type NodeSubmission = NodeSubmissionBase<ObjectId>;
export type CourseSnapshot = CourseSnapshotBase<ObjectId>;
export type CourseSnapshotMeta = CourseSnapshotMetaBase<ObjectId>;

/**
 * Collection names
 */
export const COLLECTIONS = {
  COURSES: "courses",
  MODULES: "modules",
  NODES: "nodes",
  ENROLLMENTS: "enrollments",
  SUBMISSIONS: "submissions",
  SNAPSHOTS: "course_snapshots",
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

export function getSubmissionCollection(db: Db): Collection<NodeSubmission> {
  return db.collection<NodeSubmission>(COLLECTIONS.SUBMISSIONS);
}

export function getSnapshotCollection(db: Db): Collection<CourseSnapshot> {
  return db.collection<CourseSnapshot>(COLLECTIONS.SNAPSHOTS);
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

  // Submission indexes
  const submissions = getSubmissionCollection(db);
  await submissions.createIndexes([
    { key: { nodeId: 1, userId: 1 } },
    { key: { courseId: 1, userId: 1 } },
    { key: { nodeId: 1, status: 1 } },
    { key: { courseId: 1, nodeId: 1, status: 1 } },
    { key: { createdAt: -1 } },
  ]);

  // Snapshot indexes
  const snapshots = getSnapshotCollection(db);
  await snapshots.createIndexes([
    { key: { courseId: 1, createdAt: -1 } },
    { key: { courseId: 1, parentId: 1 } },
    { key: { "createdBy.id": 1 } },
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
   * Reorder modules within a course (set each module's order to its index in moduleIds).
   * All moduleIds must belong to the course.
   */
  async reorderModules(courseId: ObjectId | string, moduleIds: string[]): Promise<boolean> {
    const _courseId = typeof courseId === "string" ? new ObjectId(courseId) : courseId;
    const existing = await this.getModulesByCourseId(_courseId);
    const existingIds = new Set(existing.map((m) => m._id.toString()));
    if (
      existingIds.size !== moduleIds.length ||
      moduleIds.some((id) => !existingIds.has(id))
    ) {
      return false;
    }
    const moduleCollection = getModuleCollection(this.db);
    const now = new Date();
    await Promise.all(
      moduleIds.map((id, index) =>
        moduleCollection.updateOne(
          { _id: new ObjectId(id), courseId: _courseId },
          { $set: { order: index, updatedAt: now } }
        )
      )
    );
    return true;
  }

  /**
   * Reorder nodes within a module (set each node's order to its index in nodeIds).
   * All nodeIds must belong to the module.
   */
  async reorderNodes(moduleId: ObjectId | string, nodeIds: string[]): Promise<boolean> {
    const _moduleId = typeof moduleId === "string" ? new ObjectId(moduleId) : moduleId;
    const existing = await this.getNodesByModuleId(_moduleId);
    const existingIds = new Set(existing.map((n) => n._id.toString()));
    if (
      existingIds.size !== nodeIds.length ||
      nodeIds.some((id) => !existingIds.has(id))
    ) {
      return false;
    }
    const nodeCollection = getNodeCollection(this.db);
    const now = new Date();
    await Promise.all(
      nodeIds.map((id, index) =>
        nodeCollection.updateOne(
          { _id: new ObjectId(id), moduleId: _moduleId },
          { $set: { order: index, updatedAt: now } }
        )
      )
    );
    return true;
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

  // ── Submissions ──

  async createSubmission(
    data: Omit<NodeSubmission, "_id" | "createdAt" | "updatedAt">
  ): Promise<NodeSubmission> {
    const collection = getSubmissionCollection(this.db);
    const now = new Date();
    const submission: NodeSubmission = {
      _id: new ObjectId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await collection.insertOne(submission);
    return submission;
  }

  async getSubmissionById(id: ObjectId | string): Promise<NodeSubmission | null> {
    const collection = getSubmissionCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return collection.findOne({ _id });
  }

  async getSubmissionsByNodeAndUser(
    nodeId: ObjectId | string,
    userId: ObjectId | string
  ): Promise<NodeSubmission[]> {
    const collection = getSubmissionCollection(this.db);
    const _nodeId = typeof nodeId === "string" ? new ObjectId(nodeId) : nodeId;
    const _userId = typeof userId === "string" ? new ObjectId(userId) : userId;
    return collection
      .find({ nodeId: _nodeId, userId: _userId })
      .sort({ attemptNumber: -1 })
      .toArray();
  }

  async getSubmissionsByNode(
    nodeId: ObjectId | string,
    statusFilter?: string
  ): Promise<NodeSubmission[]> {
    const collection = getSubmissionCollection(this.db);
    const _nodeId = typeof nodeId === "string" ? new ObjectId(nodeId) : nodeId;
    const filter: Record<string, unknown> = { nodeId: _nodeId };
    if (statusFilter) filter.status = statusFilter;
    return collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  async updateSubmission(
    id: ObjectId | string,
    updates: Partial<Omit<NodeSubmission, "_id" | "createdAt">>
  ): Promise<boolean> {
    const collection = getSubmissionCollection(this.db);
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const result = await collection.updateOne(
      { _id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async countSubmissions(
    nodeId: ObjectId | string,
    userId: ObjectId | string
  ): Promise<number> {
    const collection = getSubmissionCollection(this.db);
    const _nodeId = typeof nodeId === "string" ? new ObjectId(nodeId) : nodeId;
    const _userId = typeof userId === "string" ? new ObjectId(userId) : userId;
    return collection.countDocuments({ nodeId: _nodeId, userId: _userId });
  }

  async bulkReleaseSubmissions(nodeId: ObjectId | string): Promise<number> {
    const collection = getSubmissionCollection(this.db);
    const _nodeId = typeof nodeId === "string" ? new ObjectId(nodeId) : nodeId;
    const result = await collection.updateMany(
      { nodeId: _nodeId, status: "graded" },
      { $set: { status: "released", updatedAt: new Date() } }
    );
    return result.modifiedCount;
  }
}

/**
 * SnapshotModel — version control for courses
 */
export class SnapshotModel {
  constructor(private db: Db) {}

  /**
   * Create a snapshot: deep-copies the course, all its modules, and all nodes.
   * Sets course.currentSnapshotId to the new snapshot.
   */
  async createSnapshot(
    courseId: ObjectId | string,
    label: string,
    description: string | undefined,
    userId: ObjectId | string,
    userName: string
  ): Promise<CourseSnapshot> {
    const _courseId = typeof courseId === "string" ? new ObjectId(courseId) : courseId;
    const _userId = typeof userId === "string" ? new ObjectId(userId) : userId;

    const courseModel = new CourseModel(this.db);
    const course = await courseModel.getCourseById(_courseId);
    if (!course) throw new Error("Course not found");

    const modules = await courseModel.getModulesByCourseId(_courseId);
    const nodes: Node[] = [];
    for (const mod of modules) {
      const modNodes = await courseModel.getNodesByModuleId(mod._id);
      nodes.push(...modNodes);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { modules: _moduleRefs, ...courseWithoutModuleRefs } = course;

    const snapshot: CourseSnapshot = {
      _id: new ObjectId(),
      courseId: _courseId,
      parentId: course.currentSnapshotId ?? null,
      label,
      description,
      createdBy: { id: _userId, name: userName },
      createdAt: new Date(),
      data: {
        course: courseWithoutModuleRefs,
        modules,
        nodes,
      },
    };

    const snapshotCollection = getSnapshotCollection(this.db);
    await snapshotCollection.insertOne(snapshot);

    // Update course.currentSnapshotId
    const courseCollection = getCourseCollection(this.db);
    await courseCollection.updateOne(
      { _id: _courseId },
      { $set: { currentSnapshotId: snapshot._id, updatedAt: new Date() } }
    );

    return snapshot;
  }

  /**
   * List snapshots for a course (metadata only — no data field).
   */
  async getSnapshotsByCourse(courseId: ObjectId | string): Promise<CourseSnapshotMeta[]> {
    const _courseId = typeof courseId === "string" ? new ObjectId(courseId) : courseId;
    const collection = getSnapshotCollection(this.db);
    return collection
      .find({ courseId: _courseId }, { projection: { data: 0 } })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Promise<CourseSnapshotMeta[]>;
  }

  /**
   * Get a single snapshot with full data.
   */
  async getSnapshotById(id: ObjectId | string): Promise<CourseSnapshot | null> {
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    const collection = getSnapshotCollection(this.db);
    return collection.findOne({ _id });
  }

  /**
   * Restore a snapshot: replace the course, its modules, and nodes with
   * snapshot data, then set course.currentSnapshotId to this snapshot.
   */
  async restoreSnapshot(snapshotId: ObjectId | string): Promise<boolean> {
    const _id = typeof snapshotId === "string" ? new ObjectId(snapshotId) : snapshotId;
    const snapshot = await this.getSnapshotById(_id);
    if (!snapshot) return false;

    const { course: savedCourse, modules: savedModules, nodes: savedNodes } = snapshot.data;

    const courseCollection = getCourseCollection(this.db);
    const moduleCollection = getModuleCollection(this.db);
    const nodeCollection = getNodeCollection(this.db);

    // Delete existing modules and nodes for this course
    const existingModules = await getModuleCollection(this.db)
      .find({ courseId: snapshot.courseId })
      .toArray();
    const existingModuleIds = existingModules.map((m) => m._id);

    if (existingModuleIds.length > 0) {
      await nodeCollection.deleteMany({ moduleId: { $in: existingModuleIds } });
      await moduleCollection.deleteMany({ courseId: snapshot.courseId });
    }

    // Re-insert modules and nodes from snapshot
    if (savedModules.length > 0) {
      await moduleCollection.insertMany(savedModules);
    }
    if (savedNodes.length > 0) {
      await nodeCollection.insertMany(savedNodes);
    }

    // Restore course document (preserve _id, update the rest)
    const now = new Date();
    await courseCollection.updateOne(
      { _id: snapshot.courseId },
      {
        $set: {
          ...savedCourse,
          _id: snapshot.courseId,
          modules: savedModules.map((m) => m._id),
          currentSnapshotId: snapshot._id,
          updatedAt: now,
        },
      }
    );

    return true;
  }
}
