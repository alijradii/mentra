import type { SectionDTO } from "@/lib/api";

/**
 * Splits sections into pages using "page-break" sections as dividers.
 * Page-break sections are consumed and not included in any page.
 */
export function splitIntoPages(sections: SectionDTO[]): SectionDTO[][] {
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

/**
 * Returns true if the answer value counts as "answered" for advance validation.
 * Used in practice/quiz focus mode to block Next until all questions on the page are filled.
 */
export function hasAnswer(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true; // number, boolean
}

/**
 * Quiz section IDs on the current page that require an answer to advance.
 */
export function getQuizSectionIds(sections: SectionDTO[]): string[] {
    return sections.filter((s) => s.type === "quiz").map((s) => s.id);
}
