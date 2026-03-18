"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { MatchingQuizSectionDTO } from "@/lib/api";
import { shuffle } from "../utils";
import { ResultBanner } from "../result-banner";
import { MathEnabledText } from "@/components/math/MathEnabledText";

interface MatchingPreviewProps {
  section: MatchingQuizSectionDTO;
  onAnswered?: () => void;
}

export function MatchingPreview({ section, onAnswered }: MatchingPreviewProps) {
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
          const selectedRight = chosen ? shuffledRight.find((r) => r.id === chosen)?.text : undefined;
          let borderCls = "border-border";
          if (submitted) {
            borderCls = chosen === pair.id ? "border-success" : "border-destructive";
          }
          return (
            <div key={pair.id} className="flex items-center gap-3">
              <span className="flex-1 px-3 py-2 rounded-lg border bg-card text-sm">
                <MathEnabledText text={pair.left} variant="inline" />
              </span>
              <span className="text-muted-foreground text-sm">&rarr;</span>
              <div className="flex-1">
                <select
                  value={chosen ?? ""}
                  onChange={(e) => !submitted && setMatches((prev) => ({ ...prev, [pair.id]: e.target.value }))}
                  disabled={submitted}
                  className={`w-full px-3 py-2 rounded-lg border-2 bg-card text-sm focus:outline-none ${borderCls} ${submitted ? "cursor-default" : ""}`}
                >
                  <option value="">Select match</option>
                  {shuffledRight.map((r) => (
                    <option key={r.id} value={r.id}>{r.text}</option>
                  ))}
                </select>
                {chosen && selectedRight && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Selected: <MathEnabledText text={selectedRight} variant="inline" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => { setSubmitted(true); onAnswered?.(); }} disabled={!allFilled}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}
