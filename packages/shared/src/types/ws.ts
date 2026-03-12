/**
 * WebSocket event types for real-time course collaboration
 */

export type CourseWSEventName =
  | "course:updated"
  | "module:created"
  | "module:updated"
  | "module:deleted"
  | "modules:reordered"
  | "node:created"
  | "node:updated"
  | "node:deleted"
  | "nodes:reordered"
  | "snapshot:restored"
  | "presence:joined"
  | "presence:left"
  | "chat:message"
  | "ai:edits_locked"
  | "ai:chat_locked"
  | "ai:plan";

/**
 * Optional metadata describing how a chat message should be rendered.
 * Kept intentionally loose so older clients that only read `text` continue to work.
 */
export type ChatMessageKind = "user" | "assistant" | "ai-log" | "ai-plan";

export interface ChatMessagePayload {
  text: string;
  /** High-level origin/kind of the message (user, assistant reply, AI status log, or structured plan). */
  kind?: ChatMessageKind;
  /**
   * Optional phase of the mentor AI run this message belongs to.
   * Useful for grouping logs in the UI.
   */
  phase?: "context" | "planning" | "execution" | "summary";
}

export interface CourseWSActor {
  id: string;
  name: string;
}

export interface CourseWSEvent {
  type: CourseWSEventName;
  courseId: string;
  actor: CourseWSActor;
  payload: unknown;
  timestamp: string;
}

/** Sent by client to join a course editing room */
export interface WSClientJoinMessage {
  type: "join_course";
  courseId: string;
}

/** Sent by client to leave a course editing room */
export interface WSClientLeaveMessage {
  type: "leave_course";
  courseId: string;
}

/** Sent by client to broadcast a chat message to mentors in the same course room (ephemeral, not persisted) */
export interface WSClientChatMessage {
  type: "chat_message";
  text: string;
}

export type WSClientMessage =
  | WSClientJoinMessage
  | WSClientLeaveMessage
  | WSClientChatMessage;

/** Server → client: current presence list after join */
export interface WSPresenceListMessage {
  type: "presence:list";
  courseId: string;
  users: CourseWSActor[];
}

export type WSServerMessage = CourseWSEvent | WSPresenceListMessage;
