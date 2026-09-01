/**
 * Os seis pilares do processo de M&A.
 *
 * O pilar de um item é DERIVADO do que o seed já diz — frente de trabalho,
 * marco, tipo de documento. Nada aqui inventa fato: só arruma em prateleira
 * o que já estava no corte.
 *
 * Um item pode trazer `pillarSlug` explícito e, quando traz, ele manda. O
 * corte atual não precisou de nenhum: a frente de trabalho resolve todos os
 * casos, e as regras de pilar 4 e 5 (assembleia, sócios, laudo, JUCESP,
 * CADE, closing 51%, exercício 49%) não encontram nenhum item hoje.
 * Item sem frente cai em Due Diligence, fila "A classificar".
 */
import type { Semaphore } from "./types";

export const PILLARS = [
  {
    slug: "preparacao",
    order: 1,
    name: "Planejamento Estratégico e Preparação",
    short: "Preparação",
  },
  { slug: "dd", order: 2, name: "Due Diligence", short: "Due Diligence" },
  { slug: "estruturacao", order: 3, name: "Estruturação e Negociação", short: "Estruturação" },
  {
    slug: "aprovacoes",
    order: 4,
    name: "Aprovações Corporativas e Regulatório",
    short: "Aprovações",
  },
  { slug: "fechamento", order: 5, name: "Fechamento", short: "Fechamento" },
  { slug: "pmi", order: 6, name: "Integração Pós-Incorporação (PMI)", short: "Integração" },
] as const;

export type PillarSlug = (typeof PILLARS)[number]["slug"];

/** Subgrupos existem só na Due Diligence. */
export const DD_SUBGROUPS = [
  { slug: "legal", name: "Legal" },
  { slug: "financeiro", name: "Financeiro" },
  { slug: "trabalhista", name: "Trabalhista" },
  { slug: "esg", name: "ESG" },
] as const;

export type DdSubgroup = (typeof DD_SUBGROUPS)[number]["slug"];

export const PILLAR_BY_SLUG = Object.fromEntries(PILLARS.map((p) => [p.slug, p])) as Record<
  PillarSlug,
  (typeof PILLARS)[number]
>;

export function isPillarSlug(value: string | null | undefined): value is PillarSlug {
  return Boolean(value && PILLARS.some((p) => p.slug === value));
}

export function isDdSubgroup(value: string | null | undefined): value is DdSubgroup {
  return Boolean(value && DD_SUBGROUPS.some((s) => s.slug === value));
}

/** Frente de trabalho do seed → pilar. */
const FRENTE_PARA_PILAR: Record<string, PillarSlug> = {
  legal: "dd",
  financeiro: "dd",
  comercial: "dd",
  "pessoas-pi": "dd",
  operacional: "dd",
  negociacao: "estruturacao",
  integracao: "pmi",
};

/** Frente de trabalho → subgrupo da DD. Comercial e operacional não têm. */
const FRENTE_PARA_SUBGRUPO: Record<string, DdSubgroup> = {
  legal: "legal",
  financeiro: "financeiro",
  "pessoas-pi": "trabalhista",
};

/** Marco da linha do tempo → pilar. Aprovações não tem marco no corte. */
const MARCO_PARA_PILAR: Record<string, PillarSlug> = {
  preparar: "preparacao",
  dd: "dd",
  estruturar: "estruturacao",
  fechar: "fechamento",
  integrar: "pmi",
};

export function pillarOfMilestone(slug: string): PillarSlug | null {
  return MARCO_PARA_PILAR[slug] ?? null;
}

/**
 * URL antiga de frente de trabalho → pilar de destino, sem tocar no seed.
 * Puro de propósito: a rota chama isto antes de buscar dado, para o redirect
 * sair como 307 de verdade em vez de virar salto no cliente depois do
 * loading.tsx já ter sido transmitido.
 */
export function pillarForLegacyWorkstream(
  slug: string,
): { pillar: PillarSlug; subgroup: DdSubgroup | null } | null {
  const pillar = FRENTE_PARA_PILAR[slug];
  if (!pillar) return null;
  return { pillar, subgroup: FRENTE_PARA_SUBGRUPO[slug] ?? null };
}

type Classificavel = {
  pillarSlug?: string | null;
  workstreamSlug?: string | null;
};

export function pillarOf(item: Classificavel): PillarSlug {
  if (isPillarSlug(item.pillarSlug)) return item.pillarSlug;
  const frente = item.workstreamSlug ?? "";
  return FRENTE_PARA_PILAR[frente] ?? "dd";
}

/** Só o item que já fala de ESG/ambiental entra no subgrupo ESG. */
function falaDeEsg(texto: string) {
  return /\besg\b|ambiental|sustentabilid/i.test(texto);
}

export function ddSubgroupOf(
  item: Classificavel & { title?: string; detail?: string; note?: string },
): DdSubgroup | null {
  if (pillarOf(item) !== "dd") return null;
  const texto = `${item.title ?? ""} ${item.detail ?? ""} ${item.note ?? ""}`;
  if (falaDeEsg(texto)) return "esg";
  return FRENTE_PARA_SUBGRUPO[item.workstreamSlug ?? ""] ?? null;
}

/** Item de DD sem frente conhecida fica numa fila visível, não escondido. */
export function isUnfiled(item: Classificavel): boolean {
  return pillarOf(item) === "dd" && !item.workstreamSlug;
}

/**
 * Semáforo do pilar: vem dos itens visíveis nele, não de um campo novo.
 * Vermelho manda; depois âmbar; verde só quando há item e nada pendente.
 */
export function pillarHealth(input: {
  redRisks: number;
  amberRisks: number;
  lateActions: number;
  openActions: number;
  openChecks: number;
  blockedChecks: number;
  total: number;
}): Semaphore {
  if (input.redRisks > 0 || input.blockedChecks > 0) return "red";
  if (input.amberRisks > 0 || input.lateActions > 0) return "amber";
  if (input.total === 0) return "gray";
  if (input.openActions > 0 || input.openChecks > 0) return "amber";
  return "green";
}
