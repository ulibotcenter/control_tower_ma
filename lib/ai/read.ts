import { SEMAPHORE_LABEL } from "../constants";
import { blockersFrom, getPillarViews } from "../data/pillar-view";
import { getDealBundle } from "../data/provider";
import { addAiProposals, listAiProposals, listDecisions, listDocTextBodies, listFileReads, listInbox } from "../data/store";
import { formatDate } from "../format";
import type { AiProposal, DealBundle, Decision } from "../types";
import { isUnread, laterStamp } from "./corpus";
import { AI_UNCONFIGURED, isOpenRouterConfigured } from "./env";
import { pickReadingExcerpts, type ReadingExcerpt } from "./excerpts";
import {
  AI_PROPOSAL_CAP,
  AI_SYSTEM_A,
  AI_SYSTEM_B,
  AI_SYSTEM_C_HEALTH,
  AI_SYSTEM_C_LOOPERT,
  buildGapBrief,
  buildStatusBrief,
  slot,
  todayLabel,
  withPending,
  type StatusRow,
} from "./context";
import { blockedBySeen, foldProposalText, rememberSeen, seenIndex, type SeenIndex, type SeenProposal } from "./near";
import { askOpenRouter } from "./openrouter";
import { parseModelProposals, type ProposalDraft } from "./proposals";
import { gapFolderLabel, selectGapNames, type GapName } from "./scope";
import { EMPTY_MEMORY_TOAST, insertToast, varreduraFailToast, withMemoriaTrechos, type WaveCounts } from "./toast-line";

export type ReadOutcome = {
  configured: boolean;
  message?: string;
  proposals: AiProposal[];
  waves?: WaveCounts;
  toast?: string;
  failed?: boolean;
};

const WAVE_TOKENS = 4000;
const WAVE_NEW = 5;

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

function statusBrief(bundle: DealBundle, decisions: Decision[], excerpts: ReadingExcerpt[]) {
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
    excerpts,
  });
}

function gapBrief(
  bundle: DealBundle,
  names: GapName[],
  folders: string,
  texts: { name: string; body: string }[],
  note?: string,
) {
  return buildGapBrief({
    today: todayLabel(),
    name: bundle.deal.name,
    slug: bundle.deal.slug,
    folders,
    names: names.map((file) => file.name),
    openPointTitles: bundle.openPoints.filter((point) => point.status !== "resolvido").map((point) => point.title),
    texts,
    note,
  });
}

