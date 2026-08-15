/**
 * Contrato de origem dos dados da torre.
 *
 * Não muda o shape (ver lib/types.ts). Serve para marcar, com clareza,
 * o que ainda é corte estático (seed) e o que já passa — ou passará —
 * pelo Supabase.
 *
 * Quando um bloco migrar:
 *   1. Ler da tabela indicada em `futureTable` (snake_case no Postgres).
 *   2. Manter o mesmo tipo TypeScript.
 *   3. Trocar `origin` de "seed" para "supabase".
 *   4. Não inventar números: só o que estiver no banco / no corte oficial.
 */

export type DataOrigin = "seed" | "store";

export type CollectionSource = {
  /** Chave estável da coleção no provider. */
  key: string;
  /** De onde a torre lê hoje. */
  origin: DataOrigin;
  /** Arquivo atual. */
  today: string;
  /** Tabela Postgres prevista. Null = continua seed ou não é tabela. */
  futureTable: string | null;
  note: string;
};

/**
 * Coleções do programa. Inbox / decisões / extras de classificação
 * já têm caminho real em `store.ts` → `store-supabase.ts`.
 */
export const DATA_ORIGIN = {
  deals: {
    key: "deals",
    origin: "seed",
    today: "lib/data/seed.ts → deals",
    futureTable: "deals",
    note: "Cadastro das duas operações. Hoje é o corte 14/08/2026.",
  },
  boardCard: {
    key: "boardCard",
    origin: "seed",
    today: "lib/data/seed.ts → boardCard",
    futureTable: "program_board",
    note: "Frase da próxima decisão do board. Uma linha por programa.",
  },
  workstreams: {
    key: "workstreams",
    origin: "seed",
    today: "lib/data/seed.ts → workstreams",
    futureTable: "workstreams",
    note: "Frentes de cada deal (legal, financeiro, …).",
  },
  milestones: {
    key: "milestones",
    origin: "seed",
    today: "lib/data/seed.ts → milestones",
    futureTable: "milestones",
    note: "Linha do tempo / fases.",
  },
  documents: {
    key: "documents",
    origin: "seed",
    today: "lib/data/seed.ts → documents + store.extraDocuments",
    futureTable: "documents",
    note: "Catálogo do corte + arquivos classificados na bandeja (store).",
  },
  risks: {
    key: "risks",
    origin: "seed",
    today: "lib/data/seed.ts → risks",
    futureTable: "risks",
    note: "Riscos e issues. Alimenta o bloco Atenção (severity = red).",
  },
  actions: {
    key: "actions",
    origin: "seed",
    today: "lib/data/seed.ts → actions",
    futureTable: "actions",
    note: "Próximos passos. Alimenta o bloco Atenção (status = late).",
  },
  checklist: {
    key: "checklist",
    origin: "seed",
    today: "lib/data/seed.ts → checklist + store.extraChecklist",
    futureTable: "checklist_items",
    note: "Itens de DD do corte + itens criados ao classificar a bandeja.",
  },
  metrics: {
    key: "metrics",
    origin: "seed",
    today: "lib/data/seed.ts → metrics",
    futureTable: "metrics",
    note: "Indicadores já formalizados no corte. Sem inventar número.",
  },
  notes: {
    key: "notes",
    origin: "seed",
    today: "lib/data/seed.ts → notes",
    futureTable: "notes",
    note: "Notas com visibility/sensitivities. Não vazar no modo Alvo.",
  },
  thesis: {
    key: "thesis",
    origin: "seed",
    today: "lib/data/seed.ts → thesis",
    futureTable: "thesis_steps",
    note: "Histórico falado da tese. Nunca é LOI.",
  },
  prices: {
    key: "prices",
    origin: "seed",
    today: "lib/data/seed.ts → prices",
    futureTable: "price_steps",
    note: "Trajetória verbal de preço. Suspensa. Oculta no modo Alvo.",
  },
  capTable: {
    key: "capTable",
    origin: "seed",
    today: "lib/data/seed.ts → capFor()",
    futureTable: "cap_rows",
    note: "Quadro societário. Oculto no modo Alvo.",
  },
  people: {
    key: "people",
    origin: "seed",
    today: "lib/data/seed.ts → peopleFor()",
    futureTable: "people",
    note: "Pessoas do deal. Oculto no modo Alvo.",
  },
  decisions: {
    key: "decisions",
    origin: "store",
    today: "lib/data/store.ts → listDecisions (Supabase ou seed+local)",
    futureTable: "decisions",
    note: "Já persiste no Postgres quando SERVICE_ROLE está setado.",
  },
  inbox: {
    key: "inbox",
    origin: "store",
    today: "lib/data/store.ts → listInbox / classifyInboxFile",
    futureTable: "inbox_files",
    note: "Já persiste no Postgres quando SERVICE_ROLE está setado.",
  },
  activity: {
    key: "activity",
    origin: "store",
    today: "lib/activity.ts (decisões + bandeja + fatos datados do corte)",
    futureTable: "activity_events",
    note: "Feed derivado. Sem inventar data. Tabela própria quando o histórico for vivo.",
  },
} as const satisfies Record<string, CollectionSource>;

export type DataOriginKey = keyof typeof DATA_ORIGIN;
