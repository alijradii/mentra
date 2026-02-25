"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FillBlankQuizSectionDTO, QuizSectionDTO } from "@/lib/api";

interface FillBlankEditorProps {
  section: FillBlankQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function FillBlankEditor({ section, onChange }: FillBlankEditorProps) {
  const syncBlanks = (template: string) => {
    const regex = /\{\{blank:([^}]+)\}\}/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) ids.push(match[1]);
    const existingMap = new Map(section.blanks.map((b) => [b.id, b]));
    const blanks = ids.map((id) => existingMap.get(id) ?? { id, acceptedAnswers: [""] });
    onChange({ ...section, template, blanks });
  };

  const updateBlankAnswer = (blankId: string, idx: number, value: string) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: b.acceptedAnswers.map((a, i) => (i === idx ? value : a)) } : b
      ),
    });
  };
  const addBlankAnswer = (blankId: string) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: [...b.acceptedAnswers, ""] } : b
      ),
    });
  };
  const removeBlankAnswer = (blankId: string, idx: number) => {
    onChange({
      ...section,
      blanks: section.blanks.map((b) =>
        b.id === blankId ? { ...b, acceptedAnswers: b.acceptedAnswers.filter((_, i) => i !== idx) } : b
      ),
    });
  };

  const updateWordBank = (idx: number, value: string) => {
    const wb = [...(section.wordBank ?? [])];
    wb[idx] = value;
    onChange({ ...section, wordBank: wb });
  };
  const addWord = () => onChange({ ...section, wordBank: [...(section.wordBank ?? []), ""] });
  const removeWord = (idx: number) => onChange({ ...section, wordBank: (section.wordBank ?? []).filter((_, i) => i !== idx) });

  return (
    <>
      <div>
        <Label>Template <span className="text-muted-foreground/80 font-normal">(use {"{{blank:id}}"} for blanks, e.g. {"{{blank:city}}"})</span></Label>
        <Textarea
          value={section.template}
          onChange={(e) => syncBlanks(e.target.value)}
          rows={4}
          placeholder={'const {{blank:var}} = "Berlin";\nprint({{blank:var}}, " is the capital of ", {{blank:country}})'}
          className="mt-1 font-mono text-xs"
        />
      </div>
      <div>
        <Label>Language <span className="text-muted-foreground/80 font-normal">(optional, for syntax highlighting)</span></Label>
        <Input
          value={section.language ?? ""}
          onChange={(e) => onChange({ ...section, language: e.target.value || undefined })}
          placeholder="e.g. javascript, python"
          className="mt-1"
        />
      </div>
      {section.blanks.length > 0 && (
        <div>
          <Label>Blank accepted answers</Label>
          <div className="mt-1 space-y-3">
            {section.blanks.map((blank) => (
              <div key={blank.id} className="p-3 border rounded-lg bg-background space-y-2">
                <p className="text-xs font-mono text-muted-foreground">{`{{blank:${blank.id}}}`}</p>
                {blank.acceptedAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={ans}
                      onChange={(e) => updateBlankAnswer(blank.id, i, e.target.value)}
                      placeholder={`Answer ${i + 1}`}
                      className="flex-1"
                    />
                    {blank.acceptedAnswers.length > 1 && (
                      <button type="button" onClick={() => removeBlankAnswer(blank.id, i)} className="text-destructive text-sm px-1">✕</button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addBlankAnswer(blank.id)}>+ Add answer</Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label>Word bank <span className="text-muted-foreground/80 font-normal">(optional, draggable options for students)</span></Label>
        <div className="mt-1 space-y-2">
          {(section.wordBank ?? []).map((word, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={word}
                onChange={(e) => updateWordBank(i, e.target.value)}
                placeholder={`Word ${i + 1}`}
                className="flex-1"
              />
              <button type="button" onClick={() => removeWord(i)} className="text-destructive text-sm px-1">✕</button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addWord}>+ Add word</Button>
        </div>
      </div>
    </>
  );
}
