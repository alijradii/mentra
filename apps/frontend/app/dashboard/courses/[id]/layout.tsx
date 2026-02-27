"use client";

import { AiSidebar } from "@/components/course-ai-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { CourseWSProvider } from "@/contexts/CourseWSContext";
import { useParams } from "next/navigation";

export default function CourseIdLayout({ children }: { children: React.ReactNode }) {
    const { token, user } = useAuth();
    const params = useParams();
    const courseId = params?.id as string;

    if (!token || !user || !courseId) {
        return <>{children}</>;
    }

    return (
        <CourseWSProvider courseId={courseId} token={token} userId={user.id}>
            <div className="h-full min-h-0 flex w-full overflow-hidden">
                <main className="flex-1 min-w-0 min-h-full overflow-auto">{children}</main>
                <AiSidebar />
            </div>
        </CourseWSProvider>
    );
}
