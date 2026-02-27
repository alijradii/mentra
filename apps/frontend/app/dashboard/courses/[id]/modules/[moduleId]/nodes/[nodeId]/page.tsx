"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCourseWS } from "@/contexts/CourseWSContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionPreview } from "@/components/section-preview";
import {
  SectionForm,
  SectionTypePicker,
  createEmptySection,
  sectionSummary,
  SELECT_CLASS,
  ConfirmDeleteDialog,
} from "@/components/courses";
import {
  ApiError,
  nodesApi,
  type SectionDTO,
  type SectionType,
  type NodeType,
  type NodeSettingsDTO,
} from "@/lib/api";
import type { CourseWSEvent } from "shared";
import { useAutoSave, type AutoSaveStatus } from "@/hooks/use-auto-save";

type NodeStatus = "draft" | "published" | "archived";

function SaveIndicator({ meta, sections }: { meta: AutoSaveStatus; sections: AutoSaveStatus }) {
  const active = meta === "saving" || sections === "saving";
  const error = meta === "error" || sections === "error";
  const saved = !active && !error && (meta === "saved" || sections === "saved");

  if (active) return <span className="text-xs text-muted-foreground">Saving...</span>;
  if (error) return <span className="text-xs text-destructive">Error saving</span>;
  if (saved) return <span className="text-xs text-success">All changes saved</span>;
  return null;
}

function NodeEditorContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const moduleId = params?.moduleId as string;
  const nodeId = params?.nodeId as string;

  const { on, editsLocked } = useCourseWS();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nodeType, setNodeType] = useState<NodeType>("lesson");
  const [status, setStatus] = useState<NodeStatus>("draft");
  const [settings, setSettings] = useState<NodeSettingsDTO>({});
  const [loadingNode, setLoadingNode] = useState(true);

  const [sections, setSections] = useState<SectionDTO[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<SectionDTO | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState("");

  const metaAutoSave = useAutoSave(1500);
  const sectionsAutoSave = useAutoSave(1500);

  const latestMeta = useRef({ title, description, nodeType, status, settings });
  latestMeta.current = { title, description, nodeType, status, settings };

  const latestSections = useRef(sections);
  latestSections.current = sections;

  const initialLoadDone = useRef(false);

  const loadNode = useCallback(async (quiet = false) => {
    if (!token || !nodeId) return;
    if (!quiet) setLoadingNode(true);
    try {
      const res = await nodesApi.getById(token, nodeId);
      setTitle(res.data.title);
      setDescription(res.data.description ?? "");
      setNodeType(res.data.type ?? "lesson");
      setStatus((res.data.status as NodeStatus) ?? "draft");
      setSettings(res.data.settings ?? {});
      setSections(res.data.sections ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load page");
      if (err instanceof ApiError && err.status === 403) {
        router.replace(`/dashboard/courses/${courseId}/modules/${moduleId}`);
      }
    } finally {
      if (!quiet) {
        setLoadingNode(false);
        initialLoadDone.current = true;
      }
    }
  }, [token, nodeId, courseId, moduleId, router]);

  useEffect(() => {
    loadNode();
  }, [loadNode]);

  useEffect(() => {
    const unsubscribers = [
      on("node:updated", (e: CourseWSEvent) => {
        const payload = e.payload as Record<string, any>;
        if (payload.nodeId !== nodeId || e.actor.id === user?.id) return;

        if ("title" in payload) setTitle(payload.title);
        if ("description" in payload) setDescription(payload.description ?? "");
        if ("type" in payload) setNodeType(payload.type);
        if ("status" in payload) setStatus(payload.status);
        if ("settings" in payload) setSettings(payload.settings ?? {});
        if ("sections" in payload) setSections(payload.sections ?? []);
      }),
      on("snapshot:restored", (e: CourseWSEvent) => {
        if (e.actor.id === user?.id) return;
        loadNode(true);
      }),
    ];
    return () => unsubscribers.forEach((u) => u());
  }, [on, nodeId, user?.id, loadNode]);

  const doSaveMeta = useCallback(() => {
    if (!token) return Promise.resolve();
    const { title, description, nodeType, status, settings } = latestMeta.current;
    if (!title.trim()) return Promise.resolve();
    return nodesApi.update(token, nodeId, {
      title: title.trim(),
      description: description.trim() || undefined,
      type: nodeType,
      status,
      settings: nodeType !== "lesson" ? settings : undefined,
    }).then(() => {});
  }, [token, nodeId]);

  const doSaveSections = useCallback(() => {
    if (!token) return Promise.resolve();
    const normalized = latestSections.current.map((s, i) => ({ ...s, order: i }));
    return nodesApi.update(token, nodeId, { sections: normalized as any }).then(() => {
      setSections(normalized);
    });
  }, [token, nodeId]);

  const triggerMetaSave = useCallback(() => {
    if (!initialLoadDone.current) return;
    metaAutoSave.trigger(doSaveMeta);
  }, [metaAutoSave, doSaveMeta]);

  const triggerSectionsSave = useCallback(() => {
    if (!initialLoadDone.current) return;
    sectionsAutoSave.trigger(doSaveSections);
  }, [sectionsAutoSave, doSaveSections]);

  const handleAddSection = (type: SectionType) => {
    const newSection = createEmptySection(type, sections.length);
    setSections((prev) => [...prev, newSection]);
    setEditingId(newSection.id);
    setShowTypePicker(false);
    triggerSectionsSave();
  };

  const performDeleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
    triggerSectionsSave();
  };

  const handleRequestDeleteSection = (section: SectionDTO) => {
    setSectionToDelete(section);
  };

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return;
    performDeleteSection(sectionToDelete.id);
    setSectionToDelete(null);
  };

  const handleSectionChange = (updated: SectionDTO) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    triggerSectionsSave();
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
    triggerSectionsSave();
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {breadcrumb}

      {editsLocked && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 text-sm border border-amber-500/30">
          Edits are locked while the AI agent is working. You can still view the page.
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>}

      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Page settings
            </h2>
            <SaveIndicator meta={metaAutoSave.status} sections={sectionsAutoSave.status} />
          </div>
          <div className="flex items-center gap-2">
            {nodeType === "quiz" && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/nodes/${nodeId}/submissions`}>
                  View submissions
                </Link>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsPreview(true)}>
              Preview
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="node-title">Title</Label>
            <Input
              id="node-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); triggerMetaSave(); }}
              required
              maxLength={200}
              className="mt-1"
              disabled={editsLocked}
            />
          </div>
          <div>
            <Label htmlFor="node-desc">Description</Label>
            <Textarea
              id="node-desc"
              value={description}
              onChange={(e) => { setDescription(e.target.value); triggerMetaSave(); }}
              maxLength={1000}
              rows={2}
              placeholder="Optional short description"
              className="mt-1"
              disabled={editsLocked}
            />
          </div>
          <div>
            <Label htmlFor="node-type">Node type</Label>
            <select
              id="node-type"
              value={nodeType}
              onChange={(e) => { setNodeType(e.target.value as NodeType); triggerMetaSave(); }}
              className={`mt-1 ${SELECT_CLASS}`}
              disabled={editsLocked}
            >
              <option value="lesson">Lesson</option>
              <option value="practice">Practice</option>
              <option value="quiz">Quiz</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {nodeType === "lesson" && "Passive learning content. Students read and mark as complete."}
              {nodeType === "practice" && "Interactive questions with immediate feedback. Students can retry unlimited times."}
              {nodeType === "quiz" && "Graded assessment. Answers are submitted for mentor review."}
            </p>
          </div>
          {nodeType === "quiz" && (
            <div className="space-y-3 border rounded-lg p-4 bg-background">
              <h3 className="text-sm font-semibold text-muted-foreground">Quiz settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="max-attempts">Max attempts</Label>
                  <Input
                    id="max-attempts"
                    type="number"
                    min={1}
                    value={settings.maxAttempts ?? 1}
                    onChange={(e) => { setSettings({ ...settings, maxAttempts: parseInt(e.target.value) || 1 }); triggerMetaSave(); }}
                    className="mt-1"
                    disabled={editsLocked}
                  />
                </div>
                <div>
                  <Label htmlFor="time-limit">Time limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min={0}
                    placeholder="No limit"
                    value={settings.timeLimit ?? ""}
                    onChange={(e) => { setSettings({ ...settings, timeLimit: e.target.value ? parseInt(e.target.value) : undefined }); triggerMetaSave(); }}
                    className="mt-1"
                    disabled={editsLocked}
                  />
                </div>
                <div>
                  <Label htmlFor="passing-score">Passing score (%)</Label>
                  <Input
                    id="passing-score"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="None"
                    value={settings.passingScore ?? ""}
                    onChange={(e) => { setSettings({ ...settings, passingScore: e.target.value ? parseInt(e.target.value) : undefined }); triggerMetaSave(); }}
                    className="mt-1"
                    disabled={editsLocked}
                  />
                </div>
                <div>
                  <Label htmlFor="show-answers">Show correct answers</Label>
                  <select
                    id="show-answers"
                    value={settings.showCorrectAnswers ?? "after-grading"}
                    onChange={(e) => { setSettings({ ...settings, showCorrectAnswers: e.target.value as NodeSettingsDTO["showCorrectAnswers"] }); triggerMetaSave(); }}
                    className={`mt-1 ${SELECT_CLASS}`}
                    disabled={editsLocked}
                  >
                    <option value="after-grading">After grading</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="due-date">Due date</Label>
                <Input
                  id="due-date"
                  type="datetime-local"
                  value={settings.dueDate ? new Date(settings.dueDate).toISOString().slice(0, 16) : ""}
                  onChange={(e) => { setSettings({ ...settings, dueDate: e.target.value || undefined }); triggerMetaSave(); }}
                  className="mt-1"
                  disabled={editsLocked}
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="node-status">Status</Label>
            <select
              id="node-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value as NodeStatus); triggerMetaSave(); }}
              className={`mt-1 ${SELECT_CLASS}`}
              disabled={editsLocked}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sections <span className="text-muted-foreground/80 text-sm font-normal">({sections.length})</span>
        </h2>
        <Button size="sm" onClick={() => setShowTypePicker((v) => !v)} disabled={editsLocked}>
          {showTypePicker ? "Cancel" : "+ Add section"}
        </Button>
      </div>

      {showTypePicker && !editsLocked && <SectionTypePicker onSelect={handleAddSection} />}

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
                    disabled={idx === 0 || editsLocked}
                    className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === sections.length - 1 || editsLocked}
                    className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                    disabled={editsLocked}
                  >
                    {editingId === section.id ? "Close" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRequestDeleteSection(section)}
                    disabled={editsLocked}
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

      <ConfirmDeleteDialog
        open={!!sectionToDelete}
        title="Delete section"
        description="This will remove the selected section from this page."
        confirmLabel="Delete section"
        onCancel={() => setSectionToDelete(null)}
        onConfirm={handleConfirmDeleteSection}
      >
        {sectionToDelete && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Type: <span className="font-medium text-foreground">{sectionToDelete.type}</span>
            </p>
            <p className="text-xs">
              Summary: {sectionSummary(sectionToDelete)}
            </p>
          </div>
        )}
      </ConfirmDeleteDialog>
    </div>
  );
}

export default function NodeEditorPage() {
  const { token, user } = useAuth();
  const params = useParams();
  const courseId = params?.id as string;

  if (!token || !courseId || !user) return null;

  return <NodeEditorContent />;
}
