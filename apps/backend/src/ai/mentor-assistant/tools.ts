import { tool } from "ai";
import { type CourseOutline, type CourseOutlineModule, type Node } from "shared";
import { z } from "zod";
import { getDb } from "../../db";
import { CourseModel } from "../../models/course";
import { aiSectionInputSchema, hydrateSections } from "./schemas";
import type { MentorAIActionContext } from "./types";

export const getCourseOutlineTool = (context: MentorAIActionContext) => {
    return tool({
        description: "View the outline of a course, including its modules and pages",
        inputSchema: z.object({
        }),
        execute: async (): Promise<{ success: true; outline: CourseOutline } | { success: false; error: string }> => {
            context.sendChat("Getting course outline for course " + context.courseId);

            const model = new CourseModel(getDb());
            const course = await model.getCourseById(context.courseId);
            if (!course) {
                return { success: false, error: "Course not found" };
            }

            const modules = await model.getModulesByCourseId(course._id);

            const outlineModules: CourseOutlineModule[] = await Promise.all(
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
                            description: node.description,
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
            context.sendChat("Viewing content of node " + nodeId);
            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);

            if (!node) {
                return { success: false, error: "Node not found" };
            }

            return { success: true, node: node as unknown as Node<string> };
        },
    });
}

export const editNodeSectionsTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Replace all sections of a node. Each section needs a 'type' field: 'text', 'embedding', 'quiz', 'code', 'image', or 'video'. Quiz sections also need a 'quizType' field. IDs, order, and timestamps are generated automatically.",
        inputSchema: z.object({
            nodeId: z.string().describe("ID of the node to edit"),
            sections: z
                .array(aiSectionInputSchema)
                .min(1, "At least one section is required"),
        }),
        execute: async ({ nodeId, sections }): Promise<{ success: true; message: string } | { success: false; error: string }> => {
            context.sendChat("Editing sections of node " + nodeId);
            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);

            if (!node) {
                return { success: false, error: "Node not found" };
            }

            const hydratedSections = hydrateSections(sections) as unknown as import("shared").Section[];

            await model.updateNode(nodeId, {
                sections: hydratedSections,
            });

            context.broadcastToCourse("node:updated", {
                nodeId,
                sections: hydratedSections,
            });

            return { success: true, message: "Sections updated successfully" };
        },
    });
}