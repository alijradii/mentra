import { generateText, stepCountIs } from "ai";
import type {
  CourseWSActor,
} from "shared";
import { reasoningModel } from "../models";
import { getCourseOutlineTool, getNodeContentTool } from "./tools";
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

    this.setEditsLocked(courseId, true);

    const ctx: MentorAIActionContext = {
      courseId,
      actor,
      sendChat: (text) => this.sendChat(courseId, text),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked)
    }

    const prompt = `
    You are a mentor assistant for a learning platform.

    Here is your current context:
    You are viewing the course with the ID: ${courseId}

    The user ${actor?.name} sent you the following message:

    ${inputText}
    `

    const { text } = await generateText({
      model: reasoningModel,
      prompt,
      tools: {
        viewCourseOutline: getCourseOutlineTool(ctx),
        viewNodeContent: getNodeContentTool(ctx)
      },
      stopWhen: stepCountIs(5)
    });

    this.setEditsLocked(courseId, false);
    this.sendChat(courseId, text);
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
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked)
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
}
