"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowUp } from "lucide-react";
import { useCourseWS } from "@/contexts/CourseWSContext";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CourseWSEvent } from "shared";

export const SIDEBAR_WIDTH = 440;

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const MIN_TEXTAREA_HEIGHT = 44;
    const MAX_TEXTAREA_HEIGHT = 200;

    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const height = Math.min(MAX_TEXTAREA_HEIGHT, Math.max(MIN_TEXTAREA_HEIGHT, el.scrollHeight));
        el.style.height = `${height}px`;
    }, []);

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

    useEffect(() => {
        resizeTextarea();
    }, [input, resizeTextarea]);

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
                            <span className="text-sm font-semibold truncate">Mentor AI</span>
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
                        title="Mentor AI Sidebar"
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
                                            "rounded-lg px-3 py-2 text-sm wrap-break-word markdown markdown-chat",
                                            msg.isOwn
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground",
                                        )}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            <div ref={listEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="shrink-0 p-3 pt-0">
                            <div className="relative rounded-xl border border-border bg-muted/50 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card">
                                <Textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask the mentor AI…"
                                    rows={1}
                                    className="min-h-[44px] max-h-[200px] overflow-y-auto resize-none border-0 bg-transparent py-3 pl-4 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                                    onKeyDown={e => {
                                        // Enter = send, Shift+Enter = new line
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
                                    className="absolute right-2 bottom-2 h-8 w-8 rounded-full shrink-0 shadow-sm"
                                    disabled={!connected || !input.trim()}
                                    aria-label="Send message"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="mt-1.5 text-[11px] text-muted-foreground px-0.5">
                                Shift+Enter for new line
                            </p>
                        </form>
                    </div>
                </>
            )}
        </aside>
    );
}
