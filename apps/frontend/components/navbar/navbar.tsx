"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ProfileMenu } from "./profile-menu";

export function Navbar() {
  const pathname = usePathname();

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
          <div className="flex items-center">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
