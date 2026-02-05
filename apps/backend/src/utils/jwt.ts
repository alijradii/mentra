import jwt from "jsonwebtoken";
import { getRequiredEnv, getEnv } from "./env";

const JWT_SECRET = getRequiredEnv("JWT_SECRET");
const JWT_EXPIRES_IN = getEnv("JWT_EXPIRES_IN", "7d");

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateToken(userId: string, email: string): string {
  const payload: JwtPayload = { userId, email };
  // Type assertion needed due to StringValue branded type in @types/jsonwebtoken
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}
