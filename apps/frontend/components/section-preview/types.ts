import type { SectionDTO } from "@/lib/api";

export interface SectionPreviewProps {
  section: SectionDTO;
  onAnswered?: (sectionId: string) => void;
}
