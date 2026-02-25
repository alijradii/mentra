"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { MatchingQuizSectionDTO } from "@/lib/api";
import { shuffle } from "../utils";
import { ResultBanner } from "../result-banner";

interface MatchingPreviewProps {
  section: MatchingQuizSectionDTO;
}

export function MatchingPreview({ section }: MatchingPreviewProps) {
  const shuffledRight = useMemo(() => shuffle(section.pairs.map((p) => ({ id: p.id, text: p.right }))), [section.pairs]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const isCorrect =
    submitted &&
    section.pairs.every((p) => matches[p.id] === p.id);

  const allFilled = section.pairs.every((p) => matches[p.id]);

  return (
    <>
      <div className="space-y-2">
        {section.pairs.map((pair) => {
          const chosen = matches[pair.id];
          let borderCls = "border-border";
          if (submitted) {
            borderCls = chosen === pair.id ? "border-success" : "border-destructive";
          }
          return (
            <div key={pair.id} className="flex items-center gap-3">
              <span className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">{pair.left}</span>
              <span className="text-muted-foreground text-sm">&rarr;</span>
              <select
                value={chosen ?? ""}
                onChange={(e) => !submitted && setMatches((prev) => ({ ...prev, [pair.id]: e.target.value }))}
                disabled={submitted}
                className={`flex-1 px-3 py-2 rounded-lg border-2 bg-card text-sm focus:outline-none ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">Select match</option>
                {shuffledRight.map((r) => (
                  <option key={r.id} value={r.id}>{r.text}</option>
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
