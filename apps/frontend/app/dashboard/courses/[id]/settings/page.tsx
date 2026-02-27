"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/courses";
import { coursesApi, ApiError } from "@/lib/api";
import { useAutoSave } from "@/hooks/use-auto-save";

type Visibility = "public" | "private";
type Status = "draft" | "published" | "archived";

export default function CourseSettingsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [status, setStatus] = useState<Status>("draft");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState("");

  const autoSave = useAutoSave(1500);
  const latestFields = useRef({ title, description, visibility, status });
  latestFields.current = { title, description, visibility, status };
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    coursesApi
      .getById(token, id)
      .then((res) => {
        if (!cancelled) {
          setTitle(res.data.title);
          setDescription(res.data.description ?? "");
          setVisibility((res.data.visibility as Visibility) ?? "public");
          setStatus((res.data.status as Status) ?? "draft");
          setOwnerId(res.data.ownerId ?? null);
          initialLoadDone.current = true;
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

  const doSave = useCallback(async () => {
    if (!token || !id) return;
    const { title, description, visibility, status } = latestFields.current;
    if (!title.trim()) return;
    setError("");
    await coursesApi.update(token, id, {
      title: title.trim(),
      description: description.trim(),
      visibility,
      status,
    });
  }, [token, id]);

  const triggerSave = useCallback(() => {
    if (!initialLoadDone.current) return;
    autoSave.trigger(doSave);
  }, [autoSave, doSave]);

  const handleConfirmDelete = async () => {
    if (!token || !id) return;
    setError("");
    setDeleting(true);
    try {
      await coursesApi.delete(token, id);
      setShowDeleteDialog(false);
      router.push("/dashboard/courses");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
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
        <Link href={`/dashboard/courses/${id}`} className="hover:text-foreground">{title || "Course"}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Settings</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Course settings</h1>
        {autoSave.status === "saving" && <span className="text-xs text-muted-foreground">Saving...</span>}
        {autoSave.status === "saved" && <span className="text-xs text-success">All changes saved</span>}
        {autoSave.status === "error" && <span className="text-xs text-destructive">Error saving</span>}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      <div className="max-w-md">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); triggerSave(); }}
              placeholder="Course title"
              required
              maxLength={200}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); triggerSave(); }}
              placeholder="Brief description of the course"
              maxLength={5000}
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => { setVisibility(e.target.value as Visibility); triggerSave(); }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as Status); triggerSave(); }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/courses/${id}`}>Back to course</Link>
          </Button>
        </div>

        {user && ownerId && user.id === ownerId && (
          <div className="mt-10 pt-8 border-t">
            <h2 className="text-sm font-medium text-foreground mb-3">Danger zone</h2>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
            >
              Delete course
            </Button>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        title="Delete course"
        description="This will permanently delete the course and all its modules, pages, and sections. This cannot be undone."
        confirmLabel="Delete course"
        loading={deleting}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
      >
        <div className="text-sm text-muted-foreground">
          <p>
            Course: <span className="font-medium text-foreground">&quot;{title || "Untitled"}&quot;</span>
          </p>
          {description && (
            <p className="text-xs mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </ConfirmDeleteDialog>
    </div>
  );
}
