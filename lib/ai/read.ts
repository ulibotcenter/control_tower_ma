import { SEMAPHORE_LABEL } from "../constants";
import { blockersFrom, getPillarViews } from "../data/pillar-view";
import { getDealBundle } from "../data/provider";
import { addAiProposals, listAiProposals, listDecisions, listInbox } from "../data/store";
import { formatDate } from "../format";
import type { AiProposal, DealBundle, Decision } from "../types";
import { AI_UNCONFIGURED, isOpenRouterConfigured } from "./env";
import {
  AI_PROPOSAL_CAP,
  AI_SYSTEM_A,
  AI_SYSTEM_B,
  AI_SYSTEM_C_HEALTH,
  AI_SYSTEM_C_LOOPERT,
  buildGapBrief,
  buildRadioCloseBrief,
  buildStatusBrief,
  slot,
  todayLabel,
  withPending,
  type StatusRow,
} from "./context";
import { isNearAny } from "./near";
import { askOpenRouter } from "./openrouter";
import { parseModelProposals, type ProposalDraft } from "./proposals";
import { gapFolderLabel, selectGapNames, type GapName } from "./scope";
import { varreduraFailToast, varreduraToast, type WaveCounts } from "./toast-line";

export type ReadOutcome = {
  configured: boolean;
  message?: string;
  proposals: AiProposal[];
  waves?: WaveCounts;
  toast?: string;
  failed?: boolean;
};

const WAVE_TOKENS = 4000;

function lightOf(tone: string) {
  const label = SEMAPHORE_LABEL[tone];
  return label ? `${tone} (${label})` : tone;
}

function pointRow(row: { title: string; owner: string; due: string; pillarSlug?: string | null; status: string }): StatusRow {
  return {
    title: row.title,
    owner: row.owner,
    due: row.due ? formatDate(row.due) : "",
    pillar: row.pillarSlug ?? "",
    status: row.status,
  };
}

function statusBrief(bundle: DealBundle, decisions: Decision[]) {
  const openPoints = bundle.openPoints.filter((point) => point.status !== "resolvido").map(pointRow);
  const tasks = bundle.actions.filter((task) => task.status === "open" || task.status === "late").map(pointRow);
  const recent = decisions
    .filter((decision) => decision.dealId === bundle.deal.id || decision.dealId === null)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);
  return buildStatusBrief({
    today: todayLabel(),
    name: bundle.deal.name,
    slug: bundle.deal.slug,
    headline: bundle.deal.headline,
    health: bundle.deal.health,
    healthReason: bundle.deal.healthReason,
    fronts: bundle.workstreams.map((item) =>
      [item.slug, lightOf(item.health), slot(item.summary)].filter(Boolean).join(" | "),
    ),
    pillars: getPillarViews(bundle).map((view) => `${view.slug} | ${lightOf(view.health)}`),
    blockers: blockersFrom(bundle.risks, bundle.checklist, 8, bundle.actions).map((item) => item.line),
    openPoints,
    tasks,
    risks: bundle.risks.map((risk) => ({ title: risk.title, severity: risk.severity })),
    decisions: recent.map((decision) => ({
      date: formatDate(decision.date),
      who: decision.whoLabel,
      text: decision.decisionTaken,
    })),
  });
}

function gapBrief(bundle: DealBundle, names: GapName[], folders: string, note?: string) {
  return buildGapBrief({
    today: todayLabel(),
    name: bundle.deal.name,
    slug: bundle.deal.slug,
    folders,
    names: names.map((file) => file.name),
    openPointTitles: bundle.openPoints.filter((point) => point.status !== "resolvido").map((point) => point.title),
    note,
  });
}

function freshDrafts(drafts: ProposalDraft[], prior: string[]) {
  const seen = [...prior];
  const out: ProposalDraft[] = [];
  for (const draft of drafts) {
    const text = [draft.payload.text, draft.payload.title].filter(Boolean).join(" ");
    if (isNearAny(text, seen)) continue;
    out.push(draft);
    seen.push(text);
  }
  return out;
}

/**
 * Três ondas na mesma fila. Onda vazia segue. Falha da API para e devolve o que já gravou.
 * Não publica fato e não lê PDF nem áudio.
 */
