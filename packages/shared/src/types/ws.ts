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
  | "presence:left";

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

export type WSClientMessage = WSClientJoinMessage | WSClientLeaveMessage;

/** Server → client: current presence list after join */
export interface WSPresenceListMessage {
  type: "presence:list";
  courseId: string;
  users: CourseWSActor[];
}

export type WSServerMessage = CourseWSEvent | WSPresenceListMessage;
