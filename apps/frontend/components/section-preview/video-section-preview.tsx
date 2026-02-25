"use client";

import type { VideoSectionDTO } from "@/lib/api";

interface VideoSectionPreviewProps {
  section: VideoSectionDTO;
}

export function VideoSectionPreview({ section }: VideoSectionPreviewProps) {
  if (!section.url)
    return <p className="text-muted-foreground/80 text-sm italic">No video URL provided.</p>;
  return (
    <figure>
      <video controls src={section.url} className="w-full rounded-lg" />
      {section.caption && (
        <figcaption className="text-sm text-muted-foreground mt-2">{section.caption}</figcaption>
      )}
    </figure>
  );
}
