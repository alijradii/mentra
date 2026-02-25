"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmbeddingSectionDTO } from "@/lib/api";
import { SELECT_CLASS } from "./utils";

interface EmbeddingSectionFormProps {
  section: EmbeddingSectionDTO;
  onChange: (updated: EmbeddingSectionDTO) => void;
}

export function EmbeddingSectionForm({ section, onChange }: EmbeddingSectionFormProps) {
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
