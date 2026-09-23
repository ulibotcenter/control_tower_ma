export type WaveCounts = { A: number; B: number; C: number };

export const EMPTY_WAVES: WaveCounts = { A: 0, B: 0, C: 0 };

/** Toast quando as três ondas terminam. */
export function varreduraToast(counts: WaveCounts) {
  return `Varredura PMO · A ${counts.A} · B ${counts.B} · C ${counts.C} propostas`;
}

/** Delta de ata/transcrição. Áudio é frase fixa: não entra número nem nome. */
export function leituraToast(read: number, seen: number) {
  return `Leu ${read} atas/transcrições novas · pulou áudio · ${seen} já vistas`;
}

/** OpenRouter caiu no meio: a frase da API e o que já entrou na fila. */
export function varreduraFailToast(phrase: string, counts: WaveCounts) {
  const clean = phrase.replace(/\s+/g, " ").trim();
  return `${clean} · ${varreduraToast(counts)}`;
}

export function insertToast(inserted: number, skipped: number) {
  return `Inseridas ${inserted} · puladas já vistas ${skipped}`;
}

/** doc_text sem corpo utilizável. Não chama o modelo. */
export const EMPTY_MEMORY_TOAST = "Memória vazia — rode Ingerir";

/** k = trechos que foram no contexto deste clique. */
export function memoriaTrechos(count: number) {
  return `memória ${count} trechos`;
}

export function withMemoriaTrechos(toast: string, count: number) {
  return `${toast} · ${memoriaTrechos(count)}`;
}

/** Onda B deste clique: o arquivo que entrou, ou a frase da falha. */
export function bClickToast(name: string, failPhrase = "") {
  const fail = failPhrase.replace(/\s+/g, " ").trim();
  if (fail) return `B falhou: ${fail}`;
  const file = name.replace(/\s+/g, " ").trim();
  return file ? `B: ${file}` : "";
}

/**
 * Vermelho só se A, B e C falharem.
 * Se alguma onda segurou, o toast normal. Frase de B entra quando essa onda falhou.
 */
export function scanToast(input: {
  read: number;
  seen: number;
  allFailed: boolean;
  failPhrase: string;
  bPhrase: string;
  counts: WaveCounts;
}) {
  const delta = leituraToast(input.read, input.seen);
  if (input.allFailed) {
    const phrase = input.failPhrase.replace(/\s+/g, " ").trim() || "A IA não devolveu texto.";
    return { failed: true as const, toast: `${varreduraFailToast(phrase, input.counts)} · ${delta}` };
  }
  const b = input.bPhrase.replace(/\s+/g, " ").trim();
  return { failed: false as const, toast: b ? `${delta} · B falhou: ${b}` : delta };
}
