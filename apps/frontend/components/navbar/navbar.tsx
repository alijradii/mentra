"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProfileMenu } from "./profile-menu";

const NAV_LINKS = [
    { href: "/dashboard/browse", label: "Browse" },
    { href: "/dashboard/learn", label: "My learning" },
    { href: "/dashboard/courses", label: "My courses" },
    { href: "/dashboard/profile", label: "Profile" },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileOpen(false);
            }
        };
        if (mobileOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const navLinkClass = (isActive: boolean) =>
        `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
            isActive ? "text-foreground bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
        }`;

    const mobileLinkClass = (isActive: boolean) =>
        `block text-sm font-medium px-3 py-2.5 rounded-md transition-colors ${
            isActive ? "text-foreground bg-primary/15" : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
        }`;

    return (
        <nav className="sticky top-0 z-40 border-b border-border/70 bg-secondary/35 backdrop-blur-md" ref={menuRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-2xl font-bold text-primary">
                            Mentra
                        </Link>
                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-1">
                            {NAV_LINKS.map(({ href, label }) => (
                                <Link key={href} href={href} className={navLinkClass(Boolean(pathname?.startsWith(href)))}>
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ProfileMenu />
                        {/* Hamburger button */}
                        <button
                            type="button"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(prev => !prev)}
                            className="md:hidden flex flex-col justify-center items-center h-9 w-9 rounded-md transition-colors hover:bg-muted/70 gap-1.5"
                        >
                            <span
                                className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-200 origin-center ${
                                    mobileOpen ? "translate-y-2 rotate-45" : ""
                                }`}
                            />
                            <span
                                className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-200 ${
                                    mobileOpen ? "opacity-0 scale-x-0" : ""
                                }`}
                            />
                            <span
                                className={`block h-0.5 w-5 rounded-full bg-foreground transition-all duration-200 origin-center ${
                                    mobileOpen ? "-translate-y-2 -rotate-45" : ""
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-border/70 bg-secondary/60 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link key={href} href={href} className={mobileLinkClass(Boolean(pathname?.startsWith(href)))}>
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
