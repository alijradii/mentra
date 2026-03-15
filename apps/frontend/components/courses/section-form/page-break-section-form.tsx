import type { PageBreakSectionDTO } from "@/lib/api";

interface PageBreakSectionFormProps {
  section: PageBreakSectionDTO;
}

export function PageBreakSectionForm({ section: _ }: PageBreakSectionFormProps) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
      <div className="flex-1 border-t border-dashed border-border" />
      <span className="shrink-0 px-2 py-0.5 rounded bg-muted text-xs font-medium">Page Break</span>
      <div className="flex-1 border-t border-dashed border-border" />
    </div>
  );
}
