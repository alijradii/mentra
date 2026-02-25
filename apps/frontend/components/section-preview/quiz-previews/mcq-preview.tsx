"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MCQQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";

interface MCQPreviewProps {
  section: MCQQuizSectionDTO;
}

export function MCQPreview({ section }: MCQPreviewProps) {
  const isMultiple = section.correctAnswers.length > 1;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (optId: string) => {
    if (submitted) return;
    if (isMultiple) {
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
      );
    } else {
      setSelected([optId]);
    }
  };

  const isCorrect =
    submitted &&
    selected.length === section.correctAnswers.length &&
    selected.every((id) => section.correctAnswers.includes(id));

  return (
    <>
      <div className="space-y-2">
        {section.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isThisCorrect = section.correctAnswers.includes(opt.id);
          let cls = "border-border bg-card hover:bg-background";
          if (submitted) {
            if (isThisCorrect) cls = "border-success bg-success/15";
            else if (isSelected) cls = "border-destructive bg-destructive/15";
          } else if (isSelected) {
            cls = "border-primary bg-background";
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected.length === 0}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}
