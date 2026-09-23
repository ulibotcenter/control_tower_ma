import { AI_B_CHARS } from "./corpus";
import { compareDocNames } from "../data/doc-groups";
import { docTextSkipKind, type DocTextBody } from "../doc-text";

/** Trechos por Pedir leitura. */
export const EXCERPT_LIMIT = 5;

/**
 * Nome com estes trechos vem primeiro, nesta ordem.
 * O resto completa até o teto.
 */
const NAME_PRIORITY = [
  "ata",
  "transcri",
  "rh",
  "pessoal",
  "targa",
  "cnd",
  "dre",
  "apresentacao completa",
] as const;

const TOKEN_KEYS = new Set<string>(["rh", "cnd", "dre"]);

export type ReadingExcerpt = {
  driveId: string;
  name: string;
  body: string;
};

export function foldExcerptName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Menor é mais prioritário. Sem palavra da lista, fica depois. */
export function excerptNameRank(name: string) {
  const folded = foldExcerptName(name);
  const tokens = new Set(folded.split(" ").filter(Boolean));
  for (let i = 0; i < NAME_PRIORITY.length; i++) {
    const key = NAME_PRIORITY[i];
    if (key === "ata") {
      if ([...tokens].some((token) => token === "ata" || token.startsWith("atas"))) return i;
      continue;
    }
    if (key.includes(" ")) {
      if (folded.includes(key)) return i;
      continue;
    }
    if (TOKEN_KEYS.has(key)) {
      if (tokens.has(key)) return i;
      continue;
    }
    if (folded.includes(key)) return i;
  }
  return NAME_PRIORITY.length;
}

/** Corta no teto. Não acrescenta reticências nem baixa o arquivo. */
export function clipExcerpt(raw: string, max = AI_B_CHARS) {
  const clean = raw
    .replace(/\u0000/g, "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max);
}

function isRawPdf(body: string) {
  return body.trimStart().startsWith("%PDF");
}

/**
 * Até 5 corpos já ingeridos do deal (ou compartilhados).
 * Áudio, pulo e PDF cru ficam de fora. Sem chamada ao Drive.
 */
export function pickReadingExcerpts(rows: readonly DocTextBody[], dealSlug: string, limit = EXCERPT_LIMIT): ReadingExcerpt[] {
  const usable: { row: DocTextBody; body: string; rank: number }[] = [];
  for (const row of rows) {
    if (row.skippedReason) continue;
    if (row.dealSlug && row.dealSlug !== dealSlug) continue;
    if (docTextSkipKind(row.name, row.mime)) continue;
    if (isRawPdf(row.body)) continue;
    const body = clipExcerpt(row.body);
    if (!body) continue;
    const name = row.name.replace(/\s+/g, " ").trim();
    if (!name) continue;
    usable.push({ row: { ...row, name }, body, rank: excerptNameRank(name) });
  }
  usable.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const byName = compareDocNames(a.row.name, b.row.name);
    if (byName) return byName;
    return a.row.driveId.localeCompare(b.row.driveId);
  });
  return usable.slice(0, limit).map((item) => ({
    driveId: item.row.driveId,
    name: item.row.name,
    body: item.body,
  }));
}