function namesWithExcerpts(names: GapName[], excerpts: ReadingExcerpt[]): GapName[] {
  const seen = new Set(names.map((item) => foldProposalText(item.name)));
  const extra: GapName[] = [];
  for (const item of excerpts) {
    const key = foldProposalText(item.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    extra.push({ name: item.name, inboxId: "", driveId: "" });
  }
  return [...extra, ...names];
}

function stillDue(names: GapName[], lastReadAt: Map<string, string>, modifiedAt: Map<string, string>) {
  return names.filter((file) => {
    if (!file.driveId) return true;
    return isUnread(lastReadAt.get(file.driveId), modifiedAt.get(file.driveId) || null);
  });
}

/** Carimbo já gravado. Não lista o Drive e não exporta arquivo. */
async function readStamps(inboxLast: Map<string, string>) {
  const stamps = await listFileReads();
  const lastReadAt = new Map(inboxLast);
  for (const row of stamps) {
    const prev = lastReadAt.get(row.driveId);
    if (!prev || laterStamp(row.lastReadAt, prev) === row.lastReadAt) lastReadAt.set(row.driveId, row.lastReadAt);
  }
  return lastReadAt;
}

function titlesOf(rows: SeenProposal[]) {
  const out: string[] = [];
  const used = new Set<string>();
  for (const row of rows) {
    const title = (row.title || row.text).replace(/\s+/g, " ").trim();
    const key = title.toLowerCase();
    if (!title || used.has(key)) continue;
    used.add(key);
    out.push(title);
    if (out.length >= 40) break;
  }
  return out;
}

function takeNew(drafts: ProposalDraft[], index: SeenIndex) {
  const kept: ProposalDraft[] = [];
  let skipped = 0;
  for (const draft of drafts) {
    const row = { kind: draft.kind, text: draft.payload.text, title: draft.payload.title };
    if (blockedBySeen(row, index)) {
      skipped += 1;
      continue;
    }
    if (kept.length >= WAVE_NEW) break;
    kept.push(draft);
    rememberSeen(index, row);
  }
  return { kept, skipped };
}

/**
 * A, depois B, depois C. Cada onda leva a OPL e até 5 trechos de doc_text.
 * Memória vazia não chama o modelo. Vermelho só se A, B e C falharem.
 * Não publica fato, não exporta arquivo, não lê áudio nem PDF cru.
 */
export async function readDealProposals(slug: string): Promise<ReadOutcome> {
  const bundle = await getDealBundle(slug, "operate");
  if (!bundle) return { configured: true, message: "Deal desconhecido.", proposals: [] };
  const memory = await listDocTextBodies();
  const excerpts = pickReadingExcerpts(memory, bundle.deal.slug);
  const modifiedAt = new Map(
    memory.flatMap((row) => (row.driveId && row.driveModifiedAt ? [[row.driveId, row.driveModifiedAt] as const] : [])),
  );
  if (!excerpts.length) {
    return { configured: true, message: EMPTY_MEMORY_TOAST, toast: EMPTY_MEMORY_TOAST, proposals: [] };
  }
  if (!isOpenRouterConfigured()) {
    return { configured: false, message: AI_UNCONFIGURED, proposals: [] };
  }

  const dealId = bundle.deal.id;
  const dealSlug = bundle.deal.slug;
  const readingAt = new Date().toISOString();

  const [decisions, inbox, history] = await Promise.all([
    listDecisions(),
    listInbox(),
    listAiProposals({ dealSlug: bundle.deal.slug }),
  ]);

  const seen: SeenProposal[] = history.map((row) => ({
    kind: row.kind,
    status: row.status,
    text: row.payload.text,
    title: row.payload.title || "",
  }));
  const index = seenIndex(seen);
  let skipped = 0;
  const counts: WaveCounts = { A: 0, B: 0, C: 0 };
  const saved: AiProposal[] = [];
  const inboxLast = new Map<string, string>();
  for (const file of inbox) {
    if (file.driveId && file.lastReadAt) inboxLast.set(file.driveId, file.lastReadAt);
  }
  const lastReadAt = await readStamps(inboxLast);
  const namesB = stillDue(
    selectGapNames({
      dealId: bundle.deal.id,
      slug: bundle.deal.slug,
      driveFolderId: bundle.deal.driveFolderId,
      documents: bundle.documents,
      inbox,
      wave: "B",
    }),
    lastReadAt,
    modifiedAt,
  );
  const radio = bundle.deal.slug === "radio-health";
  const namesC = radio
    ? namesB
    : stillDue(
        selectGapNames({
          dealId: bundle.deal.id,
          slug: bundle.deal.slug,
          driveFolderId: bundle.deal.driveFolderId,
          documents: bundle.documents,
          inbox,
          wave: "C",
          skipNames: namesB.map((file) => file.name),
        }),
        lastReadAt,
        modifiedAt,
      );
  const status = statusBrief(bundle, decisions, excerpts);
  const fronts = bundle.workstreams.map((item) => item.slug);
  const foldersB = gapFolderLabel(bundle.deal.slug, "B");
  let failPhrase = "";

  async function askWave(
    id: keyof WaveCounts,
    system: string,
    briefText: string,
    files: GapName[],
  ): Promise<{ ok: true; content: string } | { ok: false; message: string }> {
    const brief = withPending(briefText, titlesOf(seen));
    const answer = await askOpenRouter(brief, { system, maxTokens: WAVE_TOKENS, json: true });
    if (!answer.ok) {
      console.error("[ai] leitura falhou", { slug, wave: id, status: answer.status });
      return { ok: false, message: answer.message };
    }
    const picked = takeNew(
      parseModelProposals(answer.content, {
        brief,
        dealId,
        files: files.filter((file) => file.inboxId).map((file) => ({ id: file.inboxId, name: file.name })),
        workstreamSlugs: fronts,
        limit: AI_PROPOSAL_CAP,
      }),
      index,
    );
    skipped += picked.skipped;
    const drafts = picked.kept;
    if (!drafts.length) return { ok: true, content: answer.content };
    try {
      const rows = await addAiProposals(
        drafts.map((draft) => ({
          dealSlug,
          kind: draft.kind,
          payload: draft.kind === "classificacao" ? { ...draft.payload, dealId } : draft.payload,
        })),
        readingAt,
      );
      counts[id] += rows.length;
      saved.push(...rows);
      seen.push(
        ...rows.map((row) => ({
          kind: row.kind,
          status: row.status,
          text: row.payload.text,
          title: row.payload.title || "",
        })),
      );
      return { ok: true, content: answer.content };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao gravar a fila";
      console.error("[ai] fila falhou", { slug, wave: id });
      return { ok: false, message };
    }
  }

  const waveA = await askWave("A", AI_SYSTEM_A, status, []);
  if (!waveA.ok) failPhrase = waveA.message;

  const namesForB = namesWithExcerpts(namesB, excerpts);
  const waveB = await askWave(
    "B",
    AI_SYSTEM_B,
    gapBrief(bundle, namesForB, foldersB, excerpts, "Até 5 trechos da memória e a OPL."),
    namesForB,
  );
  if (!waveB.ok && !failPhrase) failPhrase = waveB.message;

  const waveC = await askWave(
    "C",
    radio ? AI_SYSTEM_C_HEALTH : AI_SYSTEM_C_LOOPERT,
    gapBrief(
      bundle,
      namesC,
      gapFolderLabel(bundle.deal.slug, "C"),
      excerpts,
      radio
        ? "Trechos da memória, os nomes deste recorte e a OPL."
        : "Trechos da memória. Nomes de Relatorios e Open Point List.",
    ),
    namesC,
  );
  if (!waveC.ok && !failPhrase) failPhrase = waveC.message;

  const allFailed = !waveA.ok && !waveB.ok && !waveC.ok;
  const inserted = withMemoriaTrechos(insertToast(saved.length, skipped), excerpts.length);
  const toast = allFailed
    ? withMemoriaTrechos(
        `${varreduraFailToast(failPhrase || "A IA não devolveu texto.", counts)} · ${insertToast(saved.length, skipped)}`,
        excerpts.length,
      )
    : inserted;
  return {
    configured: true,
    failed: allFailed,
    message: allFailed ? failPhrase || toast : toast,
    proposals: saved,
    waves: counts,
    toast,
  };
}
