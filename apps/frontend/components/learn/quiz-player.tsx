"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionPreview } from "@/components/section-preview";
import {
  submissionsApi,
  type NodeDTO,
  type NodeSubmissionDTO,
  type QuestionAnswerDTO,
  type SectionDTO,
} from "@/lib/api";

interface QuizPlayerProps {
  node: NodeDTO;
  courseId: string;
  token: string;
}

type QuizPhase = "info" | "taking" | "submitted" | "released";

export function QuizPlayer({ node, courseId, token }: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submissions, setSubmissions] = useState<NodeSubmissionDTO[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<NodeSubmissionDTO | null>(null);
  const [phase, setPhase] = useState<QuizPhase>("info");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const quizSections = node.sections.filter((s) => s.type === "quiz");
  const settings = node.settings ?? {};
  const maxAttempts = settings.maxAttempts ?? 1;
  const timeLimit = settings.timeLimit;
  const totalPoints = quizSections.reduce((sum, s) => sum + ((s as any).points ?? 10), 0);

  useEffect(() => {
    submissionsApi.getMine(token, node._id).then((res) => {
      setSubmissions(res.data);

      const inProgress = res.data.find((s) => s.status === "in-progress");
      if (inProgress) {
        setActiveSubmission(inProgress);
        setPhase("taking");
        if (timeLimit) {
          const elapsed = (Date.now() - new Date(inProgress.startedAt).getTime()) / 60000;
          const remaining = Math.max(0, timeLimit - elapsed);
          setTimeRemaining(Math.floor(remaining * 60));
        }
      } else {
        const released = res.data.find((s) => s.status === "released");
        const submitted = res.data.find((s) => s.status === "submitted" || s.status === "graded");
        if (released) {
          setActiveSubmission(released);
          setPhase("released");
        } else if (submitted) {
          setActiveSubmission(submitted);
          setPhase("submitted");
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token, node._id, timeLimit]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "taking" || timeRemaining === null) return;
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeRemaining !== null]);

  const attemptCount = submissions.filter((s) => s.status !== "in-progress").length;
  const canRetake = attemptCount < maxAttempts;
  const isDuePassed = settings.dueDate ? new Date(settings.dueDate) < new Date() : false;

  const handleStart = useCallback(async () => {
    try {
      const res = await submissionsApi.start(token, node._id, courseId);
      setActiveSubmission(res.data);
      setPhase("taking");
      if (timeLimit) {
        setTimeRemaining(timeLimit * 60);
      }
    } catch (err) {
      console.error("Failed to start quiz:", err);
    }
  }, [token, node._id, courseId, timeLimit]);

  const handleAnswerChange = (sectionId: string, answer: unknown) => {
    setAnswers((prev) => ({ ...prev, [sectionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !activeSubmission) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const answerList: QuestionAnswerDTO[] = quizSections.map((s) => ({
        sectionId: s.id,
        answer: answers[s.id] ?? null,
      }));

      const result = await submissionsApi.submit(token, node._id, activeSubmission._id, answerList);
      setActiveSubmission(result.data);
      setSubmissions((prev) => [result.data, ...prev.filter((s) => s._id !== result.data._id)]);
      setPhase("submitted");
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setSubmitting(false);
    }
  }, [token, node._id, activeSubmission, answers, quizSections, submitting]);

  const handleRetake = () => {
    setAnswers({});
    setActiveSubmission(null);
    setTimeRemaining(null);
    setPhase("info");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading quiz...</p>;
  }

  // ── Info phase: show quiz details before starting ──
  if (phase === "info") {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-lg border bg-card space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Quiz</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Questions:</span>{" "}
              <span className="font-medium">{quizSections.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total points:</span>{" "}
              <span className="font-medium">{totalPoints}</span>
            </div>
            {timeLimit && (
              <div>
                <span className="text-muted-foreground">Time limit:</span>{" "}
                <span className="font-medium">{timeLimit} min</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Attempts:</span>{" "}
              <span className="font-medium">{attemptCount}/{maxAttempts}</span>
            </div>
            {settings.passingScore && (
              <div>
                <span className="text-muted-foreground">Passing score:</span>{" "}
                <span className="font-medium">{settings.passingScore}%</span>
              </div>
            )}
            {settings.dueDate && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Due:</span>{" "}
                <span className={`font-medium ${isDuePassed ? "text-destructive" : ""}`}>
                  {new Date(settings.dueDate).toLocaleString()}
                  {isDuePassed && " (past due)"}
                </span>
              </div>
            )}
          </div>
        </div>

        {canRetake && !isDuePassed ? (
          <Button onClick={handleStart}>
            {attemptCount === 0 ? "Start quiz" : "Retake quiz"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isDuePassed ? "This quiz is past due." : "No attempts remaining."}
          </p>
        )}

        {submissions.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Your attempts</h3>
            <div className="space-y-1">
              {submissions.filter((s) => s.status !== "in-progress").map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => { setActiveSubmission(s); setPhase(s.status === "released" ? "released" : "submitted"); }}
                  className="w-full flex items-center justify-between text-sm px-3 py-2 rounded bg-background border hover:bg-card transition-colors"
                >
                  <span>Attempt #{s.attemptNumber}</span>
                  <span className="text-muted-foreground capitalize">{s.status}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Taking phase: answering questions ──
  if (phase === "taking") {
    return (
      <div className="space-y-6">
        {timeRemaining !== null && (
          <div className={`sticky top-0 z-10 p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${timeRemaining < 60 ? "bg-destructive/15 text-destructive border-destructive/40" : "bg-card"}`}>
            <span>Time remaining</span>
            <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
          </div>
        )}

        {node.sections.map((section) => {
          if (section.type === "quiz") {
            return (
              <QuizQuestionSection
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

        <div className="pt-4 border-t flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit quiz"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {Object.keys(answers).length}/{quizSections.length} questions answered
          </p>
        </div>
      </div>
    );
  }

  // ── Submitted phase: waiting for grading ──
  if (phase === "submitted" && activeSubmission) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-lg border bg-card space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Quiz submitted</h2>
          <p className="text-sm text-muted-foreground">
            Your answers have been submitted. Grades will be available once your instructor releases them.
          </p>
          {activeSubmission.submittedAt && (
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(activeSubmission.submittedAt).toLocaleString()}
            </p>
          )}
        </div>

        {canRetake && !isDuePassed && (
          <Button variant="outline" onClick={handleRetake}>Retake quiz</Button>
        )}
      </div>
    );
  }

  // ── Released phase: show grades and feedback ──
  if (phase === "released" && activeSubmission) {
    const grading = activeSubmission.grading;
    const finalScore = grading ? grading.finalScore : (activeSubmission.autoScore ?? 0);
    const maxScore = activeSubmission.maxScore;
    const pct = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
    const passed = settings.passingScore ? pct >= settings.passingScore : true;
    const showCorrect = settings.showCorrectAnswers !== "never";

    return (
      <div className="space-y-6">
        <div className="p-5 rounded-lg border bg-card space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Quiz results</h2>
          <p className="text-3xl font-bold text-foreground">
            {finalScore} / {maxScore}
            <span className={`text-base font-normal ml-2 ${passed ? "text-success" : "text-destructive"}`}>
              ({pct}%{settings.passingScore ? (passed ? " — Passed" : " — Not passed") : ""})
            </span>
          </p>
          {grading?.overallFeedback && (
            <div className="mt-3 p-3 rounded-lg bg-background border text-sm">
              <p className="font-semibold text-muted-foreground text-xs mb-1">Instructor feedback</p>
              <p className="text-foreground">{grading.overallFeedback}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {quizSections.map((section) => {
            const gradedAnswer = activeSubmission.answers.find((a) => a.sectionId === section.id);
            const override = grading?.overrides.find((o) => o.sectionId === section.id);
            const score = override ? override.score : (gradedAnswer?.autoScore ?? 0);
            const maxPts = gradedAnswer?.maxScore ?? (section as any).points ?? 10;

            return (
              <div key={section.id} className="space-y-2">
                {showCorrect ? (
                  <SectionPreview section={section} />
                ) : (
                  <p className="font-semibold text-foreground text-base">{(section as any).question}</p>
                )}
                <div className={`p-3 rounded-lg text-sm ${gradedAnswer?.isCorrect ? "bg-success/15 text-success border border-success/40" : "bg-destructive/15 text-destructive border border-destructive/40"}`}>
                  <p className="font-semibold">
                    {score}/{maxPts} pts
                  </p>
                  {override?.feedback && (
                    <p className="mt-1 text-foreground/80">{override.feedback}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canRetake && !isDuePassed && (
          <Button variant="outline" onClick={handleRetake}>Retake quiz</Button>
        )}
      </div>
    );
  }

  return null;
}

// Reuse the same interactive quiz components from practice-player
function QuizQuestionSection({
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
  const maxPts = quiz.points ?? 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground text-base">{quiz.question}</p>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">{maxPts} pts</span>
      </div>
      <InteractiveInput quizType={quizType} quiz={quiz} answer={answer} onAnswer={onAnswer} />
    </div>
  );
}

function InteractiveInput({ quizType, quiz, answer, onAnswer }: { quizType: string; quiz: any; answer: unknown; onAnswer: (v: unknown) => void }) {
  switch (quizType) {
    case "mcq": {
      const selected = (Array.isArray(answer) ? answer : []) as string[];
      const isMultiple = quiz.correctAnswers?.length > 1;
      const toggle = (optId: string) => {
        if (isMultiple) {
          onAnswer(selected.includes(optId) ? selected.filter((id: string) => id !== optId) : [...selected, optId]);
        } else {
          onAnswer([optId]);
        }
      };
      return (
        <div className="space-y-2">
          {quiz.options?.map((opt: any) => (
            <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm cursor-pointer ${selected.includes(opt.id) ? "border-primary bg-background" : "border-border bg-card hover:bg-background"}`}
            >{opt.text}</button>
          ))}
        </div>
      );
    }
    case "true-false":
      return (
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" onClick={() => onAnswer(val)}
              className={`px-6 py-3 rounded-lg border-2 text-sm font-medium transition-colors cursor-pointer ${answer === val ? "border-primary bg-background" : "border-border bg-card hover:bg-background"}`}
            >{val ? "True" : "False"}</button>
          ))}
        </div>
      );
    case "short-answer":
      return <input type="text" value={typeof answer === "string" ? answer : ""} onChange={(e) => onAnswer(e.target.value)} placeholder="Type your answer..." className="w-full px-4 py-3 rounded-lg border bg-card text-sm" />;
    case "sequence": {
      const items = quiz.items ?? [];
      const currentOrder = (Array.isArray(answer) ? answer : items.map((i: any) => i.id)) as string[];
      const itemMap = new Map(items.map((i: any) => [i.id, i.text]));
      const moveItem = (idx: number, dir: -1 | 1) => {
        const next = [...currentOrder];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        onAnswer(next);
      };
      return (
        <div className="space-y-1">
          {currentOrder.map((id, idx) => (
            <div key={id} className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card text-sm">
              <span className="text-muted-foreground w-6">{idx + 1}.</span>
              <span className="flex-1">{itemMap.get(id) ?? id}</span>
              <button type="button" onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 disabled:opacity-30">↑</button>
              <button type="button" onClick={() => moveItem(idx, 1)} disabled={idx === currentOrder.length - 1} className="p-1 disabled:opacity-30">↓</button>
            </div>
          ))}
        </div>
      );
    }
    case "matching": {
      const pairs = quiz.pairs ?? [];
      const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;
      const rights = pairs.map((p: any) => p.right);
      return (
        <div className="space-y-2">
          {pairs.map((pair: any) => (
            <div key={pair.id} className="flex items-center gap-3 text-sm">
              <span className="w-1/3 font-medium">{pair.left}</span>
              <span className="text-muted-foreground">→</span>
              <select value={current[pair.id] ?? ""} onChange={(e) => onAnswer({ ...current, [pair.id]: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">
                <option value="">Select...</option>
                {rights.map((r: string) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case "fill-blank": {
      const blanks = quiz.blanks ?? [];
      const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quiz.template}</p>
          {blanks.map((blank: any, idx: number) => (
            <div key={blank.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Blank {idx + 1}:</span>
              <input type="text" value={current[blank.id] ?? ""} onChange={(e) => onAnswer({ ...current, [blank.id]: e.target.value })} placeholder="Your answer..." className="flex-1 px-3 py-2 rounded-lg border bg-card" />
            </div>
          ))}
        </div>
      );
    }
    case "math-input":
      return <input type="text" value={typeof answer === "string" ? answer : ""} onChange={(e) => onAnswer(e.target.value)} placeholder="Enter expression..." className="w-full px-4 py-3 rounded-lg border bg-card text-sm font-mono" />;
    case "classification": {
      const items = quiz.items ?? [];
      const categories = quiz.categories ?? [];
      const current = (typeof answer === "object" && answer !== null ? answer : {}) as Record<string, string>;
      return (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="w-1/3 font-medium">{item.text}</span>
              <span className="text-muted-foreground">→</span>
              <select value={current[item.id] ?? ""} onChange={(e) => onAnswer({ ...current, [item.id]: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">
                <option value="">Select category...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      );
    }
    default:
      return <p className="text-muted-foreground text-sm italic">Unsupported quiz type.</p>;
  }
}
