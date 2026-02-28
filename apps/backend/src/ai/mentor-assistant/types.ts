import type {
    CourseWSActor,
    CourseWSEventName,
} from "shared";

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
    sendChat(text: string): void;
    setEditsLocked(locked: boolean): void;
    /** Broadcast a course WS event to all clients in the current course room (for real-time updates). */
    broadcastToCourse(
        type: CourseWSEventName,
        payload: unknown,
        excludeSocket?: unknown,
        actor?: CourseWSActor
    ): void;
}