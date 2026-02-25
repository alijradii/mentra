"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TextSectionDTO } from "@/lib/api";
import { SELECT_CLASS } from "./utils";

interface TextSectionFormProps {
  section: TextSectionDTO;
  onChange: (updated: TextSectionDTO) => void;
}

export function TextSectionForm({ section, onChange }: TextSectionFormProps) {
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
