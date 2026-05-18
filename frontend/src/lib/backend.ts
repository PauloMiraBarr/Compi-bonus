export type ParserType = "LL1" | "RD" | "DR" | "LR0" | "SLR1" | "LR1" | "LALR1";

export type AnalysisRequest = {
    gramatica: string;
    simbolo_inicial: string;
    cadena_entrada: string;
    tipo_parser: ParserType;
};

export type StepRow = {
    paso: number;
    pila?: string;
    entrada?: string;
    accion: string;
};

export type ParseTable = {
    tipo: string;
    columnas: string[];
    filas: Record<string, string>[];
    conflictos?: { estado: number | string; simbolo: string; conflicto: string }[];
};

export type TreeNode = {
    name: string;
    children?: TreeNode[];
};

export type AutomatonState = {
    estado: string;
    items: string[];
    transiciones?: Record<string, string>;
    lr1_fusionados?: string[];
};

export type Automaton = {
    tipo: string;
    estados: AutomatonState[];
};

export type CommonResponse = {
    cadena_valida: boolean;
    mensaje: string;
    proceso_paso_a_paso?: StepRow[];
    gramatica_parseable?: boolean;
    conjuntos_first_follow?: Record<string, { FIRST: string[]; FOLLOW: string[] }>;
    construccion_tablas?: ParseTable;
    sugerencias_transformacion?: {
        requiere_transformacion: boolean;
        motivo: string;
        gramatica_sugerida: string | null;
    };
    arbol_derivacion?: TreeNode | null;
    afn_clausura?: Automaton;
    afn_lr1?: Automaton;
    lalr_estados?: Automaton;
};

export type BackendError = { error: string; detalles?: unknown };

export type BackendResult = CommonResponse | BackendError;

export function getBackendBaseUrl(): string {
    return process.env.NEXT_PUBLIC_BACKEND_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:8000";
}

export async function analyzeGrammar(
    payload: AnalysisRequest,
    baseUrl: string = getBackendBaseUrl(),
): Promise<BackendResult> {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BackendResult;

    if (!response.ok) {
        if (typeof data === "object" && data && "error" in data) {
            throw new Error(data.error);
        }
        throw new Error(`Respuesta HTTP ${response.status}`);
    }

    return data;
}
