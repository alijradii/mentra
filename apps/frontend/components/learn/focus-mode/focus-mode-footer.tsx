"use client";

interface FocusModeFooterProps {
    showQuizWarning?: boolean;
    warningMessage?: string;
    children: React.ReactNode;
}

const DEFAULT_WARNING = "Please answer all questions on this page before continuing.";

export function FocusModeFooter({
    showQuizWarning = false,
    warningMessage = DEFAULT_WARNING,
    children,
}: FocusModeFooterProps) {
    return (
        <div className="mt-10 pt-6 border-t shrink-0">
            {showQuizWarning && (
                <p className="text-sm text-destructive mb-3">{warningMessage}</p>
            )}
            <div className="flex justify-end">{children}</div>
        </div>
    );
}
