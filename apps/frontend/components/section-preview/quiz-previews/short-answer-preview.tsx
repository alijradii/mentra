"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShortAnswerQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";
import { MathEnabledText } from "@/components/math/MathEnabledText";

interface ShortAnswerPreviewProps {
  section: ShortAnswerQuizSectionDTO;
  onAnswered?: () => void;
}

export function ShortAnswerPreview({ section, onAnswered }: ShortAnswerPreviewProps) {
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
      <div className="space-y-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => !submitted && setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-sm focus:outline-none focus:border-primary transition-colors"
          readOnly={submitted}
        />
        {answer.trim() && (
          <div className="p-3 bg-background border rounded-lg text-center">
            <MathEnabledText text={answer} variant="block" />
          </div>
        )}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => { setSubmitted(true); onAnswered?.(); }} disabled={!answer.trim()}>
          Check answer
        </Button>
      ) : (
        <>
          <ResultBanner correct={isCorrect} explanation={section.explanation} />
          {!isCorrect && (
            <p className="text-xs text-muted-foreground">
              Accepted:{" "}
              {section.acceptedAnswers.map((a, i) => (
                <span key={i} className="inline-block mx-1">
                  <MathEnabledText text={a} variant="inline" />
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </>
  );
}
