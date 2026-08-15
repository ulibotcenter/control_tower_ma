/**
 * Fachada de leitura da torre.
 *
 * HOJE
 *   - Programa, deals, riscos, ações, marcos, tese, preço, métricas, notas:
 *     `seed.ts` (corte estático 14/08/2026). Ver DATA_ORIGIN.
 *   - Inbox, decisões, docs/checklist classificados na bandeja:
 *     `store.ts` → Supabase se URL+service role; senão seed + .data/.
 *
 * AMANHÃ (sem mudar o shape de DealBundle / ProgramView)
 *   - Trocar os imports de seed pelas queries em store-supabase
 *     usando as tabelas listadas em `DATA_ORIGIN[key].futureTable`.
 *   - Manter filterVisible(mode, …) em volta de tudo que tem visibility.
 */
import { CORTE } from "../constants";
import { isDriveConfigured, isResendConfigured, isSupabaseConfigured } from "../config";
import { collectActivity, visibleActivity } from "../activity";
import { collectAttention } from "../attention";
import type { ActivityEvent, AttentionItem, DealBundle, MeetingMode, ProgramView } from "../types";
import { canSeeDecisions, canSeeInbox, filterVisible } from "../visibility";
import {
  actions,
  boardCard,
  capFor,
  checklist,
  deals,
  decisions as seedDecisions,
  documents,
  metrics,
  milestones,
  notes,
  peopleFor,
  prices,
  risks,
  thesis,
  workstreams,
} from "./seed";
import { extraChecklist, extraDocuments, listDecisions, listInbox, unclassifiedCount } from "./store";
import { DATA_ORIGIN } from "./sources";

export { DATA_ORIGIN };

export async function getProgram(mode: MeetingMode): Promise<ProgramView> {
  const inboxUnclassified = canSeeInbox(mode) ? await unclassifiedCount() : 0;

  return {
    corte: CORTE,
    board: boardCard,
    deals: deals
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map((deal) => {
        const dealRisks = filterVisible(
          mode,
          risks.filter((r) => r.dealId === deal.id),
        );
        const reds = dealRisks.filter((r) => r.severity === "red");
        const ambers = dealRisks.filter((r) => r.severity === "amber");
        return {
          ...deal,
          redCount: reds.length,
          amberCount: ambers.length,
          topReds: reds.slice(0, 3).map((r) => r.title),
        };
      }),
    driveConfigured: isDriveConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    dataBackend: isSupabaseConfigured() ? "supabase" : "seed",
    resendConfigured: isResendConfigured(),
    inboxUnclassified,
  };
}

export function getDealSlugs() {
  return deals.map((d) => d.slug);
}

export function getDealBySlug(slug: string) {
  return deals.find((d) => d.slug === slug) ?? null;
}

export async function getDealBundle(slug: string, mode: MeetingMode): Promise<DealBundle | null> {
  const deal = getDealBySlug(slug);
  if (!deal) return null;

  return {
    deal,
    workstreams: workstreams.filter((w) => w.dealId === deal.id),
    milestones: milestones.filter((m) => m.dealId === deal.id),
    documents: filterVisible(mode, [
      ...documents.filter((d) => d.dealId === deal.id),
      ...(await extraDocuments()).filter((d) => d.dealId === deal.id),
    ]),
    risks: filterVisible(
      mode,
      risks.filter((r) => r.dealId === deal.id),
    ),
    actions: filterVisible(
      mode,
      actions.filter((a) => a.dealId === deal.id),
    ),
    checklist: filterVisible(mode, [
      ...(await extraChecklist()).filter((c) => c.dealId === deal.id),
      ...checklist.filter((c) => c.dealId === deal.id),
    ]),
    metrics: filterVisible(
      mode,
      metrics.filter((m) => m.dealId === deal.id),
    ),
    notes: filterVisible(
      mode,
      notes.filter((n) => n.dealId === deal.id || n.dealId === null),
    ),
    thesis: filterVisible(
      mode,
      thesis.filter((t) => t.dealId === deal.id),
    ),
    prices: filterVisible(
      mode,
      prices.filter((p) => p.dealId === deal.id),
    ),
    capTable: capFor(deal.id),
    people: filterVisible(mode, peopleFor(deal.id)),
  };
}

export function workstreamOf(bundle: DealBundle, slug: string) {
  return bundle.workstreams.find((w) => w.slug === slug) ?? null;
}

/**
 * MOCK: ações/riscos do seed.
 * REAL: a mesma assinatura, lendo `actions` + `risks` do Supabase
 * (DATA_ORIGIN.actions / DATA_ORIGIN.risks).
 */
export function getAttentionItems(mode: MeetingMode): AttentionItem[] {
  return collectAttention({ actions, risks, deals }, mode);
}

function dealName(id: string | null) {
  if (!id) return "Programa";
  return deals.find((d) => d.id === id)?.name ?? "Programa";
}

/**
 * MOCK/DERIVADO: decisões + bandeja + fatos datados do corte.
 * REAL: DATA_ORIGIN.activity → activity_events.
 * Falha no store não derruba a home — cai no seed.
 */
export async function getActivity(mode: MeetingMode, limit = 8): Promise<ActivityEvent[]> {
  let decisionRows = seedDecisions;
  let inboxRows: Awaited<ReturnType<typeof listInbox>> = [];
  try {
    if (canSeeDecisions(mode) !== "hidden") decisionRows = await listDecisions();
  } catch {
    decisionRows = seedDecisions;
  }
  try {
    if (canSeeInbox(mode)) inboxRows = await listInbox();
  } catch {
    inboxRows = [];
  }
  return visibleActivity(collectActivity({ decisions: decisionRows, inbox: inboxRows, dealName }), mode, limit);
}
