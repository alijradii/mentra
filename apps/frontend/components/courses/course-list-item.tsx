import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CourseDTO } from "@/lib/api";

interface CourseListItemProps {
  course: CourseDTO;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

export function CourseListItem({ course, deletingId, onDelete }: CourseListItemProps) {
  return (
    <li className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border">
      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/courses/${course._id}`}
          className="font-medium text-foreground hover:underline"
        >
          {course.title}
        </Link>
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
            {course.status}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
            {course.visibility}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/courses/${course._id}`}>Edit</Link>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={deletingId === course._id}
          onClick={() => onDelete(course._id)}
        >
          {deletingId === course._id ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </li>
  );
}
