"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  nodesApi,
  type SectionDTO,
  type SectionType,
  type EmbeddingSectionDTO,
  type QuizSectionDTO,
} from "@/lib/api";
import { ApiError } from "@/lib/api";

type NodeStatus = "draft" | "published" | "archived";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return crypto.randomUUID();
}

function createEmptySection(type: SectionType, order: number): SectionDTO {
  const base = {
    id: genId(),
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  switch (type) {
    case "text":      return { ...base, type, content: "", format: "markdown" };
    case "image":     return { ...base, type, url: "", alt: "", caption: "" };
    case "video":     return { ...base, type, url: "", caption: "" };
    case "embedding": return { ...base, type, url: "", embedType: "youtube", title: "" };
    case "code":      return { ...base, type, code: "", language: "javascript" };
    case "quiz":      return {
      ...base, type,
      question: "",
      options: [
        { id: genId(), text: "", order: 0 },
        { id: genId(), text: "", order: 1 },
      ],
      correctAnswers: [],
      explanation: "",
      points: 10,
    };
  }
}

function sectionSummary(s: SectionDTO): string {
  switch (s.type) {
    case "text":      return s.content ? s.content.slice(0, 80) + (s.content.length > 80 ? "…" : "") : "(empty)";
    case "image":     return s.url || "(no URL)";
    case "video":     return s.url || "(no URL)";
    case "embedding": return s.url || "(no URL)";
    case "code":      return s.language || "(no language)";
    case "quiz":      return s.question || "(no question)";
  }
}

function getEmbedUrl(section: EmbeddingSectionDTO): string {
  const url = section.url;
  if (section.embedType === "youtube") {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (section.embedType === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
}

const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "text",      label: "Text" },
  { type: "image",     label: "Image" },
  { type: "video",     label: "Video" },
  { type: "embedding", label: "Embed" },
  { type: "code",      label: "Code" },
  { type: "quiz",      label: "Quiz" },
];

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

// ─── Preview: interactive quiz ────────────────────────────────────────────────

function QuizPreview({ section }: { section: QuizSectionDTO }) {
  const isMultiple = section.correctAnswers.length > 1;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (optId: string) => {
    if (submitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
      );
    } else {
      setSelected([optId]);
    }
  };

  const isCorrect =
    submitted &&
    selected.length === section.correctAnswers.length &&
    selected.every((id) => section.correctAnswers.includes(id));

  return (
    <div className="space-y-3">
      <p className="font-semibold text-foreground text-base">{section.question}</p>
      <div className="space-y-2">
        {section.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isThisCorrect = section.correctAnswers.includes(opt.id);
          let cls = "border-border bg-card hover:bg-background";
          if (submitted) {
            if (isThisCorrect) cls = "border-success bg-success/15";
            else if (isSelected) cls = "border-destructive bg-destructive/15";
          } else if (isSelected) {
            cls = "border-primary bg-background";
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected.length === 0}>
          Check answer
        </Button>
      ) : (
        <div
          className={`p-3 rounded-lg text-sm ${
            isCorrect ? "bg-success/15 text-success border border-success/40" : "bg-destructive/15 text-destructive border border-destructive/40"
          }`}
        >
          <p className="font-semibold">{isCorrect ? "Correct!" : "Not quite."}</p>
          {section.explanation && <p className="mt-1">{section.explanation}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Preview: section renderer ────────────────────────────────────────────────

function SectionPreview({ section }: { section: SectionDTO }) {
  if (section.type === "text") {
    if (section.format === "plain") {
      return <p className="whitespace-pre-wrap text-foreground leading-relaxed">{section.content || ""}</p>;
    }
    if (section.format === "html") {
      return <div dangerouslySetInnerHTML={{ __html: section.content }} />;
    }
    return (
      <div className="markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");
              if (!match) {
                return <code className={className} {...props}>{children}</code>;
              }
              return (
                <SyntaxHighlighter
                  language={match[1]}
                  style={oneLight}
                  PreTag="div"
                  customStyle={{ borderRadius: "0.5rem", fontSize: "0.875rem", margin: "0.75rem 0" }}
                >
                  {codeString}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {section.content || ""}
        </ReactMarkdown>
      </div>
    );
  }

  if (section.type === "image") {
    if (!section.url) return <p className="text-muted-foreground/80 text-sm italic">No image URL provided.</p>;
    return (
      <figure>
        <img
          src={section.url}
          alt={section.alt || ""}
          className="max-w-full rounded-lg"
        />
        {section.caption && (
          <figcaption className="text-sm text-muted-foreground mt-2 text-center">
            {section.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "video") {
    if (!section.url) return <p className="text-muted-foreground/80 text-sm italic">No video URL provided.</p>;
    return (
      <figure>
        <video controls src={section.url} className="w-full rounded-lg" />
        {section.caption && (
          <figcaption className="text-sm text-muted-foreground mt-2">{section.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "embedding") {
    if (!section.url) return <p className="text-muted-foreground/80 text-sm italic">No embed URL provided.</p>;
    return (
      <div>
        {section.title && (
          <p className="text-sm font-medium text-foreground mb-2">{section.title}</p>
        )}
        <iframe
          src={getEmbedUrl(section)}
          className="w-full rounded-lg"
          style={{ aspectRatio: "16/9", border: "none" }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={section.title || "Embedded content"}
        />
      </div>
    );
  }

  if (section.type === "code") {
    return (
      <SyntaxHighlighter
        language={section.language || "text"}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{ borderRadius: "0.5rem", fontSize: "0.875rem" }}
      >
        {section.code || ""}
      </SyntaxHighlighter>
    );
  }

  if (section.type === "quiz") {
    return <QuizPreview section={section} />;
  }

  return null;
}

// ─── Editor: section form ─────────────────────────────────────────────────────

function SectionForm({
  section,
  onChange,
}: {
  section: SectionDTO;
  onChange: (updated: SectionDTO) => void;
}) {
  if (section.type === "text") {
    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = "  ";
      const newValue =
        textarea.value.slice(0, start) + indent + textarea.value.slice(end);
      onChange({ ...section, content: newValue });
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indent.length;
      });
    };

    return (
      <div className="space-y-3">
        <div>
          <Label>Content</Label>
          <Textarea
            value={section.content}
            onChange={(e) => onChange({ ...section, content: e.target.value })}
            onKeyDown={handleTab}
            rows={8}
            placeholder="Write your content here…"
            className="mt-1 font-mono text-xs"
          />
        </div>
        <div>
          <Label>Format</Label>
          <select
            value={section.format}
            onChange={(e) =>
              onChange({ ...section, format: e.target.value as "markdown" | "html" | "plain" })
            }
            className={`mt-1 ${SELECT_CLASS}`}
          >
            <option value="markdown">Markdown</option>
            <option value="plain">Plain text</option>
            <option value="html">HTML</option>
          </select>
        </div>
      </div>
    );
  }

  if (section.type === "image") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Image URL</Label>
          <Input value={section.url} onChange={(e) => onChange({ ...section, url: e.target.value })} placeholder="https://…" className="mt-1" />
        </div>
        <div>
          <Label>Alt text</Label>
          <Input value={section.alt ?? ""} onChange={(e) => onChange({ ...section, alt: e.target.value })} placeholder="Describe the image" className="mt-1" />
        </div>
        <div>
          <Label>Caption</Label>
          <Input value={section.caption ?? ""} onChange={(e) => onChange({ ...section, caption: e.target.value })} placeholder="Optional caption" className="mt-1" />
        </div>
      </div>
    );
  }

  if (section.type === "video") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Video URL</Label>
          <Input value={section.url} onChange={(e) => onChange({ ...section, url: e.target.value })} placeholder="https://…" className="mt-1" />
        </div>
        <div>
          <Label>Caption</Label>
          <Input value={section.caption ?? ""} onChange={(e) => onChange({ ...section, caption: e.target.value })} placeholder="Optional caption" className="mt-1" />
        </div>
      </div>
    );
  }

  if (section.type === "embedding") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Embed URL</Label>
          <Input value={section.url} onChange={(e) => onChange({ ...section, url: e.target.value })} placeholder="https://…" className="mt-1" />
        </div>
        <div>
          <Label>Type</Label>
          <select
            value={section.embedType}
            onChange={(e) =>
              onChange({
                ...section,
                embedType: e.target.value as "youtube" | "vimeo" | "codepen" | "codesandbox" | "other",
              })
            }
            className={`mt-1 ${SELECT_CLASS}`}
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="codepen">CodePen</option>
            <option value="codesandbox">CodeSandbox</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={section.title ?? ""} onChange={(e) => onChange({ ...section, title: e.target.value })} placeholder="Optional title" className="mt-1" />
        </div>
      </div>
    );
  }

  if (section.type === "code") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Language</Label>
          <Input value={section.language} onChange={(e) => onChange({ ...section, language: e.target.value })} placeholder="e.g. javascript, python" className="mt-1" />
        </div>
        <div>
          <Label>Code</Label>
          <Textarea
            value={section.code}
            onChange={(e) => onChange({ ...section, code: e.target.value })}
            rows={8}
            placeholder="Paste your code here…"
            className="mt-1 font-mono text-xs"
          />
        </div>
      </div>
    );
  }

  if (section.type === "quiz") {
    const toggleCorrect = (optId: string) => {
      const next = section.correctAnswers.includes(optId)
        ? section.correctAnswers.filter((id) => id !== optId)
        : [...section.correctAnswers, optId];
      onChange({ ...section, correctAnswers: next });
    };
    const updateOption = (optId: string, text: string) => {
      onChange({
        ...section,
        options: section.options.map((o) => (o.id === optId ? { ...o, text } : o)),
      });
    };
    const addOption = () => {
      onChange({
        ...section,
        options: [...section.options, { id: genId(), text: "", order: section.options.length }],
      });
    };
    const removeOption = (optId: string) => {
      onChange({
        ...section,
        options: section.options.filter((o) => o.id !== optId),
        correctAnswers: section.correctAnswers.filter((id) => id !== optId),
      });
    };

    return (
      <div className="space-y-3">
        <div>
          <Label>Question</Label>
          <Input value={section.question} onChange={(e) => onChange({ ...section, question: e.target.value })} placeholder="Enter the question" className="mt-1" />
        </div>
        <div>
          <Label>
            Options{" "}
            <span className="text-muted-foreground/80 font-normal">(check correct answers)</span>
          </Label>
          <div className="mt-1 space-y-2">
            {section.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={section.correctAnswers.includes(opt.id)}
                  onChange={() => toggleCorrect(opt.id)}
                  className="h-4 w-4 rounded border-border"
                />
                <Input
                  value={opt.text}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  placeholder={`Option ${section.options.indexOf(opt) + 1}`}
                  className="flex-1"
                />
                {section.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="text-destructive hover:text-destructive text-sm px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              + Add option
            </Button>
          </div>
        </div>
        <div>
          <Label>
            Explanation{" "}
            <span className="text-muted-foreground/80 font-normal">(optional)</span>
          </Label>
          <Textarea
            value={section.explanation ?? ""}
            onChange={(e) => onChange({ ...section, explanation: e.target.value })}
            rows={2}
            placeholder="Shown after answering"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

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

  // ── Breadcrumb (shared) ──
  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
      <Link href="/dashboard/courses" className="hover:text-foreground">My courses</Link>
      <span>/</span>
      <Link href={`/dashboard/courses/${courseId}`} className="hover:text-foreground">Course</Link>
      <span>/</span>
      <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`} className="hover:text-foreground">Module</Link>
      <span>/</span>
      <span className="text-foreground font-medium">{title || "Page"}</span>
    </div>
  );

  // ════════════════════════════════════════════
  // PREVIEW MODE
  // ════════════════════════════════════════════
  if (isPreview) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {breadcrumb}

        {/* Preview banner */}
        <div className="flex items-center justify-between mb-8 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm">
          <span className="font-medium">Preview mode</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPreview(false)}
            className="text-foreground"
          >
            Back to editing
          </Button>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-base">{description}</p>
          )}
        </div>

        {/* Sections rendered */}
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

  // ════════════════════════════════════════════
  // EDIT MODE
  // ════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {breadcrumb}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      {/* ── Page settings ── */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Page settings
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPreview(true)}
          >
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

      {/* ── Sections ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sections{" "}
          <span className="text-muted-foreground/80 text-sm font-normal">({sections.length})</span>
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

      {/* Type picker */}
      {showTypePicker && (
        <div className="mb-4 p-4 bg-card border rounded-lg flex flex-wrap gap-2">
          <p className="w-full text-sm text-muted-foreground mb-1">Choose section type:</p>
          {SECTION_TYPES.map(({ type, label }) => (
            <Button key={type} variant="outline" size="sm" onClick={() => handleAddSection(type)}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* Sections list */}
      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No sections yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} className="bg-card border rounded-lg overflow-hidden">
              {/* Section header */}
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

              {/* Section edit form */}
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
