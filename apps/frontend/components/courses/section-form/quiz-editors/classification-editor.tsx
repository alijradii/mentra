"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassificationQuizSectionDTO, QuizSectionDTO } from "@/lib/api";
import { genId, SELECT_CLASS } from "../utils";

interface ClassificationEditorProps {
  section: ClassificationQuizSectionDTO;
  onChange: (s: QuizSectionDTO) => void;
}

export function ClassificationEditor({ section, onChange }: ClassificationEditorProps) {
  const updateCategory = (id: string, label: string) => {
    onChange({ ...section, categories: section.categories.map((c) => (c.id === id ? { ...c, label } : c)) });
  };
  const addCategory = () => {
    onChange({ ...section, categories: [...section.categories, { id: genId(), label: "" }] });
  };
  const removeCategory = (id: string) => {
    onChange({
      ...section,
      categories: section.categories.filter((c) => c.id !== id),
      items: section.items.map((it) => (it.categoryId === id ? { ...it, categoryId: "" } : it)),
    });
  };

  const updateItem = (id: string, field: "text" | "categoryId", value: string) => {
    onChange({ ...section, items: section.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) });
  };
  const addItem = () => {
    onChange({ ...section, items: [...section.items, { id: genId(), text: "", categoryId: "" }] });
  };
  const removeItem = (id: string) => {
    onChange({ ...section, items: section.items.filter((it) => it.id !== id) });
  };

  return (
    <>
      <div>
        <Label>Categories</Label>
        <div className="mt-1 space-y-2">
          {section.categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Input
                value={cat.label}
                onChange={(e) => updateCategory(cat.id, e.target.value)}
                placeholder={`Category ${i + 1}`}
                className="flex-1"
              />
              {section.categories.length > 2 && (
                <button type="button" onClick={() => removeCategory(cat.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCategory}>+ Add category</Button>
        </div>
      </div>
      <div>
        <Label>Items <span className="text-muted-foreground/80 font-normal">(assign each to a category)</span></Label>
        <div className="mt-1 space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.text}
                onChange={(e) => updateItem(item.id, "text", e.target.value)}
                placeholder={`Item ${i + 1}`}
                className="flex-1"
              />
              <select
                value={item.categoryId}
                onChange={(e) => updateItem(item.id, "categoryId", e.target.value)}
                className={`w-48 ${SELECT_CLASS}`}
              >
                <option value="">Assign category</option>
                {section.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label || "(unnamed)"}</option>
                ))}
              </select>
              {section.items.length > 1 && (
                <button type="button" onClick={() => removeItem(item.id)} className="text-destructive text-sm px-1">✕</button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add item</Button>
        </div>
      </div>
    </>
  );
}
