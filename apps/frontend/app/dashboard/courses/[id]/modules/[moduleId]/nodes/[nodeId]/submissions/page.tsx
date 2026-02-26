"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  submissionsApi,
  nodesApi,
  type NodeDTO,
  type NodeSubmissionDTO,
} from "@/lib/api";

export default function SubmissionsListPage() {
  const { user, token } = useAuth();
  const params = useParams();
  const courseId = params?.id as string;
  const moduleId = params?.moduleId as string;
  const nodeId = params?.nodeId as string;

  const [node, setNode] = useState<NodeDTO | null>(null);
  const [submissions, setSubmissions] = useState<NodeSubmissionDTO[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (!token || !nodeId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      nodesApi.getById(token, nodeId),
      submissionsApi.listForNode(token, courseId, nodeId, statusFilter || undefined),
    ])
      .then(([nodeRes, subRes]) => {
        if (!cancelled) {
          setNode(nodeRes.data);
          setSubmissions(subRes.data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, courseId, nodeId, statusFilter]);

  const handleReleaseAll = async () => {
    if (!token || releasing) return;
    setReleasing(true);
    try {
      await submissionsApi.releaseAll(token, courseId, nodeId);
      // Refresh
      const res = await submissionsApi.listForNode(token, courseId, nodeId, statusFilter || undefined);
      setSubmissions(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to release");
    } finally {
      setReleasing(false);
    }
  };

  if (!user) return null;

  const basePath = `/dashboard/courses/${courseId}/modules/${moduleId}/nodes/${nodeId}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/dashboard/courses" className="hover:text-foreground">My courses</Link>
        <span>/</span>
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground">Course</Link>
        <span>/</span>
        <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground">Module</Link>
        <span>/</span>
        <Link href={basePath} className="hover:text-foreground">{node?.title ?? "Node"}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Submissions</span>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Student submissions</h1>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-card text-sm"
          >
            <option value="">All</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="released">Released</option>
          </select>
          <Button size="sm" variant="outline" disabled={releasing} onClick={handleReleaseAll}>
            {releasing ? "Releasing..." : "Release all graded"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No submissions yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-background text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Attempt</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id} className="border-b last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {sub.user?.avatar ? (
                        <img src={sub.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {sub.user?.name?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <span className="font-medium">{sub.user?.name ?? "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">#{sub.attemptNumber}</td>
                  <td className="px-4 py-3">
                    {sub.grading ? (
                      <span className="font-medium">{sub.grading.finalScore}/{sub.maxScore}</span>
                    ) : sub.autoScore !== undefined ? (
                      <span className="text-muted-foreground">{sub.autoScore}/{sub.maxScore}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      sub.status === "released" ? "bg-success/15 text-success" :
                      sub.status === "graded" ? "bg-blue-500/15 text-blue-600 dark:text-blue-400" :
                      sub.status === "submitted" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`${basePath}/submissions/${sub._id}`}>
                        {sub.status === "submitted" ? "Grade" : "View"}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
