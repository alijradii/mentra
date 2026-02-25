"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MathInputQuizSectionDTO, QuizSectionDTO } from "@/lib/api";
import { SELECT_CLASS } from "../utils";

interface MathInputEditorProps {
  section: MathInputQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function MathInputEditor({ section, onChange }: MathInputEditorProps) {
  const updateAnswer = (idx: number, value: string) => {
    const next = [...section.acceptedAnswers];
    next[idx] = value;
    onChange({ ...section, acceptedAnswers: next });
  };
  const addAnswer = () => onChange({ ...section, acceptedAnswers: [...section.acceptedAnswers, ""] });
  const removeAnswer = (idx: number) => onChange({ ...section, acceptedAnswers: section.acceptedAnswers.filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Input format</Label>
        <select
          value={section.inputFormat}
          onChange={(e) => onChange({ ...section, inputFormat: e.target.value as "latex" | "asciimath" })}
          className={`mt-1 ${SELECT_CLASS}`}
        >
          <option value="latex">LaTeX</option>
          <option value="asciimath">AsciiMath</option>
        </select>
      </div>
      <div>
        <Label>Accepted answers <span className="text-muted-foreground/80 font-normal">(LaTeX notation)</span></Label>
        <div className="mt-1 space-y-2">
          {section.acceptedAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder={`e.g. \\frac{1}{2}`}
                className="flex-1 font-mono text-xs"
              />
              {section.acceptedAnswers.length > 1 && (
                <button type="button" onClick={() => removeAnswer(i)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>+ Add answer</Button>
        </div>
      </div>
      <div>
        <Label>Comparison mode</Label>
        <select
          value={section.comparisonMode ?? "exact"}
          onChange={(e) => onChange({ ...section, comparisonMode: e.target.value as "exact" | "symbolic" })}
          className={`mt-1 ${SELECT_CLASS}`}
        >
          <option value="exact">Exact match</option>
          <option value="symbolic">Symbolic (future)</option>
        </select>
      </div>
    </>
  );
}
