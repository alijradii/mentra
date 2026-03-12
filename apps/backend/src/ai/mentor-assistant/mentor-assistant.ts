import { Output, ToolLoopAgent, generateText, stepCountIs } from "ai";
import type {
  CourseWSActor,
} from "shared";
import { reasoningModel } from "../models";
import { mentorPlanSchema } from "./plan";
import {
  createAndPopulateModuleTool,
  createAndPopulateNodeTool,
  createModuleTool,
  createNodeTool,
  deleteModuleTool,
  deleteNodeTool,
  editNodeSectionsTool,
  getCourseOutlineTool,
  getNodeContentTool,
  reorderModulesTool,
  reorderNodesTool,
} from "./tools";
import type { MentorAIActionContext, MentorAITransport } from "./types";

const AI_ACTOR: CourseWSActor = { id: "ai-mentor", name: "AI Assistant" };


export type MentorAIActionHandler = (ctx: MentorAIActionContext) => void | Promise<void>;

/**
 * Mentor AI assistant: receives messages, runs registered actions (e.g. lockedits, unlockedits),
 * and can send chat messages and control edits-locked state. Built to scale with more actions later.
 */
export class MentorAIAssistant {
  private transport: MentorAITransport;
  private actions = new Map<string, MentorAIActionHandler>();

  constructor(transport: MentorAITransport) {
    this.transport = transport;
    this.registerBuiltInActions();
  }

  private registerBuiltInActions() {
    this.registerAction("lockedits", (ctx) => {
      this.setEditsLocked(ctx.courseId, true);
      this.sendChat(ctx.courseId, "Done");
    });
    this.registerAction("unlockedits", (ctx) => {
      this.setEditsLocked(ctx.courseId, false);
      this.sendChat(ctx.courseId, "Done");
    });
  }

  /**
   * Register an action that can be triggered by a command.
   * The name is stored as-is; the user must send exactly this name (or "/" + name) to run it.
   */
  registerAction(name: string, handler: MentorAIActionHandler): void {
    this.actions.set(name, handler);
  }

  async handleMessage(courseId: string, inputText: string, actor?: CourseWSActor): Promise<void> {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("/")) {
      return this.handleCommand(courseId, inputText, actor);
    }

