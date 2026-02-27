import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ModuleDTO } from "@/lib/api";

interface ModuleListItemProps {
  module: ModuleDTO;
  idx: number;
  total: number;
  courseId: string;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** When true, move and delete are disabled (e.g. AI agent is editing) */
  editsLocked?: boolean;
}

export function ModuleListItem({
  module,
  idx,
  total,
  courseId,
  deletingId,
  onDelete,
  onMoveUp,
  onMoveDown,
  editsLocked = false,
}: ModuleListItemProps) {
  return (
    <li className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0 || editsLocked}
          className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1 || editsLocked}
          className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
          title="Move down"
        >
          ↓
        </button>
      </div>
      <Link
        href={`/dashboard/courses/${courseId}/modules/${module._id}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <span className="text-xs text-muted-foreground/80 w-5 shrink-0">{idx + 1}</span>
        <span className="font-medium text-foreground group-hover:underline">{module.title}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">
          {module.status}
        </span>
      </Link>
      <Button
        variant="destructive"
        size="sm"
        disabled={deletingId === module._id || editsLocked}
        onClick={() => onDelete(module._id)}
      >
        {deletingId === module._id ? "..." : "Delete"}
      </Button>
    </li>
  );
}
