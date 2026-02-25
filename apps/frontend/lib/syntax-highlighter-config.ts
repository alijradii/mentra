import {
  coldarkCold,
  duotoneDark,
  nightOwl,
  oneLight,
  twilight,
  vscDarkPlus
} from "react-syntax-highlighter/dist/esm/styles/prism";

const prismThemes = {
  oneLight,
  vscDarkPlus,
  nightOwl,
  twilight,
  coldarkCold,
  duotoneDark
} as const;

export type PrismThemeName = keyof typeof prismThemes;

// Change this value to set the syntax highlighting theme across the app.
export const syntaxHighlighterThemeName: PrismThemeName = "nightOwl";

export const syntaxHighlighterTheme = prismThemes[syntaxHighlighterThemeName];
