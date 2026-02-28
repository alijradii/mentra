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
}