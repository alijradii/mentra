"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModuleListItem } from "@/components/courses/module-list-item";
import { ConfirmDeleteDialog, CourseMembersPanel } from "@/components/courses";
import { coursesApi, modulesApi, type CourseDTO, type ModuleDTO, ApiError } from "@/lib/api";

type Tab = "modules" | "members";

export default function CourseDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showNewModule, setShowNewModule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleDTO | null>(null);

  const [savedOrder, setSavedOrder] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("modules");

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    Promise.all([
      coursesApi.getById(token, id),
      modulesApi.list(token, id),
    ])
      .then(([courseRes, modulesRes]) => {
        if (!cancelled) {
          setCourse(courseRes.data);
          setModules(modulesRes.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load course");
          if (err instanceof ApiError && err.status === 403) {
            router.replace("/dashboard/courses");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, id, router]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTitle.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await modulesApi.create(token, id, { title: newTitle.trim() });
      setModules((prev) => [...prev, res.data]);
      setNewTitle("");
      setShowNewModule(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create module");
    } finally {
      setCreating(false);
    }
  };

  const handleRequestDeleteModule = (moduleId: string) => {
    const mod = modules.find((m) => m._id === moduleId) ?? null;
    if (mod) {
      setModuleToDelete(mod);
    }
  };

  const handleConfirmDeleteModule = async () => {
    if (!token || !moduleToDelete) return;
    const moduleId = moduleToDelete._id;
    setDeletingId(moduleId);
    setError("");
    try {
      await modulesApi.delete(token, moduleId);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete module");
    } finally {
      setDeletingId(null);
      setModuleToDelete(null);
    }
  };

  const moveModule = (idx: number, dir: -1 | 1) => {
    const next = [...modules];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setModules(next);
    setSavedOrder(false);
  };

  const handleSaveModuleOrder = async () => {
    if (!token || !id) return;
    setSavingOrder(true);
    setError("");
    try {
      await coursesApi.reorderModules(token, id, modules.map((m) => m._id));
      setSavedOrder(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard/courses" className="hover:text-foreground">My courses</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{course?.title ?? "Course"}</span>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
          {course?.description && (
            <p className="text-muted-foreground mt-1 text-sm max-w-xl">{course.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{course?.status}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{course?.visibility}</span>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/courses/${id}/settings`}>Settings</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        {(["modules", "members"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "modules" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Modules</h2>
            <div className="flex items-center gap-2">
              {modules.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingOrder || savedOrder}
                  onClick={handleSaveModuleOrder}
                >
                  {savingOrder ? "Saving…" : "Save order"}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowNewModule((v) => !v)}>
                {showNewModule ? "Cancel" : "Add module"}
              </Button>
            </div>
          </div>
          {modules.length > 0 && savedOrder === false && (
            <p className="text-warning text-xs mb-2">Order changed. Click &quot;Save order&quot; to persist.</p>
          )}

          {showNewModule && (
            <form
              onSubmit={handleCreateModule}
              className="mb-4 p-4 bg-card border rounded-lg flex gap-2 items-end"
            >
              <div className="flex-1">
                <Label htmlFor="new-module-title">Module title</Label>
                <Input
                  id="new-module-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Introduction"
                  required
                  maxLength={200}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Adding..." : "Add"}
              </Button>
            </form>
          )}

          {modules.length === 0 && !showNewModule ? (
            <p className="text-muted-foreground text-sm">No modules yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {modules.map((module, idx) => (
                <ModuleListItem
                  key={module._id}
                  module={module}
                  idx={idx}
                  total={modules.length}
                  courseId={id}
                  deletingId={deletingId}
                  onDelete={handleRequestDeleteModule}
                  onMoveUp={() => moveModule(idx, -1)}
                  onMoveDown={() => moveModule(idx, 1)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === "members" && token && course && (
        <CourseMembersPanel
          courseId={id}
          token={token}
          currentUserId={user.id}
          ownerId={course.ownerId}
          isMentor={course.mentorIds.includes(user.id)}
        />
      )}

      <ConfirmDeleteDialog
        open={!!moduleToDelete}
        title="Delete module"
        description="This will permanently delete the selected module and its pages."
        confirmLabel="Delete module"
        loading={!!(moduleToDelete && deletingId === moduleToDelete._id)}
        onCancel={() => setModuleToDelete(null)}
        onConfirm={handleConfirmDeleteModule}
      >
        {moduleToDelete && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Module: <span className="font-medium text-foreground">"{moduleToDelete.title}"</span>
            </p>
            <p className="text-xs">
              It currently has {moduleToDelete.nodes.length} page
              {moduleToDelete.nodes.length === 1 ? "" : "s"}. All of them (and their sections) will be
              deleted.
            </p>
          </div>
        )}
      </ConfirmDeleteDialog>
    </div>
  );
}
