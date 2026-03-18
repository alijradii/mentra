import { tool } from "ai";
import { ObjectId } from "mongodb";
import { type CourseOutline, type CourseOutlineModule, type Node } from "shared";
import { z } from "zod";
import { getDb } from "../../db";
import { CourseModel } from "../../models/course";
import { aiSectionInputSchema, hydrateSections } from "./schemas";
import type { MentorAIActionContext } from "./types";

const nodeTypeSchema = z.enum(["lesson", "practice", "quiz"]);

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

export const appendToNodeTool = (context: MentorAIActionContext) => {
    return tool({
        description:
            "Append ONE new section to the end of a node. The section must include a 'type' field: 'text', 'embedding', 'quiz', 'code', 'image', 'video', or 'page-break'. IDs, order, and timestamps are generated automatically.",
        inputSchema: z.object({
            nodeId: z.string().describe("ID of the node to append the section to"),
            section: aiSectionInputSchema.describe("The section to append"),
        }),
        execute: async ({
            nodeId,
            section,
        }): Promise<
            | { success: true; message: string; sectionId: string }
            | { success: false; error: string }
        > => {
            context.sendChat(`Appending a section to node ${nodeId}`);
            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);

            if (!node) {
                return { success: false, error: "Node not found" };
            }

            // Ensure the node belongs to the current course.
            const module = await model.getModuleById(node.moduleId);
            if (!module || module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Node does not belong to this course" };
            }

            const existingSections = (node.sections ?? []) as unknown as import("shared").Section[];
            const nextOrder = existingSections.length;

            const [hydrated] = hydrateSections([section]) as unknown as import("shared").Section[];
            const appendedSection = { ...hydrated, order: nextOrder } as import("shared").Section;

            const updatedSections = [...existingSections, appendedSection];

            const ok = await model.updateNode(nodeId, {
                sections: updatedSections,
            });
            if (!ok) {
                return { success: false, error: "Failed to append section" };
            }

            context.broadcastToCourse("node:updated", {
                nodeId,
                sections: updatedSections,
            });

            return {
                success: true,
                message: "Section appended successfully",
                sectionId: (appendedSection as any).id ?? "",
            };
        },
    });
};

export const editNodeSectionTool = (context: MentorAIActionContext) => {
    return tool({
        description:
            "Edit (replace) ONE existing section in a node by sectionId. The new section must include a 'type' field: 'text', 'embedding', 'quiz', 'code', 'image', 'video', or 'page-break'. The section's id/order/createdAt are preserved; other fields are replaced and timestamps updated.",
        inputSchema: z.object({
            nodeId: z.string().describe("ID of the node containing the section"),
            sectionId: z.string().min(1).describe("ID of the section to modify"),
            section: aiSectionInputSchema.describe("The replacement section content"),
        }),
        execute: async ({
            nodeId,
            sectionId,
            section,
        }): Promise<
            | { success: true; message: string }
            | { success: false; error: string }
        > => {
            context.sendChat(`Editing section ${sectionId} in node ${nodeId}`);
            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);

            if (!node) {
                return { success: false, error: "Node not found" };
            }

            // Ensure the node belongs to the current course.
            const module = await model.getModuleById(node.moduleId);
            if (!module || module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Node does not belong to this course" };
            }

            const existingSections = (node.sections ?? []) as unknown as import("shared").Section[];
            const index = existingSections.findIndex((s: any) => s?.id === sectionId);
            if (index === -1) {
                return { success: false, error: "Section not found" };
            }

            const existing = existingSections[index] as any;

            const [hydrated] = hydrateSections([section]) as unknown as import("shared").Section[];
            const replacement = {
                ...hydrated,
                id: existing.id,
                order: existing.order,
                createdAt: existing.createdAt,
                updatedAt: new Date(),
            } as import("shared").Section;

            const updatedSections = [...existingSections];
            updatedSections[index] = replacement;

            const ok = await model.updateNode(nodeId, { sections: updatedSections });
            if (!ok) {
                return { success: false, error: "Failed to update section" };
            }

            context.broadcastToCourse("node:updated", {
                nodeId,
                sections: updatedSections,
            });

            return { success: true, message: "Section updated successfully" };
        },
    });
};

export const createModuleTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Create a new module (chapter) in the course",
        inputSchema: z.object({
            title: z.string().min(1).max(200).describe("Module title"),
            description: z.string().max(1000).optional().describe("Optional module description"),
            order: z.number().int().min(0).optional().describe("Order position (0-based). If omitted, appends at end."),
        }),
        execute: async ({
            title,
            description,
            order,
        }): Promise<{ success: true; moduleId: string } | { success: false; error: string }> => {
            context.sendChat(`Creating module "${title}"`);

            const model = new CourseModel(getDb());
            const course = await model.getCourseById(context.courseId);
            if (!course) {
                return { success: false, error: "Course not found" };
            }

            const modules = await model.getModulesByCourseId(course._id);
            const insertOrder =
                order !== undefined ? order : modules.length;

            const module = await model.createModule({
                courseId: course._id as ObjectId,
                title,
                description,
                order: insertOrder,
                nodes: [],
                status: "draft",
            });

            context.broadcastToCourse("module:created", module);

            return { success: true, moduleId: module._id.toString() };
        },
    });
};

