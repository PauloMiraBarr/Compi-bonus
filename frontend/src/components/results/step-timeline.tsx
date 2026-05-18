import type { CommonResponse } from "@/lib/backend";

type StepTimelineProps = {
    steps: NonNullable<CommonResponse["proceso_paso_a_paso"]>;
};

export function StepTimeline({ steps }: StepTimelineProps) {
    return (
        <div className="space-y-3">
            {steps.map((step) => (
                <div key={step.paso} className="flex gap-4 rounded-2xl border border-theme bg-theme p-4 shadow-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="step-dot h-3 w-3 rounded-full" />
                        <div className="text-xs font-semibold text-muted">{step.paso}</div>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                        {step.pila ? (
                            <div className="text-xs text-muted">
                                Pila: <span className="mono">{step.pila}</span>
                            </div>
                        ) : null}
                        {step.entrada ? (
                            <div className="text-xs text-muted">
                                Entrada: <span className="mono">{step.entrada}</span>
                            </div>
                        ) : null}
                        <div className="text-sm font-medium">{step.accion}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
