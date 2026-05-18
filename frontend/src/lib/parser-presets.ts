import type { AnalysisRequest, ParserType } from "./backend";

export type ParserGroup = {
    label: string;
    options: { value: ParserType; label: string; description: string }[];
};

export const parserGroups: ParserGroup[] = [
    {
        label: "Top Down",
        options: [
            { value: "LL1", label: "LL(1)", description: "Tabla predictiva, FIRST/FOLLOW y sugerencias" },
            { value: "RD", label: "Descenso recursivo", description: "Backtracking y árbol de derivación" },
            { value: "DR", label: "Descenso recursivo (alias DR)", description: "Misma ruta que RD" },
        ],
    },
    {
        label: "Bottom Up",
        options: [
            { value: "LR0", label: "LR(0)", description: "Autómata y tabla shift-reduce básica" },
            { value: "SLR1", label: "SLR(1)", description: "LR(0) con FOLLOW para reducciones" },
            { value: "LR1", label: "LR(1)", description: "Lookaheads exactos por ítem" },
            { value: "LALR1", label: "LALR(1)", description: "Fusión de estados LR(1)" },
        ],
    },
];

export const sampleGrammars: Record<string, AnalysisRequest> = {
    ll1: {
        gramatica: "E  -> T E'\nE' -> + T E' | eps\nT  -> F T'\nT' -> * F T' | eps\nF  -> ( E ) | id",
        simbolo_inicial: "E",
        cadena_entrada: "id + id * id",
        tipo_parser: "LL1",
    },
    rd: {
        gramatica: "S -> q A | q B\nA -> a b\nB -> a c",
        simbolo_inicial: "S",
        cadena_entrada: "q a c",
        tipo_parser: "RD",
    },
    lr: {
        gramatica: "E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id",
        simbolo_inicial: "E",
        cadena_entrada: "id * id + id",
        tipo_parser: "LALR1",
    },
};

export type KeyboardGroup = {
    label: string;
    keys: Array<{ label: string; value: string; description?: string }>;
};

export const keyboardGroups: KeyboardGroup[] = [
    {
        label: "Símbolos de gramática",
        keys: [
            { label: "→", value: "->", description: "Separador de producción" },
            { label: "|", value: "|", description: "Alternativa" },
            { label: "eps", value: "eps", description: "Épsilon canónico" },
            { label: "\n", value: "\n", description: "Nueva línea" },
        ],
    },
    {
        label: "No terminales",
        keys: [
            { label: "S", value: "S" },
            { label: "E", value: "E" },
            { label: "T", value: "T" },
            { label: "F", value: "F" },
            { label: "A", value: "A" },
            { label: "B", value: "B" },
            { label: "E'", value: "E'" },
            { label: "T'", value: "T'" },
        ],
    },
    {
        label: "Terminales comunes",
        keys: [
            { label: "id", value: "id" },
            { label: "+", value: "+" },
            { label: "*", value: "*" },
            { label: "(", value: "(" },
            { label: ")", value: ")" },
            { label: "q", value: "q" },
            { label: "a", value: "a" },
            { label: "b", value: "b" },
            { label: "c", value: "c" },
        ],
    },
];
