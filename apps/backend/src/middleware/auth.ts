import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { findUserById, userDocumentToUser } from "../models/user";
import type { User } from "shared";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const userDoc = await findUserById(payload.userId);
    
    if (!userDoc) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Attach user to request
    req.user = userDocumentToUser(userDoc);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export function requireEmailVerification(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({ 
      error: "Email verification required",
      message: "Please verify your email address to access this resource"
    });
    return;
  }

  next();
}
