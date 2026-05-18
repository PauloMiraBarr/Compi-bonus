import type { CommonResponse } from "@/lib/backend";

type TableViewProps = {
    table: NonNullable<CommonResponse["construccion_tablas"]>;
};

export function TableView({ table }: TableViewProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-theme">
            <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-(--accent-soft)">
                        <tr>
                            {table.columnas.map((col) => (
                                <th key={col} className="border-b border-theme px-4 py-3 font-semibold text-foreground">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.filas.map((row, index) => (
                            <tr key={`${row.Estado ?? row.NoTerminal ?? index}`} className="table-row">
                                {table.columnas.map((col) => {
                                    const cell = row[col] ?? "";
                                    const isConflict =
                                        typeof cell === "string" && (cell.includes("/") || cell.includes("vs"));
                                    return (
                                        <td
                                            key={col}
                                            className={`border-b border-theme px-4 py-3 align-top text-sm mono ${isConflict ? "text-[color:var(--danger)] font-semibold" : ""}`}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {table.conflictos && table.conflictos.length > 0 ? (
                <div className="border-t border-theme bg-(--surface-soft) p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Conflictos</div>
                    <div className="space-y-2 text-sm">
                        {table.conflictos.map((conflict, i) => (
                            <div
                                key={`${conflict.estado}-${conflict.simbolo}-${i}`}
                                className="rounded-xl border border-[color:var(--danger)] bg-[rgba(153,27,27,0.06)] px-3 py-2 text-[color:var(--danger)]"
                            >
                                <span className="font-semibold">Estado {conflict.estado}</span> · {conflict.simbolo} ·{" "}
                                {conflict.conflicto}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
