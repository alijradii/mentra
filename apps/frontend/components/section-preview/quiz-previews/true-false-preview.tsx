"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrueFalseQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";

interface TrueFalsePreviewProps {
  section: TrueFalseQuizSectionDTO;
}

export function TrueFalsePreview({ section }: TrueFalsePreviewProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = submitted && selected === section.correctAnswer;

  return (
    <>
      <div className="flex gap-3">
        {[true, false].map((val) => {
          let cls = "border-border bg-card hover:bg-background";
          if (submitted) {
            if (val === section.correctAnswer) cls = "border-success bg-success/15";
            else if (val === selected) cls = "border-destructive bg-destructive/15";
          } else if (val === selected) {
            cls = "border-primary bg-background";
          }
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => !submitted && setSelected(val)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${cls} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {val ? "True" : "False"}
            </button>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={selected === null}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}
