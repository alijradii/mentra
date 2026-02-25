import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NodeDTO } from "@/lib/api";

interface NodeListItemProps {
  node: NodeDTO;
  idx: number;
  total: number;
  courseId: string;
  moduleId: string;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function NodeListItem({
  node,
  idx,
  total,
  courseId,
  moduleId,
  deletingId,
  onDelete,
  onMoveUp,
  onMoveDown,
}: NodeListItemProps) {
  return (
    <li className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0}
          className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="p-1 text-muted-foreground/80 hover:text-foreground disabled:opacity-30"
          title="Move down"
        >
          ↓
        </button>
      </div>
      <Link
        href={`/dashboard/courses/${courseId}/modules/${moduleId}/nodes/${node._id}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <span className="text-xs text-muted-foreground/80 w-5 shrink-0">{idx + 1}</span>
        <span className="font-medium text-foreground group-hover:underline">{node.title}</span>
        <span className="text-xs text-muted-foreground/80 shrink-0">
          {node.sections.length} section{node.sections.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize shrink-0">
          {node.status}
        </span>
      </Link>
      <Button
        variant="destructive"
        size="sm"
        disabled={deletingId === node._id}
        onClick={() => onDelete(node._id)}
      >
        {deletingId === node._id ? "..." : "Delete"}
      </Button>
    </li>
  );
}
