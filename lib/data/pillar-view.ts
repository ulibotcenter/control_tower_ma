/**
 * Recorte de um deal por pilar.
 *
 * Só reorganiza o que `getDealBundle` já entregou — e o bundle já passou pelo
 * filtro de visibilidade do modo. Ou seja: o que some no Alvo continua sumindo,
 * e a contagem de cada pilar conta apenas o que aquele público pode ver.
 */
import {
  DD_SUBGROUPS,
  PILLARS,
  ddSubgroupOf,
  isUnfiled,
  pillarHealth,
  pillarOf,
  pillarOfMilestone,
  type DdSubgroup,
  type PillarSlug,
} from "../pillars";
import { isPendingInboxDoc, isScanFolderDoc } from "./doc-groups";
import type {
  ActionItem,
  ChecklistItem,
  DealBundle,
  DriveDocument,
  Milestone,
  Risk,
  Semaphore,
} from "../types";

export type PillarView = {
  slug: PillarSlug;
  order: number;
  name: string;
  short: string;
  health: Semaphore;
  milestones: Milestone[];
  checklist: ChecklistItem[];
  risks: Risk[];
  actions: ActionItem[];
  documents: DriveDocument[];
  /** Itens de DD que chegaram sem frente: ficam visíveis, não sumidos. */
  unfiled: number;
  openChecks: number;
  redRisks: number;
  total: number;
};

function contar(
  checklist: ChecklistItem[],
  risks: Risk[],
  actions: ActionItem[],
  documents: DriveDocument[],
) {
  const openChecks = checklist.filter(
    (c) => c.status === "aberto" || c.status === "em_andamento",
  ).length;
  const blockedChecks = checklist.filter((c) => c.status === "bloqueado").length;
  const redRisks = risks.filter((r) => r.severity === "red").length;
  const amberRisks = risks.filter((r) => r.severity === "amber").length;
  const lateActions = actions.filter((a) => a.status === "late").length;
  const openActions = actions.filter((a) => a.status === "open").length;
  const total = checklist.length + risks.length + actions.length + documents.length;
  return { openChecks, blockedChecks, redRisks, amberRisks, lateActions, openActions, total };
}

export function getPillarViews(bundle: DealBundle): PillarView[] {
  return PILLARS.map((pilar) => {
    const checklist = bundle.checklist.filter((c) => pillarOf(c) === pilar.slug);
    const risks = bundle.risks.filter((r) => pillarOf(r) === pilar.slug);
    const actions = bundle.actions.filter((a) => pillarOf(a) === pilar.slug);
    const documents = bundle.documents.filter(
      (d) => !isScanFolderDoc(d) && !isPendingInboxDoc(d) && pillarOf(d) === pilar.slug,
    );
    const milestones = bundle.milestones.filter((m) => pillarOfMilestone(m.slug) === pilar.slug);
    const c = contar(checklist, risks, actions, documents);

    return {
      slug: pilar.slug,
      order: pilar.order,
      name: pilar.name,
      short: pilar.short,
      health: pillarHealth(c),
      milestones,
      checklist,
      risks,
      actions,
      documents,
      unfiled: [...checklist, ...risks, ...actions, ...documents].filter(isUnfiled).length,
      openChecks: c.openChecks,
      redRisks: c.redRisks,
      total: c.total,
    };
  });
}

export function getPillarView(bundle: DealBundle, slug: PillarSlug): PillarView {
  return getPillarViews(bundle).find((p) => p.slug === slug)!;
}

export type SubgroupCount = { slug: DdSubgroup; name: string; count: number };

/** Contagem dos quatro subgrupos da DD, para os chips do pilar 2. */
export function ddSubgroupCounts(view: PillarView): SubgroupCount[] {
  const itens = [...view.checklist, ...view.risks, ...view.actions, ...view.documents];
  return DD_SUBGROUPS.map((s) => ({
    slug: s.slug,
    name: s.name,
    count: itens.filter((i) => ddSubgroupOf(i) === s.slug).length,
  }));
}

/**
 * Itens da DD fora dos quatro subgrupos travados (comercial, operacional e
 * os que chegaram sem frente). Os chips não os alcançam, então a tela diz
 * quantos são em vez de deixá-los sumidos atrás de "Tudo".
 */
export function ddOutsideSubgroups(view: PillarView): number {
  const itens = [...view.checklist, ...view.risks, ...view.actions, ...view.documents];
  return itens.filter((i) => ddSubgroupOf(i) === null).length;
}

export function filterBySubgroup<T extends { workstreamSlug?: string | null; title?: string }>(
  items: T[],
  subgroup: DdSubgroup | null,
): T[] {
  if (!subgroup) return items;
  return items.filter((i) => ddSubgroupOf(i) === subgroup);
}

/** Risco vermelho ou checklist bloqueado. Só o que o bundle já deixou visível. */
export type Blocker = { id: string; title: string; line: string };

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tituloCurto(title: string) {
  const corte = title.split(" — ")[0].split(":")[0].trim();
  return corte.length <= 52 ? corte : `${corte.slice(0, 50)}…`;
}

function tokensDe(title: string) {
  return semAcento(title)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
}

function acaoLigada(title: string, workstream: string | null, actions: ActionItem[]) {
  const abertas = actions.filter((a) => a.status === "open" || a.status === "late");
  const toks = tokensDe(title);
  const porToken = abertas.find((a) => toks.some((t) => semAcento(a.title).includes(t)));
  if (porToken) return porToken;
  if (!workstream) return null;
  const naFrente = abertas.filter((a) => a.workstreamSlug === workstream);
  return naFrente.length === 1 ? naFrente[0] : null;
}

function linhaTrava(title: string, action: ActionItem | null) {
  const curto = tituloCurto(title);
  if (!action) return curto;
  const dono = action.owner.split("/")[0].trim().split(/\s+/)[0];
  const hint = /sem valor/i.test(action.title) ? "sem valor" : null;
  return hint ? `${curto} — ${dono} · ${hint}` : `${curto} — ${dono}`;
}

export function blockersFrom(
  risks: Risk[],
  checklist: ChecklistItem[],
  limit = 3,
  actions: ActionItem[] = [],
): Blocker[] {
  const out: Blocker[] = [];
  for (const r of risks) {
    if (r.severity !== "red") continue;
    const action = acaoLigada(r.title, r.workstreamSlug, actions);
    out.push({ id: r.id, title: r.title, line: linhaTrava(r.title, action) });
    if (out.length >= limit) return out;
  }
  for (const c of checklist) {
    if (c.status !== "bloqueado") continue;
    const action = acaoLigada(c.title, c.workstreamSlug, actions);
    out.push({ id: c.id, title: c.title, line: linhaTrava(c.title, action) });
    if (out.length >= limit) return out;
  }
  return out;
}

/** Primeira ação atrasada; se não houver, a primeira aberta. Ordem do seed. */
export function firstOpenAction(actions: ActionItem[]): ActionItem | null {
  return (
    actions.find((a) => a.status === "late") ??
    actions.find((a) => a.status === "open") ??
    null
  );
}
