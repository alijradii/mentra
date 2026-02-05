import { Router, Request, Response } from "express";
import { registerSchema, loginSchema, verifyEmailSchema, toUserDTO } from "shared";
import {
  createUser,
  findUserByEmail,
  verifyPassword,
  verifyEmailToken,
  userDocumentToUser,
} from "../models/user";
import { generateToken } from "../utils/jwt";
import { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } from "../utils/email";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = registerSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: result.error.errors 
      });
      return;
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    // Generate email verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const userDoc = await createUser(email, password, name, verificationToken);
    const user = userDocumentToUser(userDoc);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    res.status(201).json({
      user: toUserDTO(user),
      token,
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: result.error.errors 
      });
      return;
    }

    const { email, password } = result.data;

    // Find user
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, userDoc.password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = userDocumentToUser(userDoc);

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    res.json({
      user: toUserDTO(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({ user: toUserDTO(req.user) });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post("/verify-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);
    
    if (!result.success) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: result.error.errors 
      });
      return;
    }

    const { token } = result.data;

    const userDoc = await verifyEmailToken(token);
    
    if (!userDoc) {
      res.status(400).json({ 
        error: "Invalid or expired verification token" 
      });
      return;
    }

    const user = userDocumentToUser(userDoc);
    
    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.json({
      message: "Email verified successfully",
      user: toUserDTO(user),
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email (requires authentication)
 */
router.post("/resend-verification", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (req.user.isEmailVerified) {
      res.status(400).json({ error: "Email is already verified" });
      return;
    }

    const verificationToken = generateVerificationToken();
    await sendVerificationEmail(req.user.email, verificationToken);

    res.json({ 
      message: "Verification email sent successfully" 
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

export default router;
