"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function DarkModeMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
      role="menuitem"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 shrink-0" />
      ) : (
        <Moon className="h-4 w-4 shrink-0" />
      )}
      <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
