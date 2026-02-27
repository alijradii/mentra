import type {
  CourseWSEventName,
  CourseWSActor,
} from "shared";

const AI_ACTOR: CourseWSActor = { id: "ai-mentor", name: "AI Assistant" };

export interface MentorAITransport {
  broadcastToCourse(
    courseId: string,
    type: CourseWSEventName,
    payload: unknown,
    excludeSocket?: unknown,
    actor?: CourseWSActor
  ): void;
}

export interface MentorAIActionContext {
  courseId: string;
  actor?: CourseWSActor;
  /** Send a chat message to the course room as the AI assistant */
  sendChat(text: string): void;
  /** Set the edits-locked state and notify the frontend */
  setEditsLocked(locked: boolean): void;
}

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
      ctx.setEditsLocked(true);
      ctx.sendChat("Done");
    });
    this.registerAction("unlockedits", (ctx) => {
      ctx.setEditsLocked(false);
      ctx.sendChat("Done");
    });
  }

  /**
   * Register an action that can be triggered by a command.
   * The name is stored as-is; the user must send exactly this name (or "/" + name) to run it.
   */
  registerAction(name: string, handler: MentorAIActionHandler): void {
    this.actions.set(name, handler);
  }

  /**
   * Handle an incoming message (e.g. from chat). If the message matches a registered action name,
   * runs that action. Commands are matched as "/name" or "name" (exact string match).
   */
  async handleMessage(courseId: string, text: string, actor?: CourseWSActor): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const command = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    const handler = this.actions.get(command);
    if (!handler) return;

    const ctx: MentorAIActionContext = {
      courseId,
      actor,
      sendChat: (msg) => this.sendChat(courseId, msg),
      setEditsLocked: (locked) => this.setEditsLocked(courseId, locked),
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
