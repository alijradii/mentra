"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DarkModeMenuItem } from "./dark-mode-menu-item";

export function ProfileMenu() {
    const { user, logout } = useAuth();
    const router = useRouter();
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

    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="h-10 w-10 rounded-full border border-border/80 bg-card shadow-sm hover:border-primary/50 transition overflow-hidden"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Open user menu"
            >
                {user?.avatar ? (
                    <Image
                        src={user.avatar}
                        alt="User avatar"
                        width={100}
                        height={100}
                        quality={90}
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
                    <DarkModeMenuItem />
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
    );
}
