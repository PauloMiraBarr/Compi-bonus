"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { AnalysisRequest, BackendResult } from "@/lib/backend";
import { sampleGrammars } from "@/lib/parser-presets";
import { runAnalysis } from "@/app/actions";
import { useTheme } from "@/hooks/use-theme";
import { GuideModal } from "@/components/ui/guide-modal";
import { ParserForm } from "@/components/form/parser-form";
import { ResultPanels } from "@/components/results/result-panels";
import { AiTutor } from "@/components/results/ai-tutor";

// ─── Token insertion helper ──────────────────────────────────────────────────

function buildInsertion(
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    token: string,
) {
    if (!textarea) {
        const needsSpacing = token !== "\n" && token !== "|";
        const insertion = token === "\n" ? token : needsSpacing ? `${token} ` : token;
        return {
            value: `${currentValue}${currentValue.endsWith("\n") || currentValue.length === 0 ? "" : " "}${insertion}`.trimStart(),
            cursor: currentValue.length + insertion.length,
        };
    }

    const { selectionStart = 0, selectionEnd = 0, value } = textarea;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const needsSpacing = token !== "\n" && token !== "|";
    const insertion = token === "\n" ? token : needsSpacing ? `${token} ` : token;

    return {
        value: `${before}${insertion}${after}`,
        cursor: before.length + insertion.length,
    };
}

// ─── Theme icon ──────────────────────────────────────────────────────────────

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
    if (theme === "dark") {
        return (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 9 9c0-.4 0-.8-.1-1.2A7.5 7.5 0 0 1 12 3Z" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </svg>
    );
}

// ─── Main playground orchestrator ────────────────────────────────────────────

export function Playground() {
    const { theme, toggleTheme } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [form, setForm] = useState<AnalysisRequest>(sampleGrammars.lr);
    const [analysisRequest, setAnalysisRequest] = useState<AnalysisRequest | null>(null);
    const [analysisVersion, setAnalysisVersion] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BackendResult | null>(null);
    const [guideOpen, setGuideOpen] = useState(false);
    const [aiTutorOpen, setAiTutorOpen] = useState(false);
    const [aiTutorSeed, setAiTutorSeed] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            setAnalysisRequest({ ...form });
            const data = await runAnalysis(form);
            setResult(data);
            setAnalysisVersion((version) => version + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setAnalysisRequest(null);
        } finally {
            setLoading(false);
        }
    }

    function loadSample(key: keyof typeof sampleGrammars) {
        setForm(sampleGrammars[key]);
        setAnalysisRequest(null);
        setResult(null);
        setError(null);
    }

    function updateForm(patch: Partial<AnalysisRequest>) {
        setForm((prev) => ({ ...prev, ...patch }));
    }

    function handleInsertToken(token: string) {
        const target = textareaRef.current;
        const insertion = buildInsertion(target, form.gramatica, token);
        updateForm({ gramatica: insertion.value });

        if (target) {
            window.requestAnimationFrame(() => {
                target.focus();
                target.setSelectionRange(insertion.cursor, insertion.cursor);
            });
        }
    }

    return (
        <main className="min-h-screen compiler-grid text-foreground">
            <div className="fixed right-4 top-4 z-50">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-theme bg-theme shadow-sm transition hover:-translate-y-0.5"
                    aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                    title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                >
                    <ThemeIcon theme={theme as "light" | "dark"} />
                </button>
            </div>

            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                {/* ── Header card ── */}
                <section className="glass-panel w-full overflow-hidden rounded-4xl">
                    <div className="accent-line h-1 w-full" />
                    <div className="p-6 lg:p-8">
                        <div className="space-y-4">
                            {/* Title + description */}
                            <div className="space-y-3">
                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Analizador de gramáticas para parsers top-down y bottom-up
                                </h1>
                                <p className="max-w-3xl text-sm leading-6 text-muted sm:text-base">
                                    Interfaz académica para probar LL(1), RD, LR(0), SLR(1), LR(1) y LALR(1). El
                                    autómata LR se visualiza como un grafo interactivo.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setGuideOpen(true)}
                                    className="focus-ring rounded-full border border-theme bg-theme px-4 py-2 font-medium shadow-sm transition hover:-translate-y-0.5"
                                >
                                    Ver guía
                                </button>
                                <a
                                    href="#resultado"
                                    className="focus-ring rounded-full border border-theme bg-(--accent-soft) px-4 py-2 font-medium transition hover:-translate-y-0.5"
                                >
                                    Ir al resultado
                                </a>
                            </div>
                        </div>

                        {/* Form section */}
                        <div className="mt-6">
                            <ParserForm
                                form={form}
                                loading={loading}
                                onFormChange={updateForm}
                                onSubmit={handleSubmit}
                                onLoadSample={loadSample}
                                textareaRef={textareaRef}
                                onInsertGrammarToken={handleInsertToken}
                            />
                        </div>
                    </div>
                </section>

                {/* ── Results ── */}
                <section id="resultado">
                    <ResultPanels
                        error={error}
                        result={result}
                        request={analysisRequest}
                        onExplainWithAi={(prompt) => {
                            setAiTutorSeed(prompt);
                            setAiTutorOpen(true);
                        }}
                    />
                </section>

                {/* ── Footer ── */}
                <footer className="glass-panel rounded-4xl p-6 text-sm text-muted">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="font-semibold text-foreground">Proyecto de compiladores</div>
                            <div>Interfaz académica para validación y visualización de análisis sintáctico.</div>
                        </div>
                        <div className="mono">Flujo local listo para pruebas y validación</div>
                    </div>
                </footer>
            </div>

            <AiTutor
                request={analysisRequest}
                result={result}
                analysisVersion={analysisVersion}
                open={aiTutorOpen}
                seedPrompt={aiTutorSeed}
                onOpenChange={setAiTutorOpen}
                onSeedConsumed={() => setAiTutorSeed(null)}
            />

            <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
        </main>
    );
}
