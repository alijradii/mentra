"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchingQuizSectionDTO, QuizSectionDTO } from "@/lib/api";
import { genId } from "../utils";

interface MatchingEditorProps {
  section: MatchingQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function MatchingEditor({ section, onChange }: MatchingEditorProps) {
  const updatePair = (id: string, field: "left" | "right", value: string) => {
    onChange({ ...section, pairs: section.pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)) });
  };
  const addPair = () => {
    onChange({ ...section, pairs: [...section.pairs, { id: genId(), left: "", right: "" }] });
  };
  const removePair = (id: string) => {
    onChange({ ...section, pairs: section.pairs.filter((p) => p.id !== id) });
  };

  return (
    <div>
      <Label>Pairs <span className="text-muted-foreground/80 font-normal">(left matches right)</span></Label>
      <div className="mt-1 space-y-2">
        {section.pairs.map((pair, i) => (
          <div key={pair.id} className="flex items-center gap-2">
            <Input
              value={pair.left}
              onChange={(e) => updatePair(pair.id, "left", e.target.value)}
              placeholder={`Left ${i + 1}`}
              className="flex-1"
            />
            <span className="text-muted-foreground text-sm">&harr;</span>
            <Input
              value={pair.right}
              onChange={(e) => updatePair(pair.id, "right", e.target.value)}
              placeholder={`Right ${i + 1}`}
              className="flex-1"
            />
            {section.pairs.length > 2 && (
              <button type="button" onClick={() => removePair(pair.id)} className="text-destructive text-sm px-1">✕</button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPair}>+ Add pair</Button>
      </div>
    </div>
  );
}
