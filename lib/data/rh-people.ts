import type { DealBundle } from "../types";

export type RhPersonCard = {
  name: string;
  role: string;
  years: string;
  importance: string;
  salary: string;
  source: string;
};

const EMPTY = "—";

function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Reunião de RH indexada: o nome do arquivo traz Pessoal, Pessoas ou RH
 * e é ata, transcrição ou reunião. “Documentos de pessoal” não entra.
 */
export function isRhMeetingFileName(name: string): boolean {
  const text = fold(name);
  const topic =
    text.includes("pessoal") ||
    text.includes("pessoas") ||
    /(^|[^a-z0-9])rh([^a-z0-9]|$)/.test(text);
  if (!topic) return false;
  return /reuniao|transcri|(^|[^a-z])ata([^a-z]|$)/.test(text);
}

export function findRhMeetingName(names: readonly string[]): string | null {
  return names.find((name) => isRhMeetingFileName(name)) ?? null;
}

/** Cartão do que o seed já nomeia. Ano, importância e salário não estão no corte. */
export function seedPersonCards(people: DealBundle["people"]): RhPersonCard[] {
  return people.map((person) => ({
    name: person.name,
    role: person.role.trim() || EMPTY,
    years: EMPTY,
    importance: EMPTY,
    salary: EMPTY,
    source: "seed",
  }));
}
