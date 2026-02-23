"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-background dark">
            {/* Navigation */}
            <nav className="border-b bg-card/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/" className="text-2xl font-bold text-foreground">
                                Mentra
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="outline">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button>Sign Up</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                        Welcome to{" "}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Mentra
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        A modern platform built with the latest technologies. Experience seamless authentication and a
                        beautiful user interface.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/signup">
                            <Button size="lg" className="text-lg px-8 py-6">
                                Get Started
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-32 grid md:grid-cols-3 gap-8">
                    <div className="bg-card p-8 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                            <svg
                                className="w-6 h-6 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Secure Authentication</h3>
                        <p className="text-muted-foreground">
                            Industry-standard security with JWT tokens and email verification.
                        </p>
                    </div>

                    <div className="bg-card p-8 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                            <svg
                                className="w-6 h-6 text-accent"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                        <p className="text-muted-foreground">Built with Next.js and Bun for optimal performance and speed.</p>
                    </div>

                    <div className="bg-card p-8 rounded-2xl shadow-sm border">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center mb-4">
                            <svg
                                className="w-6 h-6 text-success"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Modern Design</h3>
                        <p className="text-muted-foreground">Beautiful UI with Tailwind CSS and shadcn/ui components.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