    const ctx: MentorAIActionContext = {
      courseId,
      actor,
      sendChat: (text) => this.sendChat(courseId, text),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked),
      broadcastToCourse: (type, payload, excludeSocket, actorOverride) =>
        this.transport.broadcastToCourse(courseId, type, payload, excludeSocket, actorOverride ?? AI_ACTOR),
    };

    try {
      // ── Phase 1: Context gathering ──────────────────────────────────────────
      // Use generateText with read-only tools so the planner can inspect the
      // course freely. We deliberately do NOT request a structured output here
      // because mixing tools + Output.object in generateText causes
      // AI_NoOutputGeneratedError with Gemini models.
      ctx.sendChat("🔍 Gathering course context...");

      const contextPrompt = `
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

      const { text: contextSummary } = await generateText({
        model: reasoningModel,
        prompt: contextPrompt,
        tools: {
          viewCourseOutline: getCourseOutlineTool(ctx),
          viewNodeContent: getNodeContentTool(ctx),
        },
        stopWhen: stepCountIs(8),
      });

      ctx.sendChat(`📋 Context gathered. Building execution plan...`);

      // ── Phase 2: Plan generation ────────────────────────────────────────────
      // Use generateObject (no tools) with the gathered context to produce a
      // structured MentorPlan. generateObject is purpose-built for structured
      // output and does not suffer from the tool/output conflict.
      const planningPrompt = `
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

      const { output: plan } = await generateText({
        model: reasoningModel,
        prompt: planningPrompt,
        output: Output.object({
          schema: mentorPlanSchema,
        })
      });

      ctx.sendChat(`✅ Plan ready – ${plan.todoPoints.length} step(s) to execute:`);
      ctx.sendChat(plan.todoPoints.map((p, i) => `${i + 1}. [${p.action}] ${p.content}`).join("\n"));

      // ── Phase 3: Execution ──────────────────────────────────────────────────
      // A ToolLoopAgent executes each to-do point in isolation. Each run gets
      // a fresh context window containing only the plan description and the
      // current step.
      const executorAgent = new ToolLoopAgent({
        model: reasoningModel,
        instructions: `
You are a course-editing worker agent for an AI powered learning platform.
You receive ONE to-do point at a time from a planning agent.

Rules:
- Complete ONLY the step you are given using the provided tools.
- Always call viewCourseOutline first if you need to discover IDs.
- Never invent or guess IDs.
- After completing the step, summarize what you did in 2-4 sentences.
`,
        tools: {
          viewCourseOutline: getCourseOutlineTool(ctx),
          viewNodeContent: getNodeContentTool(ctx),
          editNodeSections: editNodeSectionsTool(ctx),
          createModule: createModuleTool(ctx),
          deleteModule: deleteModuleTool(ctx),
          reorderModules: reorderModulesTool(ctx),
          createNode: createNodeTool(ctx),
          deleteNode: deleteNodeTool(ctx),
          reorderNodes: reorderNodesTool(ctx),
          createAndPopulateModule: createAndPopulateModuleTool(ctx),
          createAndPopulateNode: createAndPopulateNodeTool(ctx),
        },
      });

      for (let i = 0; i < plan.todoPoints.length; i++) {
        const todo = plan.todoPoints[i];
        const stepLabel = `Step ${i + 1}/${plan.todoPoints.length} [${todo.action}]: ${todo.content}`;

        ctx.sendChat(`⚙️ Starting ${stepLabel}`);

        try {
          const result = await executorAgent.generate({
            prompt: this.buildExecutionPrompt(plan.description, todo),
          });

          ctx.sendChat(`✅ Completed ${stepLabel}\n${result.text}`);
        } catch (stepErr) {
          const msg = stepErr instanceof Error ? stepErr.message : String(stepErr);
          ctx.sendChat(`❌ Failed ${stepLabel}\nError: ${msg}`);
          // Continue with remaining steps rather than aborting the whole plan.
        }
      }

      ctx.sendChat("🎉 All steps have been processed.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      ctx.sendChat(`❌ Mentor assistant encountered an error: ${msg}`);
    }
  }

  async handleCommand(courseId: string, text: string, actor?: CourseWSActor): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const command = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    const handler = this.actions.get(command);
    if (!handler) return;

    const ctx: MentorAIActionContext = {
      courseId,
      actor,
      sendChat: (text) => this.sendChat(courseId, text),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked),
      broadcastToCourse: (type, payload, excludeSocket, actorOverride) =>
        this.transport.broadcastToCourse(courseId, type, payload, excludeSocket, actorOverride ?? AI_ACTOR),
    };

    await Promise.resolve(handler(ctx));
  }

  private sendChat(courseId: string, text: string): void {
    this.transport.broadcastToCourse(
      courseId,
      "chat:message",
      { text },
      undefined,
      AI_ACTOR
    );
  }

  private setEditsLocked(courseId: string, locked: boolean): void {
    this.transport.broadcastToCourse(
      courseId,
      "ai:edits_locked",
      { locked },
      undefined,
      AI_ACTOR
    );
  }

  /**
   * Build the natural language prompt for a worker subagent that executes
   * a single to-do point from the overall plan.
   */
  private buildExecutionPrompt(
    planDescription: string,
    todo: {
      content: string;
      nodeIds: string[];
      action: string;
      moduleId?: string;
      nodeId?: string;
      explanation?: string;
      contextNotes?: string;
    }
  ): string {
    return `
You are a specialized worker subagent that can modify a course using tools.

Overall plan description:
${planDescription}

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
}
