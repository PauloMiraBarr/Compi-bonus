"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    BackgroundVariant,
    MarkerType,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Automaton, AutomatonState } from "@/lib/backend";
import dagre from "dagre";

// ─── Layout via dagre ──────────────────────────────────────────────────────

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 40 });

    nodes.forEach((node) => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
    edges.forEach((edge) => g.setEdge(edge.source, edge.target));

    dagre.layout(g);

    return nodes.map((node) => {
        const { x, y } = g.node(node.id);
        return { ...node, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } };
    });
}

// ─── Custom Node ─────────────────────────────────────────────────────────────

type StateNodeData = {
    label: string;
    itemCount: number;
    fused?: string[];
    selected?: boolean;
};

function StateNode({ data, selected }: { data: StateNodeData; selected: boolean }) {
    return (
        <div
            className={`rounded-xl border-2 px-4 py-2 text-sm shadow-md transition-all cursor-pointer select-none ${
                selected
                    ? "border-[color:var(--accent)] bg-(--accent-soft) font-bold"
                    : "border-theme bg-theme"
            }`}
            style={{ minWidth: NODE_WIDTH, textAlign: "center" }}
        >
            <Handle type="target" position={Position.Left} className="!bg-[var(--accent)] !border-0" />
            <div className="font-semibold">{data.label}</div>
            <div className="text-xs text-muted mt-0.5">{data.itemCount} ítem{data.itemCount !== 1 ? "s" : ""}</div>
            {data.fused && data.fused.length > 0 ? (
                <div className="text-xs text-muted mt-0.5">↔ {data.fused.join(", ")}</div>
            ) : null}
            <Handle type="source" position={Position.Right} className="!bg-[var(--accent)] !border-0" />
        </div>
    );
}

const NODE_TYPES = { stateNode: StateNode };

// ─── Convert automaton to RF nodes/edges ─────────────────────────────────────

function buildGraph(automaton: Automaton): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = automaton.estados.map((state) => ({
        id: state.estado,
        type: "stateNode",
        position: { x: 0, y: 0 },
        data: {
            label: state.estado,
            itemCount: state.items.length,
            fused: state.lr1_fusionados,
        },
    }));

    const edgeMap = new Map<string, Edge>();

    automaton.estados.forEach((state) => {
        if (!state.transiciones) return;
        Object.entries(state.transiciones).forEach(([symbol, target]) => {
            const edgeId = `${state.estado}-${symbol}-${target}`;
            if (!edgeMap.has(edgeId)) {
                edgeMap.set(edgeId, {
                    id: edgeId,
                    source: state.estado,
                    target: String(target),
                    label: symbol,
                    animated: false,
                    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent)" },
                    style: { stroke: "var(--accent)", strokeWidth: 1.5 },
                    labelStyle: {
                        fontSize: 11,
                        fontFamily: "var(--font-geist-mono)",
                        fill: "var(--foreground)",
                        fontWeight: 600,
                    },
                    labelBgStyle: { fill: "var(--surface)", fillOpacity: 0.9 },
                    labelBgPadding: [4, 4] as [number, number],
                    labelBgBorderRadius: 4,
                });
            }
        });
    });

    const layoutedNodes = applyDagreLayout(nodes, [...edgeMap.values()]);
    return { nodes: layoutedNodes, edges: [...edgeMap.values()] };
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function StateDetailPanel({
    state,
    onClose,
}: {
    state: AutomatonState | null;
    onClose: () => void;
}) {
    if (!state) {
        return (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">
                Haz clic en un estado del grafo para ver sus ítems LR aquí.
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-3 overflow-auto p-4 scrollbar-thin">
            <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{state.estado}</div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-theme bg-theme px-2 py-1 text-xs transition hover:-translate-y-0.5"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-1">
                <div className="panel-title">Ítems LR</div>
                <div className="rounded-xl border border-theme bg-(--code-bg) p-3 font-mono text-xs leading-6 text-(--code-fg)">
                    {state.items.map((item) => (
                        <div key={item}>{item}</div>
                    ))}
                </div>
            </div>

            {state.transiciones && Object.keys(state.transiciones).length > 0 ? (
                <div className="space-y-1">
                    <div className="panel-title">Transiciones</div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(state.transiciones).map(([sym, tgt]) => (
                            <span key={`${sym}-${tgt}`} className="chip rounded-full px-3 py-1 text-xs mono">
                                {sym} → {tgt}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}

            {state.lr1_fusionados && state.lr1_fusionados.length > 0 ? (
                <div className="space-y-1">
                    <div className="panel-title">Estados fusionados</div>
                    <div className="flex flex-wrap gap-2">
                        {state.lr1_fusionados.map((s) => (
                            <span key={s} className="chip chip-active rounded-full px-3 py-1 text-xs">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────

type AutomatonGraphProps = {
    automaton: Automaton;
    title?: string;
};

export function AutomatonGraph({ automaton, title }: AutomatonGraphProps) {
    const { nodes: initialNodes, edges: initialEdges } = buildGraph(automaton);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedState, setSelectedState] = useState<AutomatonState | null>(null);

    // Re-build when automaton changes
    useEffect(() => {
        const { nodes: n, edges: e } = buildGraph(automaton);
        setNodes(n);
        setEdges(e);
        setSelectedState(null);
    }, [automaton, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    function handleNodeClick(_: React.MouseEvent, node: Node) {
        const state = automaton.estados.find((s) => s.estado === node.id) ?? null;
        setSelectedState(state);
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-active rounded-full px-3 py-1 text-xs">
                    {title ?? automaton.tipo}
                </span>
                <span className="chip rounded-full px-3 py-1 text-xs">
                    {automaton.estados.length} estados
                </span>
                <span className="text-xs text-muted">Arrastra los nodos · Zoom con scroll · Clic para ver ítems</span>
            </div>

            {/* Graph + side panel */}
            <div className="flex gap-4 rounded-2xl border border-theme overflow-hidden" style={{ height: 460 }}>
                {/* React Flow canvas */}
                <div className="flex-1 min-w-0">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={handleNodeClick}
                        nodeTypes={NODE_TYPES}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        minZoom={0.3}
                        maxZoom={2}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1}
                            color="var(--border)"
                        />
                        <Controls
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                            }}
                        />
                        <MiniMap
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: 12,
                            }}
                            nodeColor="var(--accent-soft)"
                            maskColor="rgba(0,0,0,0.2)"
                        />
                    </ReactFlow>
                </div>

                {/* Detail panel */}
                <div className="w-64 shrink-0 border-l border-theme bg-(--surface-soft)">
                    <StateDetailPanel state={selectedState} onClose={() => setSelectedState(null)} />
                </div>
            </div>
        </div>
    );
}
