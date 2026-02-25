"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShortAnswerQuizSectionDTO, QuizSectionDTO } from "@/lib/api";

interface ShortAnswerEditorProps {
  section: ShortAnswerQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function ShortAnswerEditor({ section, onChange }: ShortAnswerEditorProps) {
  const updateAnswer = (idx: number, text: string) => {
    const next = [...section.acceptedAnswers];
    next[idx] = text;
    onChange({ ...section, acceptedAnswers: next });
  };
  const addAnswer = () => onChange({ ...section, acceptedAnswers: [...section.acceptedAnswers, ""] });
  const removeAnswer = (idx: number) => onChange({ ...section, acceptedAnswers: section.acceptedAnswers.filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Accepted answers</Label>
        <div className="mt-1 space-y-2">
          {section.acceptedAnswers.map((ans, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={ans}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder={`Answer ${i + 1}`}
                className="flex-1"
              />
              {section.acceptedAnswers.length > 1 && (
                <button type="button" onClick={() => removeAnswer(i)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>+ Add answer</Button>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.caseSensitive ?? false}
            onChange={(e) => onChange({ ...section, caseSensitive: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Case sensitive
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.trimWhitespace ?? true}
            onChange={(e) => onChange({ ...section, trimWhitespace: e.target.checked })}
            className="h-4 w-4 rounded border-border"
          />
          Trim whitespace
        </label>
      </div>
    </>
  );
}
