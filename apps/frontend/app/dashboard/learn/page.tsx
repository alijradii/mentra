"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EnrolledCourseCard } from "@/components/learn/enrolled-course-card";
import { enrollmentApi, type CourseDTO, type EnrollmentDTO, ApiError } from "@/lib/api";

export default function MyLearningPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<{ enrollment: EnrollmentDTO; course: CourseDTO }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    enrollmentApi
      .getEnrolled(token)
      .then((res) => {
        if (!cancelled) setItems(res.data.filter((item) => item.course !== null));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My learning</h1>
          <p className="text-muted-foreground text-sm mt-1">Pick up where you left off</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/browse">Browse courses</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground font-medium">You haven't enrolled in any courses yet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/browse">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ course, enrollment }) => (
            <EnrolledCourseCard key={course._id} course={course} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}
