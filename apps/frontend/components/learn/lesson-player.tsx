"use client";

import { SectionPreview } from "@/components/section-preview";
import type { NodeDTO } from "@/lib/api";

interface LessonPlayerProps {
  node: NodeDTO;
}

export function LessonPlayer({ node }: LessonPlayerProps) {
  const sections = (node.sections ?? []).filter((s) => s.type !== "page-break");

  if (sections.length === 0) {
    return (
      <p className="text-muted-foreground/80 italic text-sm">
        This lesson has no content yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id}>
          <SectionPreview section={section} />
        </div>
      ))}
    </div>
  );
}
