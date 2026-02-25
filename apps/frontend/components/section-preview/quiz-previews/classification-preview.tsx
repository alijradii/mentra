"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ClassificationQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";

interface ClassificationPreviewProps {
  section: ClassificationQuizSectionDTO;
}

export function ClassificationPreview({ section }: ClassificationPreviewProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allFilled = section.items.every((it) => assignments[it.id]);
  const isCorrect = submitted && section.items.every((it) => assignments[it.id] === it.categoryId);

  return (
    <>
      <div className="space-y-2">
        {section.items.map((item) => {
          const chosen = assignments[item.id] ?? "";
          let borderCls = "border-border";
          if (submitted) {
            borderCls = chosen === item.categoryId ? "border-success" : "border-destructive";
          }
          return (
            <div key={item.id} className="flex items-center gap-3">
              <span className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">{item.text}</span>
              <span className="text-muted-foreground text-sm">&rarr;</span>
              <select
                value={chosen}
                onChange={(e) => !submitted && setAssignments((prev) => ({ ...prev, [item.id]: e.target.value }))}
                disabled={submitted}
                className={`flex-1 px-3 py-2 rounded-lg border-2 bg-card text-sm focus:outline-none ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">Select category</option>
                {section.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!allFilled}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}
