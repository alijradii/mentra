"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseWS } from "@/contexts/CourseWSContext";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CourseWSEvent } from "shared";

export const SIDEBAR_WIDTH = 340;

interface ChatMessage {
    id: string;
    text: string;
    actorId: string;
    actorName: string;
    timestamp: string;
    isOwn: boolean;
}

export function AiSidebar() {
    const { user } = useAuth();
    const { sendChat, on, connected } = useCourseWS();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(true);
    const listEndRef = useRef<HTMLDivElement>(null);
    const nextIdRef = useRef(0);

    const scrollToBottom = useCallback(() => {
        listEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const unsub = on("chat:message", (event: CourseWSEvent) => {
            if (event.type !== "chat:message") return;
            const payload = event.payload as { text: string };
            setMessages(prev =>
                prev.concat({
                    id: `msg-${event.timestamp}-${nextIdRef.current++}`,
                    text: payload.text,
                    actorId: event.actor.id,
                    actorName: event.actor.name,
                    timestamp: event.timestamp,
                    isOwn: event.actor.id === user?.id,
                }),
            );
        });
        return unsub;
    }, [on, user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;
        sendChat(trimmed);
        setInput("");
    };

    if (!user) return null;

    return (
        <aside
            className="flex min-h-full flex-col border-l border-border bg-card text-card-foreground shrink-0 transition-[width] duration-200 overflow-hidden"
            style={{ width: isOpen ? SIDEBAR_WIDTH : 44 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 shrink-0 min-w-0">
                {isOpen ? (
                    <>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold truncate">Agent Tab</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {!connected && (
                                <span className="text-xs text-muted-foreground" title="Reconnecting…">
                                    Offline
                                </span>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close sidebar"
                            >
                                →
                            </Button>
                        </div>
                    </>
                ) : (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 mx-auto"
                        onClick={() => setIsOpen(true)}
                        aria-label="Open sidebar"
                        title="Agent Tab"
                    >
                        ←
                    </Button>
                )}
            </div>

            {isOpen && (
                <>
                    {/* Messages */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6 px-2">
                                    Get AI assistance while editing your course. Ask for help with structure, content,
                                    or ideas.
                                </p>
                            )}
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[90%]",
                                        msg.isOwn ? "self-end items-end" : "self-start items-start",
                                    )}
                                >
                                    {!msg.isOwn && (
                                        <span className="text-xs text-muted-foreground mb-0.5">{msg.actorName}</span>
                                    )}
                                    <div
                                        className={cn(
                                            "rounded-lg px-3 py-2 text-sm wrap-break-word",
                                            msg.isOwn
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground",
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={listEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="border-t border-border p-2 shrink-0">
                            <div className="flex gap-2">
                                <Textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask the agent…"
                                    rows={1}
                                    className="min-h-[40px] max-h-24 resize-none"
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e as unknown as React.FormEvent);
                                        }
                                    }}
                                    disabled={!connected}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="shrink-0 h-10 w-10"
                                    disabled={!connected || !input.trim()}
                                    aria-label="Send message"
                                >
                                    Send
                                </Button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </aside>
    );
}
