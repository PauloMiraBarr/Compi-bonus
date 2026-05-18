import type { RefObject } from "react";
import { getGrammarNonTerminals, splitGrammarLines, tokenizeGrammarLine } from "@/lib/grammar/parse";
import { VirtualKeyboard } from "@/components/form/virtual-keyboard";

type GrammarEditorProps = {
    value: string;
    onChange: (value: string) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    onInsertToken: (token: string) => void;
};

function tokenClass(kind: string): string {
    switch (kind) {
        case "lhs":
        case "nonTerminal":
            return "text-[color:var(--accent)] font-semibold";
        case "arrow":
            return "text-[color:var(--success)] font-semibold";
        case "pipe":
            return "text-[color:var(--warning)] font-semibold";
        case "epsilon":
            return "text-[color:var(--danger)] font-semibold";
        case "terminal":
            return "text-foreground";
        default:
            return "text-muted";
    }
}

export function GrammarEditor({ value, onChange, textareaRef, onInsertToken }: GrammarEditorProps) {
    const nonTerminals = getGrammarNonTerminals(value);
    const lines = splitGrammarLines(value);

    return (
        <section className="rounded-3xl border border-theme bg-theme p-4">
            <div className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <label className="block space-y-2 text-sm">
                        <span className="font-medium">Gramática</span>
                        <textarea
                            ref={textareaRef}
                            rows={13}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="focus-ring mono w-full rounded-3xl border border-theme bg-theme px-4 py-4 text-sm leading-6"
                            placeholder="E -> T E'"
                        />
                        <div className="text-xs text-muted">
                            Usa una producción por línea. La herramienta normaliza{" "}
                            <span className="mono">eps</span> como epsilon.
                        </div>
                    </label>

                    <div className="h-full">
                        <VirtualKeyboard onInsert={onInsertToken} />
                    </div>
                </div>

                <div>
                    <div className="panel-title">Vista previa léxica</div>
                    <div className="mt-3 space-y-2 rounded-2xl border border-theme bg-(--code-bg) p-4 font-mono text-sm leading-7 text-(--code-fg)">
                        {lines.length > 0 ? (
                            lines.map((line, lineIndex) => {
                                const tokens = tokenizeGrammarLine(line, nonTerminals);
                                return (
                                    <div key={`${line}-${lineIndex}`} className="whitespace-pre-wrap wrap-break-word">
                                        {tokens.length > 0 ? (
                                            tokens.map((token, tokenIndex) => (
                                                <span
                                                    key={`${token.text}-${tokenIndex}`}
                                                    className={tokenClass(token.kind)}
                                                >
                                                    {token.text}
                                                    {tokenIndex < tokens.length - 1 ? " " : ""}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted">&nbsp;</span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-muted">Escribe una gramática para ver el resaltado.</div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
