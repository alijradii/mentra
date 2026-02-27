"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  mentorsApi,
  studentsApi,
  type CourseMemberDTO,
  type CourseStudentDTO,
  ApiError,
} from "@/lib/api";

interface Props {
  courseId: string;
  token: string;
  currentUserId: string;
  ownerId: string;
  /** True when the current user is also in mentorIds (not just the owner) */
  isMentor: boolean;
  /** When true, add/remove mentor actions are disabled (e.g. AI agent is editing) */
  editsLocked?: boolean;
}

function UserAvatar({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <span className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0 select-none">
      {initials}
    </span>
  );
}

export function CourseMembersPanel({
  courseId,
  token,
  currentUserId,
  ownerId,
  isMentor,
  editsLocked = false,
}: Props) {
  const isOwner = currentUserId === ownerId;
  const isPrivileged = isOwner || isMentor;

  const [mentors, setMentors] = useState<CourseMemberDTO[]>([]);
  const [students, setStudents] = useState<CourseStudentDTO[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");

  const [addMentorEmail, setAddMentorEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadMentors = useCallback(() => {
    setLoadingMentors(true);
    mentorsApi
      .list(token, courseId)
      .then((res) => setMentors(res.data))
      .catch(() => setError("Failed to load teachers"))
      .finally(() => setLoadingMentors(false));
  }, [token, courseId]);

  const loadStudents = useCallback(() => {
    setLoadingStudents(true);
    studentsApi
      .list(token, courseId)
      .then((res) => setStudents(res.data))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [token, courseId]);

  useEffect(() => {
    loadMentors();
    loadStudents();
  }, [loadMentors, loadStudents]);

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = addMentorEmail.trim();
    if (!email) return;
    setAdding(true);
    setAddError("");
    try {
      await mentorsApi.add(token, courseId, email);
      setAddMentorEmail("");
      loadMentors();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Failed to add mentor");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMentor = async (mentorId: string) => {
    setRemovingId(mentorId);
    try {
      await mentorsApi.remove(token, courseId, mentorId);
      setMentors((prev) => prev.filter((m) => m._id !== mentorId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove mentor");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Teachers */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Teachers</h2>

        {loadingMentors ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="space-y-2">
            {mentors.map((m) => (
              <li
                key={m._id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border"
              >
                <UserAvatar name={m.name} avatar={m.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                </div>
                {isOwner && m.role === "mentor" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    disabled={removingId === m._id || editsLocked}
                    onClick={() => handleRemoveMentor(m._id)}
                  >
                    {removingId === m._id ? "Removing…" : "Remove"}
                  </Button>
                )}
              </li>
            ))}
            {mentors.length === 0 && (
              <p className="text-sm text-muted-foreground">No teachers yet.</p>
            )}
          </ul>
        )}

        {/* Add mentor form — owner only */}
        {isOwner && !editsLocked && (
          <form onSubmit={handleAddMentor} className="mt-4 flex gap-2 items-start">
            <div className="flex-1">
              <Input
                type="email"
                value={addMentorEmail}
                onChange={(e) => { setAddMentorEmail(e.target.value); setAddError(""); }}
                placeholder="Enter email address to add as mentor"
                className={addError ? "border-destructive" : ""}
              />
              {addError && (
                <p className="text-xs text-destructive mt-1">{addError}</p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={adding || !addMentorEmail.trim()}>
              {adding ? "Adding…" : "Add mentor"}
            </Button>
          </form>
        )}
      </section>

      {/* Students */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Students
          {!loadingStudents && students.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({students.length})
            </span>
          )}
        </h2>

        {loadingStudents ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => (
              <li
                key={s._id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border"
              >
                <UserAvatar name={s.name} avatar={s.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  {isPrivileged && s.email && (
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  )}
                </div>
                {isPrivileged && s.progress !== undefined && (
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-foreground">{s.progress}%</p>
                    <p className="text-xs text-muted-foreground">progress</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
