"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { modulesApi, nodesApi, type ModuleDTO, type NodeDTO } from "@/lib/api";
import { ApiError } from "@/lib/api";

type ModuleStatus = "draft" | "published" | "archived";

export default function ModuleDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const moduleId = params?.moduleId as string;

  const [module, setModule] = useState<ModuleDTO | null>(null);
  const [nodes, setNodes] = useState<NodeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inline edit module
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<ModuleStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New node form
  const [showNewNode, setShowNewNode] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reorder nodes: same pattern as section reorder
  const [savedOrder, setSavedOrder] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    if (!token || !moduleId) return;
    let cancelled = false;
    Promise.all([
      modulesApi.getById(token, moduleId),
      nodesApi.list(token, moduleId),
    ])
      .then(([modRes, nodesRes]) => {
        if (!cancelled) {
          setModule(modRes.data);
          setEditTitle(modRes.data.title);
          setEditDesc(modRes.data.description ?? "");
          setEditStatus((modRes.data.status as ModuleStatus) ?? "draft");
          setNodes(nodesRes.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load module");
          if (err instanceof ApiError && err.status === 403) {
            router.replace(`/dashboard/courses/${courseId}`);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, moduleId, courseId, router]);

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editTitle.trim()) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await modulesApi.update(token, moduleId, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        status: editStatus,
      });
      setModule((prev) => prev ? { ...prev, title: editTitle.trim(), description: editDesc.trim(), status: editStatus } : prev);
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newNodeTitle.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await nodesApi.create(token, moduleId, { title: newNodeTitle.trim() });
      setNodes((prev) => [...prev, res.data]);
      setNewNodeTitle("");
      setShowNewNode(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create node");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!token || !confirm("Delete this node and all its sections?")) return;
    setDeletingId(nodeId);
    setError("");
    try {
      await nodesApi.delete(token, nodeId);
      setNodes((prev) => prev.filter((n) => n._id !== nodeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete node");
    } finally {
      setDeletingId(null);
    }
  };

  const moveNode = (idx: number, dir: -1 | 1) => {
    const next = [...nodes];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setNodes(next);
    setSavedOrder(false);
  };

  const handleSaveNodeOrder = async () => {
    if (!token || !moduleId) return;
    setSavingOrder(true);
    setError("");
    try {
      await modulesApi.reorderNodes(token, moduleId, nodes.map((n) => n._id));
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/dashboard/courses" className="hover:text-foreground">My courses</Link>
        <span>/</span>
        <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground">Course</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{module?.title ?? "Module"}</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      {/* Module header / inline edit */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        {editing ? (
          <form onSubmit={handleSaveModule} className="space-y-3">
            <div>
              <Label htmlFor="mod-title">Title</Label>
              <Input
                id="mod-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={200}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="mod-desc">Description</Label>
              <Textarea
                id="mod-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={1000}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mod-status">Status</Label>
              <select
                id="mod-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ModuleStatus)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{module?.title}</h1>
              {module?.description && (
                <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {module?.status}
                </span>
              </div>
              {saved && <p className="text-success text-xs mt-2">Saved.</p>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Nodes section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Pages (nodes)</h2>
        <div className="flex items-center gap-2">
          {nodes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={savingOrder || savedOrder}
              onClick={handleSaveNodeOrder}
            >
              {savingOrder ? "Saving…" : "Save order"}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowNewNode((v) => !v)}>
            {showNewNode ? "Cancel" : "Add page"}
          </Button>
        </div>
      </div>
      {nodes.length > 0 && savedOrder === false && (
        <p className="text-warning text-xs mb-2">Order changed. Click &quot;Save order&quot; to persist.</p>
      )}

      {showNewNode && (
        <form
          onSubmit={handleCreateNode}
          className="mb-4 p-4 bg-card border rounded-lg flex gap-2 items-end"
        >
          <div className="flex-1">
            <Label htmlFor="new-node-title">Page title</Label>
            <Input
              id="new-node-title"
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder="e.g. What is JavaScript?"
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

      {nodes.length === 0 && !showNewNode ? (
        <p className="text-muted-foreground text-sm">No pages yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {nodes.map((node, idx) => (
            <li
              key={node._id}
              className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border"
            >
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => moveNode(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveNode(idx, 1)}
                  disabled={idx === nodes.length - 1}
                  className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <Link
                href={`/dashboard/courses/${courseId}/modules/${moduleId}/nodes/${node._id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group"
              >
                <span className="text-xs text-muted-foreground/80 w-5 shrink-0">{idx + 1}</span>
                <span className="font-medium text-foreground group-hover:underline">{node.title}</span>
                <span className="text-xs text-muted-foreground/80 shrink-0">
                  {node.sections.length} section{node.sections.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">
                  {node.status}
                </span>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === node._id}
                onClick={() => handleDeleteNode(node._id)}
              >
                {deletingId === node._id ? "..." : "Delete"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
