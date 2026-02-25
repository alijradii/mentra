"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SectionDTO, SectionType } from "@/lib/api";

export function genId(): string {
  return crypto.randomUUID();
}

export function createEmptySection(type: SectionType, order: number): SectionDTO {
  const base = {
    id: genId(),
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  switch (type) {
    case "text":
      return { ...base, type, content: "", format: "markdown" };
    case "image":
      return { ...base, type, url: "", alt: "", caption: "" };
    case "video":
      return { ...base, type, url: "", caption: "" };
    case "embedding":
      return { ...base, type, url: "", embedType: "youtube", title: "" };
    case "code":
      return { ...base, type, code: "", language: "javascript" };
    case "quiz":
      return {
        ...base,
        type,
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

export function sectionSummary(s: SectionDTO): string {
  switch (s.type) {
    case "text":
      return s.content ? s.content.slice(0, 80) + (s.content.length > 80 ? "…" : "") : "(empty)";
    case "image":
      return s.url || "(no URL)";
    case "video":
      return s.url || "(no URL)";
    case "embedding":
      return s.url || "(no URL)";
    case "code":
      return s.language || "(no language)";
    case "quiz":
      return s.question || "(no question)";
  }
}

export const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
  { type: "video", label: "Video" },
  { type: "embedding", label: "Embed" },
  { type: "code", label: "Code" },
  { type: "quiz", label: "Quiz" },
];

export const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface SectionFormProps {
  section: SectionDTO;
  onChange: (updated: SectionDTO) => void;
}

export function SectionForm({ section, onChange }: SectionFormProps) {
  if (section.type === "text") {
    const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") return;
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indent = "  ";
      const newValue = textarea.value.slice(0, start) + indent + textarea.value.slice(end);
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
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://…"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Alt text</Label>
          <Input
            value={section.alt ?? ""}
            onChange={(e) => onChange({ ...section, alt: e.target.value })}
            placeholder="Describe the image"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Caption</Label>
          <Input
            value={section.caption ?? ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value })}
            placeholder="Optional caption"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "video") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Video URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://…"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Caption</Label>
          <Input
            value={section.caption ?? ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value })}
            placeholder="Optional caption"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "embedding") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Embed URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://…"
            className="mt-1"
          />
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
          <Input
            value={section.title ?? ""}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            placeholder="Optional title"
            className="mt-1"
          />
        </div>
      </div>
    );
  }

  if (section.type === "code") {
    return (
      <div className="space-y-3">
        <div>
          <Label>Language</Label>
          <Input
            value={section.language}
            onChange={(e) => onChange({ ...section, language: e.target.value })}
            placeholder="e.g. javascript, python"
            className="mt-1"
          />
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
          <Input
            value={section.question}
            onChange={(e) => onChange({ ...section, question: e.target.value })}
            placeholder="Enter the question"
            className="mt-1"
          />
        </div>
        <div>
          <Label>
            Options <span className="text-muted-foreground/80 font-normal">(check correct answers)</span>
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
            Explanation <span className="text-muted-foreground/80 font-normal">(optional)</span>
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
