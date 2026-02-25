"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CodeSectionDTO } from "@/lib/api";

interface CodeSectionFormProps {
  section: CodeSectionDTO;
  onChange: (updated: CodeSectionDTO) => void;
}

export function CodeSectionForm({ section, onChange }: CodeSectionFormProps) {
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
