"use client";

import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { forgotPasswordSchema } from "shared";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = forgotPasswordSchema.safeParse({ email });
            if (!result.success) {
                setError(result.error.errors[0]?.message ?? "Invalid email");
                setLoading(false);
                return;
            }

            await authApi.forgotPassword({ email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="text-3xl font-bold text-gray-900">
                            Mentra
                        </Link>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
                        <div className="text-green-600 text-5xl mb-4">✓</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
                        <p className="text-gray-600 mb-6">
                            If an account exists with <strong>{email}</strong>, you will receive a password reset link
                            shortly.
                        </p>
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-gray-900">
                        Mentra
                    </Link>
                    <p className="text-gray-600 mt-2">Reset your password</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

                        <p className="text-gray-600 text-sm">
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full py-6">
                            {loading ? "Sending..." : "Send reset link"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            ← Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
