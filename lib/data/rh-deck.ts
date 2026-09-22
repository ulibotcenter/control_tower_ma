import type { RhPersonCard } from "./rh-people";

/** Arquivo Drive: Apresentacao Completa - M&A. */
export const DECK_FILE_ID = "15IjNus__YweAKBgl7dlue4O_pWymHnrQ";
export const DECK_SOURCE = "Apresentação Completa";

const EMPTY = "—";

function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const FLEX: Record<string, string> = {
  a: "[aáàâã]",
  e: "[eéèê]",
  i: "[iíìî]",
  o: "[oóòôõ]",
  u: "[uúùü]",
  c: "[cç]",
};

function flex(name: string) {
  return [...fold(name)]
    .map((ch) => FLEX[ch] ?? ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("");
}

/** O nome do corte, ou cada lado de “Juninho / Delgado”. Não casa no meio de outra palavra. */
function namePattern(name: string): RegExp {
  const parts = name
    .split("/")
    .map((part) => part.trim())
    .filter((part) => fold(part).length >= 3);
  const alts = [name, ...parts].map(flex).join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alts})(?![\\p{L}\\p{N}])`, "iu");
}

export function deckNamesPerson(text: string, name: string): boolean {
  return namePattern(name).test(text);
}

function excerpt(text: string, name: string, others: readonly string[]): string {
  const match = namePattern(name).exec(text);
  if (!match || match.index == null) return "";
  const start = match.index;
  let end = Math.min(text.length, start + 700);
  const after = start + match[0].length;
  for (const other of others) {
    if (fold(other) === fold(name)) continue;
    const next = namePattern(other).exec(text.slice(after));
    if (!next || next.index == null) continue;
    const abs = after + next.index;
    if (abs < end) end = abs;
  }
  return text.slice(start, end);
}

function clean(value: string): string {
  const text = value.replace(/\s+/g, " ").trim().replace(/[;,.\s]+$/, "");
  if (!text || text === "-" || text === "—" || text === "–") return "";
  if (/^(fun[cç][aã]o|cargo|papel|anos|tempo|import[aâ]ncia|pmi|sal[aá]rio|remunera)/i.test(text)) return "";
  return text.slice(0, 80);
}

function labeled(slice: string, label: RegExp): string {
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${label.source})(?![\\p{L}\\p{N}])\\s*(?:[:\\-–—]\\s*|\\n\\s*)([^\\n]{1,80})`,
    "iu",
  );
  const match = re.exec(slice);
  return match ? clean(match[1]) : "";
}

function importanceFrom(slice: string): string {
  const combined = labeled(slice, /import[aâ]ncia(?:\s*\(?\s*atual\s*\/\s*pmi\s*\)?)?/);
  const atual = labeled(slice, /import[aâ]ncia\s+atual/);
  const pmi = labeled(slice, /\bpmi\b/);
  if (atual && pmi) return `${atual} / ${pmi}`;
  if (combined && pmi && !/pmi/i.test(combined)) return `${combined} / ${pmi}`;
  return atual || combined || pmi;
}

/**
 * Preenche só quem o texto da apresentação nomeia.
 * Campo sem rótulo no trecho fica “—”. Quem o deck não cita permanece como está.
 */
export function applyDeckText(cards: RhPersonCard[], text: string | null | undefined): RhPersonCard[] {
  if (!text?.trim()) return cards;
  const names = cards.map((card) => card.name);
  return cards.map((card) => {
    if (!deckNamesPerson(text, card.name)) return card;
    const slice = excerpt(text, card.name, names);
    return {
      name: card.name,
      role: labeled(slice, /fun[cç][aã]o|cargo|papel/) || EMPTY,
      years: labeled(slice, /anos de empresa|tempo de empresa|tempo de casa|anos/) || EMPTY,
      importance: importanceFrom(slice) || EMPTY,
      salary: labeled(slice, /sal[aá]rio|remunera[cç][aã]o/) || EMPTY,
      source: DECK_SOURCE,
    };
  });
}
