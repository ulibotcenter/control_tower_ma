/**
 * Fachada de leitura da torre.
 *
 * HOJE
 *   - Programa, deals, riscos, ações, marcos, tese, preço, métricas, notas:
 *     `seed.ts` (corte estático 02/09/2026). Ver DATA_ORIGIN.
 *   - Inbox, decisões, docs/checklist, pontos em aberto e tarefas/notas novas:
 *     `store.ts` → Supabase se URL+service role; senão seed + .data/.
 *     O corte de actions/notes continua no seed e recebe o que foi gravado por cima.
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
import type { ActionItem, ActivityEvent, AttentionItem, DealBundle, DriveDocument, MeetingMode, OpenPoint, ProgramView } from "../types";
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
import {
  extraChecklist,
  extraDocuments,
  listDecisions,
  listExtraActions,
  listExtraNotes,
  listInbox,
  listOpenPoints,
  unclassifiedCount,
} from "./store";
import { DATA_ORIGIN } from "./sources";
import { applyScanFileHints, dealIdForDriveFolder, isScanFolderDoc, scanParentMap } from "./doc-groups";
import { treeDocFromInbox } from "./store-map";
import { driveResourceId } from "../http";

export { DATA_ORIGIN };

/**
 * `onlyDeal` é o slug travado na reunião (modo Alvo). Quando presente, o outro
 * deal não entra na resposta: o alvo não vê a operação concorrente.
 */
type Scope = { onlyDeal?: string | null };

function inScope(slug: string, scope?: Scope) {
  return !scope?.onlyDeal || slug === scope.onlyDeal;
}

export async function getProgram(mode: MeetingMode, scope?: Scope): Promise<ProgramView> {
  const inboxUnclassified = canSeeInbox(mode) ? await unclassifiedCount() : 0;

  return {
    corte: CORTE,
    board: boardCard,
    deals: deals
      .filter((d) => inScope(d.slug, scope))
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

/** Lista enxuta para os seletores de deal e para o masthead de reunião. */
export function getDealOptions(scope?: Scope) {
  return deals
    .filter((d) => inScope(d.slug, scope))
    .sort((a, b) => a.priority - b.priority)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      priority: d.priority,
      phaseLabel: d.phaseLabel,
      health: d.health,
    }));
}

export function getDealBySlug(slug: string) {
  return deals.find((d) => d.slug === slug) ?? null;
}

function mergeById<T extends { id: string }>(fresh: T[], base: T[]): T[] {
  const seen = new Set(fresh.map((item) => item.id));
  return [...fresh, ...base.filter((item) => !seen.has(item.id))];
}

function liveOf<T extends { superseded?: boolean }>(rows: T[]): T[] {
  return rows.filter((row) => !row.superseded);
}

function originSet(actionsRows: ActionItem[], points: OpenPoint[]): Set<string> {
  const origins = new Set<string>();
  for (const row of [...actionsRows, ...points]) {
    if (row.originId) origins.add(row.originId);
  }
  return origins;
}

/** Linha gravada (inclusive túmulo) esconde o id do corte. A lista mostra só o que está vivo. */
function actionsForDeal(dealId: string, storedActions: ActionItem[], storedPoints: OpenPoint[]): ActionItem[] {
  const origins = originSet(storedActions, storedPoints);
  const live = liveOf(storedActions).filter((row) => row.dealId === dealId);
  const seed = actions.filter((row) => row.dealId === dealId && !origins.has(row.id));
  return mergeById(live, seed);
}

export async function getDealBundle(slug: string, mode: MeetingMode): Promise<DealBundle | null> {
  const deal = getDealBySlug(slug);
  if (!deal) return null;
  const [storedDocs, storedChecks, storedActions, storedNotes, storedPoints, inbox] = await Promise.all([
    extraDocuments(),
    extraChecklist(),
    listExtraActions(),
    listExtraNotes(),
    listOpenPoints(),
    canSeeInbox(mode) ? listInbox() : Promise.resolve([]),
  ]);

  const rooms = deals.map((item) => ({ id: item.id, driveFolderId: item.driveFolderId }));
  const parentOf = scanParentMap(storedDocs);
  const belongsToDeal = (doc: DriveDocument) => {
    if (doc.dealId === deal.id) return true;
    if (doc.dealId && doc.dealId !== deal.id) return false;
    const self = isScanFolderDoc(doc) ? driveResourceId(doc.driveUrl) : null;
    const owner = dealIdForDriveFolder(self || doc.folderId, parentOf, rooms);
    return owner === deal.id || owner === null;
  };

  return {
    deal,
    workstreams: workstreams.filter((w) => w.dealId === deal.id),
    milestones: milestones.filter((m) => m.dealId === deal.id),
    documents: filterVisible(
      mode,
      applyScanFileHints(
        mergeById(
          inbox.map(treeDocFromInbox).filter(belongsToDeal),
          mergeById(
            storedDocs.filter(belongsToDeal),
            documents.filter((d) => d.dealId === deal.id),
          ),
        ),
      ),
    ),
    risks: filterVisible(
      mode,
      risks.filter((r) => r.dealId === deal.id),
    ),
    actions: filterVisible(mode, actionsForDeal(deal.id, storedActions, storedPoints)),
    openPoints: filterVisible(mode, liveOf(storedPoints).filter((p) => p.dealId === deal.id)),
    checklist: filterVisible(mode, [
      ...storedChecks.filter((c) => c.dealId === deal.id),
      ...checklist.filter((c) => c.dealId === deal.id),
    ]),
    metrics: filterVisible(
      mode,
      metrics.filter((m) => m.dealId === deal.id),
    ),
    notes: filterVisible(
      mode,
      mergeById(storedNotes, notes).filter((n) => n.dealId === deal.id || n.dealId === null),
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
export function getAttentionItems(mode: MeetingMode, scope?: Scope): AttentionItem[] {
  const scoped = deals.filter((d) => inScope(d.slug, scope));
  const ids = new Set(scoped.map((d) => d.id));
  return collectAttention(
    {
      actions: actions.filter((a) => ids.has(a.dealId)),
      risks: risks.filter((r) => ids.has(r.dealId)),
      deals: scoped,
    },
    mode,
  );
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
export async function getActivity(
  mode: MeetingMode,
  limit = 8,
  scope?: Scope,
): Promise<ActivityEvent[]> {
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
  const events = collectActivity({ decisions: decisionRows, inbox: inboxRows, dealName });
  const scopedId = scope?.onlyDeal
    ? (deals.find((d) => d.slug === scope.onlyDeal)?.id ?? null)
    : null;
  const scoped = scopedId ? events.filter((e) => e.dealId === scopedId) : events;
  return visibleActivity(scoped, mode, limit);
}
