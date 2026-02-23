"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coursesApi, modulesApi, type CourseDTO, type ModuleDTO } from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function CourseDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New module form
  const [showNewModule, setShowNewModule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Per-module deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reorder: local order is reflected in modules array; save sends current order to API
  const [savedOrder, setSavedOrder] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

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

  const handleDeleteModule = async (moduleId: string) => {
    if (!token || !confirm("Delete this module and all its nodes?")) return;
    setDeletingId(moduleId);
    setError("");
    try {
      await modulesApi.delete(token, moduleId);
      setModules((prev) => prev.filter((m) => m._id !== moduleId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete module");
    } finally {
      setDeletingId(null);
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
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/courses" className="hover:text-gray-700">My courses</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{course?.title ?? "Course"}</span>
      </div>

      {/* Course header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
          {course?.description && (
            <p className="text-gray-500 mt-1 text-sm max-w-xl">{course.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{course?.status}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{course?.visibility}</span>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/courses/${id}/settings`}>Settings</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Modules section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
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
        <p className="text-amber-600 text-xs mb-2">Order changed. Click &quot;Save order&quot; to persist.</p>
      )}

      {showNewModule && (
        <form
          onSubmit={handleCreateModule}
          className="mb-4 p-4 bg-white border rounded-lg flex gap-2 items-end"
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
        <p className="text-gray-500 text-sm">No modules yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {modules.map((module, idx) => (
            <li
              key={module._id}
              className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => moveModule(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveModule(idx, 1)}
                  disabled={idx === modules.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <Link
                href={`/dashboard/courses/${id}/modules/${module._id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                <span className="font-medium text-gray-900 group-hover:underline">{module.title}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 capitalize shrink-0">
                  {module.status}
                </span>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === module._id}
                onClick={() => handleDeleteModule(module._id)}
              >
                {deletingId === module._id ? "..." : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
