import type { ParserType } from "@/lib/backend";
import { parserGroups } from "@/lib/parser-presets";

type ParserSelectProps = {
    value: ParserType;
    onChange: (value: ParserType) => void;
};

export function ParserSelect({ value, onChange }: ParserSelectProps) {
    return (
        <label className="block space-y-2 text-sm">
            <span className="font-medium">Tipo de parser</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as ParserType)}
                className="focus-ring w-full rounded-2xl border border-theme bg-theme px-4 py-3"
            >
                {parserGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label} · {option.description}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </label>
    );
}
