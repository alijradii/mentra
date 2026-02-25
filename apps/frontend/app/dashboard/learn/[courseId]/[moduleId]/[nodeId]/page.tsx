"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SectionPreview } from "@/components/section-preview";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { LessonNavigation } from "@/components/learn/lesson-navigation";
import type { FlatNode } from "@/components/learn/types";
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Course outline
          </button>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
          )}

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{node?.title}</h1>
            {node?.description && (
              <p className="text-muted-foreground mt-2 text-sm">{node.description}</p>
            )}
          </div>

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
