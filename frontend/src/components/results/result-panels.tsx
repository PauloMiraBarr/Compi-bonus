import type { BackendResult } from "@/lib/backend";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { CodeBlock } from "@/components/ui/code-block";
import { FirstFollowTable } from "@/components/results/first-follow-table";
import { TableView } from "@/components/results/table-view";
import { StepTimeline } from "@/components/results/step-timeline";
import { TreeView } from "@/components/results/tree-view";
import { AutomatonGraph } from "@/components/results/automaton-graph";

type ResultPanelsProps = {
    error: string | null;
    result: BackendResult | null;
};

export function ResultPanels({ error, result }: ResultPanelsProps) {
    const typedResult = result && !("error" in result) ? result : null;

    const summary = typedResult
        ? {
              valid: typedResult.cadena_valida,
              message: typedResult.mensaje,
              parserParseable: typedResult.gramatica_parseable ?? null,
              steps: typedResult.proceso_paso_a_paso ?? [],
          }
        : null;

    return (
        <div className="grid gap-6">
            {/* Primary result card */}
            <SectionCard
                title="Resultado"
                subtitle="La lectura primaria viene de cadena_valida y mensaje. Los paneles adicionales dependen del parser ejecutado."
            >
                {error ? (
                    <div className="rounded-2xl border border-[color:var(--danger)] bg-[rgba(153,27,27,0.08)] p-5 text-sm">
                        <div className="mb-2 font-semibold text-[color:var(--danger)]">Error de integración</div>
                        <div>{error}</div>
                    </div>
                ) : null}

                {summary ? (
                    <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div
                                className={`rounded-2xl border p-4 ${summary.valid ? "border-[color:var(--success)] bg-[rgba(22,101,52,0.06)]" : "border-[color:var(--danger)] bg-[rgba(153,27,27,0.06)]"}`}
                            >
                                <div className="text-xs uppercase tracking-wide text-muted">Estado de cadena</div>
                                <div
                                    className={`mt-2 text-xl font-bold ${summary.valid ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}
                                >
                                    {summary.valid ? "✓ Válida" : "✗ Inválida"}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-theme bg-theme p-4 md:col-span-2">
                                <div className="text-xs uppercase tracking-wide text-muted">Mensaje</div>
                                <div className="mt-2 text-sm leading-6">{summary.message}</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {summary.parserParseable !== null ? (
                                <Badge tone={summary.parserParseable ? "success" : "warning"}>
                                    Gramática parseable: {summary.parserParseable ? "sí" : "no"}
                                </Badge>
                            ) : null}
                            <Badge tone={summary.valid ? "success" : "danger"}>
                                Cadena: {summary.valid ? "aceptada" : "rechazada"}
                            </Badge>
                            <Badge tone="neutral">{summary.steps.length} pasos de traza</Badge>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-theme bg-theme p-5 text-sm text-muted">
                        Ejecuta un análisis para visualizar aquí el resultado del parser.
                    </div>
                )}
            </SectionCard>

            {/* Secondary panels — only when there's a valid result */}
            {summary && !error ? (
                <section className="grid gap-6 xl:grid-cols-2">
                    {/* FIRST / FOLLOW */}
                    {typedResult?.conjuntos_first_follow ? (
                        <SectionCard
                            title="FIRST / FOLLOW"
                            subtitle="Disponible para LL(1) y SLR(1)."
                        >
                            <FirstFollowTable data={typedResult.conjuntos_first_follow} />
                        </SectionCard>
                    ) : null}

                    {/* Transformation suggestions */}
                    {typedResult?.sugerencias_transformacion ? (
                        <SectionCard
                            title="Sugerencias de transformación"
                            subtitle="Solo LL(1) devuelve esta sección."
                        >
                            <div className="space-y-4 text-sm">
                                <Badge
                                    tone={
                                        typedResult.sugerencias_transformacion.requiere_transformacion
                                            ? "warning"
                                            : "success"
                                    }
                                >
                                    {typedResult.sugerencias_transformacion.requiere_transformacion
                                        ? "Requiere transformación"
                                        : "No requiere transformación"}
                                </Badge>
                                <div className="rounded-2xl border border-theme bg-theme p-4">
                                    <div className="mb-2 text-xs uppercase tracking-wide text-muted">Motivo</div>
                                    <div>{typedResult.sugerencias_transformacion.motivo}</div>
                                </div>
                                <div className="rounded-2xl border border-theme bg-theme p-4">
                                    <div className="mb-2 text-xs uppercase tracking-wide text-muted">
                                        Gramática sugerida
                                    </div>
                                    {typedResult.sugerencias_transformacion.gramatica_sugerida ? (
                                        <CodeBlock
                                            value={typedResult.sugerencias_transformacion.gramatica_sugerida}
                                        />
                                    ) : (
                                        <div className="text-muted">No disponible.</div>
                                    )}
                                </div>
                            </div>
                        </SectionCard>
                    ) : null}

                    {/* LR Automaton (merged / canonical) — spans full width */}
                    {typedResult?.afn_clausura ? (
                        <div className="xl:col-span-2">
                            <SectionCard
                                title="AFN / Colección canónica"
                                subtitle="Grafo interactivo de estados y transiciones. Arrastra, haz zoom y haz clic en un estado para ver sus ítems."
                            >
                                <AutomatonGraph automaton={typedResult.afn_clausura} />
                            </SectionCard>
                        </div>
                    ) : null}

                    {/* Pre-fusion LR(1) automaton — LALR1 only */}
                    {typedResult?.afn_lr1 ? (
                        <div className="xl:col-span-2">
                            <SectionCard
                                title="AFN LR(1) previo a fusión"
                                subtitle="Disponible únicamente para LALR(1). Muestra el autómata LR(1) antes de fusionar estados."
                            >
                                <AutomatonGraph
                                    automaton={typedResult.afn_lr1}
                                    title="LR(1) — pre-fusión"
                                />
                            </SectionCard>
                        </div>
                    ) : null}

                    {/* Parse table */}
                    {typedResult?.construccion_tablas ? (
                        <div className="xl:col-span-2">
                            <SectionCard
                                title="Tabla de análisis"
                                subtitle="Tabla predictiva o ACTION/GOTO, según el parser seleccionado. Las celdas en rojo indican conflictos."
                            >
                                <TableView table={typedResult.construccion_tablas} />
                            </SectionCard>
                        </div>
                    ) : null}

                    {/* Derivation tree — RD/DR only */}
                    {typedResult?.arbol_derivacion ? (
                        <SectionCard title="Árbol de derivación" subtitle="Solo aparece para descenso recursivo.">
                            <TreeView node={typedResult.arbol_derivacion} />
                        </SectionCard>
                    ) : null}

                    {/* Step trace */}
                    {summary.steps.length > 0 ? (
                        <div className={`${!typedResult?.arbol_derivacion ? "xl:col-span-2" : ""}`}>
                            <SectionCard
                                title="Traza paso a paso"
                                subtitle="Secuencia completa de ejecución interpretada por el analizador."
                            >
                                <StepTimeline steps={summary.steps} />
                            </SectionCard>
                        </div>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}
