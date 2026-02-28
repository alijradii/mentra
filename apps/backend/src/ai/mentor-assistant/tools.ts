import { tool } from "ai";
import type { CourseOutline, Node } from "shared";
import { z } from "zod";
import { getDb } from "../../db";
import { CourseModel } from "../../models/course";
import type { MentorAIActionContext } from "./types";

export const getCourseOutlineTool = (context: MentorAIActionContext) => {
    return tool({
        description: "View the outline of a course, including its modules and pages",
        inputSchema: z.object({
        }),
        execute: async (): Promise<{ success: true; outline: CourseOutline } | { success: false; error: string }> => {
            const model = new CourseModel(getDb());
            const course = await model.getCourseById(context.courseId);
            if (!course) {
                return { success: false, error: "Course not found" };
            }

            const modules = await model.getModulesByCourseId(course._id);

            const outlineModules = await Promise.all(
                modules.map(async (mod) => {
                    const nodes = await model.getNodesByModuleId(mod._id);
                    return {
                        _id: mod._id.toString(),
                        title: mod.title,
                        order: mod.order,
                        nodes: nodes.map((node) => ({
                            _id: node._id.toString(),
                            title: node.title,
                            type: node.type,
                        })),
                    };
                })
            );

            const outline: CourseOutline = {
                _id: course._id.toString(),
                title: course.title,
                description: course.description,
                modules: outlineModules,
            };

            return { success: true, outline };
        },
    });
}

export const getNodeContentTool = (context: MentorAIActionContext) => {
    return tool({
        description: "View the content of a node",
        inputSchema: z.object({
            nodeId: z.string(),
        }),
        execute: async ({ nodeId }): Promise<{ success: true; node: Node } | { success: false; error: string }> => {
            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);

            if (!node) {
                return { success: false, error: "Node not found" };
            }

            return { success: true, node: node as unknown as Node<string> };
        },
    });
}