export type WaveCounts = { A: number; B: number; C: number };

export const EMPTY_WAVES: WaveCounts = { A: 0, B: 0, C: 0 };

/** Toast quando as três ondas terminam. */
export function varreduraToast(counts: WaveCounts) {
  return `Varredura PMO · A ${counts.A} · B ${counts.B} · C ${counts.C} propostas`;
}

/** OpenRouter caiu no meio: a frase da API e o que já entrou na fila. */
export function varreduraFailToast(phrase: string, counts: WaveCounts) {
  const clean = phrase.replace(/\s+/g, " ").trim();
  return `${clean} · ${varreduraToast(counts)}`;
}
