"use client";

import { keyboardGroups } from "@/lib/parser-presets";

export function VirtualKeyboard({ onInsert }: { onInsert: (token: string) => void }) {
    return (
        <div className="space-y-4 rounded-2xl border border-theme bg-theme p-4 text-sm h-full">
            <div className="panel-title">Teclado virtual</div>
            {keyboardGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                    <div className="text-xs text-muted">{group.label}</div>
                    <div className="flex flex-wrap gap-2">
                        {group.keys.map((key) => (
                            <button
                                key={key.value}
                                type="button"
                                title={key.description}
                                onClick={() => onInsert(key.value)}
                                className="focus-ring chip rounded-xl px-3 py-1.5 text-xs font-medium transition hover:-translate-y-0.5"
                            >
                                {key.label === "\n" ? "↵" : key.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
