"use client";

import type { ImageSectionDTO } from "@/lib/api";

interface ImageSectionPreviewProps {
  section: ImageSectionDTO;
}

export function ImageSectionPreview({ section }: ImageSectionPreviewProps) {
  if (!section.url)
    return <p className="text-muted-foreground/80 text-sm italic">No image URL provided.</p>;
  return (
    <figure>
      <img src={section.url} alt={section.alt || ""} className="max-w-full rounded-lg" />
      {section.caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {section.caption}
        </figcaption>
      )}
    </figure>
  );
}
