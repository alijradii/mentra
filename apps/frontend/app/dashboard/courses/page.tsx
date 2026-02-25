"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CourseListItem, ConfirmDeleteDialog } from "@/components/courses";
import { coursesApi, type CourseDTO, ApiError } from "@/lib/api";

export default function MyCoursesPage() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<CourseDTO | null>(null);

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

  const handleRequestDelete = (id: string) => {
    const course = courses.find((c) => c._id === id) ?? null;
    if (course) setCourseToDelete(course);
  };

  const handleConfirmDelete = async () => {
    if (!token || !courseToDelete) return;
    const id = courseToDelete._id;
    setDeletingId(id);
    setError("");
    try {
      await coursesApi.delete(token, id);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      setCourseToDelete(null);
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
        <p className="text-muted-foreground">You don&apos;t have any courses yet.</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((course) => (
            <CourseListItem
              key={course._id}
              course={course}
              deletingId={deletingId}
              onDelete={handleRequestDelete}
              canDelete={user?.id === course.ownerId}
            />
          ))}
        </ul>
      )}

      <ConfirmDeleteDialog
        open={!!courseToDelete}
        title="Delete course"
        description="This will permanently delete the course and all its modules, pages, and sections. This cannot be undone."
        confirmLabel="Delete course"
        loading={!!(courseToDelete && deletingId === courseToDelete._id)}
        onCancel={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
      >
        {courseToDelete && (
          <div className="text-sm text-muted-foreground">
            <p>
              Course: <span className="font-medium text-foreground">&quot;{courseToDelete.title}&quot;</span>
            </p>
            {courseToDelete.description && (
              <p className="text-xs mt-1 line-clamp-2">{courseToDelete.description}</p>
            )}
          </div>
        )}
      </ConfirmDeleteDialog>
    </div>
  );
}
