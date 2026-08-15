import { CORTE } from "../constants";
import { isDriveConfigured, isResendConfigured, isSupabaseConfigured } from "../config";
import type { DealBundle, MeetingMode, ProgramView } from "../types";
import { canSeeInbox, filterVisible } from "../visibility";
import {
  actions,
  boardCard,
  capFor,
  checklist,
  deals,
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
import { extraChecklist, extraDocuments, unclassifiedCount } from "./store";

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
