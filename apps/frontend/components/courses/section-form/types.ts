import type { SectionDTO } from "@/lib/api";

export interface SectionFormProps {
  section: SectionDTO;
  onChange: (updated: SectionDTO) => void;
}
