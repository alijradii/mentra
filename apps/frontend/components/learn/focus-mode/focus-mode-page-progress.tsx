"use client";

interface FocusModePageProgressProps {
    currentPage: number;
    totalPages: number;
}

export function FocusModePageProgress({ currentPage, totalPages }: FocusModePageProgressProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center gap-2 mb-8 shrink-0">
            {Array.from({ length: totalPages }, (_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                        i < currentPage ? "bg-primary" : i === currentPage ? "bg-primary/60" : "bg-muted"
                    }`}
                />
            ))}
            <span className="text-xs text-muted-foreground ml-1 shrink-0">
                {currentPage + 1} / {totalPages}
            </span>
        </div>
    );
}
