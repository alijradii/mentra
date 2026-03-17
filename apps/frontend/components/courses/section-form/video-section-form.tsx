"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/lib/uploadthing";
import type { VideoSectionDTO } from "@/lib/api";

interface VideoSectionFormProps {
  section: VideoSectionDTO;
  onChange: (updated: VideoSectionDTO) => void;
}

export function VideoSectionForm({ section, onChange }: VideoSectionFormProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label>Video URL</Label>
          <Input
            value={section.url}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
            placeholder="https://…"
            className="mt-1"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Or upload</Label>
          <UploadButton
            endpoint="videoSection"
            onClientUploadComplete={(res) => {
              const first = res?.[0] as { url?: string; serverData?: { url?: string } } | undefined;
              const url = first?.url ?? first?.serverData?.url;
              if (url) {
                onChange({ ...section, url });
              }
            }}
            content={{ button: section.url ? "Replace video" : "Upload video" }}
          />
        </div>
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
