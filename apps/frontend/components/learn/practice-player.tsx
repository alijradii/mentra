"use client";

import {
    FocusModeFooter,
    FocusModeLayout,
    FocusModePageProgress,
    getQuizSectionIds,
    hasAnswer,
    splitIntoPages,
} from "@/components/learn/focus-mode";
import { SectionPreview } from "@/components/section-preview";
import { MathEnabledText } from "@/components/math/MathEnabledText";
import { Button } from "@/components/ui/button";
import {
    submissionsApi,
    type NodeDTO,
    type NodeSubmissionDTO,
    type QuestionAnswerDTO,
    type SectionDTO,
} from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PracticePlayerProps {
    node: NodeDTO;
    courseId: string;
    token: string;
    isFocused?: boolean;
}

export function PracticePlayer({ node, courseId, token, isFocused = false }: PracticePlayerProps) {
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [submission, setSubmission] = useState<NodeSubmissionDTO | null>(null);
    const [pastAttempts, setPastAttempts] = useState<NodeSubmissionDTO[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const pages = useMemo(() => splitIntoPages(node.sections), [node.sections]);
    const isMultiPage = isFocused && pages.length > 1;
    const isLastPage = currentPage === pages.length - 1;
    const currentSections = isFocused ? (pages[currentPage] ?? []) : node.sections;

    const quizSections = node.sections.filter((s) => s.type === "quiz");
    const currentPageQuizIds = useMemo(() => getQuizSectionIds(currentSections), [currentSections]);
    const canAdvance = useMemo(
        () => currentPageQuizIds.every((id) => hasAnswer(answers[id])),
        [currentPageQuizIds, answers],
    );
    const [showQuizWarning, setShowQuizWarning] = useState(false);

    useEffect(() => {
        submissionsApi
            .getMine(token, node._id)
            .then(res => {
                const released = res.data.filter(s => s.status === "released");
                setPastAttempts(released);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [token, node._id]);

    const handleAnswerChange = (sectionId: string, answer: unknown) => {
        setAnswers((prev) => ({ ...prev, [sectionId]: answer }));
        if (isFocused) setShowQuizWarning(false);
    };

    const handleSubmit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const startRes = await submissionsApi.start(token, node._id, courseId);
            const submissionId = startRes.data._id;

            const answerList: QuestionAnswerDTO[] = quizSections.map(s => ({
                sectionId: s.id,
                answer: answers[s.id] ?? null,
            }));

            const result = await submissionsApi.submit(token, node._id, submissionId, answerList);
            setSubmission(result.data);
            setShowResults(true);
            setPastAttempts(prev => [result.data, ...prev]);
        } catch (err) {
            console.error("Failed to submit practice:", err);
        } finally {
            setSubmitting(false);
        }
    }, [token, node._id, courseId, answers, quizSections, submitting]);

    const handleRetry = () => {
        setAnswers({});
        setSubmission(null);
        setShowResults(false);
        setCurrentPage(0);
    };

    if (loading) {
        return <p className="text-muted-foreground text-sm">Loading...</p>;
    }

    if (showResults && submission) {
        const score = submission.autoScore ?? 0;
        const max = submission.maxScore;
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;

        const resultsContent = (
            <div className="space-y-6">
                <div className="p-4 rounded-lg border bg-card">
                    <h2 className="text-lg font-semibold text-foreground mb-1">Results</h2>
                    <p className="text-2xl font-bold text-foreground">
                        {score} / {max}
                        <span className="text-base font-normal text-muted-foreground ml-2">({pct}%)</span>
                    </p>
                </div>

                <div className="space-y-6">
                    {quizSections.map(section => {
                        const graded = submission.answers.find(a => a.sectionId === section.id);
                        return (
                            <div key={section.id} className="space-y-2">
                                <SectionPreview section={section} />
                                {graded && (
                                    <div
                                        className={`p-3 rounded-lg text-sm ${graded.isCorrect ? "bg-success/15 text-success border border-success/40" : "bg-destructive/15 text-destructive border border-destructive/40"}`}
                                    >
                                        <p className="font-semibold">
                                            {graded.isCorrect ? "Correct" : "Incorrect"} — {graded.autoScore ?? 0}/
                                            {graded.maxScore ?? 0} pts
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <Button onClick={handleRetry}>Try again</Button>
                </div>

                {pastAttempts.length > 1 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Past attempts</h3>
                        <div className="space-y-1">
                            {pastAttempts.map(a => (
                                <div
                                    key={a._id}
                                    className="flex items-center justify-between text-sm px-3 py-2 rounded bg-background border"
                                >
                                    <span>Attempt #{a.attemptNumber}</span>
                                    <span className="font-medium">
                                        {a.autoScore ?? 0}/{a.maxScore}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );

        if (isFocused) {
            return (
                <div className="flex flex-1 flex-col min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {resultsContent}
                    </div>
                </div>
            );
        }
        return resultsContent;
    }

    const canSubmit = quizSections.length > 0 && quizSections.every((s) => hasAnswer(answers[s.id]));

    const handleNextPage = () => {
        if (!canAdvance) {
            setShowQuizWarning(true);
            return;
        }
        setShowQuizWarning(false);
        setCurrentPage((p) => p + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (isFocused) {
        return (
            <FocusModeLayout
                pageProgress={
                    isMultiPage ? (
                        <FocusModePageProgress currentPage={currentPage} totalPages={pages.length} />
                    ) : undefined
                }
                footer={
                    <FocusModeFooter showQuizWarning={showQuizWarning}>
                        {isMultiPage && !isLastPage ? (
                            <Button
                                onClick={handleNextPage}
                                variant={canAdvance ? "default" : "outline"}
                                className={
                                    !canAdvance ? "text-muted-foreground border-border cursor-not-allowed" : ""
                                }
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </Button>
                        ) : quizSections.length > 0 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !canSubmit}
                                className={!canSubmit ? "text-muted-foreground border-border cursor-not-allowed" : ""}
                            >
                                {submitting ? "Submitting..." : "Submit answers"}
                            </Button>
                        ) : null}
                    </FocusModeFooter>
                }
            >
                <div className="space-y-8">
                    {currentSections.map((section) => {
                        if (section.type === "quiz") {
                            return (
                                <PracticeQuizSection
                                    key={section.id}
                                    section={section}
                                    answer={answers[section.id]}
                                    onAnswer={(val) => handleAnswerChange(section.id, val)}
                                />
                            );
                        }
                        return (
                            <div key={section.id}>
                                <SectionPreview section={section} />
                            </div>
                        );
                    })}
                </div>
                {pastAttempts.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Past attempts</h3>
                        <div className="space-y-1">
                            {pastAttempts.map((a) => (
                                <div
                                    key={a._id}
                                    className="flex items-center justify-between text-sm px-3 py-2 rounded bg-background border"
                                >
                                    <span>Attempt #{a.attemptNumber}</span>
                                    <span className="font-medium">
                                        {a.autoScore ?? 0}/{a.maxScore}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </FocusModeLayout>
        );
    }

    return (
        <div className="space-y-8">
            {currentSections.map((section) => {
                if (section.type === "quiz") {
                    return (
                        <PracticeQuizSection
                            key={section.id}
                            section={section}
                            answer={answers[section.id]}
                            onAnswer={(val) => handleAnswerChange(section.id, val)}
                        />
                    );
                }
                return (
                    <div key={section.id}>
                        <SectionPreview section={section} />
                    </div>
                );
            })}

            {quizSections.length > 0 && (
                <div className="pt-4 border-t">
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit answers"}
                    </Button>
                </div>
            )}

            {pastAttempts.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Past attempts</h3>
                    <div className="space-y-1">
                        {pastAttempts.map((a) => (
                            <div
                                key={a._id}
                                className="flex items-center justify-between text-sm px-3 py-2 rounded bg-background border"
                            >
                                <span>Attempt #{a.attemptNumber}</span>
                                <span className="font-medium">
                                    {a.autoScore ?? 0}/{a.maxScore}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Wrapper around a quiz section that captures the student's answer via callback
 * instead of the preview's built-in check.
 */
function PracticeQuizSection({
    section,
    answer,
    onAnswer,
}: {
    section: SectionDTO;
    answer: unknown;
    onAnswer: (val: unknown) => void;
}) {
    if (section.type !== "quiz") return null;
    const quiz = section as any;
    const quizType = quiz.quizType ?? "mcq";

    return (
        <div className="space-y-3">
            <MathEnabledText text={quiz.question} className="font-semibold text-foreground text-base" />
            <InteractiveQuiz quizType={quizType} quiz={quiz} answer={answer} onAnswer={onAnswer} />
        </div>
    );
}

function InteractiveQuiz({
    quizType,
    quiz,
    answer,
    onAnswer,
}: {
    quizType: string;
    quiz: any;
    answer: unknown;
    onAnswer: (val: unknown) => void;
}) {
    switch (quizType) {
        case "mcq":
            return <InteractiveMCQ quiz={quiz} answer={answer} onAnswer={onAnswer} />;
        case "true-false":
            return <InteractiveTrueFalse answer={answer} onAnswer={onAnswer} />;
        case "short-answer":
            return <InteractiveShortAnswer answer={answer} onAnswer={onAnswer} />;
        case "sequence":
            return <InteractiveSequence quiz={quiz} answer={answer} onAnswer={onAnswer} />;
        case "matching":
            return <InteractiveMatching quiz={quiz} answer={answer} onAnswer={onAnswer} />;
        case "fill-blank":
            return <InteractiveFillBlank quiz={quiz} answer={answer} onAnswer={onAnswer} />;
        case "math-input":
            return <InteractiveMathInput answer={answer} onAnswer={onAnswer} />;
        case "classification":
            return <InteractiveClassification quiz={quiz} answer={answer} onAnswer={onAnswer} />;
        default:
            return <p className="text-muted-foreground text-sm italic">Unsupported quiz type.</p>;
    }
}

function InteractiveMCQ({ quiz, answer, onAnswer }: { quiz: any; answer: unknown; onAnswer: (v: unknown) => void }) {
    const selected = (Array.isArray(answer) ? answer : []) as string[];
    const isMultiple = quiz.correctAnswers?.length > 1;

    const toggle = (optId: string) => {
        if (isMultiple) {
            const next = selected.includes(optId)
                ? selected.filter((id: string) => id !== optId)
                : [...selected, optId];
            onAnswer(next);
        } else {
            onAnswer([optId]);
        }
    };

    return (
        <div className="space-y-2">
            {quiz.options?.map((opt: any) => {
                const isSelected = selected.includes(opt.id);
                const cls = isSelected ? "border-primary bg-background" : "border-border bg-card hover:bg-background";
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggle(opt.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm cursor-pointer ${cls}`}
                    >
                        <MathEnabledText text={opt.text} variant="inline" />
                    </button>
                );
            })}
        </div>
    );
}

function InteractiveTrueFalse({ answer, onAnswer }: { answer: unknown; onAnswer: (v: unknown) => void }) {
    return (
        <div className="flex gap-3">
            {[true, false].map(val => (
                <button
                    key={String(val)}
                    type="button"
                    onClick={() => onAnswer(val)}
                    className={`px-6 py-3 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer ${answer === val ? "border-primary bg-background" : "border-border bg-card hover:bg-background"}`}
                >
                    {val ? "True" : "False"}
                </button>
            ))}
        </div>
    );
}

function InteractiveShortAnswer({ answer, onAnswer }: { answer: unknown; onAnswer: (v: unknown) => void }) {
    const v = typeof answer === "string" ? answer : "";
    return (
        <div className="space-y-2">
            <input
                type="text"
                value={v}
                onChange={e => onAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 rounded-lg border bg-card text-sm"
            />
            {v.trim() && (
                <div className="p-3 bg-background border rounded-lg text-center">
                    <MathEnabledText text={v} variant="block" />
                </div>
            )}
        </div>
    );
}

function InteractiveSequence({
    quiz,
    answer,
    onAnswer,
}: {
    quiz: any;
    answer: unknown;
    onAnswer: (v: unknown) => void;
}) {
    const items = quiz.items ?? [];
    const currentOrder = (Array.isArray(answer) ? answer : items.map((i: any) => i.id)) as string[];

    const moveItem = (idx: number, dir: -1 | 1) => {
        const next = [...currentOrder];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        onAnswer(next);
    };

    const itemMap = new Map<string, string>(items.map((i: any) => [i.id, i.text]));

    return (
        <div className="space-y-1">
            {currentOrder.map((id, idx) => (
                <div key={id} className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card text-sm">
                    <span className="text-muted-foreground w-6">{idx + 1}.</span>
                    <span className="flex-1">
                        <MathEnabledText text={itemMap.get(id) ?? id} variant="inline" />
                    </span>
                    <button
                        type="button"
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 disabled:opacity-30"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === currentOrder.length - 1}
                        className="p-1 disabled:opacity-30"
                    >
                        ↓
                    </button>
                </div>
            ))}
        </div>
    );
}

function InteractiveMatching({
    quiz,
    answer,
    onAnswer,
}: {
    quiz: any;
    answer: unknown;
    onAnswer: (v: unknown) => void;
}) {
    const pairs = quiz.pairs ?? [];
    const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;
    const rights = pairs.map((p: any) => p.right);

    return (
        <div className="space-y-2">
            {pairs.map((pair: any) => (
                <div key={pair.id} className="flex items-center gap-3 text-sm">
                    <span className="w-1/3 font-medium">
                        <MathEnabledText text={pair.left} variant="inline" />
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex-1">
                        <select
                            value={current[pair.id] ?? ""}
                            onChange={e => onAnswer({ ...current, [pair.id]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border bg-card text-sm"
                        >
                            <option value="">Select...</option>
                            {rights.map((r: string) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                        {current[pair.id] && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                Selected:{" "}
                                <MathEnabledText text={current[pair.id]} variant="inline" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function InteractiveFillBlank({
    quiz,
    answer,
    onAnswer,
}: {
    quiz: any;
    answer: unknown;
    onAnswer: (v: unknown) => void;
}) {
    const blanks = quiz.blanks ?? [];
    const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;

    return (
        <div className="space-y-2">
            <MathEnabledText
                text={quiz.template}
                className="text-sm text-muted-foreground whitespace-pre-wrap"
            />
            {blanks.map((blank: any, idx: number) => (
                <div key={blank.id} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">Blank {idx + 1}:</span>
                    <div className="flex-1 space-y-1">
                        <input
                            type="text"
                            value={current[blank.id] ?? ""}
                            onChange={e => onAnswer({ ...current, [blank.id]: e.target.value })}
                            placeholder="Your answer..."
                            className="w-full px-3 py-2 rounded-lg border bg-card"
                        />
                        {current[blank.id]?.trim() && (
                            <div className="text-xs text-muted-foreground">
                                Answer:{" "}
                                <MathEnabledText text={current[blank.id]} variant="inline" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function InteractiveMathInput({ answer, onAnswer }: { answer: unknown; onAnswer: (v: unknown) => void }) {
    const v = typeof answer === "string" ? answer : "";
    return (
        <div className="space-y-2">
            <input
                type="text"
                value={v}
                onChange={e => onAnswer(e.target.value)}
                placeholder="Enter expression..."
                className="w-full px-4 py-3 rounded-lg border bg-card text-sm font-mono"
            />
            {v.trim() && (
                <div className="p-3 bg-background border rounded-lg text-center">
                    <MathEnabledText text={v} variant="block" />
                </div>
            )}
        </div>
    );
}

function InteractiveClassification({
    quiz,
    answer,
    onAnswer,
}: {
    quiz: any;
    answer: unknown;
    onAnswer: (v: unknown) => void;
}) {
    const items = quiz.items ?? [];
    const categories = quiz.categories ?? [];
    const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;

    return (
        <div className="space-y-2">
            {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span className="w-1/3 font-medium">
                        <MathEnabledText text={item.text} variant="inline" />
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <div className="flex-1">
                        <select
                            value={current[item.id] ?? ""}
                            onChange={e => onAnswer({ ...current, [item.id]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border bg-card text-sm"
                        >
                            <option value="">Select category...</option>
                            {categories.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {current[item.id] && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                Selected:{" "}
                                <MathEnabledText
                                    text={
                                        categories.find((c: any) => c.id === current[item.id])?.label ??
                                        current[item.id]
                                    }
                                    variant="inline"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
