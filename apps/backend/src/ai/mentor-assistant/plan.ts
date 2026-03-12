import { MENTOR_PLAN_TODO_ACTIONS } from "shared";
import { z } from "zod";

/**
 * Zod enum for the structured mentor plan to-do actions.
 * This is kept in sync with `MENTOR_PLAN_TODO_ACTIONS` from the shared types.
 */
export const planTodoActionSchema = z.enum(MENTOR_PLAN_TODO_ACTIONS);

/**
 * Schema for a single structured to-do point the planning agent can create.
 * This mirrors `MentorPlanTodoPoint` in the shared types.
 */
export const toDoPointSchema = z.object({
    content: z
        .string()
        .min(1)
        .describe("Human-readable description of this to-do step."),

    nodeIds: z
        .array(z.string())
        .describe(
            "Node IDs this step touches. Use an empty array for module-level steps or steps that don't touch specific nodes."
        ),

    action: planTodoActionSchema.describe(
        "Structured action type describing what this step will actually do. Must be one of: create_module, create_node, modify_node, create_and_populate_module, create_and_populate_node, delete_node, delete_module. These map directly onto the available mentor tools."
    ),

    moduleId: z
        .string()
        .optional()
        .describe(
            "Optional module ID this step is primarily about (for module-level operations like create/delete module)."
        ),

    nodeId: z
        .string()
        .optional()
        .describe(
            "Optional primary node ID this step is about (for node-level operations like create/modify/delete node)."
        ),

    explanation: z
        .string()
        .optional()
        .describe(
            "Short explanation of why this step exists or what it tries to achieve, written for mentors."
        ),

    contextNotes: z
        .string()
        .optional()
        .describe(
            "Extra contextual notes that might help when executing this step (user intent, constraints, examples, etc.)."
        ),
});

/**
 * Schema for the full plan object that a future `createPlan` tool can accept.
 * This keeps the agent constrained to actionable, structured steps.
 */
export const mentorPlanSchema = z.object({
    description: z
        .string()
        .min(1)
        .describe("High-level description of what the AI is going to do."),

    todoPoints: z
        .array(toDoPointSchema)
        .min(1)
        .describe(
            "Structured to-do points. Each point must use an allowed action type and, when possible, specify moduleId/nodeId."
        ),
});
