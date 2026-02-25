"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className="h-9 w-9 rounded-md border border-border/80 bg-card flex items-center justify-center text-muted-foreground"
        aria-label="Toggle dark mode"
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-md border border-border/80 bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition"
      aria-label="Toggle dark mode"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const initials = useMemo(() => {
    const source = (user?.name || user?.email || "").trim();
    if (!source) return "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [user?.email, user?.name]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    router.push("/");
  };

  const navLinkClass = (isActive: boolean) =>
    `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
      isActive
        ? "text-foreground bg-primary/15"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-border/70 bg-secondary/35 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              Mentra
            </Link>
            <Link
              href="/dashboard/browse"
              className={navLinkClass(Boolean(pathname?.startsWith("/dashboard/browse")))}
            >
              Browse
            </Link>
            <Link
              href="/dashboard/learn"
              className={navLinkClass(Boolean(pathname?.startsWith("/dashboard/learn")))}
            >
              My learning
            </Link>
            <Link
              href="/dashboard/courses"
              className={navLinkClass(Boolean(pathname?.startsWith("/dashboard/courses")))}
            >
              My courses
            </Link>
            <Link
              href="/dashboard/profile"
              className={navLinkClass(Boolean(pathname?.startsWith("/dashboard/profile")))}
            >
              Profile
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="h-10 w-10 rounded-full border border-border/80 bg-card shadow-sm hover:border-primary/50 transition overflow-hidden"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Open user menu"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="User avatar"
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-sm font-semibold text-foreground">
                    {initials}
                  </span>
                )}
              </button>
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-lg"
                  role="menu"
                >
                  <Link
                    href="/dashboard/profile"
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/15"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
