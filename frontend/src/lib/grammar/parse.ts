export type GrammarTokenKind =
    | "lhs"
    | "arrow"
    | "pipe"
    | "epsilon"
    | "nonTerminal"
    | "terminal"
    | "plain";

export type GrammarToken = {
    text: string;
    kind: GrammarTokenKind;
};

const EPSILON_RE = /^(eps|ε|epsilon|EPSILON|EPS)$/;

export function splitGrammarLines(value: string): string[] {
    return value.split(/\r?\n/);
}

export function getGrammarNonTerminals(value: string): Set<string> {
    const nonTerminals = new Set<string>();

    for (const line of splitGrammarLines(value)) {
        const match = line.match(/^\s*([A-Za-z][A-Za-z0-9']*)\s*->/);
        if (match) {
            nonTerminals.add(match[1]);
        }
    }

    return nonTerminals;
}

export function tokenizeGrammarLine(line: string, nonTerminals: Set<string>): GrammarToken[] {
    const tokens = line.trim().length > 0 ? line.trim().split(/\s+/) : [];

    return tokens.map((token, index) => {
        if (index === 0 && line.includes("->")) {
            return { text: token, kind: "lhs" };
        }

        if (token === "->") {
            return { text: token, kind: "arrow" };
        }

        if (token === "|") {
            return { text: token, kind: "pipe" };
        }

        if (EPSILON_RE.test(token)) {
            return { text: "eps", kind: "epsilon" };
        }

        if (nonTerminals.has(token) || /^[A-Z][A-Za-z0-9']*$/.test(token)) {
            return { text: token, kind: "nonTerminal" };
        }

        return { text: token, kind: "terminal" };
    });
}
