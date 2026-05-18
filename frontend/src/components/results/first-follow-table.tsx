import type { CommonResponse } from "@/lib/backend";

type FirstFollowTableProps = {
    data: NonNullable<CommonResponse["conjuntos_first_follow"]>;
};

function formatList(values?: string[]): string {
    return values && values.length > 0 ? values.join(", ") : "—";
}

export function FirstFollowTable({ data }: FirstFollowTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-theme">
            <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-(--accent-soft)">
                        <tr>
                            <th className="border-b border-theme px-4 py-3 text-left font-semibold">No terminal</th>
                            <th className="border-b border-theme px-4 py-3 text-left font-semibold">FIRST</th>
                            <th className="border-b border-theme px-4 py-3 text-left font-semibold">FOLLOW</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map(([symbol, sets]) => (
                            <tr key={symbol} className="table-row">
                                <td className="border-b border-theme px-4 py-3 font-semibold">{symbol}</td>
                                <td className="border-b border-theme px-4 py-3 mono text-sm">
                                    {formatList(sets.FIRST)}
                                </td>
                                <td className="border-b border-theme px-4 py-3 mono text-sm">
                                    {formatList(sets.FOLLOW)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
