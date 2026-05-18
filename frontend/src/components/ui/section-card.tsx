import type { ReactNode } from "react";

type SectionCardProps = {
    title: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
};

export function SectionCard({ title, subtitle, children, action }: SectionCardProps) {
    return (
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <div className="panel-title">{title}</div>
                    {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            {children}
        </section>
    );
}
