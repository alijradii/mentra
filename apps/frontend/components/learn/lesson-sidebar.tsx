"use client";

import { ProgressBar } from "@/components/shared/progress-bar";
import type { CourseDTO, EnrollmentDTO, ModuleDTO, NodeDTO } from "@/lib/api";
import Link from "next/link";
import type { FlatNode } from "./types";

interface LessonSidebarProps {
    course: CourseDTO | null;
    courseId: string;
    modules: ModuleDTO[];
    nodesByModule: Record<string, NodeDTO[]>;
    enrollment: EnrollmentDTO | null;
    currentNodeId: string;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (node: FlatNode) => void;
}

export function LessonSidebar({
    course,
    courseId,
    modules,
    nodesByModule,
    enrollment,
    currentNodeId,
    isOpen,
    onClose,
    onNavigate,
}: LessonSidebarProps) {
    const completedNodes = new Set(enrollment?.progress.completedNodes ?? []);

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-background/70 z-20 lg:hidden" onClick={onClose} />}

            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
          w-72 shrink-0 bg-card border-r flex flex-col
          transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
                style={{ top: "64px" }}
            >
                <div className="px-4 py-3 border-b shrink-0">
                    <Link
                        href={`/dashboard/learn/${courseId}`}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {course?.title ?? "Course"}
                    </Link>
                    {enrollment && (
                        <div className="mt-2 space-y-0.5">
                            <ProgressBar value={enrollment.progress.overallPercentage} size="sm" />
                            <p className="text-xs text-muted-foreground/80">
                                {enrollment.progress.overallPercentage}% complete
                            </p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto py-2">
                    {modules.map((mod, mi) => {
                        const nodes = nodesByModule[mod._id] ?? [];
                        return (
                            <div key={mod._id}>
                                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                                    {mi + 1}. {mod.title}
                                </p>
                                <ul>
                                    {nodes.map(n => {
                                        const active = n._id === currentNodeId;
                                        const done = completedNodes.has(n._id);
                                        return (
                                            <li key={n._id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onNavigate({
                                                            moduleId: mod._id,
                                                            moduleTitle: mod.title,
                                                            moduleIdx: mi,
                                                            nodeId: n._id,
                                                            nodeTitle: n.title,
                                                            nodeIdx: 0,
                                                        })
                                                    }
                                                    className={`w-full text-left flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                                        active
                                                            ? "bg-muted text-muted-foreground"
                                                            : "text-foreground hover:bg-background"
                                                    }`}
                                                >
                                                    {done ? (
                                                        <svg
                                                            className={`w-3.5 h-3.5 shrink-0 ${active ? "text-success/80" : "text-success"}`}
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <span className="w-3.5 h-3.5 shrink-0 rounded-full border-2 border-border" />
                                                    )}
                                                    <span className="truncate">{n.title}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
