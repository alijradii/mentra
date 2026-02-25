"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionPreview } from "@/components/section-preview";
import {
  SectionForm,
  SectionTypePicker,
  genId,
  createEmptySection,
  sectionSummary,
  SELECT_CLASS,
} from "@/components/courses";
import {
  ApiError,
  nodesApi,
  type SectionDTO,
  type SectionType,
} from "@/lib/api";

type NodeStatus = "draft" | "published" | "archived";

export default function NodeEditorPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const moduleId = params?.moduleId as string;
  const nodeId = params?.nodeId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<NodeStatus>("draft");
  const [loadingNode, setLoadingNode] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savedMeta, setSavedMeta] = useState(false);

  const [sections, setSections] = useState<SectionDTO[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingSections, setSavingSections] = useState(false);
  const [savedSections, setSavedSections] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !nodeId) return;
    let cancelled = false;
    nodesApi
      .getById(token, nodeId)
      .then((res) => {
        if (!cancelled) {
          setTitle(res.data.title);
          setDescription(res.data.description ?? "");
          setStatus((res.data.status as NodeStatus) ?? "draft");
          setSections(res.data.sections ?? []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load page");
          if (err instanceof ApiError && err.status === 403) {
            router.replace(`/dashboard/courses/${courseId}/modules/${moduleId}`);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingNode(false);
      });
    return () => { cancelled = true; };
  }, [token, nodeId, courseId, moduleId, router]);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setSavingMeta(true);
    setSavedMeta(false);
    setError("");
    try {
      await nodesApi.update(token, nodeId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      });
      setSavedMeta(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveSections = async () => {
    if (!token) return;
    setSavingSections(true);
    setSavedSections(false);
    setError("");
    const normalized = sections.map((s, i) => ({ ...s, order: i }));
    try {
      await nodesApi.update(token, nodeId, { sections: normalized as any });
      setSections(normalized);
      setSavedSections(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save sections");
    } finally {
      setSavingSections(false);
    }
  };

  const handleAddSection = (type: SectionType) => {
    const newSection = createEmptySection(type, sections.length);
    setSections((prev) => [...prev, newSection]);
    setEditingId(newSection.id);
    setShowTypePicker(false);
    setSavedSections(false);
  };

  const handleDeleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
    setSavedSections(false);
  };

  const handleSectionChange = (updated: SectionDTO) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSavedSections(false);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
    setSavedSections(false);
  };

  if (!user) return null;

  if (loadingNode) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
      <Link href="/dashboard/courses" className="hover:text-foreground">
        My courses
      </Link>
      <span>/</span>
      <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground">
        Course
      </Link>
      <span>/</span>
      <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground">
        Module
      </Link>
      <span>/</span>
      <span className="text-foreground font-medium">{title || "Page"}</span>
    </div>
  );

  // ── Preview mode ──
  if (isPreview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {breadcrumb}

        <div className="flex items-center justify-between mb-8 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm">
          <span className="font-medium">Preview mode</span>
          <Button size="sm" variant="outline" onClick={() => setIsPreview(false)} className="text-foreground">
            Back to editing
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-2 text-base">{description}</p>}
        </div>

        {sections.length === 0 ? (
          <p className="text-muted-foreground/80 italic">This page has no sections yet.</p>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id}>
                <SectionPreview section={section} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {breadcrumb}

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>}

      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Page settings
          </h2>
          <Button size="sm" variant="outline" onClick={() => setIsPreview(true)}>
            Preview
          </Button>
        </div>
        <form onSubmit={handleSaveMeta} className="space-y-3">
          <div>
            <Label htmlFor="node-title">Title</Label>
            <Input
              id="node-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setSavedMeta(false); }}
              required
              maxLength={200}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="node-desc">Description</Label>
            <Textarea
              id="node-desc"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setSavedMeta(false); }}
              maxLength={1000}
              rows={2}
              placeholder="Optional short description"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="node-status">Status</Label>
            <select
              id="node-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as NodeStatus); setSavedMeta(false); }}
              className={`mt-1 ${SELECT_CLASS}`}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={savingMeta}>
              {savingMeta ? "Saving…" : "Save settings"}
            </Button>
            {savedMeta && <span className="text-success text-xs">Saved.</span>}
          </div>
        </form>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sections <span className="text-muted-foreground/80 text-sm font-normal">({sections.length})</span>
        </h2>
        <div className="flex gap-2">
          {sections.length > 0 && (
            <Button size="sm" variant="outline" disabled={savingSections} onClick={handleSaveSections}>
              {savingSections ? "Saving…" : "Save sections"}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowTypePicker((v) => !v)}>
            {showTypePicker ? "Cancel" : "+ Add section"}
          </Button>
        </div>
      </div>

      {savedSections && <p className="text-success text-xs mb-3">Sections saved.</p>}

      {showTypePicker && <SectionTypePicker onSelect={handleAddSection} />}

      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No sections yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} className="bg-card border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
                <span className="text-xs font-semibold text-muted-foreground/80 uppercase w-16 shrink-0">
                  {section.type}
                </span>
                <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
                  {sectionSummary(section)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                  >
                    {editingId === section.id ? "Close" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {editingId === section.id && (
                <div className="p-4">
                  <SectionForm section={section} onChange={handleSectionChange} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" disabled={savingSections} onClick={handleSaveSections}>
            {savingSections ? "Saving…" : "Save sections"}
          </Button>
          {savedSections && <span className="text-success text-xs">Saved.</span>}
        </div>
      )}
    </div>
  );
}
