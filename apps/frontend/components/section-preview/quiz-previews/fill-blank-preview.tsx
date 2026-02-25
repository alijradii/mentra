"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { FillBlankQuizSectionDTO } from "@/lib/api";
import { ResultBanner } from "../result-banner";

interface FillBlankPreviewProps {
  section: FillBlankQuizSectionDTO;
}

export function FillBlankPreview({ section }: FillBlankPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const blanksMap = useMemo(() => new Map(section.blanks.map((b) => [b.id, b])), [section.blanks]);
  const hasWordBank = section.wordBank && section.wordBank.length > 0;

  const parts = useMemo(() => {
    const regex = /\{\{blank:([^}]+)\}\}/g;
    const result: { type: "text" | "blank"; value: string }[] = [];
    let last = 0;
    let match;
    while ((match = regex.exec(section.template)) !== null) {
      if (match.index > last) result.push({ type: "text", value: section.template.slice(last, match.index) });
      result.push({ type: "blank", value: match[1] });
      last = match.index + match[0].length;
    }
    if (last < section.template.length) result.push({ type: "text", value: section.template.slice(last) });
    return result;
  }, [section.template]);

  const checkBlank = (blankId: string, value: string) => {
    const blank = blanksMap.get(blankId);
    if (!blank) return false;
    return blank.acceptedAnswers.some((a) => a.trim().toLowerCase() === value.trim().toLowerCase());
  };

  const allFilled = section.blanks.every((b) => answers[b.id]?.trim());
  const isCorrect = submitted && section.blanks.every((b) => checkBlank(b.id, answers[b.id] ?? ""));

  return (
    <>
      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap p-4 bg-card border rounded-lg">
        {parts.map((part, i) => {
          if (part.type === "text") return <span key={i}>{part.value}</span>;
          const val = answers[part.value] ?? "";
          let borderCls = "border-primary/50";
          if (submitted) borderCls = checkBlank(part.value, val) ? "border-success" : "border-destructive";

          if (hasWordBank) {
            return (
              <select
                key={i}
                value={val}
                onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [part.value]: e.target.value }))}
                disabled={submitted}
                className={`inline-block mx-1 px-2 py-0.5 rounded border-2 bg-background text-sm ${borderCls} ${submitted ? "cursor-default" : ""}`}
              >
                <option value="">___</option>
                {section.wordBank!.map((w, wi) => (
                  <option key={wi} value={w}>{w}</option>
                ))}
              </select>
            );
          }

          return (
            <input
              key={i}
              type="text"
              value={val}
              onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [part.value]: e.target.value }))}
              readOnly={submitted}
              placeholder="___"
              className={`inline-block mx-1 px-2 py-0.5 rounded border-2 bg-background text-sm w-28 ${borderCls} focus:outline-none`}
            />
          );
        })}
      </div>
      {hasWordBank && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground mr-1">Word bank:</span>
          {section.wordBank!.map((w, i) => (
            <span key={i} className="px-2 py-1 rounded bg-muted text-xs">{w}</span>
          ))}
        </div>
      )}
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
