"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { enrollmentApi, type CourseDTO, type EnrollmentDTO, ApiError } from "@/lib/api";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-1.5 rounded-full bg-gray-800 transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

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
          <h1 className="text-2xl font-bold text-gray-900">My learning</h1>
          <p className="text-gray-500 text-sm mt-1">Pick up where you left off</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/browse">Browse courses</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-500 font-medium">You haven't enrolled in any courses yet.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/browse">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ course, enrollment }) => {
            const pct = enrollment.progress.overallPercentage;
            const completed = enrollment.status === "completed";
            return (
              <Link
                key={course._id}
                href={`/dashboard/learn/${course._id}`}
                className="bg-white border rounded-xl p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow group"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:underline">
                      {course.title}
                    </h3>
                    {completed && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  {course.author?.name && (
                    <p className="text-xs text-gray-500 mb-2">by {course.author.name}</p>
                  )}
                  {course.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{pct}% complete</span>
                    <span>
                      {enrollment.progress.completedNodes.length} lesson
                      {enrollment.progress.completedNodes.length !== 1 ? "s" : ""} done
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
