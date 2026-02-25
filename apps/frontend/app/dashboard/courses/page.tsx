"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CourseListItem } from "@/components/courses/course-list-item";
import { coursesApi, type CourseDTO, ApiError } from "@/lib/api";

export default function MyCoursesPage() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    coursesApi
      .getMine(token)
      .then((res) => {
        if (!cancelled) setCourses(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("Delete this course?")) return;
    setDeletingId(id);
    setError("");
    try {
      await coursesApi.delete(token, id);
      setCourses((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">My courses</h1>
        <Button asChild>
          <Link href="/dashboard/courses/new">New course</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground">You haven't created any courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <CourseListItem
              key={course._id}
              course={course}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
