"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MCQQuizSectionDTO, QuizSectionDTO } from "@/lib/api";
import { genId } from "../utils";

interface MCQEditorProps {
  section: MCQQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function MCQEditor({ section, onChange }: MCQEditorProps) {
  const toggleCorrect = (optId: string) => {
    const next = section.correctAnswers.includes(optId)
      ? section.correctAnswers.filter((id) => id !== optId)
      : [...section.correctAnswers, optId];
    onChange({ ...section, correctAnswers: next });
  };
  const updateOption = (optId: string, text: string) => {
    onChange({
      ...section,
      options: section.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    });
  };
  const addOption = () => {
    onChange({
      ...section,
      options: [...section.options, { id: genId(), text: "", order: section.options.length }],
    });
  };
  const removeOption = (optId: string) => {
    onChange({
      ...section,
      options: section.options.filter((o) => o.id !== optId),
      correctAnswers: section.correctAnswers.filter((id) => id !== optId),
    });
  };

  return (
    <>
      <div>
        <Label>
          Options <span className="text-muted-foreground/80 font-normal">(check correct answers)</span>
        </Label>
        <div className="mt-1 space-y-2">
          {section.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={section.correctAnswers.includes(opt.id)}
                onChange={() => toggleCorrect(opt.id)}
                className="h-4 w-4 rounded border-border"
              />
              <Input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1"
              />
              {section.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-destructive hover:text-destructive text-sm px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            + Add option
          </Button>
        </div>
      </div>
    </>
  );
}
