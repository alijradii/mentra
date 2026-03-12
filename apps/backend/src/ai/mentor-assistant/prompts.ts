import type { CourseWSActor } from "shared";
import type { z } from "zod";
import type { mentorPlanSchema, toDoPointSchema } from "./plan";

type MentorPlan = z.infer<typeof mentorPlanSchema>;
type MentorTodoPoint = z.infer<typeof toDoPointSchema>;

export function buildContextPrompt(params: {
  courseId: string;
  inputText: string;
  actor?: CourseWSActor;
}): string {
  const { courseId, inputText, actor } = params;

  return `
You are a planning AI agent for an AI powered learning platform.
Use the available tools to explore the course structure and any relevant nodes.
Summarize everything you find that is relevant to fulfilling the mentor's request.
After gathering context, describe:
1. The current course structure (modules and nodes you found).
2. What changes need to be made to satisfy the request.

Context:
- Course ID: ${courseId}
- Mentor (${actor?.name ?? "Unknown"}): "${inputText}"
`;
}

export function buildPlanningPrompt(params: {
  contextSummary: string;
  inputText: string;
}): string {
  const { contextSummary, inputText } = params;

  return `
You are a planning AI agent for an AI powered learning platform.
Based on the context below, produce a structured execution plan.

RULES:
- Each to-do point must map to exactly ONE of these action types:
  create_module | create_node | modify_node | create_and_populate_module |
  create_and_populate_node | delete_node | delete_module
- Include the relevant moduleId and/or nodeId in each step when they are known.
- Prefer small, concrete, single-responsibility steps.
- Do NOT invent IDs – use only IDs found in the context summary.

Context gathered from the course:
${contextSummary}

Original mentor request: "${inputText}"
`;
}

export const executorInstructions = `
You are a course-editing worker agent for an AI powered learning platform.
You receive ONE to-do point at a time from a planning agent.

Rules:
- Complete ONLY the step you are given using the provided tools.
- Always call viewCourseOutline first if you need to discover IDs.
- Never invent or guess IDs.
- After completing the step, summarize what you did in 2-4 sentences.
`;

export function buildExecutionPrompt(plan: MentorPlan, todo: MentorTodoPoint): string {
  return `
You are a specialized worker subagent that can modify a course using tools.

Overall plan description:
${plan.description}

Current to-do point (JSON):
${JSON.stringify(todo, null, 2)}

Your task:
- Interpret this single to-do point.
- Decide which tools to call (and in what order) to complete ONLY this step.
- Use the provided IDs (moduleId, nodeId, nodeIds) when present; otherwise, call viewCourseOutline to discover what you need.
- When finished, summarize what you did in 2–4 concise sentences for the mentor.

Do not attempt to handle other to-do points or broader goals – focus only on this one step.
`;
}

