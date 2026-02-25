import {
  coldarkCold,
  duotoneDark,
  nightOwl,
  oneLight,
  twilight,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useColorTheme } from "@/contexts/ThemeContext";

export const prismThemes = {
  oneLight,
  vscDarkPlus,
  nightOwl,
  twilight,
  coldarkCold,
  duotoneDark,
} as const;

export function useSyntaxTheme() {
  const { syntaxTheme } = useColorTheme();
  return prismThemes[syntaxTheme];
}
