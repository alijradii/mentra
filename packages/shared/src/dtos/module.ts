import { z } from "zod";
import { moduleSchema } from "../schemas/module";

/**
 * Module DTOs
 */
export const createModuleSchema = moduleSchema.omit({ nodes: true });
export const updateModuleSchema = createModuleSchema.partial().omit({ courseId: true });

export type CreateModuleDto = z.infer<typeof createModuleSchema>;
export type UpdateModuleDto = z.infer<typeof updateModuleSchema>;
