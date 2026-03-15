"use client";

import type { ImageSectionDTO } from "@/lib/api";

interface ImageSectionPreviewProps {
  section: ImageSectionDTO;
}

/**
 * Uses native <img> so users can embed images from any domain without
 * configuring next.config.js. next/image only allows explicitly listed domains.
 */
export function ImageSectionPreview({ section }: ImageSectionPreviewProps) {
  if (!section.url)
    return <p className="text-muted-foreground/80 text-sm italic">No image URL provided.</p>;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={section.url}
        alt={section.alt || ""}
        className="max-w-full h-auto rounded-lg"
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 800px"
      />
      {section.caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {section.caption}
        </figcaption>
      )}
    </figure>
  );
}
