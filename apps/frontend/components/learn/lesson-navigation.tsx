import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { EnrollmentDTO } from "@/lib/api";
import type { FlatNode } from "./types";

interface LessonNavigationProps {
  courseId: string;
  enrollment: EnrollmentDTO | null;
  isDone: boolean;
  marking: boolean;
  prevNode: FlatNode | null;
  nextNode: FlatNode | null;
  onMarkComplete: () => void;
  onNavigate: (node: FlatNode) => void;
}

export function LessonNavigation({
  courseId,
  enrollment,
  isDone,
  marking,
  prevNode,
  nextNode,
  onMarkComplete,
  onNavigate,
}: LessonNavigationProps) {
  return (
    <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {enrollment === null ? (
          <Button size="sm" asChild>
            <Link href="/dashboard/browse">Enroll to track progress</Link>
          </Button>
        ) : isDone ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-success">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        ) : (
          <Button size="sm" variant="outline" disabled={marking} onClick={onMarkComplete}>
            {marking ? "Marking…" : "Mark as complete"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {prevNode && (
          <Button variant="outline" size="sm" onClick={() => onNavigate(prevNode)}>
            ← Previous
          </Button>
        )}
        {nextNode ? (
          <Button
            size="sm"
            onClick={() => {
              if (enrollment && !isDone) onMarkComplete();
              onNavigate(nextNode);
            }}
          >
            Next →
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/dashboard/learn/${courseId}`}>Back to overview</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
