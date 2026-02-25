"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError, authApi } from "@/lib/api";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
    const { user, token, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name ?? "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || name.trim() === user?.name) return;
        setSaving(true);
        setMessage(null);
        try {
            await authApi.updateProfile(token, { name: name.trim() });
            await refreshUser();
            setMessage({ type: "success", text: "Profile updated." });
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof ApiError ? err.message : "Failed to update profile.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUploadComplete = async (res: { url?: string; serverData?: { url?: string } }[]) => {
        const first = res?.[0];
        const url = first?.url ?? (first as { serverData?: { url?: string } })?.serverData?.url;
        if (!url || !token) return;
        try {
            await authApi.updateProfile(token, { avatar: url });
            await refreshUser();
            setMessage({ type: "success", text: "Avatar updated." });
        } catch (err) {
            setMessage({
                type: "error",
                text: err instanceof ApiError ? err.message : "Failed to save avatar.",
            });
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

            <div className="space-y-8">
                {/* Avatar */}
                <section className="flex flex-col gap-4">
                    <Label className="text-sm font-medium text-foreground">Avatar</Label>
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-muted overflow-hidden border-2 border-border flex items-center justify-center shrink-0 relative">
                            {user.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt={user.name}
                                    width={192}
                                    height={192}
                                    quality={100}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-semibold text-muted-foreground">
                                    {user.name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <UploadButton
                                endpoint="avatar"
                                onClientUploadComplete={handleAvatarUploadComplete}
                                onUploadError={e => {
                                    setMessage({ type: "error", text: e.message });
                                }}
                                content={{
                                    button: "Change avatar",
                                }}
                            />
                            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 4MB.</p>
                        </div>
                    </div>
                </section>

                {/* Name & Email */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Display name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            minLength={2}
                            maxLength={100}
                            placeholder="Your name"
                            className="max-w-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={user.email}
                            disabled
                            className="max-w-sm bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">
                            Email cannot be changed here. Contact support if needed.
                        </p>
                    </div>
                    {message && (
                        <p className={message.type === "success" ? "text-sm text-success" : "text-sm text-destructive"}>
                            {message.text}
                        </p>
                    )}
                    <Button type="submit" disabled={saving || name.trim() === user.name}>
                        {saving ? "Saving…" : "Save changes"}
                    </Button>
                </form>

                {/* Security */}
                <section className="pt-6 border-t border-border">
                    <h2 className="text-lg font-semibold text-foreground mb-2">Security</h2>
                    <Link href="/forgot-password">
                        <Button variant="outline">Change password</Button>
                    </Link>
                </section>
            </div>
        </div>
    );
}
