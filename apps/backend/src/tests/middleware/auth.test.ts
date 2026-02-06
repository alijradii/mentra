import { describe, it, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import type { Request, Response, NextFunction } from "express";
import { ObjectId, type Db } from "mongodb";
import { authenticate, requireEmailVerification } from "../../middleware/auth.js";
import { generateToken } from "../../utils/jwt.js";
import { createMockUser } from "../utils/test-helpers.js";
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase, getTestDb } from "../setup.js";

let testDb: Db;

// Mock db module to return our test database
mock.module("../../db.js", () => ({
  getDb: () => testDb,
  connectToDatabase: async () => {},
  closeDatabase: async () => {},
}));

describe("Auth Middleware", () => {
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

  describe("authenticate", () => {
    it("should authenticate valid token and attach user to request", async () => {
      const userId = new ObjectId();
      const user = createMockUser({ _id: userId.toString() });
      
      // Insert user into test database
      await testDb.collection("users").insertOne({
        _id: userId,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        password: "hashed_password",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      const token = generateToken(userId.toString(), user.email);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as Request;

      const res = {
        status: mock(() => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?._id).toBe(userId.toString());
    });

    it("should return 401 when no token provided", async () => {
      const req = {
        headers: {},
      } as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is malformed", async () => {
      const req = {
        headers: {
          authorization: "InvalidToken",
        },
      } as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", async () => {
      const req = {
        headers: {
          authorization: "Bearer invalid.token.here",
        },
      } as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user not found", async () => {
      const userId = new ObjectId();
      const token = generateToken(userId.toString(), "test@example.com");
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireEmailVerification", () => {
    it("should allow access for verified users", () => {
      const user = createMockUser({ isEmailVerified: true });
      const req = { user } as Request;

      const res = {
        status: mock(() => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      requireEmailVerification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 403 for unverified users", () => {
      const user = createMockUser({ isEmailVerified: false });
      const req = { user } as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email verification required",
        message: "Please verify your email address to access this resource",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", () => {
      const req = {} as Request;

      const res = {
        status: mock((code: number) => res),
        json: mock(() => res),
      } as unknown as Response;

      const next = mock(() => {}) as unknown as NextFunction;

      requireEmailVerification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