export async function readDealProposals(slug: string): Promise<ReadOutcome> {
  if (!isOpenRouterConfigured()) {
    return { configured: false, message: AI_UNCONFIGURED, proposals: [] };
  }

  const bundle = await getDealBundle(slug, "operate");
  if (!bundle) return { configured: true, message: "Deal desconhecido.", proposals: [] };

  const [decisions, inbox, pending] = await Promise.all([
    listDecisions(),
    listInbox(),
    listAiProposals({ status: "pendente", dealSlug: bundle.deal.slug }),
  ]);

  const prior = pending.map((row) => [row.payload.text, row.payload.title].filter(Boolean).join(" "));
  const counts: WaveCounts = { A: 0, B: 0, C: 0 };
  const saved: AiProposal[] = [];
  const namesB = selectGapNames({
    dealId: bundle.deal.id,
    slug: bundle.deal.slug,
    driveFolderId: bundle.deal.driveFolderId,
    documents: bundle.documents,
    inbox,
    wave: "B",
  });
  const radio = bundle.deal.slug === "radio-health";
  const namesC = radio
    ? namesB
    : selectGapNames({
        dealId: bundle.deal.id,
        slug: bundle.deal.slug,
        driveFolderId: bundle.deal.driveFolderId,
        documents: bundle.documents,
        inbox,
        wave: "C",
        skipNames: namesB.map((file) => file.name),
      });
  const status = statusBrief(bundle, decisions);
  const gapB = gapBrief(bundle, namesB, gapFolderLabel(bundle.deal.slug, "B"));
  const waves: { id: keyof WaveCounts; system: string; brief: string; files: GapName[] }[] = [
    { id: "A", system: AI_SYSTEM_A, brief: status, files: [] },
    { id: "B", system: AI_SYSTEM_B, brief: gapB, files: namesB },
    radio
      ? {
          id: "C",
          system: AI_SYSTEM_C_HEALTH,
          brief: buildRadioCloseBrief(status, gapB),
          files: namesB,
        }
      : {
          id: "C",
          system: AI_SYSTEM_C_LOOPERT,
          brief: gapBrief(
            bundle,
            namesC,
            gapFolderLabel(bundle.deal.slug, "C"),
            "Nomes de Relatorios e Open Point List que não entraram na lista de Ata, Transcricoes e Doctos.",
          ),
          files: namesC,
        },
  ];
  const fronts = bundle.workstreams.map((item) => item.slug);

  for (const wave of waves) {
    const brief = withPending(wave.brief, prior);
    const answer = await askOpenRouter(brief, { system: wave.system, maxTokens: WAVE_TOKENS });
    if (!answer.ok) {
      console.error("[ai] leitura falhou", { slug, wave: wave.id, status: answer.status });
      return {
        configured: true,
        failed: true,
        message: answer.message,
        proposals: saved,
        waves: counts,
        toast: varreduraFailToast(answer.message, counts),
      };
    }
    const drafts = freshDrafts(
      parseModelProposals(answer.content, {
        brief,
        dealId: bundle.deal.id,
        files: wave.files.filter((file) => file.inboxId).map((file) => ({ id: file.inboxId, name: file.name })),
        workstreamSlugs: fronts,
        limit: AI_PROPOSAL_CAP,
      }),
      prior,
    );
    if (!drafts.length) continue;
    try {
      const rows = await addAiProposals(
        drafts.map((draft) => ({
          dealSlug: bundle.deal.slug,
          kind: draft.kind,
          payload: draft.kind === "classificacao" ? { ...draft.payload, dealId: bundle.deal.id } : draft.payload,
        })),
      );
      counts[wave.id] = rows.length;
      saved.push(...rows);
      prior.push(...rows.map((row) => [row.payload.text, row.payload.title].filter(Boolean).join(" ")));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao gravar a fila";
      console.error("[ai] fila falhou", { slug, wave: wave.id });
      return {
        configured: true,
        failed: true,
        message,
        proposals: saved,
        waves: counts,
        toast: varreduraFailToast(message, counts),
      };
    }
  }

  const toast = varreduraToast(counts);
  return { configured: true, message: toast, proposals: saved, waves: counts, toast };
}
