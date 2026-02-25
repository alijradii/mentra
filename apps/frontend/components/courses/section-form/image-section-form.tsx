"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImageSectionDTO } from "@/lib/api";

interface ImageSectionFormProps {
  section: ImageSectionDTO;
  onChange: (updated: ImageSectionDTO) => void;
}

export function ImageSectionForm({ section, onChange }: ImageSectionFormProps) {
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
