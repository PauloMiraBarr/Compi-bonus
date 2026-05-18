"use client";

import { useEffect } from "react";

export function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.58)] px-4 py-6 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Guía de uso rápido"
                className="glass-panel w-full max-w-2xl rounded-4xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="panel-title">Guía de uso rápido</div>
                        <p className="mt-2 text-sm text-muted">
                            Referencia breve para usar la plataforma sin ocupar espacio permanente en la pantalla.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="focus-ring rounded-full border border-theme bg-theme px-3 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="mt-5 space-y-4 text-sm leading-6 text-muted">
                    <div className="rounded-2xl border border-theme bg-theme p-4">
                        La plataforma acepta gramáticas en texto plano con una producción por línea y alternativas
                        separadas por <span className="mono">|</span>.
                    </div>
                    <div className="rounded-2xl border border-theme bg-theme p-4">
                        <span className="font-semibold text-foreground">Top-down:</span> LL(1) muestra FIRST/FOLLOW y
                        tabla predictiva; RD construye árbol de derivación.
                    </div>
                    <div className="rounded-2xl border border-theme bg-theme p-4">
                        <span className="font-semibold text-foreground">Bottom-up:</span> LR(0), SLR(1), LR(1) y
                        LALR(1) exponen autómata interactivo, tabla ACTION/GOTO y traza paso a paso.
                    </div>
                    <div className="rounded-2xl border border-theme bg-theme p-4">
                        <span className="font-semibold text-foreground">Grafo del autómata:</span> Haz clic en
                        cualquier estado del grafo para ver sus ítems LR en el panel lateral.
                    </div>
                </div>
            </div>
        </div>
    );
}
