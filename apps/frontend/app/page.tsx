"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Brain,
    CheckCircle,
    Sparkles,
    Star,
    Users,
    Zap,
} from "lucide-react";
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
                <div className="text-lg text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background dark">
            {/* Sticky Navbar */}
            <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Brain className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-foreground">Mentra</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-8">
                            <a
                                href="#features"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                How it works
                            </a>
                            <a
                                href="#why-mentra"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Why Mentra
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">Get started free</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background pointer-events-none" />
                <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-48 w-96 h-96 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
                    <div className="flex justify-center mb-6">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI-Powered Learning Platform
                        </span>
                    </div>

                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                            Learn anything,{" "}
                            <span className="bg-linear-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                                faster than ever
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            Mentra combines AI-powered personalization with expert-crafted courses to help you master
                            new skills at your own pace.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/signup">
                                <Button size="lg" className="text-base px-8 h-12 w-full sm:w-auto">
                                    Start learning for free
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="text-base px-8 h-12 w-full sm:w-auto">
                                    Browse courses
                                </Button>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            No credit card required · Free forever plan available
                        </p>
                    </div>

                    {/* Stats bar */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto border-t border-border/50 pt-12">
                        {[
                            { value: "10K+", label: "Active learners" },
                            { value: "500+", label: "Expert courses" },
                            { value: "98%", label: "Completion rate" },
                            { value: "4.9★", label: "Average rating" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Everything you need to succeed
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Powerful features designed to make learning effective, engaging, and enjoyable.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[
                            {
                                icon: Brain,
                                title: "AI-Personalized Paths",
                                description:
                                    "Our AI analyzes your learning style and goals to create a personalized curriculum just for you.",
                                color: "text-blue-400",
                                bg: "bg-blue-500/10",
                            },
                            {
                                icon: Zap,
                                title: "Adaptive Learning",
                                description:
                                    "Content dynamically adjusts to your progress, ensuring you're always challenged at the right level.",
                                color: "text-yellow-400",
                                bg: "bg-yellow-500/10",
                            },
                            {
                                icon: BookOpen,
                                title: "Expert-Crafted Content",
                                description:
                                    "Courses built by industry professionals with real-world experience and practical knowledge.",
                                color: "text-green-400",
                                bg: "bg-green-500/10",
                            },
                            {
                                icon: BarChart3,
                                title: "Progress Analytics",
                                description:
                                    "Detailed insights into your learning journey with actionable recommendations to improve.",
                                color: "text-purple-400",
                                bg: "bg-purple-500/10",
                            },
                            {
                                icon: Users,
                                title: "Community Learning",
                                description:
                                    "Connect with fellow learners, share insights, and collaborate on projects together.",
                                color: "text-pink-400",
                                bg: "bg-pink-500/10",
                            },
                            {
                                icon: Star,
                                title: "Certifications",
                                description:
                                    "Earn recognized certificates upon course completion to boost your career prospects.",
                                color: "text-orange-400",
                                bg: "bg-orange-500/10",
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                            >
                                <div
                                    className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}
                                >
                                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-24 bg-muted/20 border-y border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Get started in minutes
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Three simple steps to begin your learning journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                step: "01",
                                title: "Create your account",
                                description:
                                    "Sign up for free and tell us about your learning goals and current experience level.",
                            },
                            {
                                step: "02",
                                title: "Explore courses",
                                description:
                                    "Browse our catalog of 500+ courses or let AI recommend the perfect path for you.",
                            },
                            {
                                step: "03",
                                title: "Learn & achieve",
                                description:
                                    "Follow your personalized path, track your progress, and earn certificates.",
                            },
                        ].map((item, index) => (
                            <div key={item.step} className="relative text-center">
                                {index < 2 && (
                                    <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-linear-to-r from-border to-transparent" />
                                )}
                                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-5">
                                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Mentra */}
            <section id="why-mentra" className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                                Why learners choose Mentra
                            </h2>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                We&apos;re not just another learning platform. Mentra is designed to help you retain
                                knowledge, stay motivated, and achieve your goals faster.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Personalized learning paths powered by AI",
                                    "Learn at your own pace, on any device",
                                    "Real-world projects and hands-on practice",
                                    "Expert instructors from top companies",
                                    "Lifetime access to purchased courses",
                                    "Regular content updates and new courses",
                                ].map((benefit) => (
                                    <li key={benefit} className="flex items-center gap-3 text-foreground">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-10">
                                <Link href="/signup">
                                    <Button size="lg" className="h-12 px-8 text-base">
                                        Join Mentra today
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    label: "Courses completed",
                                    value: "2.4M+",
                                    gradient: "from-blue-500/20 to-blue-500/5",
                                },
                                {
                                    label: "Expert instructors",
                                    value: "350+",
                                    gradient: "from-purple-500/20 to-purple-500/5",
                                },
                                {
                                    label: "Hours of content",
                                    value: "15K+",
                                    gradient: "from-green-500/20 to-green-500/5",
                                },
                                {
                                    label: "Countries reached",
                                    value: "120+",
                                    gradient: "from-orange-500/20 to-orange-500/5",
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={`bg-linear-to-br ${item.gradient} border border-border rounded-2xl p-6`}
                                >
                                    <div className="text-3xl font-bold text-foreground mb-1">{item.value}</div>
                                    <div className="text-sm text-muted-foreground">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-linear-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-12 text-center overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                Ready to start your learning journey?
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                                Join thousands of learners who are already growing with Mentra. Start for free today.
                            </p>
                            <Link href="/signup">
                                <Button size="lg" className="text-base px-10 h-12">
                                    Get started for free
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-4">
                                Free forever · No credit card required
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                                <Brain className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold text-foreground">Mentra</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">
                                Privacy
                            </a>
                            <a href="#" className="hover:text-foreground transition-colors">
                                Terms
                            </a>
                            <a href="#" className="hover:text-foreground transition-colors">
                                Support
                            </a>
                        </div>
                        <p className="text-sm text-muted-foreground">© 2026 Mentra. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
