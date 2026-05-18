"use client";

import type { RefObject } from "react";
import type { AnalysisRequest, ParserType } from "@/lib/backend";
import { ParserSelect } from "@/components/form/parser-select";
import { GrammarEditor } from "@/components/form/grammar-editor";
import { parserGroups } from "@/lib/parser-presets";

type ParserFormProps = {
    form: AnalysisRequest;
    loading: boolean;
    onFormChange: (patch: Partial<AnalysisRequest>) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onLoadSample: (sampleKey: "ll1" | "rd" | "lr") => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    onInsertGrammarToken: (token: string) => void;
};

export function ParserForm({
    form,
    loading,
    onFormChange,
    onSubmit,
    onLoadSample,
    textareaRef,
    onInsertGrammarToken,
}: ParserFormProps) {
    const currentParser = parserGroups.flatMap((g) => g.options).find((o) => o.value === form.tipo_parser);
    const currentGroup = parserGroups.find((g) => g.options.some((o) => o.value === form.tipo_parser));

    return (
        <div className="space-y-6">
            {/* Info strip */}
            <div className="grid gap-4 rounded-[1.75rem] border border-theme bg-(--surface-soft) p-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-theme bg-theme px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-muted">Parser activo</div>
                    <div className="mt-2 font-semibold">{currentParser?.label}</div>
                </div>
                <div className="rounded-2xl border border-theme bg-theme px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-muted">Grupo</div>
                    <div className="mt-2 font-semibold">{currentGroup?.label}</div>
                </div>
                <div className="rounded-2xl border border-theme bg-theme px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-muted">Atajos</div>
                    <div className="mt-2 text-sm text-muted">
                        Usa la guía, el teclado virtual y los ejemplos para armar la gramática más rápido.
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <ParserSelect
                        value={form.tipo_parser}
                        onChange={(value: ParserType) => onFormChange({ tipo_parser: value })}
                    />
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Símbolo inicial</span>
                        <input
                            value={form.simbolo_inicial}
                            onChange={(e) => onFormChange({ simbolo_inicial: e.target.value })}
                            className="focus-ring mono w-full rounded-2xl border border-theme bg-theme px-4 py-3"
                            placeholder="E"
                        />
                    </label>
                </div>

                <label className="block space-y-2 text-sm">
                    <span className="font-medium">Cadena de entrada</span>
                    <input
                        value={form.cadena_entrada}
                        onChange={(e) => onFormChange({ cadena_entrada: e.target.value })}
                        className="focus-ring mono w-full rounded-2xl border border-theme bg-theme px-4 py-3"
                        placeholder="id + id * id"
                    />
                </label>

                <GrammarEditor
                    value={form.gramatica}
                    onChange={(value) => onFormChange({ gramatica: value })}
                    textareaRef={textareaRef}
                    onInsertToken={onInsertGrammarToken}
                />

                <div className="flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="focus-ring rounded-full bg-(--accent) px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Analizando…" : "Ejecutar análisis"}
                    </button>
                    {(["ll1", "rd", "lr"] as const).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onLoadSample(key)}
                            className="focus-ring rounded-full border border-theme bg-theme px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
                        >
                            Cargar {key === "ll1" ? "LL(1)" : key === "rd" ? "RD" : "LR"}
                        </button>
                    ))}
                </div>
            </form>
        </div>
    );
}
