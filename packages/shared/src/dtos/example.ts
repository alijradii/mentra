import { z } from "zod";

export const createExampleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

export const updateExampleSchema = createExampleSchema.partial();

export type CreateExampleDto = z.infer<typeof createExampleSchema>;
export type UpdateExampleDto = z.infer<typeof updateExampleSchema>;
