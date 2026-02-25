"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import {
  useColorTheme,
  COLOR_THEME_INFO,
  PRISM_THEME_NAMES,
  PRISM_THEME_LABELS,
  type ColorTheme,
  type PrismThemeName,
} from "@/contexts/ThemeContext";

const MODE_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorTheme, setColorTheme, syntaxTheme, setSyntaxTheme } = useColorTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize the appearance of Mentra.</p>
      </div>

      {/* Appearance mode */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground">Choose between light, dark, or system default.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isSelected = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Color theme */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Color theme</h2>
          <p className="text-sm text-muted-foreground">Select a color palette for the interface.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLOR_THEME_INFO.map((info) => {
            const isSelected = colorTheme === info.id;
            const swatch = isDark ? info.primaryDark : info.primaryLight;
            return (
              <button
                key={info.id}
                type="button"
                onClick={() => setColorTheme(info.id as ColorTheme)}
                className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div
                  className="h-10 w-10 shrink-0 rounded-lg border border-border/50 shadow-sm"
                  style={{ backgroundColor: swatch }}
                />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                    {info.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Syntax highlighting theme */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Code highlighting</h2>
          <p className="text-sm text-muted-foreground">Choose a syntax highlighting style for code blocks.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRISM_THEME_NAMES.map((name) => {
            const isSelected = syntaxTheme === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSyntaxTheme(name as PrismThemeName)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <div className="w-full h-8 rounded-md bg-muted overflow-hidden flex items-center px-2 gap-1">
                  <span className="h-2 w-2 rounded-full bg-destructive/70" />
                  <span className="h-2 w-2 rounded-full bg-chart-3/70" />
                  <span className="h-2 w-2 rounded-full bg-chart-1/70" />
                </div>
                <span className={`text-xs font-medium leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {PRISM_THEME_LABELS[name as PrismThemeName]}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
