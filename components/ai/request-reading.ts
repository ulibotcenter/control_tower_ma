export type ReadingResult = {
  configured: boolean;
  message?: string;
  count: number;
  error?: string;
};

/** Pede a leitura de um deal. A chave não sai do servidor. Sem chave, a resposta não traz proposta. */
export async function requestAiReading(dealSlug: string): Promise<ReadingResult> {
  let res: Response;
  try {
    res = await fetch("/api/ai/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealSlug }),
    });
  } catch {
    return { configured: true, count: 0, error: "Falha de rede." };
  }
  let data: { configured?: boolean; message?: string; proposals?: unknown; error?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    data = {};
  }
  const count = Array.isArray(data.proposals) ? data.proposals.length : 0;
  if (data.configured === false) {
    return { configured: false, message: data.message || "IA não configurada", count: 0 };
  }
  if (!res.ok) {
    return { configured: true, count: 0, error: data.message || "Falha na leitura." };
  }
  return { configured: true, message: data.message, count };
}
