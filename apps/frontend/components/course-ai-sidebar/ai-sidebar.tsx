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
import type { ChatMessagePayload, CourseWSEvent } from "shared";

export const SIDEBAR_WIDTH = 440;

interface ChatMessage {
    id: string;
    text: string;
    actorId: string;
    actorName: string;
    timestamp: string;
    isOwn: boolean;
}

interface PlanStepState {
    index: number;
    action: string;
    content: string;
    explanation?: string;
    contextNotes?: string;
    done?: boolean;
    failed?: boolean;
}

type ActivityEntry =
    | {
          id: string;
          type: "log";
          text: string;
          inProgress?: boolean;
      }
    | {
          id: string;
          type: "plan";
          steps: PlanStepState[];
      };

export function AiSidebar() {
    const { user } = useAuth();
    const { sendChat, on, connected, chatLocked } = useCourseWS();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
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
            const payload = event.payload as ChatMessagePayload | { text: string } | null;
            const text = typeof (payload as any)?.text === "string" ? (payload as any).text : "";
            if (!text) return;

            const kind: ChatMessagePayload["kind"] =
                (payload as ChatMessagePayload | null)?.kind ??
                (event.actor.id === user?.id ? "user" : "assistant");

            // AI log-style messages are funneled into a single activity box
            // instead of individual chat bubbles.
            if (kind === "ai-log") {
                const isStart = text.startsWith("⚙️ Starting ");
                const isDone =
                    text.startsWith("✅ Completed ") ||
                    text.startsWith("❌ Failed ") ||
                    text.startsWith("🎉 All steps have been processed.") ||
                    text.startsWith("❌ Mentor assistant encountered an error");

                // Try to extract the step index from completion/failure messages so
                // we can mark the corresponding plan step as done, similar to Cursor.
                let completedIndex: number | null = null;
                if (text.startsWith("✅ Completed ") || text.startsWith("❌ Failed ")) {
                    const match = text.match(/^(?:✅ Completed|❌ Failed) Step (\d+)\//);
                    if (match) {
                        completedIndex = Number(match[1]);
                    }
                }

                setActivityEntries(prev => {
                    const next: ActivityEntry[] = prev.map(entry => {
                        // Clear any previous in-progress marker when a new step starts or when we complete/fail.
                        if (entry.type === "log" && (isStart || isDone)) {
                            return { ...entry, inProgress: false };
                        }
                        // Mark completed/failed steps on the latest plan entry.
                        if (entry.type === "plan" && completedIndex != null) {
                            return {
                                ...entry,
                                steps: entry.steps.map(step =>
                                    step.index === completedIndex
                                        ? {
                                              ...step,
                                              done: text.startsWith("✅ Completed "),
                                              failed: text.startsWith("❌ Failed "),
                                          }
                                        : step,
                                ),
                            };
                        }
                        return entry;
                    });

                    next.push({
                        id: `log-${event.timestamp}-${nextIdRef.current++}`,
                        type: "log",
                        text,
                        inProgress: isStart,
                    });

                    return next;
                });
                return;
            }

            // Plan-specific messages are handled via a dedicated `ai:plan`
            // event; if any slip through here, treat them as assistant chat.
            setMessages(prev =>
                prev.concat({
                    id: `msg-${event.timestamp}-${nextIdRef.current++}`,
                    text,
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
        const unsub = on("ai:plan", (event: CourseWSEvent) => {
            if (event.type !== "ai:plan") return;
            const payload = event.payload as {
                todoPoints?: { action: string; content: string; explanation?: string; contextNotes?: string }[];
            };
            if (!payload || !Array.isArray(payload.todoPoints)) return;
            setActivityEntries(prev =>
                prev.concat({
                    id: `plan-${event.timestamp}-${nextIdRef.current++}`,
                    type: "plan",
                    steps: payload.todoPoints!.map((p, idx) => ({
                        index: idx + 1,
                        action: p.action,
                        content: p.content,
                        explanation: p.explanation,
                        contextNotes: p.contextNotes,
                    })),
                }),
            );
        });
        return unsub;
    }, [on]);

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
        // Start a fresh run: clear previous plan and activity log
        setActivityEntries([]);
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
                    {/* Messages + AI plan + activity log */}
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
                            {activityEntries.length > 0 && (
                                <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground space-y-3">
                                    {/* Header + loading indicator */}
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            Mentor AI activity
                                        </span>
                                        {activityEntries.some(e => e.type === "log" && e.inProgress) && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                <span>Working…</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skeleton-style loading shimmer while a step is in progress */}
                                    {activityEntries.some(e => e.type === "log" && e.inProgress) && (
                                        <div className="space-y-1.5">
                                            <div className="h-1.5 w-3/4 rounded bg-muted-foreground/10 animate-pulse" />
                                            <div className="h-1.5 w-1/2 rounded bg-muted-foreground/10 animate-pulse" />
                                        </div>
                                    )}

                                    {/* Entries rendered in chronological order:
                                        - plan entries show the execution plan with per-step completion
                                        - log entries show raw status lines
                                     */}
                                    <div className="space-y-2">
                                        {activityEntries.map(entry => {
                                            if (entry.type === "plan") {
                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className="rounded-md border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-3 py-2 space-y-1.5"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                                                                <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                                                                    Execution plan
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ol className="mt-1 space-y-1.5 text-[11px] text-muted-foreground">
                                                            {entry.steps.map(step => (
                                                                <li key={step.index} className="flex items-start gap-2">
                                                                    <span
                                                                        className={cn(
                                                                            "mt-0.5 h-4 w-4 shrink-0 rounded-full text-[10px] font-semibold flex items-center justify-center",
                                                                            step.done
                                                                                ? "bg-emerald-500 text-white"
                                                                                : step.failed
                                                                                ? "bg-destructive text-destructive-foreground"
                                                                                : "bg-primary/10 text-primary",
                                                                        )}
                                                                    >
                                                                        {step.done ? "✓" : step.failed ? "!" : step.index}
                                                                    </span>
                                                                    <div className="flex-1 space-y-0.5">
                                                                        <div className="flex flex-wrap items-center gap-1">
                                                                            <span className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary uppercase tracking-wide">
                                                                                {step.action}
                                                                            </span>
                                                                            <span className="text-[11px] text-foreground">
                                                                                {step.content}
                                                                            </span>
                                                                        </div>
                                                                        {step.explanation && (
                                                                            <div className="text-[10px] text-muted-foreground/90">
                                                                                {step.explanation}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                );
                                            }

                                            // Log entry
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className={cn(
                                                        "whitespace-pre-wrap font-mono text-[11px]",
                                                        entry.inProgress
                                                            ? "border-l-2 border-primary pl-2 text-foreground"
                                                            : "pl-1",
                                                    )}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="flex-1">{entry.text}</span>
                                                        {entry.inProgress && (
                                                            <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">
                                                                Running…
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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
              disabled={!connected || chatLocked}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="absolute right-2 bottom-2 h-8 w-8 rounded-full shrink-0 shadow-sm"
              disabled={!connected || chatLocked || !input.trim()}
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
