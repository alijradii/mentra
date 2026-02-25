"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VideoSectionDTO } from "@/lib/api";

interface VideoSectionFormProps {
  section: VideoSectionDTO;
  onChange: (updated: VideoSectionDTO) => void;
}

export function VideoSectionForm({ section, onChange }: VideoSectionFormProps) {
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
