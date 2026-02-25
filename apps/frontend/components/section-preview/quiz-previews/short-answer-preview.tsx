"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShortAnswerQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";

interface ShortAnswerPreviewProps {
  section: ShortAnswerQuizSectionDTO;
}

export function ShortAnswerPreview({ section }: ShortAnswerPreviewProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalize = (s: string) => {
    let v = s;
    if (section.trimWhitespace !== false) v = v.trim();
    if (!section.caseSensitive) v = v.toLowerCase();
    return v;
  };
  const isCorrect = submitted && section.acceptedAnswers.some((a) => normalize(a) === normalize(answer));

  return (
    <>
      <input
        type="text"
        value={answer}
        onChange={(e) => !submitted && setAnswer(e.target.value)}
        placeholder="Type your answer…"
        className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-sm focus:outline-none focus:border-primary transition-colors"
        readOnly={submitted}
      />
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
          Check answer
        </Button>
      ) : (
        <>
          <ResultBanner correct={isCorrect} explanation={section.explanation} />
          {!isCorrect && (
            <p className="text-xs text-muted-foreground">
              Accepted: {section.acceptedAnswers.join(", ")}
            </p>
          )}
        </>
      )}
    </>
  );
}
