"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  CourseWSEvent,
  CourseWSEventName,
  CourseWSActor,
  WSServerMessage,
  WSPresenceListMessage,
} from "shared";

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020")
    .replace(/^http/, "ws") + "/ws";

type EventHandler = (event: CourseWSEvent) => void;

interface CourseWSContextValue {
  /** Other users currently editing this course (excludes current user) */
  presenceList: CourseWSActor[];
  /** Subscribe to a specific event type. Returns an unsubscribe function. */
  on: (eventName: CourseWSEventName, handler: EventHandler) => () => void;
  /** Whether the socket is currently connected */
  connected: boolean;
  /** Send a chat message to all mentors in the course room (ephemeral, not persisted) */
  sendChat: (text: string) => void;
}

const CourseWSContext = createContext<CourseWSContextValue | null>(null);

interface CourseWSProviderProps {
  courseId: string;
  token: string;
  userId: string;
  children: ReactNode;
}

const RECONNECT_DELAY_MS = 3000;

export function CourseWSProvider({ courseId, token, userId, children }: CourseWSProviderProps) {
  const [presenceList, setPresenceList] = useState<CourseWSActor[]>([]);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<CourseWSEventName, Set<EventHandler>>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const dispatchEvent = useCallback((event: CourseWSEvent) => {
    const handlers = handlersRef.current.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event));
    }
  }, []);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close();
        return;
      }
      setConnected(true);
      ws.send(JSON.stringify({ type: "join_course", courseId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSServerMessage;

        if (msg.type === "presence:list") {
          const presenceMsg = msg as WSPresenceListMessage;
          setPresenceList(presenceMsg.users.filter((u) => u.id !== userId));
        } else {
          const wsEvent = msg as CourseWSEvent;
          if (wsEvent.type === "presence:joined") {
            const payload = wsEvent.payload as { user: CourseWSActor };
            if (payload.user.id === userId) return;
            setPresenceList((prev) => {
              if (prev.some((u) => u.id === payload.user.id)) return prev;
              return [...prev, payload.user];
            });
          } else if (wsEvent.type === "presence:left") {
            const payload = wsEvent.payload as { user: CourseWSActor };
            setPresenceList((prev) => prev.filter((u) => u.id !== payload.user.id));
          }
          dispatchEvent(wsEvent);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setPresenceList([]);
      if (!unmountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [courseId, token, userId, dispatchEvent]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const on = useCallback(
    (eventName: CourseWSEventName, handler: EventHandler): (() => void) => {
      if (!handlersRef.current.has(eventName)) {
        handlersRef.current.set(eventName, new Set());
      }
      handlersRef.current.get(eventName)!.add(handler);
      return () => {
        handlersRef.current.get(eventName)?.delete(handler);
      };
    },
    []
  );

  const sendChat = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN && text.trim()) {
      ws.send(JSON.stringify({ type: "chat_message", text: text.trim() }));
    }
  }, []);

  return (
    <CourseWSContext.Provider value={{ presenceList, on, connected, sendChat }}>
      {children}
    </CourseWSContext.Provider>
  );
}

export function useCourseWS(): CourseWSContextValue {
  const ctx = useContext(CourseWSContext);
  if (!ctx) {
    throw new Error("useCourseWS must be used inside CourseWSProvider");
  }
  return ctx;
}
