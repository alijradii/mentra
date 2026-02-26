"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionPreview } from "@/components/section-preview";
import {
  ApiError,
  submissionsApi,
  nodesApi,
  type NodeDTO,
  type NodeSubmissionDTO,
  type GradeOverrideDTO,
  type SectionDTO,
} from "@/lib/api";

export default function GradingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const moduleId = params?.moduleId as string;
  const nodeId = params?.nodeId as string;
  const submissionId = params?.submissionId as string;

  const [node, setNode] = useState<NodeDTO | null>(null);
  const [submission, setSubmission] = useState<NodeSubmissionDTO | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { score: number; feedback: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !nodeId || !submissionId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      nodesApi.getById(token, nodeId),
      submissionsApi.getMentorView(token, courseId, submissionId),
    ])
      .then(([nodeRes, subRes]) => {
        if (cancelled) return;
        setNode(nodeRes.data);
        setSubmission(subRes.data);

        // Pre-populate overrides from existing grading
        if (subRes.data.grading) {
          const existing: Record<string, { score: number; feedback: string }> = {};
          for (const o of subRes.data.grading.overrides) {
            existing[o.sectionId] = { score: o.score, feedback: o.feedback ?? "" };
          }
          setOverrides(existing);
          setOverallFeedback(subRes.data.grading.overallFeedback ?? "");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, courseId, nodeId, submissionId]);

  const quizSections = node?.sections.filter((s) => s.type === "quiz") ?? [];

  const handleSaveGrade = async () => {
    if (!token || saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    const overrideList: GradeOverrideDTO[] = Object.entries(overrides).map(([sectionId, val]) => ({
      sectionId,
      score: val.score,
      feedback: val.feedback || undefined,
    }));

    try {
      const res = await submissionsApi.grade(token, courseId, submissionId, {
        overrides: overrideList,
        overallFeedback: overallFeedback || undefined,
      });
      setSubmission(res.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!token || releasing) return;
    setReleasing(true);
    setError("");

    try {
      // Save grade first if there are overrides
      if (Object.keys(overrides).length > 0 || overallFeedback) {
        await handleSaveGrade();
      }
      const res = await submissionsApi.release(token, courseId, submissionId);
      setSubmission(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to release");
    } finally {
      setReleasing(false);
    }
  };

  const getOverride = (sectionId: string, autoScore: number) => {
    return overrides[sectionId] ?? { score: autoScore, feedback: "" };
  };

  const setOverrideForSection = (sectionId: string, updates: Partial<{ score: number; feedback: string }>) => {
    setSaved(false);
    setOverrides((prev) => ({
      ...prev,
      [sectionId]: {
        ...getOverride(sectionId, 0),
        ...updates,
      },
    }));
  };

  if (!user) return null;

  const basePath = `/dashboard/courses/${courseId}/modules/${moduleId}/nodes/${nodeId}`;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!submission || !node) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-destructive">Submission not found.</p>
      </div>
    );
  }

  const isReleased = submission.status === "released";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/dashboard/courses" className="hover:text-foreground">My courses</Link>
        <span>/</span>
        <Link href={basePath} className="hover:text-foreground">{node.title}</Link>
        <span>/</span>
        <Link href={`${basePath}/submissions`} className="hover:text-foreground">Submissions</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Grading</span>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>}

      {/* Student info header */}
      <div className="p-5 rounded-lg border bg-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {submission.user?.avatar ? (
              <img src={submission.user.avatar} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {submission.user?.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{submission.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                Attempt #{submission.attemptNumber}
                {submission.submittedAt && <> &middot; Submitted {new Date(submission.submittedAt).toLocaleString()}</>}
              </p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            submission.status === "released" ? "bg-success/15 text-success" :
            submission.status === "graded" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
            "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}>
            {submission.status}
          </span>
        </div>
      </div>

      {/* Questions with grading */}
      <div className="space-y-6 mb-8">
        {quizSections.map((section) => {
          const quiz = section as any;
          const gradedAnswer = submission.answers.find((a) => a.sectionId === section.id);
          const maxPts = gradedAnswer?.maxScore ?? quiz.points ?? 10;
          const autoScore = gradedAnswer?.autoScore ?? 0;
          const override = getOverride(section.id, autoScore);

          return (
            <div key={section.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 space-y-3">
                <SectionPreview section={section} />

                {gradedAnswer && (
                  <div className="p-3 rounded-lg bg-background border text-sm space-y-1">
                    <p className="text-muted-foreground text-xs font-medium">Student's answer</p>
                    <p className="text-foreground">{formatAnswer(gradedAnswer.answer)}</p>
                    <p className={`text-xs font-medium ${gradedAnswer.isCorrect ? "text-success" : "text-destructive"}`}>
                      Auto-graded: {autoScore}/{maxPts} ({gradedAnswer.isCorrect ? "correct" : "incorrect"})
                    </p>
                  </div>
                )}
              </div>

              {!isReleased && (
                <div className="px-4 py-3 border-t bg-background space-y-2">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs shrink-0">Score:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={maxPts}
                      value={override.score}
                      onChange={(e) => setOverrideForSection(section.id, { score: parseFloat(e.target.value) || 0 })}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">/ {maxPts}</span>
                  </div>
                  <Textarea
                    value={override.feedback}
                    onChange={(e) => setOverrideForSection(section.id, { feedback: e.target.value })}
                    placeholder="Feedback for this question..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}

              {isReleased && submission.grading?.overrides.find((o) => o.sectionId === section.id) && (
                <div className="px-4 py-3 border-t bg-background text-sm">
                  <p className="font-medium">Score: {submission.grading.overrides.find((o) => o.sectionId === section.id)!.score}/{maxPts}</p>
                  {submission.grading.overrides.find((o) => o.sectionId === section.id)!.feedback && (
                    <p className="text-muted-foreground mt-1">{submission.grading.overrides.find((o) => o.sectionId === section.id)!.feedback}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall feedback */}
      <div className="border rounded-lg p-4 mb-6">
        <Label className="text-sm font-semibold">Overall feedback</Label>
        {isReleased ? (
          <p className="mt-2 text-sm text-foreground">{submission.grading?.overallFeedback || "No feedback provided."}</p>
        ) : (
          <Textarea
            value={overallFeedback}
            onChange={(e) => { setOverallFeedback(e.target.value); setSaved(false); }}
            placeholder="Overall feedback for the student..."
            rows={3}
            className="mt-2 text-sm"
          />
        )}
      </div>

      {/* Actions */}
      {!isReleased && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveGrade} disabled={saving}>
            {saving ? "Saving..." : "Save grade"}
          </Button>
          <Button variant="outline" onClick={handleRelease} disabled={releasing}>
            {releasing ? "Releasing..." : "Release to student"}
          </Button>
          {saved && <span className="text-success text-xs">Saved.</span>}
        </div>
      )}

      {isReleased && submission.grading && (
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">
            Final score: <span className="text-foreground font-bold text-lg">{submission.grading.finalScore}/{submission.maxScore}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function formatAnswer(answer: unknown): string {
  if (answer === null || answer === undefined) return "(no answer)";
  if (typeof answer === "string") return answer;
  if (typeof answer === "boolean") return answer ? "True" : "False";
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") {
    return Object.entries(answer as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return String(answer);
}
