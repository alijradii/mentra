"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SectionPreview } from "@/components/section-preview";
import {
  coursesApi,
  modulesApi,
  nodesApi,
  enrollmentApi,
  type CourseDTO,
  type ModuleDTO,
  type NodeDTO,
  type EnrollmentDTO,
  ApiError,
} from "@/lib/api";

interface FlatNode {
  moduleId: string;
  moduleTitle: string;
  moduleIdx: number;
  nodeId: string;
  nodeTitle: string;
  nodeIdx: number;
}

export default function LessonPlayerPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useParams();
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

  const completedNodes = new Set(enrollment?.progress.completedNodes ?? []);
  const isDone = completedNodes.has(nodeId);

  const currentIdx = flatList.findIndex((n) => n.nodeId === nodeId);
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

        const nodeResults = await Promise.all(
          mods.map((m) => nodesApi.list(token, m._id))
        );
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
      .catch((err) => {
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

    return () => { cancelled = true; };
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/70 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
          w-72 shrink-0 bg-card border-r flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ top: "64px" }}
      >
        {/* Sidebar header */}
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
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-primary"
                  style={{ width: `${enrollment.progress.overallPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground/80 mt-0.5">
                {enrollment.progress.overallPercentage}% complete
              </p>
            </div>
          )}
        </div>

        {/* Modules + nodes */}
        <nav className="flex-1 overflow-y-auto py-2">
          {modules.map((mod, mi) => {
            const nodes = nodesByModule[mod._id] ?? [];
            return (
              <div key={mod._id}>
                <p className="px-4 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  {mi + 1}. {mod.title}
                </p>
                <ul>
                  {nodes.map((n) => {
                    const active = n._id === nodeId;
                    const done = completedNodes.has(n._id);
                    return (
                      <li key={n._id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigateTo({
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
                              ? "bg-primary text-primary-foreground"
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span
                              className={`w-3.5 h-3.5 shrink-0 rounded-full border-2 ${
                                active ? "border-border" : "border-border"
                              }`}
                            />
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

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Course outline
          </button>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
          )}

          {/* Node header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{node?.title}</h1>
            {node?.description && (
              <p className="text-muted-foreground mt-2 text-sm">{node.description}</p>
            )}
          </div>

          {/* Sections */}
          {(node?.sections?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground/80 italic text-sm">This lesson has no content yet.</p>
          ) : (
            <div className="space-y-8">
              {node!.sections.map((section) => (
                <div key={section.id}>
                  <SectionPreview section={section} />
                </div>
              ))}
            </div>
          )}

          {/* Mark complete + navigation */}
          <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {enrollment === null ? (
                <Button size="sm" asChild>
                  <Link href={`/dashboard/browse`}>Enroll to track progress</Link>
                </Button>
              ) : isDone ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Completed
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={marking}
                  onClick={handleMarkComplete}
                >
                  {marking ? "Marking…" : "Mark as complete"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {prevNode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(prevNode)}
                >
                  ← Previous
                </Button>
              )}
              {nextNode ? (
                <Button
                  size="sm"
                  onClick={() => {
                    if (enrollment && !isDone) handleMarkComplete();
                    navigateTo(nextNode);
                  }}
                >
                  Next →
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link href={`/dashboard/learn/${courseId}`}>Back to overview</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
