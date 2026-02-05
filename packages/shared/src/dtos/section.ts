import { z } from "zod";
import { sectionSchema } from "../schemas/section.js";

/**
 * Section DTOs (for adding/updating sections within a node)
 */
export const createSectionSchema = sectionSchema;

// Note: For updating sections, use the appropriate section schema directly
export type CreateSectionDto = z.infer<typeof createSectionSchema>;