export const deleteModuleTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Delete a module and all its nodes",
        inputSchema: z.object({
            moduleId: z.string().describe("ID of the module to delete"),
        }),
        execute: async ({
            moduleId,
        }): Promise<{ success: true; message: string } | { success: false; error: string }> => {
            context.sendChat(`Deleting module ${moduleId}`);

            const model = new CourseModel(getDb());
            const module = await model.getModuleById(moduleId);
            if (!module) {
                return { success: false, error: "Module not found" };
            }
            if (module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Module does not belong to this course" };
            }

            const deleted = await model.deleteModule(moduleId, true);
            if (!deleted) {
                return { success: false, error: "Failed to delete module" };
            }

            context.broadcastToCourse("module:deleted", { moduleId });

            return { success: true, message: "Module deleted successfully" };
        },
    });
};

export const reorderModulesTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Reorder modules within the course. Provide module IDs in the desired order.",
        inputSchema: z.object({
            moduleIds: z
                .array(z.string())
                .min(1)
                .describe("Module IDs in the new order"),
        }),
        execute: async ({
            moduleIds,
        }): Promise<{ success: true; message: string } | { success: false; error: string }> => {
            context.sendChat("Reordering modules");

            const model = new CourseModel(getDb());
            const course = await model.getCourseById(context.courseId);
            if (!course) {
                return { success: false, error: "Course not found" };
            }

            const ok = await model.reorderModules(context.courseId, moduleIds);
            if (!ok) {
                return { success: false, error: "Invalid module list (must include all course modules)" };
            }

            context.broadcastToCourse("modules:reordered", { moduleIds });

            return { success: true, message: "Modules reordered successfully" };
        },
    });
};

export const createNodeTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Create a new node (lesson, practice, or quiz page) in a module",
        inputSchema: z.object({
            moduleId: z.string().describe("ID of the module to add the node to"),
            title: z.string().min(1).max(200).describe("Node title"),
            description: z.string().max(1000).optional().describe("Optional description"),
            type: nodeTypeSchema.default("lesson").describe("Node type: lesson, practice, or quiz"),
            order: z.number().int().min(0).optional().describe("Order position (0-based). If omitted, appends at end."),
        }),
        execute: async ({
            moduleId,
            title,
            description,
            type,
            order,
        }): Promise<{ success: true; nodeId: string } | { success: false; error: string }> => {
            context.sendChat(`Creating node "${title}" in module ${moduleId}`);

            const model = new CourseModel(getDb());
            const module = await model.getModuleById(moduleId);
            if (!module) {
                return { success: false, error: "Module not found" };
            }
            if (module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Module does not belong to this course" };
            }

            const nodes = await model.getNodesByModuleId(moduleId);
            const insertOrder = order !== undefined ? order : nodes.length;

            const node = await model.createNode({
                moduleId: module._id as ObjectId,
                title,
                description,
                type,
                sections: [],
                order: insertOrder,
                status: "draft",
            });

            context.broadcastToCourse("node:created", node);

            return { success: true, nodeId: node._id.toString() };
        },
    });
};

export const createAndPopulateModuleTool = (context: MentorAIActionContext) => {
    return tool({
        description:
            "Create a new module and one or more populated nodes (with sections) inside it.",
        inputSchema: z.object({
            title: z.string().min(1).max(200).describe("Module title"),
            description: z
                .string()
                .max(1000)
                .optional()
                .describe("Optional module description"),
            order: z
                .number()
                .int()
                .min(0)
                .optional()
                .describe(
                    "Order position of the new module (0-based). If omitted, appends at end."
                ),
            nodes: z
                .array(
                    z.object({
                        title: z
                            .string()
                            .min(1)
                            .max(200)
                            .describe("Node title"),
                        description: z
                            .string()
                            .max(1000)
                            .optional()
                            .describe("Optional node description"),
                        type: nodeTypeSchema
                            .default("lesson")
                            .describe("Node type: lesson, practice, or quiz"),
                        order: z
                            .number()
                            .int()
                            .min(0)
                            .optional()
                            .describe(
                                "Order position within the new module (0-based). If omitted, nodes are appended in the given order."
                            ),
                        sections: z
                            .array(aiSectionInputSchema)
                            .min(1, "At least one section is required")
                            .describe(
                                "Sections that will make up the node content."
                            ),
                    })
                )
                .min(1)
                .describe(
                    "Nodes to create inside the new module, each with its own sections."
                ),
        }),
        execute: async ({
            title,
            description,
            order,
            nodes,
        }): Promise<
            | { success: true; moduleId: string; nodeIds: string[] }
            | { success: false; error: string }
        > => {
            context.sendChat(
                `Creating module "${title}" with ${nodes.length} populated node(s)`
            );

            const model = new CourseModel(getDb());
            const course = await model.getCourseById(context.courseId);
            if (!course) {
                return { success: false, error: "Course not found" };
            }

            const existingModules = await model.getModulesByCourseId(
                course._id
            );
            const insertOrder =
                order !== undefined ? order : existingModules.length;

            const module = await model.createModule({
                courseId: course._id as ObjectId,
                title,
                description,
                order: insertOrder,
                nodes: [],
                status: "draft",
            });

            const createdNodeIds: string[] = [];

            for (let index = 0; index < nodes.length; index++) {
                const nodeSpec = nodes[index];
                const hydratedSections =
                    hydrateSections(nodeSpec.sections) as unknown as import("shared").Section[];

                const nodeOrder =
                    nodeSpec.order !== undefined ? nodeSpec.order : index;

                const node = await model.createNode({
                    moduleId: module._id as ObjectId,
                    title: nodeSpec.title,
                    description: nodeSpec.description,
                    type: nodeSpec.type,
                    sections: hydratedSections,
                    order: nodeOrder,
                    status: "draft",
                });

                createdNodeIds.push(node._id.toString());

                context.broadcastToCourse("node:created", node);
            }

            context.broadcastToCourse("module:created", module);

            return {
                success: true,
                moduleId: module._id.toString(),
                nodeIds: createdNodeIds,
            };
        },
    });
};

