"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SequenceQuizSectionDTO, QuizSectionDTO } from "@/lib/api";
import { genId, SELECT_CLASS } from "../utils";

interface SequenceEditorProps {
  section: SequenceQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function SequenceEditor({ section, onChange }: SequenceEditorProps) {
  const updateItem = (id: string, text: string) => {
    onChange({ ...section, items: section.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  };
  const addItem = () => {
    const item = { id: genId(), text: "" };
    onChange({ ...section, items: [...section.items, item] });
  };
  const removeItem = (id: string) => {
    onChange({
      ...section,
      items: section.items.filter((it) => it.id !== id),
      correctOrder: section.correctOrder.filter((oid) => oid !== id),
      prefilledPositions: section.prefilledPositions?.filter((p) => p.itemId !== id),
    });
  };
  const setCorrectOrder = () => {
    onChange({ ...section, correctOrder: section.items.map((it) => it.id) });
  };

  return (
    <>
      <div>
        <Label>Items <span className="text-muted-foreground/80 font-normal">(in the order they appear to the author)</span></Label>
        <div className="mt-1 space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
              <Input
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                placeholder={`Item ${i + 1}`}
                className="flex-1"
              />
              {section.items.length > 2 && (
                <button type="button" onClick={() => removeItem(item.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add item</Button>
        </div>
      </div>
      <div>
        <Label>Correct order <span className="text-muted-foreground/80 font-normal">(comma-separated item numbers, or use button)</span></Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            value={section.correctOrder.map((id) => {
              const idx = section.items.findIndex((it) => it.id === id);
              return idx >= 0 ? idx + 1 : "?";
            }).join(", ")}
            readOnly
            className="flex-1 bg-muted/50"
          />
          <Button type="button" variant="outline" size="sm" onClick={setCorrectOrder}>
            Use current order
          </Button>
        </div>
      </div>
      <div>
        <Label>Prefilled positions <span className="text-muted-foreground/80 font-normal">(optional, positions that are already filled for the student)</span></Label>
        <div className="mt-1 space-y-2">
          {(section.prefilledPositions ?? []).map((pf, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Pos</span>
              <Input
                type="number"
                min={0}
                value={pf.position}
                onChange={(e) => {
                  const next = [...(section.prefilledPositions ?? [])];
                  next[i] = { ...pf, position: parseInt(e.target.value) || 0 };
                  onChange({ ...section, prefilledPositions: next });
                }}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">Item #</span>
              <select
                value={pf.itemId}
                onChange={(e) => {
                  const next = [...(section.prefilledPositions ?? [])];
                  next[i] = { ...pf, itemId: e.target.value };
                  onChange({ ...section, prefilledPositions: next });
                }}
                className={`w-48 ${SELECT_CLASS}`}
              >
                <option value="">Select item</option>
                {section.items.map((it, idx) => (
                  <option key={it.id} value={it.id}>{idx + 1}. {it.text || "(empty)"}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onChange({ ...section, prefilledPositions: (section.prefilledPositions ?? []).filter((_, j) => j !== i) })}
                className="text-destructive text-sm px-1"
              >✕</button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...section, prefilledPositions: [...(section.prefilledPositions ?? []), { position: 0, itemId: "" }] })}
          >
            + Add prefilled position
          </Button>
        </div>
      </div>
    </>
  );
}
