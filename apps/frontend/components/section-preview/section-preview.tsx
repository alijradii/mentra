"use client";

import type { SectionPreviewProps } from "./types";
import { TextSectionPreview } from "./text-section-preview";
import { ImageSectionPreview } from "./image-section-preview";
import { VideoSectionPreview } from "./video-section-preview";
import { EmbeddingSectionPreview } from "./embedding-section-preview";
import { CodeSectionPreview } from "./code-section-preview";
import { QuizPreview } from "./quiz-previews";

export function SectionPreview({ section }: SectionPreviewProps) {
  if (section.type === "text") {
    return <TextSectionPreview section={section} />;
  }

  if (section.type === "image") {
    return <ImageSectionPreview section={section} />;
  }

  if (section.type === "video") {
    return <VideoSectionPreview section={section} />;
  }

  if (section.type === "embedding") {
    return <EmbeddingSectionPreview section={section} />;
  }

  if (section.type === "code") {
    return <CodeSectionPreview section={section} />;
  }

  if (section.type === "quiz") {
    return <QuizPreview section={section} />;
  }

  return null;
}