export const createAndPopulateNodeTool = (context: MentorAIActionContext) => {
    return tool({
        description:
            "Create a new node in an existing module and immediately populate it with sections.",
        inputSchema: z.object({
            moduleId: z
                .string()
                .describe("ID of the module to add the node to"),
            title: z.string().min(1).max(200).describe("Node title"),
            description: z
                .string()
                .max(1000)
                .optional()
                .describe("Optional description"),
            type: nodeTypeSchema
                .default("lesson")
                .describe("Node type: lesson, practice, or quiz"),
            order: z
                .number()
                .int()
                .min(0)
                .optional()
                .describe(
                    "Order position (0-based). If omitted, appends at end."
                ),
            sections: z
                .array(aiSectionInputSchema)
                .min(1, "At least one section is required")
                .describe("Sections that will make up the node content."),
        }),
        execute: async ({
            moduleId,
            title,
            description,
            type,
            order,
            sections,
        }): Promise<
            | { success: true; nodeId: string }
            | { success: false; error: string }
        > => {
            context.sendChat(
                `Creating and populating node "${title}" in module ${moduleId}`
            );

            const model = new CourseModel(getDb());
            const module = await model.getModuleById(moduleId);
            if (!module) {
                return { success: false, error: "Module not found" };
            }
            if (module.courseId.toString() !== context.courseId) {
                return {
                    success: false,
                    error: "Module does not belong to this course",
                };
            }

            const existingNodes = await model.getNodesByModuleId(moduleId);
            const insertOrder =
                order !== undefined ? order : existingNodes.length;

            const hydratedSections =
                hydrateSections(sections) as unknown as import("shared").Section[];

            const node = await model.createNode({
                moduleId: module._id as ObjectId,
                title,
                description,
                type,
                sections: hydratedSections,
                order: insertOrder,
                status: "draft",
            });

            context.broadcastToCourse("node:created", node);

            return { success: true, nodeId: node._id.toString() };
        },
    });
};

export const deleteNodeTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Delete a node",
        inputSchema: z.object({
            nodeId: z.string().describe("ID of the node to delete"),
        }),
        execute: async ({
            nodeId,
        }): Promise<{ success: true; message: string } | { success: false; error: string }> => {
            context.sendChat(`Deleting node ${nodeId}`);

            const model = new CourseModel(getDb());
            const node = await model.getNodeById(nodeId);
            if (!node) {
                return { success: false, error: "Node not found" };
            }
            const module = await model.getModuleById(node.moduleId);
            if (!module || module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Node does not belong to this course" };
            }

            const deleted = await model.deleteNode(nodeId);
            if (!deleted) {
                return { success: false, error: "Failed to delete node" };
            }

            context.broadcastToCourse("node:deleted", { nodeId });

            return { success: true, message: "Node deleted successfully" };
        },
    });
};

export const reorderNodesTool = (context: MentorAIActionContext) => {
    return tool({
        description: "Reorder nodes within a module. Provide node IDs in the desired order.",
        inputSchema: z.object({
            moduleId: z.string().describe("ID of the module containing the nodes"),
            nodeIds: z
                .array(z.string())
                .min(1)
                .describe("Node IDs in the new order"),
        }),
        execute: async ({
            moduleId,
            nodeIds,
        }): Promise<{ success: true; message: string } | { success: false; error: string }> => {
            context.sendChat(`Reordering nodes in module ${moduleId}`);

            const model = new CourseModel(getDb());
            const module = await model.getModuleById(moduleId);
            if (!module) {
                return { success: false, error: "Module not found" };
            }
            if (module.courseId.toString() !== context.courseId) {
                return { success: false, error: "Module does not belong to this course" };
            }

            const ok = await model.reorderNodes(moduleId, nodeIds);
            if (!ok) {
                return { success: false, error: "Invalid node list (must include all module nodes)" };
            }

            context.broadcastToCourse("nodes:reordered", { moduleId, nodeIds });

            return { success: true, message: "Nodes reordered successfully" };
        },
    });
};