"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MathInputQuizSectionDTO } from "@/lib/api";
import { KaTeXRender } from "../katex-render";
import { ResultBanner } from "../result-banner";

interface MathInputPreviewProps {
  section: MathInputQuizSectionDTO;
}

export function MathInputPreview({ section }: MathInputPreviewProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && section.acceptedAnswers.some((a) => a.trim() === answer.trim());

  return (
    <>
      <div className="space-y-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => !submitted && setAnswer(e.target.value)}
          placeholder={section.inputFormat === "latex" ? "Enter LaTeX, e.g. \\frac{1}{2}" : "Enter expression…"}
          className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-sm font-mono focus:outline-none focus:border-primary transition-colors"
          readOnly={submitted}
        />
        {answer && (
          <div className="p-3 bg-background border rounded-lg text-center">
            <span className="text-xs text-muted-foreground block mb-1">Preview:</span>
            <KaTeXRender latex={answer} />
          </div>
        )}
      </div>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)} disabled={!answer.trim()}>
          Check answer
        </Button>
      ) : (
        <>
          <ResultBanner correct={isCorrect} explanation={section.explanation} />
          {!isCorrect && (
            <div className="text-xs text-muted-foreground">
              Expected: {section.acceptedAnswers.map((a, i) => (
                <span key={i} className="inline-block mx-1"><KaTeXRender latex={a} /></span>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
