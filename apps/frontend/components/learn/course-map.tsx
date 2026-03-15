"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ModuleDTO, NodeDTO } from "@/lib/api";

interface CourseMapProps {
    courseId: string;
    modules: ModuleDTO[];
    nodesByModule: Record<string, NodeDTO[]>;
    completedNodes: Set<string>;
}

interface NodeInfo {
    node: NodeDTO;
    moduleId: string;
    globalIndex: number;
    isCompleted: boolean;
    isUnlocked: boolean;
}

interface ModuleBannerItem {
    type: "banner";
    module: ModuleDTO;
    moduleIndex: number;
}

interface NodeRowItem {
    type: "row";
    nodes: (NodeInfo | null)[];
    rowIndex: number;
}

type MapItem = ModuleBannerItem | NodeRowItem;

export function CourseMap({ courseId, modules, nodesByModule, completedNodes }: CourseMapProps) {
    const router = useRouter();
    const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null);

    const mapItems = useMemo<MapItem[]>(() => {
        // Build flat list
        const flat: NodeInfo[] = [];
        for (const mod of modules) {
            for (const node of nodesByModule[mod._id] ?? []) {
                flat.push({
                    node,
                    moduleId: mod._id,
                    globalIndex: flat.length,
                    isCompleted: completedNodes.has(node._id),
                    isUnlocked: false,
                });
            }
        }

        // Determine unlock status: node i is unlocked iff all nodes 0..i-1 are completed
        let allPrevComplete = true;
        for (const info of flat) {
            info.isUnlocked = allPrevComplete;
            if (!info.isCompleted) allPrevComplete = false;
        }

        // Build map items: banners + rows of 3 nodes (snake layout)
        const items: MapItem[] = [];
        let flatIdx = 0;
        let rowIndex = 0;

        for (let mi = 0; mi < modules.length; mi++) {
            const mod = modules[mi];
            const nodeCount = (nodesByModule[mod._id] ?? []).length;
            if (nodeCount === 0) continue;

            items.push({ type: "banner", module: mod, moduleIndex: mi });

            for (let i = 0; i < nodeCount; i += 3) {
                const chunk: (NodeInfo | null)[] = [];
                for (let j = 0; j < 3; j++) {
                    chunk.push(flatIdx < flat.length ? flat[flatIdx++] : null);
                }
                items.push({ type: "row", nodes: chunk, rowIndex: rowIndex++ });
            }
        }

        return items;
    }, [modules, nodesByModule, completedNodes]);

    const handleStartLearning = (info: NodeInfo) => {
        setSelectedNode(null);
        router.push(`/dashboard/learn/${courseId}/${info.moduleId}/${info.node._id}?focused=true`);
    };

    if (modules.length === 0) {
        return (
            <p className="text-muted-foreground text-sm text-center py-12">
                No content available yet.
            </p>
        );
    }

    return (
        <div className="relative">
            {/* Backdrop overlay for node detail */}
            {selectedNode && (
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
                    onClick={() => setSelectedNode(null)}
                />
            )}

            {/* Node detail card */}
            {selectedNode && (
                <NodeDetailCard
                    info={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onStartLearning={() => handleStartLearning(selectedNode)}
                />
            )}

            {/* Map path */}
            <div className="flex flex-col items-center py-6">
                {mapItems.map((item, idx) => {
                    if (item.type === "banner") {
                        return (
                            <ModuleBanner
                                key={`banner-${item.module._id}`}
                                item={item}
                            />
                        );
                    }

                    const { rowIndex, nodes } = item;
                    const isLtr = rowIndex % 2 === 0;
                    // Snake: RTL rows display nodes right-to-left
                    const displayNodes = isLtr ? nodes : [...nodes].reverse();

                    const nextItem = mapItems[idx + 1];
                    const nextIsRow = nextItem?.type === "row";

                    return (
                        <div key={`row-${rowIndex}`} className="w-full max-w-xs">
                            {/* Node row */}
                            <div className="grid grid-cols-3 gap-2 px-2">
                                {displayNodes.map((info, colIdx) => (
                                    <div key={colIdx} className="flex justify-center">
                                        {info ? (
                                            <NodeLevelButton
                                                info={info}
                                                onClick={() => setSelectedNode(info)}
                                            />
                                        ) : (
                                            <div className="w-16 h-16" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Connector dots to next row */}
                            {nextIsRow && <RowConnector fromLtr={isLtr} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ModuleBanner({ item }: { item: ModuleBannerItem }) {
    const palettes = [
        "from-violet-500/20 to-purple-500/10 border-violet-400/40 text-violet-700 dark:text-violet-300",
        "from-blue-500/20 to-cyan-500/10 border-blue-400/40 text-blue-700 dark:text-blue-300",
        "from-emerald-500/20 to-teal-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-300",
        "from-orange-500/20 to-amber-500/10 border-orange-400/40 text-orange-700 dark:text-orange-300",
        "from-rose-500/20 to-pink-500/10 border-rose-400/40 text-rose-700 dark:text-rose-300",
    ];
    const palette = palettes[item.moduleIndex % palettes.length];

    return (
        <div
            className={`
                w-full max-w-xs my-5 px-5 py-3 rounded-2xl border
                bg-linear-to-r ${palette}
                text-center shadow-sm
            `}
        >
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">
                Chapter {item.moduleIndex + 1}
            </p>
            <p className="font-bold text-sm">{item.module.title}</p>
        </div>
    );
}

function NodeLevelButton({ info, onClick }: { info: NodeInfo; onClick: () => void }) {
    const { isCompleted, isUnlocked, globalIndex, node } = info;
    const nodeType = (node as NodeDTO & { type?: string }).type ?? "lesson";

    const typeLabel =
        nodeType === "practice" ? "Practice" : nodeType === "quiz" ? "Quiz" : "Lesson";

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                relative group w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5
                transition-all duration-200
                ${
                    isCompleted
                        ? "bg-linear-to-br from-yellow-400 to-amber-500 border-2 border-yellow-400/80 shadow-lg shadow-yellow-400/25 hover:scale-110 hover:shadow-yellow-400/40"
                        : isUnlocked
                          ? "bg-linear-to-br from-primary to-primary/80 border-2 border-primary/60 shadow-lg shadow-primary/25 hover:scale-110 hover:shadow-primary/40 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                          : "bg-muted border-2 border-border/50 opacity-50 cursor-not-allowed"
                }
            `}
        >
            {isCompleted ? (
                <>
                    <StarIcon className="w-5 h-5 text-yellow-900 fill-yellow-900" />
                    <span className="text-[9px] font-bold text-yellow-900 leading-none">Done</span>
                </>
            ) : isUnlocked ? (
                <>
                    <span className="text-base font-black text-primary-foreground leading-none">
                        {globalIndex + 1}
                    </span>
                    <span className="text-[9px] font-semibold text-primary-foreground/70 leading-none">
                        {typeLabel}
                    </span>
                </>
            ) : (
                <>
                    <LockIcon className="w-5 h-5 text-muted-foreground/40" />
                    <span className="text-[9px] font-medium text-muted-foreground/40 leading-none">
                        {globalIndex + 1}
                    </span>
                </>
            )}
        </button>
    );
}

function RowConnector({ fromLtr }: { fromLtr: boolean }) {
    // Dots appear on the side where the path turns (right for LTR→RTL, left for RTL→LTR)
    return (
        <div className={`my-1 flex ${fromLtr ? "justify-end pr-8" : "justify-start pl-8"}`}>
            <div className="flex flex-col items-center gap-[5px] py-1">
                {[1, 0.65, 0.35].map((opacity, i) => (
                    <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-border"
                        style={{ opacity }}
                    />
                ))}
            </div>
        </div>
    );
}

function NodeDetailCard({
    info,
    onClose,
    onStartLearning,
}: {
    info: NodeInfo;
    onClose: () => void;
    onStartLearning: () => void;
}) {
    const nodeType = (info.node as NodeDTO & { type?: string }).type ?? "lesson";
    const typeLabel =
        nodeType === "practice" ? "Practice" : nodeType === "quiz" ? "Quiz" : "Lesson";
    const typeBadgeClass =
        nodeType === "practice"
            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
            : nodeType === "quiz"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-primary/15 text-primary";

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div
                className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground font-medium">
                                Level {info.globalIndex + 1}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
                                {typeLabel}
                            </span>
                            {info.isCompleted && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                    <StarIcon className="w-3 h-3 fill-current" /> Completed
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight">{info.node.title}</h3>
                        {info.node.description && (
                            <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                                {info.node.description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5 p-1 rounded-lg hover:bg-muted"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Action */}
                {info.isUnlocked ? (
                    <Button className="w-full gap-2" onClick={onStartLearning}>
                        {info.isCompleted ? "Review lesson" : "Start learning"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                        <LockIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            Complete previous lessons to unlock this level
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Icon helpers ───────────────────────────────────────────────────────────────

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function LockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
        </svg>
    );
}
