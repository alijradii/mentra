"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NodeListItem } from "@/components/courses/node-list-item";
import { ConfirmDeleteDialog, sectionSummary } from "@/components/courses";
import { modulesApi, nodesApi, type ModuleDTO, type NodeDTO, ApiError } from "@/lib/api";
import { useAutoSave } from "@/hooks/use-auto-save";

type ModuleStatus = "draft" | "published" | "archived";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<ModuleStatus>("draft");

  const [showNewNode, setShowNewNode] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<NodeDTO | null>(null);

  const metaAutoSave = useAutoSave(1500);
  const latestMeta = useRef({ editTitle, editDesc, editStatus });
  latestMeta.current = { editTitle, editDesc, editStatus };

  const [orderSaveStatus, setOrderSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const orderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNodesRef = useRef(nodes);
  latestNodesRef.current = nodes;

  const initialLoadDone = useRef(false);

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
          initialLoadDone.current = true;
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

  const doSaveMeta = useCallback(async () => {
    if (!token) return;
    const { editTitle, editDesc, editStatus } = latestMeta.current;
    if (!editTitle.trim()) return;
    await modulesApi.update(token, moduleId, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      status: editStatus,
    });
    setModule((prev) => prev ? {
      ...prev,
      title: latestMeta.current.editTitle.trim(),
      description: latestMeta.current.editDesc.trim(),
      status: latestMeta.current.editStatus,
    } : prev);
  }, [token, moduleId]);

  const triggerMetaSave = useCallback(() => {
    if (!initialLoadDone.current) return;
    metaAutoSave.trigger(doSaveMeta);
  }, [metaAutoSave, doSaveMeta]);

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

  const handleRequestDeleteNode = (nodeId: string) => {
    const node = nodes.find((n) => n._id === nodeId) ?? null;
    if (node) {
      setNodeToDelete(node);
    }
  };

  const handleConfirmDeleteNode = async () => {
    if (!token || !nodeToDelete) return;
    const nodeId = nodeToDelete._id;
    setDeletingId(nodeId);
    setError("");
    try {
      await nodesApi.delete(token, nodeId);
      setNodes((prev) => prev.filter((n) => n._id !== nodeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete node");
    } finally {
      setDeletingId(null);
      setNodeToDelete(null);
    }
  };

  const saveNodeOrder = useCallback(async () => {
    if (!token || !moduleId) return;
    setOrderSaveStatus("saving");
    try {
      await modulesApi.reorderNodes(token, moduleId, latestNodesRef.current.map((n) => n._id));
      setOrderSaveStatus("saved");
    } catch {
      setOrderSaveStatus("error");
    }
  }, [token, moduleId]);

  const moveNode = (idx: number, dir: -1 | 1) => {
    const next = [...nodes];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setNodes(next);

    if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    setOrderSaveStatus("idle");
    orderTimerRef.current = setTimeout(() => saveNodeOrder(), 1500);
  };

  useEffect(() => {
    return () => {
      if (orderTimerRef.current) clearTimeout(orderTimerRef.current);
    };
  }, []);

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

      <div className="bg-card border rounded-lg p-6 mb-8">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Edit module</h2>
                {metaAutoSave.status === "saving" && <span className="text-xs text-muted-foreground">Saving...</span>}
                {metaAutoSave.status === "saved" && <span className="text-xs text-success">Saved</span>}
                {metaAutoSave.status === "error" && <span className="text-xs text-destructive">Error saving</span>}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Done
              </Button>
            </div>
            <div>
              <Label htmlFor="mod-title">Title</Label>
              <Input
                id="mod-title"
                value={editTitle}
                onChange={(e) => { setEditTitle(e.target.value); triggerMetaSave(); }}
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
                onChange={(e) => { setEditDesc(e.target.value); triggerMetaSave(); }}
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
                onChange={(e) => { setEditStatus(e.target.value as ModuleStatus); triggerMetaSave(); }}
                className={`mt-1 ${SELECT_CLASS}`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
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
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">Pages (nodes)</h2>
          {orderSaveStatus === "saving" && <span className="text-xs text-muted-foreground">Saving order...</span>}
          {orderSaveStatus === "saved" && <span className="text-xs text-success">Order saved</span>}
          {orderSaveStatus === "error" && <span className="text-xs text-destructive">Failed to save order</span>}
        </div>
        <Button size="sm" onClick={() => setShowNewNode((v) => !v)}>
          {showNewNode ? "Cancel" : "Add page"}
        </Button>
      </div>

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
            <NodeListItem
              key={node._id}
              node={node}
              idx={idx}
              total={nodes.length}
              courseId={courseId}
              moduleId={moduleId}
              deletingId={deletingId}
              onDelete={handleRequestDeleteNode}
              onMoveUp={() => moveNode(idx, -1)}
              onMoveDown={() => moveNode(idx, 1)}
            />
          ))}
        </ul>
      )}

      <ConfirmDeleteDialog
        open={!!nodeToDelete}
        title="Delete page"
        description="This will permanently delete the selected page and its sections."
        confirmLabel="Delete page"
        loading={!!(nodeToDelete && deletingId === nodeToDelete._id)}
        onCancel={() => setNodeToDelete(null)}
        onConfirm={handleConfirmDeleteNode}
      >
        {nodeToDelete && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Page: <span className="font-medium text-foreground">"{nodeToDelete.title}"</span>
            </p>
            <p className="text-xs">
              It currently has {nodeToDelete.sections.length} section
              {nodeToDelete.sections.length === 1 ? "" : "s"}.
            </p>
            {nodeToDelete.sections.length > 0 && (
              <ul className="text-xs list-disc pl-5 space-y-0.5 mt-1">
                {nodeToDelete.sections.slice(0, 5).map((s) => (
                  <li key={s.id}>{sectionSummary(s)}</li>
                ))}
                {nodeToDelete.sections.length > 5 && (
                  <li>…and {nodeToDelete.sections.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        )}
      </ConfirmDeleteDialog>
    </div>
  );
}
