"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { coursesApi, type CourseDTO } from "@/lib/api";
import { ApiError } from "@/lib/api";

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
        <h1 className="text-2xl font-bold text-gray-900">My courses</h1>
        <Button asChild>
          <Link href="/dashboard/courses/new">New course</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-500">You haven’t created any courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <li
              key={course._id}
              className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/courses/${course._id}`}
                  className="font-medium text-gray-900 hover:underline"
                >
                  {course.title}
                </Link>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                    {course.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
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
                  onClick={() => handleDelete(course._id)}
                >
                  {deletingId === course._id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
