"use client";

interface FocusModeLayoutProps {
    /** Optional slot above page progress (e.g. timer) */
    topSlot?: React.ReactNode;
    /** Optional page progress bar */
    pageProgress?: React.ReactNode;
    /** Main scrollable content */
    children: React.ReactNode;
    /** Footer (e.g. FocusModeFooter with Next/Finish buttons) */
    footer: React.ReactNode;
}

/**
 * Full-height focus mode layout used by lesson, practice, and quiz players.
 * Ensures content area fills available height and footer stays at bottom.
 */
export function FocusModeLayout({ topSlot, pageProgress, children, footer }: FocusModeLayoutProps) {
    return (
        <div className="flex flex-1 flex-col min-h-0">
            {topSlot}
            {pageProgress}

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="min-h-full flex flex-col">
                    {children}
                </div>
            </div>

            {footer}
        </div>
    );
}
