"use client";

import Image from "next/image";
import type { ImageSectionDTO } from "@/lib/api";

interface ImageSectionPreviewProps {
  section: ImageSectionDTO;
}

export function ImageSectionPreview({ section }: ImageSectionPreviewProps) {
  if (!section.url)
    return <p className="text-muted-foreground/80 text-sm italic">No image URL provided.</p>;
  return (
    <figure>
      <Image
        src={section.url}
        alt={section.alt || ""}
        width={800}
        height={450}
        className="max-w-full h-auto rounded-lg"
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
