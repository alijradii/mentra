"use client";

import { useState, useMemo, useCallback } from "react";
import { SectionPreview } from "@/components/section-preview";
import { Button } from "@/components/ui/button";
import type { NodeDTO, SectionDTO } from "@/lib/api";

interface FocusedLessonPlayerProps {
    node: NodeDTO;
    isLastNode: boolean;
    isNodeDone: boolean;
    onComplete: () => void;
}

function splitIntoPages(sections: SectionDTO[]): SectionDTO[][] {
    const pages: SectionDTO[][] = [];
    let current: SectionDTO[] = [];
    for (const section of sections) {
        if (section.type === "page-break") {
            pages.push(current);
            current = [];
        } else {
            current.push(section);
        }
    }
    pages.push(current);
    return pages.filter((p) => p.length > 0);
}

export function FocusedLessonPlayer({
    node,
    isLastNode,
    isNodeDone,
    onComplete,
}: FocusedLessonPlayerProps) {
    const pages = useMemo(() => splitIntoPages(node.sections ?? []), [node.sections]);

    const [currentPage, setCurrentPage] = useState(0);
    const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
    const [showQuizWarning, setShowQuizWarning] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    const handleAnswered = useCallback((sectionId: string) => {
        setAnsweredIds((prev) => {
            const next = new Set(prev);
            next.add(sectionId);
            return next;
        });
        setShowQuizWarning(false);
    }, []);

    const currentSections = pages[currentPage] ?? [];

    const unansweredQuizIds = useMemo(
        () =>
            currentSections
                .filter((s) => s.type === "quiz" && !answeredIds.has(s.id))
                .map((s) => s.id),
        [currentSections, answeredIds]
    );

    const canAdvance = unansweredQuizIds.length === 0;
    const isLastPage = currentPage === pages.length - 1;
    const totalPages = pages.length;

    const handleNextPage = () => {
        if (!canAdvance) {
            setShowQuizWarning(true);
            return;
        }
        setShowQuizWarning(false);
        setCurrentPage((p) => p + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFinish = () => {
        if (!canAdvance) {
            setShowQuizWarning(true);
            return;
        }
        if (isNodeDone) {
            // Already done — skip celebration, just go back
            onComplete();
        } else {
            setShowCompletion(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Completion celebration screen
    if (showCompletion) {
        return (
            <CompletionScreen
                nodeTitle={node.title}
                isLastNode={isLastNode}
                onBackToMap={onComplete}
            />
        );
    }

    if ((node.sections?.length ?? 0) === 0) {
        return (
            <div className="space-y-8">
                <p className="text-muted-foreground/80 italic text-sm">
                    This lesson has no content yet.
                </p>
                <div className="pt-6 border-t flex justify-end">
                    <Button onClick={handleFinish}>Finish</Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Page progress bar */}
            {totalPages > 1 && (
                <div className="flex items-center gap-2 mb-8">
                    {pages.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                                i < currentPage
                                    ? "bg-primary"
                                    : i === currentPage
                                      ? "bg-primary/60"
                                      : "bg-muted"
                            }`}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1 shrink-0">
                        {currentPage + 1} / {totalPages}
                    </span>
                </div>
            )}

            {/* Sections */}
            <div className="space-y-8">
                {currentSections.map((section) => (
                    <div key={section.id}>
                        <SectionPreview section={section} onAnswered={handleAnswered} />
                    </div>
                ))}
            </div>

            {/* Footer navigation */}
            <div className="mt-10 pt-6 border-t">
                {showQuizWarning && (
                    <p className="text-sm text-destructive mb-3">
                        Please answer all questions on this page before continuing.
                    </p>
                )}
                <div className="flex justify-end">
                    {!isLastPage ? (
                        <Button
                            onClick={handleNextPage}
                            variant={canAdvance ? "default" : "outline"}
                            className={!canAdvance ? "text-muted-foreground border-border cursor-not-allowed" : ""}
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            variant={canAdvance ? "default" : "outline"}
                            className={!canAdvance ? "text-muted-foreground border-border cursor-not-allowed" : ""}
                        >
                            {isNodeDone ? "Back to map" : "Finish"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({
    nodeTitle,
    isLastNode,
    onBackToMap,
}: {
    nodeTitle: string;
    isLastNode: boolean;
    onBackToMap: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 animate-in fade-in zoom-in-95 duration-500">
            {/* Icon burst */}
            <div className="relative flex items-center justify-center mb-10">
                {/* Glow backdrop */}
                <div className="absolute w-40 h-40 rounded-full bg-yellow-400/15 blur-2xl" />

                {/* Orbiting dots */}
                <OrbitDot angle={-60} radius={62} size={10} opacity={0.9} delay={0} />
                <OrbitDot angle={0} radius={68} size={7} opacity={0.7} delay={80} />
                <OrbitDot angle={55} radius={60} size={12} opacity={0.85} delay={160} />
                <OrbitDot angle={120} radius={65} size={8} opacity={0.6} delay={240} />
                <OrbitDot angle={185} radius={58} size={11} opacity={0.8} delay={320} />
                <OrbitDot angle={250} radius={64} size={6} opacity={0.65} delay={400} />

                {/* Main circle */}
                <div className="relative z-10 w-28 h-28 rounded-full bg-linear-to-br from-yellow-300 to-amber-500 shadow-2xl shadow-yellow-500/40 flex items-center justify-center ring-4 ring-yellow-400/20 ring-offset-4 ring-offset-background">
                    <StarIcon className="w-14 h-14 text-white fill-white drop-shadow" />
                </div>
            </div>

            {/* Text */}
            <h2 className="text-3xl font-bold tracking-tight mb-2">
                {isLastNode ? "Course complete!" : "Level complete!"}
            </h2>
            <p className="text-muted-foreground text-base mb-1">{nodeTitle}</p>
            <p className="text-sm text-muted-foreground/60 mb-10">
                {isLastNode
                    ? "You've finished every lesson in this course."
                    : "Great work — keep the streak going!"}
            </p>

            {/* CTA */}
            <Button size="lg" onClick={onBackToMap} variant="outline" className="gap-2 px-8">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to map
            </Button>
        </div>
    );
}

function OrbitDot({
    angle,
    radius,
    size,
    opacity,
    delay,
}: {
    angle: number;
    radius: number;
    size: number;
    opacity: number;
    delay: number;
}) {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    return (
        <div
            className="absolute rounded-full bg-yellow-400 animate-in zoom-in-0 fade-in duration-500"
            style={{
                width: size,
                height: size,
                transform: `translate(${x}px, ${y}px)`,
                opacity,
                animationDelay: `${delay}ms`,
            }}
        />
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}
