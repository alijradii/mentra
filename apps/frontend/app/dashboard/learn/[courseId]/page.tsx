"use client";

import { CourseOutline } from "@/components/learn/course-outline";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
    ApiError,
    coursesApi,
    enrollmentApi,
    modulesApi,
    nodesApi,
    type CourseDTO,
    type EnrollmentDTO,
    type ModuleDTO,
    type NodeDTO,
} from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LearnCourseOverviewPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params?.courseId as string;

    const [course, setCourse] = useState<CourseDTO | null>(null);
    const [modules, setModules] = useState<ModuleDTO[]>([]);
    const [nodesByModule, setNodesByModule] = useState<Record<string, NodeDTO[]>>({});
    const [enrollment, setEnrollment] = useState<EnrollmentDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!token || !courseId) return;
        let cancelled = false;

        Promise.all([
            coursesApi.getById(token, courseId),
            modulesApi.list(token, courseId),
            enrollmentApi.getMyEnrollment(token, courseId).catch(() => null),
        ])
            .then(async ([courseRes, modulesRes, enrollmentRes]) => {
                if (cancelled) return;
                setCourse(courseRes.data);
                const mods = modulesRes.data;
                setModules(mods);
                if (enrollmentRes) setEnrollment(enrollmentRes.data);

                if (mods.length > 0) {
                    setExpandedModules(new Set([mods[0]._id]));
                }

                const nodeResults = await Promise.all(mods.map(m => nodesApi.list(token, m._id)));
                if (cancelled) return;
                const map: Record<string, NodeDTO[]> = {};
                mods.forEach((m, i) => {
                    map[m._id] = nodeResults[i].data;
                });
                setNodesByModule(map);
            })
            .catch(err => {
                if (!cancelled) {
                    setError(err instanceof ApiError ? err.message : "Failed to load course");
                    if (err instanceof ApiError && err.status === 403) {
                        router.replace("/dashboard/learn");
                    }
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, courseId, router]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <p className="text-muted-foreground">Loading…</p>
            </div>
        );
    }

    const completedNodes = new Set(enrollment?.progress.completedNodes ?? []);

    let firstIncompleteNode: { moduleId: string; nodeId: string } | null = null;
    outer: for (const mod of modules) {
        for (const node of nodesByModule[mod._id] ?? []) {
            if (!completedNodes.has(node._id)) {
                firstIncompleteNode = { moduleId: mod._id, nodeId: node._id };
                break outer;
            }
        }
    }

    const totalNodes = modules.reduce((acc, m) => acc + (nodesByModule[m._id]?.length ?? 0), 0);
    const pct = enrollment?.progress.overallPercentage ?? 0;

    const toggleModule = (id: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link href="/dashboard/learn" className="hover:text-foreground">
                    My learning
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{course?.title ?? "Course"}</span>
            </div>

            {error && <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm">{error}</div>}

            <div className="bg-card border rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
                        {course?.author?.name && (
                            <p className="text-sm text-muted-foreground mt-0.5">by {course.author.name}</p>
                        )}
                        {course?.description && (
                            <p className="text-muted-foreground mt-2 text-sm">{course.description}</p>
                        )}
                    </div>
                    {firstIncompleteNode ? (
                        <Button asChild className="shrink-0">
                            <Link
                                href={`/dashboard/learn/${courseId}/${firstIncompleteNode.moduleId}/${firstIncompleteNode.nodeId}`}
                            >
                                {pct > 0 ? "Continue" : "Start learning"}
                            </Link>
                        </Button>
                    ) : totalNodes > 0 ? (
                        <span className="shrink-0 text-sm font-medium text-success bg-success/15 px-3 py-1.5 rounded-lg border border-success/40">
                            Course complete!
                        </span>
                    ) : null}
                </div>

                {enrollment && totalNodes > 0 && (
                    <div className="mt-4 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{pct}% complete</span>
                            <span>
                                {completedNodes.size} / {totalNodes} lessons
                            </span>
                        </div>
                        <ProgressBar value={pct} />
                    </div>
                )}
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-3">Course content</h2>

            {modules.length === 0 ? (
                <p className="text-muted-foreground text-sm">No content available yet.</p>
            ) : (
                <CourseOutline
                    courseId={courseId}
                    modules={modules}
                    nodesByModule={nodesByModule}
                    completedNodes={completedNodes}
                    expandedModules={expandedModules}
                    onToggleModule={toggleModule}
                />
            )}
        </div>
    );
}
