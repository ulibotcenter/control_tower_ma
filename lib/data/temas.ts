/**
 * Temas do eixo especialista. Só recorte do bundle já filtrado pelo modo.
 * Não inventa cultura, preço, LOI nem SPA. Sem rota nova: ?tema= na página do deal.
 */
import { isScanFolderDoc } from "./doc-groups";
import { pillarOf, PILLAR_BY_SLUG, type PillarSlug } from "../pillars";
import type { DealBundle } from "../types";

export const TEMAS = [
  { slug: "juridico", name: "Jurídico" },
  { slug: "financeiro", name: "Financeiro" },
  { slug: "comercial", name: "Comercial" },
  { slug: "pessoas", name: "Pessoas/RH" },
  { slug: "operacao", name: "Operação" },
  { slug: "cultura", name: "Cultura" },
] as const;

export type TemaSlug = (typeof TEMAS)[number]["slug"];

export function isTemaSlug(value: string | null | undefined): value is TemaSlug {
  return Boolean(value && TEMAS.some((t) => t.slug === value));
}

export type TemaKind = "risco" | "acao" | "doc";

export type TemaHit = {
  id: string;
  title: string;
  kind: TemaKind;
  pillar: PillarSlug;
};

const LIMITE_LISTA = 6;

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function falaDeCultura(item: { id?: string; title?: string; detail?: string; note?: string }) {
  const t = semAcento(`${item.title ?? ""} ${item.detail ?? ""} ${item.note ?? ""}`);
  return /\bcultura\b|\bclima\b/.test(t);
}

function ehJuridicoExtra(item: { id?: string; title?: string }) {
  const t = semAcento(`${item.id ?? ""} ${item.title ?? ""}`);
  return t.includes("targa") || t.includes("municipal") || t.includes("anuencia");
}

function caiNoTema(
  item: {
    id?: string;
    title?: string;
    detail?: string;
    note?: string;
    workstreamSlug?: string | null;
  },
  tema: TemaSlug,
) {
  if (tema === "cultura") return falaDeCultura(item);
  if (tema === "juridico") return item.workstreamSlug === "legal" || ehJuridicoExtra(item);
  if (tema === "financeiro") return item.workstreamSlug === "financeiro";
  if (tema === "comercial") return item.workstreamSlug === "comercial";
  if (tema === "pessoas") return item.workstreamSlug === "pessoas-pi";
  if (tema === "operacao") {
    return item.workstreamSlug === "operacional" || item.workstreamSlug === "integracao";
  }
  return false;
}

function hit(
  item: { id: string; title: string; workstreamSlug?: string | null; pillarSlug?: string | null },
  kind: TemaKind,
): TemaHit {
  return { id: item.id, title: item.title, kind, pillar: pillarOf(item) };
}

function coletar(bundle: DealBundle, tema: TemaSlug): TemaHit[] {
  const riscos = bundle.risks.filter((r) => caiNoTema(r, tema)).map((r) => hit(r, "risco"));
  const acoes = bundle.actions.filter((a) => caiNoTema(a, tema)).map((a) => hit(a, "acao"));
  const docs = bundle.documents.filter((d) => !isScanFolderDoc(d) && caiNoTema(d, tema)).map((d) => hit(d, "doc"));
  return [...riscos, ...acoes, ...docs];
}

export function temaCount(bundle: DealBundle, tema: TemaSlug) {
  return coletar(bundle, tema).length;
}

export function temaHits(bundle: DealBundle, tema: TemaSlug): { items: TemaHit[]; total: number } {
  const all = coletar(bundle, tema);
  return { items: all.slice(0, LIMITE_LISTA), total: all.length };
}

export function temaNome(slug: TemaSlug) {
  return TEMAS.find((t) => t.slug === slug)?.name ?? slug;
}

export function pilarNome(slug: PillarSlug) {
  return PILLAR_BY_SLUG[slug].short;
}

export function kindLabel(kind: TemaKind, target: boolean) {
  if (kind === "risco") return target ? "Ponto" : "Risco";
  if (kind === "acao") return "Ação";
  return "Documento";
}
