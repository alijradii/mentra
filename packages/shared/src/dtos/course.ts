import { z } from "zod";

/**
 * Query/filter DTOs
 */
export const courseFilterSchema = z.object({
  authorId: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  visibility: z.enum(["public", "private", "unlisted"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  pricingType: z.enum(["free", "paid"]).optional(),
});

export type CourseFilterDto = z.infer<typeof courseFilterSchema>;
