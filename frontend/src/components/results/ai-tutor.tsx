"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalysisRequest, BackendResult } from "@/lib/backend";
import { askGroqTutor, type GroqTutorMessage } from "@/app/groq-actions";

type ChatMessage = GroqTutorMessage & {
    id: number;
    streaming?: boolean;
};

type AiTutorProps = {
    request: AnalysisRequest | null;
    result: BackendResult | null;
    analysisVersion: number;
    open: boolean;
    seedPrompt: string | null;
    onOpenChange: (open: boolean) => void;
    onSeedConsumed?: () => void;
};

function buildInitialMessage() {
    return {
        id: 1,
        role: "assistant" as const,
        content: "Abre el tutor o pulsa una explicación contextual para empezar.",
    };
}

function isAnalysisResultAvailable(result: BackendResult | null): result is Exclude<BackendResult, { error: string }> {
    return Boolean(result && typeof result === "object" && !("error" in result));
}

export function AiTutor({
    request,
    result,
    analysisVersion,
    open,
    seedPrompt,
    onOpenChange,
    onSeedConsumed,
}: AiTutorProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([buildInitialMessage()]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nextMessageId = useRef(2);
    const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamStateRef = useRef<{ messageId: number; content: string; cursor: number } | null>(null);
    const consumedSeedRef = useRef<string | null>(null);

    const canUseTutor = Boolean(request && isAnalysisResultAvailable(result));

    const stopStreaming = useCallback(() => {
        if (streamTimerRef.current) {
            clearInterval(streamTimerRef.current);
            streamTimerRef.current = null;
        }

        streamStateRef.current = null;
    }, []);

    const resetConversation = useCallback(() => {
        stopStreaming();
        consumedSeedRef.current = null;
        setMessages([buildInitialMessage()]);
        setInput("");
        setError(null);
        setLoading(false);
    }, [stopStreaming]);

    const sendQuestion = useCallback(
        async (question: string) => {
            const trimmed = question.trim();

            if (!trimmed || loading || !request || !isAnalysisResultAvailable(result)) {
                return;
            }

            stopStreaming();
            setLoading(true);
            setError(null);

            const nextUserMessage: ChatMessage = {
                id: nextMessageId.current++,
                role: "user",
                content: trimmed,
            };

            const conversation = [...messages, nextUserMessage];
            setMessages(conversation);
            setInput("");

            try {
                const reply = await askGroqTutor({
                    request,
                    result,
                    question: trimmed,
                    history: messages.map(({ role, content }) => ({ role, content })),
                });

                const assistantMessageId = nextMessageId.current++;
                streamStateRef.current = {
                    messageId: assistantMessageId,
                    content: reply,
                    cursor: 0,
                };

                setMessages((current) => [
                    ...current,
                    {
                        id: assistantMessageId,
                        role: "assistant",
                        content: "",
                        streaming: true,
                    },
                ]);

                streamTimerRef.current = setInterval(() => {
                    const streamState = streamStateRef.current;

                    if (!streamState) {
                        stopStreaming();
                        return;
                    }

                    const chunkSize = Math.max(1, Math.ceil(streamState.content.length / 72));
                    const nextCursor = Math.min(streamState.content.length, streamState.cursor + chunkSize);
                    streamState.cursor = nextCursor;

                    setMessages((current) =>
                        current.map((message) =>
                            message.id === streamState.messageId
                                ? {
                                      ...message,
                                      content: streamState.content.slice(0, nextCursor),
                                      streaming: nextCursor < streamState.content.length,
                                  }
                                : message,
                        ),
                    );

                    if (nextCursor >= streamState.content.length) {
                        stopStreaming();
                    }
                }, 18);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido al consultar Groq.");
            } finally {
                setLoading(false);
            }
        },
        [loading, messages, request, result, stopStreaming],
    );

    useEffect(() => {
        resetConversation();
    }, [analysisVersion, resetConversation]);

    useEffect(() => {
        if (!open || !seedPrompt || seedPrompt === consumedSeedRef.current || !canUseTutor) {
            return;
        }

        consumedSeedRef.current = seedPrompt;
        void sendQuestion(seedPrompt);
        onSeedConsumed?.();
    }, [canUseTutor, onSeedConsumed, open, seedPrompt, sendQuestion]);

    useEffect(() => () => stopStreaming(), [stopStreaming]);

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => onOpenChange(true)}
                className="focus-ring fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-theme bg-(--accent) px-3.5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/80" />
                Tutor IA
            </button>
        );
    }

    return (
        <div
            className="fixed inset-x-4 bottom-4 z-50 mx-auto sm:left-auto sm:right-4"
            style={{ width: "min(calc(100vw - 2rem), 36rem)" }}
        >
            <div className="overflow-hidden rounded-2xl border border-theme bg-theme shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3 border-b border-theme px-3 py-3 sm:px-4">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tutor IA</div>
                        <div className="mt-0.5 text-xs text-muted">{canUseTutor ? "Listo para explicar" : "Sin análisis activo"}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="focus-ring rounded-full border border-theme bg-theme px-2.5 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="space-y-3 p-3 sm:p-4">
                    <div className="rounded-2xl border border-theme bg-theme p-2.5">
                        <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[92%] rounded-xl px-3 py-2.5 text-[13px] leading-5 ${
                                            message.role === "user"
                                                ? "bg-(--accent) text-white"
                                                : "border border-theme bg-(--surface-soft)"
                                        }`}
                                    >
                                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                                            {message.role === "user" ? "Tú" : "Tutor"}
                                        </div>
                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error ? (
                            <div className="mt-2.5 rounded-xl border border-(--danger) bg-[rgba(153,27,27,0.08)] px-3 py-2 text-[13px] text-(--danger)">
                                {error}
                            </div>
                        ) : null}

                        <form
                            className="mt-2.5 flex flex-col gap-2.5 sm:flex-row"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void sendQuestion(input);
                            }}
                        >
                            <textarea
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                rows={2}
                                placeholder={
                                    canUseTutor
                                        ? "Pregunta por el conflicto, la traza o una posible corrección..."
                                        : "Ejecuta primero un análisis para habilitar el tutor."
                                }
                                disabled={!canUseTutor}
                                className="focus-ring min-h-18 flex-1 resize-none rounded-xl border border-theme bg-theme px-3 py-2 text-[13px] leading-5 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <div className="flex flex-row gap-2 sm:flex-col sm:justify-end">
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim() || !canUseTutor}
                                    className="focus-ring rounded-full bg-(--accent) px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Consultando..." : "Preguntar"}
                                </button>
                                <button
                                    type="button"
                                    disabled={loading || !canUseTutor}
                                    onClick={resetConversation}
                                    className="focus-ring rounded-full border border-theme bg-theme px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}