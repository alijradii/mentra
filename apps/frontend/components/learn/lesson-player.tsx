"use client";

import { useState, useMemo, useCallback } from "react";
import { SectionPreview } from "@/components/section-preview";
import { Button } from "@/components/ui/button";
import type { NodeDTO, SectionDTO } from "@/lib/api";

interface LessonPlayerProps {
  node: NodeDTO;
  onComplete?: () => void;
}

function splitIntoPages(sections: SectionDTO[]): SectionDTO[][] {
  const pages: SectionDTO[][] = [];
  let current: SectionDTO[] = [];
  for (const section of sections) {
    if (section.type === "page-break") {
      pages.push(current);
      current = [];
    } else {
      current.push(section);
    }
  }
  pages.push(current);
  return pages.filter((p) => p.length > 0);
}

export function LessonPlayer({ node, onComplete }: LessonPlayerProps) {
  const pages = useMemo(() => splitIntoPages(node.sections ?? []), [node.sections]);
  const isMultiPage = pages.length > 1;

  const [currentPage, setCurrentPage] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [showQuizWarning, setShowQuizWarning] = useState(false);

  const handleAnswered = useCallback((sectionId: string) => {
    setAnsweredIds((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
    setShowQuizWarning(false);
  }, []);

  const currentSections = pages[currentPage] ?? [];

  const unansweredQuizIds = useMemo(
    () =>
      currentSections
        .filter((s) => s.type === "quiz" && !answeredIds.has(s.id))
        .map((s) => s.id),
    [currentSections, answeredIds]
  );

  const canAdvance = unansweredQuizIds.length === 0;
  const isLastPage = currentPage === pages.length - 1;

  const handleNextPage = () => {
    if (!canAdvance) {
      setShowQuizWarning(true);
      return;
    }
    setShowQuizWarning(false);
    if (isLastPage) {
      onComplete?.();
    } else {
      setCurrentPage((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if ((node.sections?.length ?? 0) === 0) {
    return (
      <p className="text-muted-foreground/80 italic text-sm">
        This lesson has no content yet.
      </p>
    );
  }

  return (
    <div>
      {isMultiPage && (
        <div className="flex items-center gap-2 mb-6">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-colors ${
                i < currentPage
                  ? "bg-primary"
                  : i === currentPage
                  ? "bg-primary/60"
                  : "bg-muted"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 shrink-0">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {currentSections.map((section) => (
          <div key={section.id}>
            <SectionPreview section={section} onAnswered={handleAnswered} />
          </div>
        ))}
      </div>

      {isMultiPage && (
        <div className="mt-10 pt-6 border-t">
          {showQuizWarning && (
            <p className="text-sm text-destructive mb-3">
              Please answer all questions on this page before continuing.
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={handleNextPage}>
              {isLastPage ? "Finish" : "Next page →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
