"use server";

import type { AnalysisRequest, BackendResult } from "@/lib/backend";

function getBackendUrl(): string {
    return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000").trim().replace(/\/$/, "");
}

export async function runAnalysis(payload: AnalysisRequest): Promise<BackendResult> {
    const baseUrl = getBackendUrl();

    const response = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BackendResult;

    if (!response.ok) {
        if (typeof data === "object" && data && "error" in data) {
            throw new Error((data as { error: string }).error);
        }
        throw new Error(`Respuesta HTTP ${response.status}`);
    }

    return data;
}
