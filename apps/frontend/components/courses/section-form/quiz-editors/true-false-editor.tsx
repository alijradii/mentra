"use client";

import { Label } from "@/components/ui/label";
import type { TrueFalseQuizSectionDTO, QuizSectionDTO } from "@/lib/api";

interface TrueFalseEditorProps {
  section: TrueFalseQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function TrueFalseEditor({ section, onChange }: TrueFalseEditorProps) {
  return (
    <div>
      <Label>Correct answer</Label>
      <div className="mt-1 flex gap-3">
        {[true, false].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange({ ...section, correctAnswer: val })}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              section.correctAnswer === val
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-background"
            }`}
          >
            {val ? "True" : "False"}
          </button>
        ))}
      </div>
    </div>
  );
}
