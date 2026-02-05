import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";
import { getCourseCollection } from "../models/course.js";
import { findUserById } from "../models/user.js";
import { addMentorSchema } from "shared";
import { isCourseOwner } from "../services/course.service.js";

/**
 * Mentor Management Controller
 */

/**
 * Add a mentor to the course
 * POST /courses/:id/mentors
 */
export async function addMentor(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: "Invalid course ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only the owner can add mentors
    if (!(await isCourseOwner(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only the course owner can add mentors",
      });
      return;
    }

    const validation = addMentorSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.error.errors,
      });
      return;
    }

    const { mentorId } = validation.data;

    // Verify mentor exists
    const mentor = await findUserById(mentorId);
    if (!mentor) {
      res.status(404).json({
        success: false,
        error: "Mentor not found",
      });
      return;
    }

    const db = getDb();
    const collection = getCourseCollection(db);
    
    // Check if already a mentor
    const course = await collection.findOne({ _id: new ObjectId(id) });
    if (course?.mentorIds.some((id) => id.toString() === mentorId)) {
      res.status(400).json({
        success: false,
        error: "User is already a mentor of this course",
      });
      return;
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $addToSet: { mentorIds: new ObjectId(mentorId) },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({
      success: true,
      message: "Mentor added successfully",
    });
  } catch (error) {
    console.error("Error adding mentor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add mentor",
    });
  }
}

/**
 * Remove a mentor from the course
 * DELETE /courses/:id/mentors/:mentorId
 */
export async function removeMentor(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const mentorId = String(req.params.mentorId);
    
    if (!ObjectId.isValid(id) || !ObjectId.isValid(mentorId)) {
      res.status(400).json({
        success: false,
        error: "Invalid ID",
      });
      return;
    }

    const userId = req.user!._id;

    // Only the owner can remove mentors
    if (!(await isCourseOwner(id, userId))) {
      res.status(403).json({
        success: false,
        error: "Only the course owner can remove mentors",
      });
      return;
    }

    // Can't remove the owner
    if (mentorId === userId) {
      res.status(400).json({
        success: false,
        error: "Cannot remove the course owner",
      });
      return;
    }

    const db = getDb();
    const collection = getCourseCollection(db);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { mentorIds: new ObjectId(mentorId) },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({
        success: false,
        error: "Course not found or mentor not in course",
      });
      return;
    }

    res.json({
      success: true,
      message: "Mentor removed successfully",
    });
  } catch (error) {
    console.error("Error removing mentor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove mentor",
    });
  }
}
