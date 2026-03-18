import type { IncomingMessage, Server } from "http";
import type {
  ChatMessagePayload,
  CourseWSActor,
  CourseWSEvent,
  CourseWSEventName,
  WSClientMessage,
  WSPresenceListMessage,
} from "shared";
import { URL } from "url";
import { WebSocket, WebSocketServer } from "ws";
import { MentorAIAssistant } from "../ai/mentor-assistant/mentor-assistant.js";
import { findUserById, getUserCollection, userDocumentToUser } from "../models/user.js";
import { verifyToken } from "../utils/jwt.js";
import { TOKENS_PER_CREDIT } from "../config/ai.js";
import { ensureCreditsFresh } from "../utils/aiCredits";
import { ObjectId } from "mongodb";

interface ConnectedClient {
  ws: WebSocket;
  actor: CourseWSActor;
  courseId: string | null;
}

/** courseId → set of connected clients in that room */
const rooms = new Map<string, Set<ConnectedClient>>();

/** ws instance → client metadata */
const clients = new Map<WebSocket, ConnectedClient>();

function joinRoom(courseId: string, client: ConnectedClient) {
  if (client.courseId && client.courseId !== courseId) {
    leaveRoom(client.courseId, client);
  }

  client.courseId = courseId;
  if (!rooms.has(courseId)) {
    rooms.set(courseId, new Set());
  }
  rooms.get(courseId)!.add(client);

  const presenceList: WSPresenceListMessage = {
    type: "presence:list",
    courseId,
    users: getPresenceList(courseId, client.actor.id),
  };
  safeSend(client.ws, presenceList);

  const alreadyPresent = Array.from(rooms.get(courseId)!).some(
    (c) => c !== client && c.actor.id === client.actor.id
  );
  if (!alreadyPresent) {
    broadcastToCourse(
      courseId,
      "presence:joined",
      { user: client.actor },
      client.ws
    );
  }
}

function leaveRoom(courseId: string, client: ConnectedClient) {
  const room = rooms.get(courseId);
  if (!room) return;
  room.delete(client);

  const sameUserStillPresent = Array.from(room).some(
    (c) => c.actor.id === client.actor.id
  );

  if (room.size === 0) {
    rooms.delete(courseId);
  }
  client.courseId = null;

  if (!sameUserStillPresent) {
    broadcastToCourse(courseId, "presence:left", { user: client.actor });
  }
}

function getPresenceList(courseId: string, excludeActorId?: string): CourseWSActor[] {
  const room = rooms.get(courseId);
  if (!room) return [];
  const seen = new Set<string>();
  const result: CourseWSActor[] = [];
  for (const c of room) {
    if (excludeActorId && c.actor.id === excludeActorId) continue;
    if (seen.has(c.actor.id)) continue;
    seen.add(c.actor.id);
    result.push(c.actor);
  }
  return result;
}

