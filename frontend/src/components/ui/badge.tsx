import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

const TONE_CLASSES: Record<BadgeTone, string> = {
    neutral: "chip text-muted",
    success: "chip border-[color:var(--success)] text-[color:var(--success)]",
    warning: "chip border-[color:var(--warning)] text-[color:var(--warning)]",
    danger: "chip border-[color:var(--danger)] text-[color:var(--danger)]",
    accent: "chip chip-active",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
            {children}
        </span>
    );
}
