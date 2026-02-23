"use client";

import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPasswordSchema } from "shared";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const result = resetPasswordSchema.safeParse({ token, password: formData.password });
        if (!result.success) {
            setError(result.error.errors[0]?.message ?? "Validation failed");
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword({ token, password: formData.password });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Password reset</h2>
                <p className="text-gray-600 mb-6">
                    Your password has been updated. You can now log in with your new password.
                </p>
                <Link href="/login">
                    <Button className="w-full py-6">Log in</Button>
                </Link>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
                <div className="text-amber-500 text-5xl mb-4">!</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h2>
                <p className="text-gray-600 mb-6">
                    This reset link is invalid or missing. Please request a new password reset from the login page.
                </p>
                <Link href="/forgot-password">
                    <Button className="w-full py-6">Request new link</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        New password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        minLength={8}
                    />
                    <p className="text-gray-500 text-xs mt-1">At least 8 characters</p>
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full py-6">
                    {loading ? "Resetting..." : "Reset password"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link href="/login" className="text-blue-600 hover:underline font-medium text-sm">
                    ← Back to login
                </Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-gray-900">
                        Mentra
                    </Link>
                    <p className="text-gray-600 mt-2">Set a new password</p>
                </div>

                <Suspense
                    fallback={
                        <div className="bg-white rounded-2xl shadow-xl border p-8 text-center text-gray-500">
                            Loading...
                        </div>
                    }
                >
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
