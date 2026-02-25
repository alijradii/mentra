"use client";

import type { SectionFormProps } from "./types";
import { TextSectionForm } from "./text-section-form";
import { ImageSectionForm } from "./image-section-form";
import { VideoSectionForm } from "./video-section-form";
import { EmbeddingSectionForm } from "./embedding-section-form";
import { CodeSectionForm } from "./code-section-form";
import { QuizForm } from "./quiz-form";

export function SectionForm({ section, onChange }: SectionFormProps) {
  if (section.type === "text") {
    return <TextSectionForm section={section} onChange={onChange} />;
  }

  if (section.type === "image") {
    return <ImageSectionForm section={section} onChange={onChange} />;
  }

  if (section.type === "video") {
    return <VideoSectionForm section={section} onChange={onChange} />;
  }

  if (section.type === "embedding") {
    return <EmbeddingSectionForm section={section} onChange={onChange} />;
  }

  if (section.type === "code") {
    return <CodeSectionForm section={section} onChange={onChange} />;
  }

  if (section.type === "quiz") {
    return <QuizForm section={section} onChange={onChange} />;
  }

  return null;
}
