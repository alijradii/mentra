"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                Mentra
              </Link>
              <Link
                href="/dashboard/browse"
                className={`text-sm font-medium ${
                  pathname?.startsWith("/dashboard/browse")
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Browse
              </Link>
              <Link
                href="/dashboard/learn"
                className={`text-sm font-medium ${
                  pathname?.startsWith("/dashboard/learn")
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My learning
              </Link>
              <Link
                href="/dashboard/courses"
                className={`text-sm font-medium ${
                  pathname?.startsWith("/dashboard/courses")
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My courses
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm">{user.name}</span>
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
