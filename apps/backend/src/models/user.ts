import { Collection, ObjectId } from "mongodb";
import { getDb } from "../db";
import bcrypt from "bcryptjs";
import type { User } from "shared";

export interface UserDocument {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function getUserCollection(): Collection<UserDocument> {
  return getDb().collection<UserDocument>("users");
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  emailVerificationToken?: string
): Promise<UserDocument> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();
  const verificationExpires = emailVerificationToken
    ? new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    : undefined;

  const user: Omit<UserDocument, "_id"> = {
    email: email.toLowerCase(),
    password: hashedPassword,
    name,
    isEmailVerified: !emailVerificationToken, // If no token, consider verified (for dev)
    emailVerificationToken,
    emailVerificationExpires: verificationExpires,
    createdAt: now,
    updatedAt: now,
  };

  const result = await getUserCollection().insertOne(user as UserDocument);
  return { ...user, _id: result.insertedId } as UserDocument;
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  return getUserCollection().findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  return getUserCollection().findOne({ _id: new ObjectId(id) });
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function verifyEmailToken(token: string): Promise<UserDocument | null> {
  const user = await getUserCollection().findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) return null;

  await getUserCollection().updateOne(
    { _id: user._id },
    {
      $set: {
        isEmailVerified: true,
        updatedAt: new Date(),
      },
      $unset: {
        emailVerificationToken: "",
        emailVerificationExpires: "",
      },
    }
  );

  return getUserCollection().findOne({ _id: user._id });
}

export function userDocumentToUser(doc: UserDocument): User {
  return {
    _id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    isEmailVerified: doc.isEmailVerified,
    emailVerificationToken: doc.emailVerificationToken,
    emailVerificationExpires: doc.emailVerificationExpires,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
