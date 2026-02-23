"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { coursesApi, enrollmentApi, type CourseDTO, ApiError } from "@/lib/api";

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function CourseCard({
  course,
  enrolled,
  onEnroll,
  enrolling,
}: {
  course: CourseDTO;
  enrolled: boolean;
  onEnroll: (id: string) => void;
  enrolling: boolean;
}) {
  const dur = course.metadata?.estimatedDuration;
  const diff = course.metadata?.difficulty;
  const count = course.metadata?.enrollmentCount ?? 0;

  return (
    <div className="bg-card border rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-base leading-snug">{course.title}</h3>
          {diff && (
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-secondary text-primary font-medium">
              {DIFFICULTY_LABEL[diff] ?? diff}
            </span>
          )}
        </div>
        {course.author?.name && (
          <p className="text-xs text-muted-foreground mb-2">by {course.author.name}</p>
        )}
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap">
        {dur && (
          <span>
            {Math.floor(dur / 60) > 0 ? `${Math.floor(dur / 60)}h ` : ""}
            {dur % 60 > 0 ? `${dur % 60}m` : ""}
          </span>
        )}
        {count > 0 && (
          <span>
            {count} {count === 1 ? "student" : "students"}
          </span>
        )}
        {course.metadata?.category && <span>{course.metadata.category}</span>}
      </div>

      <div className="flex items-center gap-2 pt-1">
        {enrolled ? (
          <Button size="sm" variant="outline" asChild className="flex-1">
            <Link href={`/dashboard/learn/${course._id}`}>Continue learning</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            disabled={enrolling}
            onClick={() => onEnroll(course._id)}
          >
            {enrolling ? "Enrolling…" : "Enroll"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BrowseCoursesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    Promise.all([coursesApi.getAll(token), enrollmentApi.getEnrolled(token)])
      .then(([allRes, enrolledRes]) => {
        if (cancelled) return;
        const published = allRes.data.filter((c) => c.status === "published");
        setCourses(published);
        setEnrolledIds(new Set(enrolledRes.data.map((e) => e.course?._id).filter(Boolean) as string[]));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleEnroll = async (courseId: string) => {
    if (!token) return;
    setEnrollingId(courseId);
    setError("");
    try {
      await enrollmentApi.enroll(token, courseId);
      setEnrolledIds((prev) => new Set([...prev, courseId]));
      router.push(`/dashboard/learn/${courseId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to enroll");
      setEnrollingId(null);
    }
  };

  const filtered = courses.filter(
    (c) =>
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browse courses</h1>
          <p className="text-muted-foreground text-sm mt-1">Find something new to learn</p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="w-full sm:w-72 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading courses…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/80">
          <p className="text-lg font-medium">No courses found</p>
          {search && (
            <p className="text-sm mt-1">Try a different search term.</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              enrolled={enrolledIds.has(course._id)}
              onEnroll={handleEnroll}
              enrolling={enrollingId === course._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
