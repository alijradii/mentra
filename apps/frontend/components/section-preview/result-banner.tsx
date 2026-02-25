"use client";

interface ResultBannerProps {
  correct: boolean;
  explanation?: string;
}

export function ResultBanner({ correct, explanation }: ResultBannerProps) {
  return (
    <div
      className={`p-3 rounded-lg text-sm ${
        correct
          ? "bg-success/15 text-success border border-success/40"
          : "bg-destructive/15 text-destructive border border-destructive/40"
      }`}
    >
      <p className="font-semibold">{correct ? "Correct!" : "Not quite."}</p>
      {explanation && <p className="mt-1">{explanation}</p>}
    </div>
  );
}
