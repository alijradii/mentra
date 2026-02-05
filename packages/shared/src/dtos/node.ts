import { z } from "zod";
import { nodeSchema } from "../schemas/node.js";

/**
 * Node DTOs
 */
export const createNodeSchema = nodeSchema;
export const updateNodeSchema = nodeSchema.partial().omit({ moduleId: true });

export type CreateNodeDto = z.infer<typeof createNodeSchema>;
export type UpdateNodeDto = z.infer<typeof updateNodeSchema>;
