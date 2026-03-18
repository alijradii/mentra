import { Output, ToolLoopAgent, generateText, stepCountIs } from "ai";
import type {
  ChatMessagePayload,
  CourseWSActor,
} from "shared";
import { reasoningModel } from "../models";
import { mentorPlanSchema } from "./plan";
import { buildContextPrompt, buildExecutionPrompt, buildPlanningPrompt, executorInstructions } from "./prompts";
import {
  createAndPopulateModuleTool,
  createAndPopulateNodeTool,
  appendToNodeTool,
  editNodeSectionTool,
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

/** Extract total token count from SDK usage (usage or totalUsage). */
function tokensFromUsage(
  u: { totalTokens?: number; inputTokens?: number; outputTokens?: number } | undefined
): number {
  if (!u) return 0;
  if (typeof u.totalTokens === "number") return u.totalTokens;
  return (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
}

export type MentorAIActionHandler = (ctx: MentorAIActionContext) => void | Promise<void>;

export type HandleMessageResult = { totalTokens: number } | void;

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

  /**
   * Low-level helper to send a typed AI chat payload to all mentors
   * in the course room.
   */
  private sendAiMessage(courseId: string, payload: ChatMessagePayload): void {
    this.transport.broadcastToCourse(
      courseId,
      "chat:message",
      payload,
      undefined,
      AI_ACTOR
    );
  }

  /**
   * Convenience helper for status/log-style messages coming from the
   * mentor assistant and its tools. These are rendered separately
   * from normal chat bubbles on the frontend.
   */
  private sendStatus(courseId: string, text: string, phase?: ChatMessagePayload["phase"]): void {
    this.sendAiMessage(courseId, {
      text,
      kind: "ai-log",
      phase,
    });
  }

  private registerBuiltInActions() {
    this.registerAction("lockedits", (ctx) => {
      this.setEditsLocked(ctx.courseId, true);
      this.sendStatus(ctx.courseId, "Done");
    });
    this.registerAction("unlockedits", (ctx) => {
      this.setEditsLocked(ctx.courseId, false);
      this.sendStatus(ctx.courseId, "Done");
    });
  }

  /**
   * Register an action that can be triggered by a command.
   * The name is stored as-is; the user must send exactly this name (or "/" + name) to run it.
   */
  registerAction(name: string, handler: MentorAIActionHandler): void {
    this.actions.set(name, handler);
  }

  async handleMessage(courseId: string, inputText: string, actor?: CourseWSActor): Promise<HandleMessageResult> {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("/")) {
      await this.handleCommand(courseId, inputText, actor);
      return;
    }

    let totalTokens = 0;
    const ctx: MentorAIActionContext = {
      courseId,
      actor,
      sendChat: (text) => this.sendStatus(courseId, text),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked),
      setChatLocked: (locked) => this.setChatLocked(courseId, locked),
      broadcastToCourse: (type, payload, excludeSocket, actorOverride) =>
        this.transport.broadcastToCourse(courseId, type, payload, excludeSocket, actorOverride ?? AI_ACTOR),
    };

    ctx.setEditsLocked(true);

    try {
      // ── Phase 1: Context gathering ──────────────────────────────────────────
      // Use generateText with read-only tools so the planner can inspect the
      // course freely. We deliberately do NOT request a structured output here
      // because mixing tools + Output.object in generateText causes
      // AI_NoOutputGeneratedError with Gemini models.
      this.sendStatus(courseId, "🔍 Gathering course context...", "context");

      const contextPrompt = buildContextPrompt({ courseId, inputText, actor });

      const contextResult = await generateText({
        model: reasoningModel,
        prompt: contextPrompt,
        tools: {
          viewCourseOutline: getCourseOutlineTool(ctx),
          viewNodeContent: getNodeContentTool(ctx),
        },
        stopWhen: stepCountIs(8),
      });
      totalTokens += tokensFromUsage(contextResult.totalUsage ?? contextResult.usage);
      const contextSummary = contextResult.text;

      this.sendStatus(courseId, "📋 Context gathered. Building execution plan...", "context");

      // ── Phase 2: Plan generation ────────────────────────────────────────────
      // Use generateObject (no tools) with the gathered context to produce a
      // structured MentorPlan. generateObject is purpose-built for structured
      // output and does not suffer from the tool/output conflict.
      const planningPrompt = buildPlanningPrompt({ contextSummary, inputText });

      const planResult = await generateText({
        model: reasoningModel,
        prompt: planningPrompt,
        output: Output.object({
          schema: mentorPlanSchema,
        })
      });
      totalTokens += tokensFromUsage(planResult.totalUsage ?? planResult.usage);
      const plan = planResult.output;

      ctx.broadcastToCourse("ai:plan", { todoPoints: plan.todoPoints });
      this.sendStatus(
        courseId,
        `✅ Plan ready – ${plan.todoPoints.length} step(s) to execute.`,
        "planning",
      );

      // ── Phase 3: Execution ──────────────────────────────────────────────────
      // A ToolLoopAgent executes each to-do point in isolation. Each run gets
      // a fresh context window containing only the plan description and the
      // current step.
      const executorAgent = new ToolLoopAgent({
        model: reasoningModel,
        instructions: executorInstructions,
        tools: {
          viewCourseOutline: getCourseOutlineTool(ctx),
          viewNodeContent: getNodeContentTool(ctx),
          editNodeSections: editNodeSectionsTool(ctx),
          appendToNode: appendToNodeTool(ctx),
          editNodeSection: editNodeSectionTool(ctx),
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

        this.sendStatus(courseId, `⚙️ Starting ${stepLabel}`, "execution");

        try {
          const result = await executorAgent.generate({
            prompt: buildExecutionPrompt(plan, todo),
          });
          totalTokens += tokensFromUsage(result.totalUsage ?? result.usage);
          this.sendStatus(courseId, `✅ Completed ${stepLabel}\n${result.text}`, "execution");
        } catch (stepErr) {
          const msg = stepErr instanceof Error ? stepErr.message : String(stepErr);
          this.sendStatus(courseId, `❌ Failed ${stepLabel}\nError: ${msg}`, "execution");
          // Continue with remaining steps rather than aborting the whole plan.
        }
      }

      this.sendStatus(courseId, "🎉 All steps have been processed.", "summary");
      ctx.setEditsLocked(false);
      return { totalTokens };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.sendStatus(courseId, `❌ Mentor assistant encountered an error: ${msg}`, "summary");
    }

    ctx.setEditsLocked(false);
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
      sendChat: (text) => this.sendStatus(courseId, text),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked),
      setChatLocked: (locked) => this.setChatLocked(courseId, locked),
      broadcastToCourse: (type, payload, excludeSocket, actorOverride) =>
        this.transport.broadcastToCourse(courseId, type, payload, excludeSocket, actorOverride ?? AI_ACTOR),
    };

    await Promise.resolve(handler(ctx));
  }

  private sendChat(courseId: string, text: string): void {
    // Backwards-compatible helper; currently delegates to status-style
    // messages so that all mentor AI output can be rendered in the
    // dedicated activity log UI.
    this.sendStatus(courseId, text);
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

  private setChatLocked(courseId: string, locked: boolean): void {
    this.transport.broadcastToCourse(
      courseId,
      "ai:chat_locked",
      { locked },
      undefined,
      AI_ACTOR
    );
  }

}
