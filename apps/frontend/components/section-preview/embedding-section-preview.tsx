"use client";

import type { EmbeddingSectionDTO } from "@/lib/api";
import { getEmbedUrl } from "./utils";

interface EmbeddingSectionPreviewProps {
  section: EmbeddingSectionDTO;
}

export function EmbeddingSectionPreview({ section }: EmbeddingSectionPreviewProps) {
  if (!section.url)
    return <p className="text-muted-foreground/80 text-sm italic">No embed URL provided.</p>;
  return (
    <div>
      {section.title && (
        <p className="text-sm font-medium text-foreground mb-2">{section.title}</p>
      )}
      <iframe
        src={getEmbedUrl(section)}
        className="w-full rounded-lg"
        style={{ aspectRatio: "16/9", border: "none" }}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={section.title || "Embedded content"}
      />
    </div>
  );
}
