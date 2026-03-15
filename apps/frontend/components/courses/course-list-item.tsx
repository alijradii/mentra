import { Button } from "@/components/ui/button";
import type { CourseDTO } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

interface CourseListItemProps {
    course: CourseDTO;
    deletingId: string | null;
    onDelete: (id: string) => void;
    /** When false, Delete button is hidden (e.g. for mentors who cannot delete the course). Default true. */
    canDelete?: boolean;
}

export function CourseListItem({ course, deletingId, onDelete, canDelete = true }: CourseListItemProps) {
    return (
        <li className="flex items-center justify-between gap-4 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-md border bg-muted overflow-hidden shrink-0">
                    {course.thumbnail ? (
                        <Image
                            src={course.thumbnail}
                            alt=""
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
                    )}
                </div>
                <div className="min-w-0">
                    <Link href={`/dashboard/courses/${course._id}`} className="font-medium text-foreground hover:underline">
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
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/courses/${course._id}`}>Edit</Link>
                </Button>
                {canDelete && (
                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingId === course._id}
                        onClick={() => onDelete(course._id)}
                    >
                        {deletingId === course._id ? "Deleting..." : "Delete"}
                    </Button>
                )}
            </div>
        </li>
    );
}