function safeSend(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * Broadcast a course event to all clients in a room.
 * @param excludeSocket - optionally skip this socket (the sender)
 */
export function broadcastToCourse(
  courseId: string,
  type: CourseWSEventName,
  payload: unknown,
  excludeSocket?: WebSocket,
  actor?: CourseWSActor
) {
  const room = rooms.get(courseId);
  if (!room) return;

  const event: CourseWSEvent = {
    type,
    courseId,
    actor: actor ?? { id: "system", name: "System" },
    payload,
    timestamp: new Date().toISOString(),
  };

  const message = JSON.stringify(event);
  for (const client of room) {
    if (excludeSocket && client.ws === excludeSocket) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/** Single mentor AI assistant instance; receives chat messages and can run actions (e.g. lock/unlock edits). */
let mentorAiAssistant: MentorAIAssistant | null = null;

function getMentorAiAssistant(): MentorAIAssistant {
  if (!mentorAiAssistant) {
    mentorAiAssistant = new MentorAIAssistant({
      broadcastToCourse(
        courseId: string,
        type: CourseWSEventName,
        payload: unknown,
        excludeSocket?: WebSocket,
        actor?: CourseWSActor
      ) {
        broadcastToCourse(courseId, type, payload, excludeSocket, actor);
      },
    });
  }
  return mentorAiAssistant;
}

/**
 * Attach the WebSocket server to an existing HTTP server.
 * Clients connect with: ws://<host>/ws?token=<jwt>
 */
export function attachCourseWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (request: IncomingMessage, socket, head) => {
    try {
      const reqUrl = new URL(request.url ?? "", `http://${request.headers.host}`);
      if (reqUrl.pathname !== "/ws") {
        socket.destroy();
        return;
      }

      const token = reqUrl.searchParams.get("token");
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const userDoc = await findUserById(payload.userId);
      if (!userDoc) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const { updatedDoc, changed } = ensureCreditsFresh(userDoc);
      if (changed) {
        await getUserCollection().updateOne(
          { _id: updatedDoc._id },
          {
            $set: {
              aiCredits: updatedDoc.aiCredits,
              aiCreditsLastReset: updatedDoc.aiCreditsLastReset,
            },
          }
        );
      }

      const user = userDocumentToUser(updatedDoc);
      const actor: CourseWSActor = {
        id: user._id,
        name: user.name,
        isPro: user.isPro,
      };

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, actor);
      });
    } catch (err) {
      console.error("[WS] Upgrade error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, _request: IncomingMessage, actor: CourseWSActor) => {
    const client: ConnectedClient = { ws, actor, courseId: null };
    clients.set(ws, client);

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as WSClientMessage;

        if (msg.type === "join_course") {
          joinRoom(msg.courseId, client);
        } else if (msg.type === "leave_course") {
          if (client.courseId) {
            leaveRoom(client.courseId, client);
          }
        } else if (msg.type === "chat_message" && client.courseId) {
          // Fetch latest user doc to enforce AI credits for free users.
          const userId = client.actor.id;
          const baseDoc = await getUserCollection().findOne({
            _id: new ObjectId(userId),
          });
          if (!baseDoc) {
            const denialPayload: ChatMessagePayload = {
              text: "Unable to load your account. Please refresh the page.",
              kind: "assistant",
            };
            const denialEvent: CourseWSEvent = {
              type: "chat:message",
              courseId: client.courseId,
              actor: { id: "system", name: "System" },
              payload: denialPayload,
              timestamp: new Date().toISOString(),
            };
            safeSend(client.ws, denialEvent);
            return;
          }

          const { updatedDoc, changed } = ensureCreditsFresh(baseDoc);
          if (changed) {
            await getUserCollection().updateOne(
              { _id: updatedDoc._id },
              {
                $set: {
                  aiCredits: updatedDoc.aiCredits,
                  aiCreditsLastReset: updatedDoc.aiCreditsLastReset,
                },
              }
            );
          }

          // Pro users are not limited by credits.
          if (updatedDoc.isPro) {
            const payload: ChatMessagePayload = {
              text: msg.text,
              kind: "user",
            };
            broadcastToCourse(
              client.courseId,
              "chat:message",
              payload,
              undefined,
              client.actor
            );
            await getMentorAiAssistant().handleMessage(
              client.courseId,
              msg.text,
              client.actor,
              {
                currentNodeId: msg.currentNodeId,
                currentModuleId: msg.currentModuleId,
              }
            );
            return;
          }

          const currentCredits = updatedDoc.aiCredits ?? 0;
          if (currentCredits <= 0) {
            const denialPayload: ChatMessagePayload = {
              text:
                "You have used all of your free Mentor AI credits for today. " +
                "Your credits will reset at midnight (UTC), or you can upgrade to Pro for unlimited access.",
              kind: "assistant",
            };
            const denialEvent: CourseWSEvent = {
              type: "chat:message",
              courseId: client.courseId,
              actor: { id: "system", name: "System" },
              payload: denialPayload,
              timestamp: new Date().toISOString(),
            };
            safeSend(client.ws, denialEvent);
            return;
          }

          const payload: ChatMessagePayload = {
            text: msg.text,
            kind: "user",
          };
          broadcastToCourse(
            client.courseId,
            "chat:message",
            payload,
            undefined,
            client.actor
          );

          const usageResult = await getMentorAiAssistant().handleMessage(
            client.courseId,
            msg.text,
            client.actor,
            {
              currentNodeId: msg.currentNodeId,
              currentModuleId: msg.currentModuleId,
            }
          );
          const totalTokens = usageResult?.totalTokens ?? 0;
          const creditsToDeduct = totalTokens > 0 ? Math.ceil(totalTokens / TOKENS_PER_CREDIT) : 0;
          const deduct = Math.min(creditsToDeduct, currentCredits);
          let remainingCredits = currentCredits;
          if (deduct > 0) {
            const decrementResult = await getUserCollection().findOneAndUpdate(
              { _id: updatedDoc._id, aiCredits: { $gte: deduct } },
              { $inc: { aiCredits: -deduct } },
              { returnDocument: "after" }
            );
            if (decrementResult) {
              remainingCredits = decrementResult.aiCredits ?? currentCredits - deduct;
            } else {
              const fresh = await getUserCollection().findOne({ _id: updatedDoc._id });
              remainingCredits = fresh?.aiCredits ?? 0;
            }
          }
          const creditsPayload: ChatMessagePayload = {
            text: `You have ${remainingCredits} credits left today.`,
            kind: "assistant",
            remainingCredits,
          };
          const creditsEvent: CourseWSEvent = {
            type: "chat:message",
            courseId: client.courseId,
            actor: { id: "system", name: "System" },
            payload: creditsPayload,
            timestamp: new Date().toISOString(),
          };
          safeSend(client.ws, creditsEvent);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (client.courseId) {
        leaveRoom(client.courseId, client);
      }
      clients.delete(ws);
    });

    ws.on("error", (err) => {
      console.error("[WS] Client error:", err);
    });
  });

  console.log("[WS] Course WebSocket server attached at /ws");
}
