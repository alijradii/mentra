"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseWS } from "@/contexts/CourseWSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModuleListItem } from "@/components/courses/module-list-item";
import { ConfirmDeleteDialog, CourseMembersPanel, SnapshotHistory } from "@/components/courses";
import { coursesApi, modulesApi, type CourseDTO, type ModuleDTO, ApiError } from "@/lib/api";
import type { CourseWSEvent } from "shared";

type Tab = "modules" | "members" | "snapshots";

interface WSNotification {
  id: number;
  message: string;
}

let notifCounter = 0;

function CourseDetailContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { presenceList, on, editsLocked } = useCourseWS();

  const [course, setCourse] = useState<CourseDTO | null>(null);
  const [modules, setModules] = useState<ModuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showNewModule, setShowNewModule] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<ModuleDTO | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("modules");

  const [notifications, setNotifications] = useState<WSNotification[]>([]);

  const [orderSaveStatus, setOrderSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const orderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestModulesRef = useRef(modules);
  latestModulesRef.current = modules;

  const showNotif = useCallback((message: string) => {
    const notifId = ++notifCounter;
    setNotifications((prev) => [...prev, { id: notifId, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    }, 4000);
  }, []);

  const reloadModules = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await modulesApi.list(token, id);
      setModules(res.data);
    } catch {
      // ignore background refresh errors
    }
  }, [token, id]);

  const reloadCourse = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await coursesApi.getById(token, id);
      setCourse(res.data);
    } catch {
      // ignore background refresh errors
    }
  }, [token, id]);

  useEffect(() => {
    const unsubscribers = [
      on("module:created", (e: CourseWSEvent) => {
        if (e.actor.id !== user?.id) {
          showNotif(`Module added by ${e.actor.name}`);
        }
        reloadModules();
      }),
      on("module:updated", (e: CourseWSEvent) => {
        if (e.actor.id !== user?.id) {
          showNotif(`Module updated by ${e.actor.name}`);
        }
        reloadModules();
      }),
      on("module:deleted", (e: CourseWSEvent) => {
        if (e.actor.id !== user?.id) {
          showNotif(`Module deleted by ${e.actor.name}`);
        }
        reloadModules();
      }),
      on("modules:reordered", (e: CourseWSEvent) => {
        if (e.actor.id !== user?.id) {
          showNotif(`Modules reordered by ${e.actor.name}`);
          reloadModules();
        }
      }),
      on("course:updated", (e: CourseWSEvent) => {
        if (e.actor.id !== user?.id) {
          showNotif(`Course updated by ${e.actor.name}`);
        }
        reloadCourse();
      }),
      on("snapshot:restored", (e: CourseWSEvent) => {
        const payload = e.payload as { label: string; action: string };
        const action = payload.action === "restored" ? "restored" : "created";
        if (e.actor.id !== user?.id) {
          showNotif(`Snapshot "${payload.label}" ${action} by ${e.actor.name}`);
        }
        if (payload.action === "restored") {
          reloadCourse();
          reloadModules();
        }
      }),
    ];
    return () => unsubscribers.forEach((u) => u());
  }, [on, user?.id, showNotif, reloadCourse, reloadModules]);

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
    if (mod) setModuleToDelete(mod);
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

  const saveModuleOrder = useCallback(async () => {
    if (!token || !id) return;
    setOrderSaveStatus("saving");
    try {
      await coursesApi.reorderModules(token, id, latestModulesRef.current.map((m) => m._id));
      setOrderSaveStatus("saved");
    } catch {
      setOrderSaveStatus("error");
    }
  }, [token, id]);

  const moveModule = (idx: number, dir: -1 | 1) => {
    const next = [...modules];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setModules(next);

    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    setOrderSaveStatus("idle");
    orderTimerRef.current = setTimeout(() => saveModuleOrder(), 1500);
  };

  useEffect(() => {
    return () => {
      if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    };
  }, []);

  if (!user) return null;

  const isOwner = course?.ownerId === user.id;
  const isMentor = isOwner || (course?.mentorIds.includes(user.id) ?? false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tabs: Tab[] = isMentor
    ? ["modules", "members", "snapshots"]
    : ["modules", "members"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-foreground text-background text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-xs animate-in fade-in slide-in-from-top-2"
            >
              {n.message}
            </div>
          ))}
        </div>
      )}

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
        <div className="flex items-center gap-3">
          {presenceList.length > 0 && (
            <div className="flex items-center gap-1.5">
              {presenceList.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  title={u.name}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-xs font-semibold text-primary select-none"
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {presenceList.length > 5 && (
                <span className="text-xs text-muted-foreground">+{presenceList.length - 5}</span>
              )}
              <span className="text-xs text-muted-foreground ml-1">
                {presenceList.length === 1
                  ? "1 other editing"
                  : `${presenceList.length} others editing`}
              </span>
            </div>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/courses/${id}/settings`}>Settings</Link>
          </Button>
        </div>
      </div>

      {editsLocked && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 text-sm border border-amber-500/30">
          Edits are locked while the AI agent is working. You can still view the course.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
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
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Modules</h2>
              {orderSaveStatus === "saving" && (
                <span className="text-xs text-muted-foreground">Saving order...</span>
              )}
              {orderSaveStatus === "saved" && (
                <span className="text-xs text-success">Order saved</span>
              )}
              {orderSaveStatus === "error" && (
                <span className="text-xs text-destructive">Failed to save order</span>
              )}
            </div>
            {isMentor && (
              <Button size="sm" onClick={() => setShowNewModule((v) => !v)} disabled={editsLocked}>
                {showNewModule ? "Cancel" : "Add module"}
              </Button>
            )}
          </div>

          {showNewModule && isMentor && !editsLocked && (
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
            <p className="text-muted-foreground text-sm">No modules yet. {isMentor ? "Add one to get started." : ""}</p>
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
                  editsLocked={editsLocked}
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
          isMentor={isMentor}
          editsLocked={editsLocked}
        />
      )}

      {activeTab === "snapshots" && token && course && isMentor && (
        <SnapshotHistory
          courseId={id}
          token={token}
          currentSnapshotId={course.currentSnapshotId}
          isOwner={isOwner}
          onRestored={() => {
            reloadCourse();
            reloadModules();
          }}
          editsLocked={editsLocked}
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

export default function CourseDetailPage() {
  const { token, user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  if (!token || !id || !user) return null;

  return <CourseDetailContent />;
}
