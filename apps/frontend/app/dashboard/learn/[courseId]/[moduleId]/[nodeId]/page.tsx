"use client";

import { FocusedLessonPlayer } from "@/components/learn/focused-lesson-player";
import { LessonNavigation } from "@/components/learn/lesson-navigation";
import { LessonPlayer } from "@/components/learn/lesson-player";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { PracticePlayer } from "@/components/learn/practice-player";
import { QuizPlayer } from "@/components/learn/quiz-player";
import type { FlatNode } from "@/components/learn/types";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
    ApiError,
    coursesApi,
    enrollmentApi,
    modulesApi,
    nodesApi,
    type CourseDTO,
    type EnrollmentDTO,
    type ModuleDTO,
    type NodeDTO,
} from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LessonPlayerPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const isFocused = searchParams?.get("focused") === "true";
    const courseId = params?.courseId as string;
    const moduleId = params?.moduleId as string;
    const nodeId = params?.nodeId as string;

    const [course, setCourse] = useState<CourseDTO | null>(null);
    const [node, setNode] = useState<NodeDTO | null>(null);
    const [flatList, setFlatList] = useState<FlatNode[]>([]);
    const [modules, setModules] = useState<ModuleDTO[]>([]);
    const [nodesByModule, setNodesByModule] = useState<Record<string, NodeDTO[]>>({});
    const [enrollment, setEnrollment] = useState<EnrollmentDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [marking, setMarking] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    const nodeType = node?.type ?? "lesson";
    const completedNodes = new Set(enrollment?.progress.completedNodes ?? []);
    const isDone = completedNodes.has(nodeId);

    const currentIdx = flatList.findIndex(n => n.nodeId === nodeId);
    const prevNode = currentIdx > 0 ? flatList[currentIdx - 1] : null;
    const nextNode = currentIdx < flatList.length - 1 ? flatList[currentIdx + 1] : null;

    useEffect(() => {
        if (!token || !courseId || !nodeId) return;
        let cancelled = false;
        setLoading(true);
        setError("");

        Promise.all([
            coursesApi.getById(token, courseId),
            nodesApi.getById(token, nodeId),
            modulesApi.list(token, courseId),
            enrollmentApi.getMyEnrollment(token, courseId).catch(() => null),
        ])
            .then(async ([courseRes, nodeRes, modulesRes, enrollmentRes]) => {
                if (cancelled) return;
                setCourse(courseRes.data);
                setNode(nodeRes.data);
                const mods = modulesRes.data;
                setModules(mods);
                if (enrollmentRes) setEnrollment(enrollmentRes.data);

                const nodeResults = await Promise.all(mods.map(m => nodesApi.list(token, m._id)));
                if (cancelled) return;

                const map: Record<string, NodeDTO[]> = {};
                const flat: FlatNode[] = [];
                mods.forEach((m, mi) => {
                    map[m._id] = nodeResults[mi].data;
                    nodeResults[mi].data.forEach((n, ni) => {
                        flat.push({
                            moduleId: m._id,
                            moduleTitle: m.title,
                            moduleIdx: mi,
                            nodeId: n._id,
                            nodeTitle: n.title,
                            nodeIdx: ni,
                        });
                    });
                });
                setNodesByModule(map);
                setFlatList(flat);
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err instanceof ApiError ? err.message : "Failed to load lesson");
                    if (err instanceof ApiError && err.status === 403) {
                        router.replace(`/dashboard/learn/${courseId}`);
                    }
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, courseId, nodeId, router]);

    const handleMarkComplete = useCallback(async () => {
        if (!token || isDone || marking) return;
        setMarking(true);
        try {
            const res = await enrollmentApi.updateProgress(token, courseId, nodeId);
            setEnrollment(res.data);
        } catch {
            // silently ignore
        } finally {
            setMarking(false);
        }
    }, [token, courseId, nodeId, isDone, marking]);

    const navigateTo = (n: FlatNode) => {
        setSidebarOpen(false);
        router.push(`/dashboard/learn/${courseId}/${n.moduleId}/${n.nodeId}`);
    };

    // Focused mode: mark complete then return to the map
    const handleFocusedComplete = useCallback(async () => {
        if (!token || marking) return;
        if (!isDone) {
            setMarking(true);
            try {
                const res = await enrollmentApi.updateProgress(token, courseId, nodeId);
                setEnrollment(res.data);
            } catch {
                // silently ignore
            } finally {
                setMarking(false);
            }
        }
        router.push(`/dashboard/learn/${courseId}`);
    }, [token, courseId, nodeId, isDone, marking, router]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex h-full min-h-0 items-center justify-center">
                <p className="text-muted-foreground">Loading…</p>
            </div>
        );
    }

    // ─── Focused mode ────────────────────────────────────────────────────────────
    if (isFocused) {
        const pct = enrollment?.progress.overallPercentage ?? 0;
        return (
            <div className="flex flex-col h-full min-h-0">
                {/* Focused header */}
                <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
                    {isDone ? (
                        <Link
                            href={`/dashboard/learn/${courseId}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Map
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowQuitConfirm(true)}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Map
                        </button>
                    )}

                    <div className="w-px h-4 bg-border shrink-0" />

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{node?.title}</p>
                        {node?.description && (
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">{node.description}</p>
                        )}
                    </div>

                    {enrollment && (
                        <div className="shrink-0 hidden sm:flex items-center gap-2">
                            <div className="w-20">
                                <ProgressBar value={pct} size="sm" />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                    )}

                    {isDone && (
                        <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-lg border border-success/20">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Done
                        </span>
                    )}
                </header>

                {/* Content: fills remaining height so footer stays at bottom; scroll is inside player */}
                <main className="flex-1 flex flex-col min-h-0">
                    {error && (
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 shrink-0">
                            <div className="p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-0 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
                        {/* Node type badge for non-lesson types */}
                        {nodeType !== "lesson" && (
                            <div className="mb-6">
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                        nodeType === "practice"
                                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    }`}
                                >
                                    {nodeType === "practice" ? "Practice" : "Quiz"}
                                </span>
                            </div>
                        )}

                        {nodeType === "lesson" && node ? (
                            <FocusedLessonPlayer
                                node={node}
                                isLastNode={!nextNode}
                                isNodeDone={isDone}
                                onComplete={handleFocusedComplete}
                            />
                        ) : nodeType === "practice" && node && token ? (
                            <PracticePlayer node={node} courseId={courseId} token={token} isFocused />
                        ) : nodeType === "quiz" && node && token ? (
                            <QuizPlayer node={node} courseId={courseId} token={token} isFocused />
                        ) : null}
                    </div>
                </main>

                {/* Quit confirmation: lose progress if they leave without finishing */}
                {showQuitConfirm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        onClick={() => setShowQuitConfirm(false)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="quit-dialog-title"
                    >
                        <div
                            className="bg-card border rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 id="quit-dialog-title" className="text-lg font-semibold text-foreground mb-2">
                                Leave lesson?
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                You will lose your progress if you quit. Are you sure you want to go back to the map?
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowQuitConfirm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        setShowQuitConfirm(false);
                                        router.push(`/dashboard/learn/${courseId}`);
                                    }}
                                >
                                    Quit
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── Standard mode ────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            <LessonSidebar
                course={course}
                courseId={courseId}
                modules={modules}
                nodesByModule={nodesByModule}
                enrollment={enrollment}
                currentNodeId={nodeId}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onNavigate={navigateTo}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                        Course outline
                    </button>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
                    )}

                    <div className="mb-8">
                        <div className="rounded-lg border bg-muted/40 px-4 py-3.5 mb-4">
                            <dl className="space-y-1.5 text-sm">
                                <div>
                                    <dd className="text-foreground font-semibold mt-0.5">{node?.title}</dd>
                                </div>
                                {node?.description && (
                                    <div>
                                        <dt className="text-xs text-muted-foreground/80 font-medium">Description</dt>
                                        <dd className="text-muted-foreground mt-0.5">{node.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                        {nodeType !== "lesson" && (
                            <span
                                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${nodeType === "practice" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}
                            >
                                {nodeType === "practice" ? "Practice" : "Quiz"}
                            </span>
                        )}
                    </div>

                    {nodeType === "practice" && node && token ? (
                        <PracticePlayer node={node} courseId={courseId} token={token} />
                    ) : nodeType === "quiz" && node && token ? (
                        <QuizPlayer node={node} courseId={courseId} token={token} />
                    ) : node ? (
                        <LessonPlayer node={node} />
                    ) : null}

                    <LessonNavigation
                        courseId={courseId}
                        enrollment={enrollment}
                        isDone={isDone}
                        marking={marking}
                        prevNode={prevNode}
                        nextNode={nextNode}
                        onMarkComplete={handleMarkComplete}
                        onNavigate={navigateTo}
                    />
                </div>
            </main>
        </div>
    );
}
