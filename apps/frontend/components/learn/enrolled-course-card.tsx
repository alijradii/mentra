import Link from "next/link";
import { ProgressBar } from "@/components/shared/progress-bar";
import type { CourseDTO, EnrollmentDTO } from "@/lib/api";

interface EnrolledCourseCardProps {
  course: CourseDTO;
  enrollment: EnrollmentDTO;
}

export function EnrolledCourseCard({ course, enrollment }: EnrolledCourseCardProps) {
  const pct = enrollment.progress.overallPercentage;
  const completed = enrollment.status === "completed";

  return (
    <Link
      href={`/dashboard/learn/${course._id}`}
      className="bg-card border rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow group"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-base leading-snug group-hover:underline">
            {course.title}
          </h3>
          {completed && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-success/20 text-success font-medium">
              Completed
            </span>
          )}
        </div>
        {course.author?.name && (
          <p className="text-xs text-muted-foreground mb-2">by {course.author.name}</p>
        )}
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{pct}% complete</span>
          <span>
            {enrollment.progress.completedNodes.length} lesson
            {enrollment.progress.completedNodes.length !== 1 ? "s" : ""} done
          </span>
        </div>
        <ProgressBar value={pct} size="md" />
      </div>
    </Link>
  );
}
