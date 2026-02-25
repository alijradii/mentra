"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const COLOR_THEMES = [
  "default",
  "blue",
  "violet",
  "vercel",
  "cosmic-night",
  "catpuccin",
  "candyland",
  "cyberpunk",
  "northern-lights",
  "elegant-luxury",
  "amethyst",
  "boldtech",
  "supabase",
  "twitter",
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export interface ColorThemeInfo {
  id: ColorTheme;
  label: string;
  description: string;
  primaryLight: string;
  primaryDark: string;
}

export const COLOR_THEME_INFO: ColorThemeInfo[] = [
  {
    id: "default",
    label: "Default",
    description: "Neutral black & white with system fonts",
    primaryLight: "rgb(23, 23, 23)",
    primaryDark: "rgb(229, 229, 229)",
  },
  {
    id: "blue",
    label: "Blue",
    description: "Classic blue accent with clean neutral tones",
    primaryLight: "rgb(59, 130, 246)",
    primaryDark: "rgb(59, 130, 246)",
  },
  {
    id: "violet",
    label: "Violet",
    description: "Rich purple with rounded corners and warm accents",
    primaryLight: "rgb(112, 51, 255)",
    primaryDark: "rgb(140, 92, 255)",
  },
  {
    id: "vercel",
    label: "Vercel",
    description: "Minimal black & white inspired by Vercel",
    primaryLight: "rgb(0, 0, 0)",
    primaryDark: "rgb(255, 255, 255)",
  },
  {
    id: "cosmic-night",
    label: "Cosmic Night",
    description: "Deep space purple with luminous accents",
    primaryLight: "rgb(110, 86, 207)",
    primaryDark: "rgb(164, 143, 255)",
  },
  {
    id: "catpuccin",
    label: "Catppuccin",
    description: "Soothing pastel palette inspired by Catppuccin",
    primaryLight: "rgb(136, 57, 239)",
    primaryDark: "rgb(203, 166, 247)",
  },
  {
    id: "candyland",
    label: "Candyland",
    description: "Sweet pink and sky blue pastels",
    primaryLight: "rgb(255, 192, 203)",
    primaryDark: "rgb(255, 153, 204)",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    description: "Electric neon pink and cyan on dark",
    primaryLight: "rgb(255, 0, 200)",
    primaryDark: "rgb(255, 0, 200)",
  },
  {
    id: "northern-lights",
    label: "Northern Lights",
    description: "Aurora greens and blues with earthy warmth",
    primaryLight: "rgb(52, 168, 90)",
    primaryDark: "rgb(52, 168, 90)",
  },
  {
    id: "elegant-luxury",
    label: "Elegant Luxury",
    description: "Deep crimson and warm gold for a premium feel",
    primaryLight: "rgb(155, 44, 44)",
    primaryDark: "rgb(185, 28, 28)",
  },
  {
    id: "amethyst",
    label: "Amethyst",
    description: "Soft mauve and rose with gentle shadows",
    primaryLight: "rgb(138, 121, 171)",
    primaryDark: "rgb(169, 149, 201)",
  },
  {
    id: "boldtech",
    label: "Bold Tech",
    description: "Vivid violet on deep indigo backgrounds",
    primaryLight: "rgb(139, 92, 246)",
    primaryDark: "rgb(139, 92, 246)",
  },
  {
    id: "supabase",
    label: "Supabase",
    description: "Supabase-inspired green with dark neutrals",
    primaryLight: "rgb(114, 227, 173)",
    primaryDark: "rgb(0, 98, 57)",
  },
  {
    id: "twitter",
    label: "Twitter / X",
    description: "Twitter blue with rounded pill shapes",
    primaryLight: "rgb(30, 157, 241)",
    primaryDark: "rgb(28, 156, 240)",
  },
];

export const PRISM_THEME_NAMES = [
  "oneLight",
  "vscDarkPlus",
  "nightOwl",
  "twilight",
  "coldarkCold",
  "duotoneDark",
] as const;

export type PrismThemeName = (typeof PRISM_THEME_NAMES)[number];

export const PRISM_THEME_LABELS: Record<PrismThemeName, string> = {
  oneLight: "One Light",
  vscDarkPlus: "VS Code Dark+",
  nightOwl: "Night Owl",
  twilight: "Twilight",
  coldarkCold: "Coldark Cold",
  duotoneDark: "Duotone Dark",
};

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  syntaxTheme: PrismThemeName;
  setSyntaxTheme: (theme: PrismThemeName) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

const COLOR_THEME_KEY = "color-theme";
const SYNTAX_THEME_KEY = "syntax-theme";

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("default");
  const [syntaxTheme, setSyntaxThemeState] = useState<PrismThemeName>("nightOwl");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme | null;
    if (savedColor && COLOR_THEMES.includes(savedColor as ColorTheme)) {
      setColorThemeState(savedColor);
    }
    const savedSyntax = localStorage.getItem(SYNTAX_THEME_KEY) as PrismThemeName | null;
    if (savedSyntax && PRISM_THEME_NAMES.includes(savedSyntax as PrismThemeName)) {
      setSyntaxThemeState(savedSyntax);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (colorTheme === "default") {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", colorTheme);
    }
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
  }, [colorTheme, mounted]);

  const setColorTheme = (theme: ColorTheme) => setColorThemeState(theme);

  const setSyntaxTheme = (theme: PrismThemeName) => {
    setSyntaxThemeState(theme);
    localStorage.setItem(SYNTAX_THEME_KEY, theme);
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, syntaxTheme, setSyntaxTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}
