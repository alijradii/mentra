"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { coursesApi } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { UploadButton } from "@/lib/uploadthing";

export default function NewCoursePage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await coursesApi.create(token, {
        title: title.trim(),
        description: description.trim(),
        visibility,
        ...(thumbnail ? { thumbnail } : {}),
      });
      router.push(`/dashboard/courses/${res.data._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md">
        <Link
          href="/dashboard/courses"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to courses
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-6">New course</h1>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Course title"
              required
              maxLength={200}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the course"
              maxLength={5000}
              rows={4}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <Label>Thumbnail</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Optional · 1:1 aspect ratio recommended</p>
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt="Course thumbnail"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-2">No thumbnail</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <UploadButton
                  endpoint="courseThumbnail"
                  onUploadBegin={() => setThumbnailUploading(true)}
                  onClientUploadComplete={res => {
                    const first = res?.[0];
                    const url = first?.url ?? (first as { serverData?: { url?: string } })?.serverData?.url;
                    if (url) setThumbnail(url);
                    setThumbnailUploading(false);
                  }}
                  onUploadError={e => {
                    setThumbnailUploading(false);
                    setError(e.message);
                  }}
                  content={{ button: thumbnailUploading ? "Uploading..." : thumbnail ? "Change thumbnail" : "Upload thumbnail" }}
                  disabled={thumbnailUploading}
                />
                {thumbnail && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors text-left"
                    onClick={() => setThumbnail(null)}
                  >
                    Remove thumbnail
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || thumbnailUploading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/courses">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
