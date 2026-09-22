import type { RhPersonCard } from "./rh-people";

/** Arquivo Drive: Apresentacao Completa - M&A. */
export const DECK_FILE_ID = "15IjNus__YweAKBgl7dlue4O_pWymHnrQ";
export const DECK_SOURCE = "Apresentação Completa";

export const RH_CARD_FIELDS = ["role", "years", "importance", "salary", "source"] as const;
export type RhCardField = (typeof RH_CARD_FIELDS)[number];

export type RhCardEdit = {
  personName: string;
  field: RhCardField;
  value: string;
};

export function isRhCardField(value: string): value is RhCardField {
  return (RH_CARD_FIELDS as readonly string[]).includes(value);
}

/**
 * Lista fechada da Eleva para o RH da Loopert. Não vem de exportação.
 * Anos não foram dados. Campo ausente é “—”.
 */
const LOOPERT_DECK_ROWS: readonly (readonly [string, string, string, string, string])[] = [
  [
    "João Konflanz",
    "CEO / administrador único",
    "Mandatório no deal; sponsor do alvo",
    "N/A (sócio)",
    "Interlocutor do alvo no mandato; governança pós-fechamento ainda a definir com a AD+R. Escritório Joinville / corte de custo no follow-up (aluguel isento até dez/2026).",
  ],
  [
    "Jorge Fernandes",
    "Sócio; infra / banco (pontual)",
    "Conselheiro técnico; PMI = consultor, não quadro fixo",
    "N/A (sócio)",
    "Fora do quadro fixo. Consultor pontual de infra/banco (“consultor de luxo”).",
  ],
  ["Carlo Huinka", "Sócio", "Cap table 20%; sem função operacional no deck", "N/A (sócio)", "Sem função operacional no deck; só cap table."],
  [
    "Lucas Caresia",
    "CTO / produto (sócio 15%)",
    "Key-man; retenção 36 meses no pack Pacta; centraliza código",
    "N/A (sócio)",
    "Key-man. Par com Matheus Bruni (pesquisa vs. desenvolvimento). Vínculo CLT/sócio em aberto. Retenção 36 meses no pack Pacta.",
  ],
  [
    "Isis Beatris de Souza Pereira",
    "Tech lead / dev (PJ)",
    "Essencial; backup do Lucas; ramificar conhecimento",
    "R$ 6.000",
    "Permanece essencial; backup do Lucas. Ramificar conhecimento. PJ vs. CLT não definido.",
  ],
  [
    "Eduardo Augusto Mascarenhas",
    "Infra TI (PJ)",
    "Essencial 24/7; 50% Radio Health — definir quem paga",
    "R$ 6.000 (metade Radio Health)",
    "Permanece na infra. 50/50 com Radio Health — quem paga fica em aberto.",
  ],
  [
    "Suélen Castilho da Roza Konflanz",
    "Financeiro / admin / RH (CLT)",
    "Crítica hoje; conflito (esposa do João); PMI em aberto",
    "R$ 4.539",
    "Financeiro hoje crítico; AD+R pode absorver. Conflito (esposa do João). Sem decisão de desligar.",
  ],
  [
    "Aline Caroline Silveira de Oliveira",
    "SDR (CLT)",
    "Demitida jul/2026; AD+R deve contratar; home office",
    "R$ 3.400",
    "Demitida jul/2026. AD+R deve contratar (SDR Brasil no Ar + Metrics), home office.",
  ],
  [
    "Christian George Bernard Roch Junior",
    "Estagiário vendas/CS",
    "Efetivar; estágio até dez/2026",
    "Bolsa R$ 2.800",
    "Efetivar (CS/suporte). Estágio até dez/2026.",
  ],
  [
    "Jorge Nelson de Souza Junior (Juninho)",
    "Suporte (CLT)",
    "Baixa aderência; reavaliar no PMI",
    "R$ 700",
    "Reavaliar; menor aderência. Possível troca por perfil mais proativo.",
  ],
  [
    "João Delgado",
    "Dev app (CLT)",
    "Desligar; app absorvido por Lucas/Isis; custo 50% Heggtech",
    "R$ 2.289",
    "Desligar. App absorvido por Lucas e Isis.",
  ],
  [
    "Matheus Bruni (Bruno)",
    "CTO Radio Health (não é Loopert)",
    "Candidato a par do Lucas; depende TARGA/Jardel",
    "—",
    "Candidato a par/CTO com Lucas. Depende de Jardel / TARGA / Radio Health.",
  ],
];

export function loopertDeckCards(): RhPersonCard[] {
  return LOOPERT_DECK_ROWS.map(([name, role, importance, salary, source]) => ({
    name,
    role,
    years: "—",
    importance,
    salary,
    source,
  }));
}

export function loopertPersonNames(): readonly string[] {
  return LOOPERT_DECK_ROWS.map(([name]) => name);
}

/** Override gravado por cima da lista. Sem linha, o default fica. */
export function applyRhEdits(cards: RhPersonCard[], edits: readonly RhCardEdit[]): RhPersonCard[] {
  if (!edits.length) return cards;
  return cards.map((card) => {
    const mine = edits.filter((edit) => edit.personName === card.name);
    if (!mine.length) return card;
    const next = { ...card };
    for (const edit of mine) {
      if (!isRhCardField(edit.field)) continue;
      next[edit.field] = edit.value;
    }
    return next;
  });
}

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
