import { ProgressBar } from "@/components/shared/progress-bar";
import type { CourseDTO, EnrollmentDTO } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

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
            className="bg-card border rounded-xl overflow-hidden flex flex-col hover:shadow-sm transition-shadow group"
        >
            <div className="relative w-full aspect-square bg-muted">
                {course.thumbnail ? (
                    <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary/20 select-none">
                            {course.title.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col gap-3 flex-1">
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
                    {(course.author?.name || course.author?.avatar) && (
                        <div className="flex items-center gap-2 mb-2">
                            {course.author.avatar && (
                                <img
                                    src={course.author.avatar}
                                    alt=""
                                    className="size-6 rounded-full object-cover shrink-0"
                                />
                            )}
                            {course.author.name && <p className="text-xs text-muted-foreground">by {course.author.name}</p>}
                        </div>
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
            </div>
        </Link>
    );
}
