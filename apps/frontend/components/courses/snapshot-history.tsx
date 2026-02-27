"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { snapshotsApi, type CourseSnapshotMetaDTO, ApiError } from "@/lib/api";

interface SnapshotTreeNode {
  snapshot: CourseSnapshotMetaDTO;
  children: SnapshotTreeNode[];
}

function buildTree(snapshots: CourseSnapshotMetaDTO[]): SnapshotTreeNode[] {
  const byId = new Map<string, SnapshotTreeNode>();
  for (const s of snapshots) {
    byId.set(s._id, { snapshot: s, children: [] });
  }
  const roots: SnapshotTreeNode[] = [];
  for (const s of snapshots) {
    const node = byId.get(s._id)!;
    if (!s.parentId || !byId.has(s.parentId)) {
      roots.push(node);
    } else {
      byId.get(s.parentId)!.children.push(node);
    }
  }
  return roots;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SnapshotNodeProps {
  node: SnapshotTreeNode;
  currentSnapshotId?: string;
  restoringId: string | null;
  onRestore: (id: string) => void;
  depth: number;
  editsLocked?: boolean;
}

function SnapshotNodeRow({
  node,
  currentSnapshotId,
  restoringId,
  onRestore,
  depth,
  editsLocked = false,
}: SnapshotNodeProps) {
  const isCurrent = node.snapshot._id === currentSnapshotId;
  return (
    <div>
      <div
        className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border transition-colors ${
          isCurrent
            ? "bg-primary/10 border-primary/30"
            : "bg-card border-border hover:bg-muted/40"
        }`}
        style={{ marginLeft: depth * 20 }}
      >
        {/* Tree connector line */}
        {depth > 0 && (
          <div className="mt-2 w-4 shrink-0 relative">
            <div className="absolute -left-4 top-1/2 w-4 h-px bg-border" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {node.snapshot.label}
            </span>
            {isCurrent && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium shrink-0">
                current
              </span>
            )}
          </div>
          {node.snapshot.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {node.snapshot.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {node.snapshot.createdBy.name} · {formatDate(node.snapshot.createdAt)}
          </p>
        </div>
        {!isCurrent && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={restoringId === node.snapshot._id || editsLocked}
            onClick={() => onRestore(node.snapshot._id)}
          >
            {restoringId === node.snapshot._id ? "Restoring…" : "Restore"}
          </Button>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 border-l border-border"
            style={{ left: (depth + 1) * 20 }}
          />
          {node.children.map((child) => (
            <SnapshotNodeRow
              key={child.snapshot._id}
              node={child}
              currentSnapshotId={currentSnapshotId}
              restoringId={restoringId}
              onRestore={onRestore}
              depth={depth + 1}
              editsLocked={editsLocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SnapshotHistoryProps {
  courseId: string;
  token: string;
  currentSnapshotId?: string;
  isOwner: boolean;
  /** Called after a successful restore so parent can refresh data */
  onRestored?: () => void;
  /** When true, create/restore snapshot actions are disabled (e.g. AI agent is editing) */
  editsLocked?: boolean;
}

export function SnapshotHistory({
  courseId,
  token,
  currentSnapshotId,
  isOwner,
  onRestored,
  editsLocked = false,
}: SnapshotHistoryProps) {
  const [snapshots, setSnapshots] = useState<CourseSnapshotMetaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await snapshotsApi.list(token, courseId);
      // Sort oldest-first so the tree builds correctly
      setSnapshots(res.data.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load snapshots");
    } finally {
      setLoading(false);
    }
  }, [token, courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await snapshotsApi.create(token, courseId, {
        label: newLabel.trim(),
        description: newDescription.trim() || undefined,
      });
      setSnapshots((prev) => [...prev, res.data]);
      setNewLabel("");
      setNewDescription("");
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Failed to create snapshot");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (snapshotId: string) => {
    setRestoringId(snapshotId);
    setRestoreError("");
    try {
      await snapshotsApi.restore(token, courseId, snapshotId);
      await load();
      onRestored?.();
    } catch (err) {
      setRestoreError(err instanceof ApiError ? err.message : "Failed to restore snapshot");
    } finally {
      setRestoringId(null);
    }
  };

  const tree = buildTree(snapshots);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Snapshots</h2>
          <p className="text-sm text-muted-foreground">
            Point-in-time captures of your course. Restore any snapshot to roll back.
          </p>
        </div>
        {isOwner && !editsLocked && (
          <Button size="sm" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? "Cancel" : "Save snapshot"}
          </Button>
        )}
      </div>

      {showCreateForm && isOwner && !editsLocked && (
        <form
          onSubmit={handleCreate}
          className="p-4 border rounded-lg bg-card space-y-3"
        >
          <div>
            <Label htmlFor="snapshot-label">Label</Label>
            <Input
              id="snapshot-label"
              className="mt-1"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Before adding quiz module"
              required
              maxLength={120}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="snapshot-description">Description (optional)</Label>
            <Textarea
              id="snapshot-description"
              className="mt-1 resize-none"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What changed since the last snapshot?"
              maxLength={500}
            />
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={creating || !newLabel.trim()}>
              {creating ? "Saving…" : "Save snapshot"}
            </Button>
          </div>
        </form>
      )}

      {restoreError && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {restoreError}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Loading snapshots…</p>
      ) : snapshots.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground text-sm">No snapshots yet.</p>
          {isOwner && (
            <p className="text-muted-foreground text-xs mt-1">
              Click &quot;Save snapshot&quot; to capture the current state.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map((root) => (
            <SnapshotNodeRow
              key={root.snapshot._id}
              node={root}
              currentSnapshotId={currentSnapshotId}
              restoringId={restoringId}
              onRestore={handleRestore}
              depth={0}
              editsLocked={editsLocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
