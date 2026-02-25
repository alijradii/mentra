import { Button } from "@/components/ui/button";
import { SECTION_TYPES } from "./section-form";
import type { SectionType } from "@/lib/api";

interface SectionTypePickerProps {
  onSelect: (type: SectionType) => void;
}

export function SectionTypePicker({ onSelect }: SectionTypePickerProps) {
  return (
    <div className="mb-4 p-4 bg-card border rounded-lg flex flex-wrap gap-2">
      <p className="w-full text-sm text-muted-foreground mb-1">Choose section type:</p>
      {SECTION_TYPES.map(({ type, label }) => (
        <Button key={type} variant="outline" size="sm" onClick={() => onSelect(type)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
