import Link from "next/link";
import type { ModuleDTO, NodeDTO } from "@/lib/api";

interface CourseOutlineProps {
  courseId: string;
  modules: ModuleDTO[];
  nodesByModule: Record<string, NodeDTO[]>;
  completedNodes: Set<string>;
  expandedModules: Set<string>;
  onToggleModule: (id: string) => void;
}

export function CourseOutline({
  courseId,
  modules,
  nodesByModule,
  completedNodes,
  expandedModules,
  onToggleModule,
}: CourseOutlineProps) {
  return (
    <div className="space-y-2">
      {modules.map((mod, modIdx) => {
        const nodes = nodesByModule[mod._id] ?? [];
        const doneCount = nodes.filter((n) => completedNodes.has(n._id)).length;
        const isExpanded = expandedModules.has(mod._id);

        return (
          <div key={mod._id} className="bg-card border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onToggleModule(mod._id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-background transition-colors"
            >
              <span className="text-xs text-muted-foreground/80 w-5 shrink-0 text-right">
                {modIdx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{mod.title}</span>
                {nodes.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground/80">
                    {doneCount}/{nodes.length} done
                  </span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground/80 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && nodes.length > 0 && (
              <ul className="border-t divide-y">
                {nodes.map((node, nodeIdx) => {
                  const done = completedNodes.has(node._id);
                  return (
                    <li key={node._id}>
                      <Link
                        href={`/dashboard/learn/${courseId}/${mod._id}/${node._id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-background transition-colors group"
                      >
                        <span className="text-xs text-muted-foreground/70 w-5 shrink-0 text-right">
                          {nodeIdx + 1}
                        </span>
                        {done ? (
                          <svg
                            className="w-4 h-4 text-success shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className="w-4 h-4 shrink-0 rounded-full border-2 border-border" />
                        )}
                        <span
                          className={`text-sm flex-1 min-w-0 group-hover:underline ${done ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {node.title}
                        </span>
                        {node.estimatedDuration && (
                          <span className="text-xs text-muted-foreground/80 shrink-0">
                            {node.estimatedDuration}m
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {isExpanded && nodes.length === 0 && (
              <p className="px-5 py-3 text-sm text-muted-foreground/80 border-t">
                No lessons in this module.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
