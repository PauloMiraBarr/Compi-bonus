export function CodeBlock({ value }: { value: string }) {
    return (
        <pre className="code-panel scrollbar-thin overflow-auto rounded-2xl p-4 text-sm leading-6">
            <code>{value}</code>
        </pre>
    );
}
