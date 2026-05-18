import type { TreeNode } from "@/lib/backend";

function TreeNodeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
    const isLeaf = !node.children || node.children.length === 0;
    return (
        <div className="space-y-2">
            <div
                className={`rounded-xl border px-3 py-2 text-sm shadow-sm ${isLeaf ? "border-theme bg-theme text-muted" : "border-[color:var(--accent)] bg-(--accent-soft) font-semibold"}`}
            >
                {node.name}
            </div>
            {node.children && node.children.length > 0 ? (
                <div className="ml-4 space-y-2 border-l border-theme pl-4">
                    {node.children.map((child, i) => (
                        <TreeNodeItem key={`${child.name}-${depth}-${i}`} node={child} depth={depth + 1} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export function TreeView({ node }: { node: TreeNode }) {
    return (
        <div className="overflow-auto scrollbar-thin p-1">
            <TreeNodeItem node={node} />
        </div>
    );
}
