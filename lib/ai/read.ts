import { SEMAPHORE_LABEL } from "../constants";
import { blockersFrom, getPillarViews } from "../data/pillar-view";
import { getDealBundle } from "../data/provider";
import { addAiProposals, listAiProposals, listDecisions, listFileReads, listInbox, markFileReads } from "../data/store";
import { exportDriveText, listAtaTranscriptFiles } from "../drive";
import { formatDate } from "../format";
import type { AiProposal, DealBundle, Decision } from "../types";
import { AI_B_CHARS, clipReading, isUnread, laterStamp, newestUnstamped } from "./corpus";
import { AI_UNCONFIGURED, isOpenRouterConfigured } from "./env";
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
import { blockedBySeen, rememberSeen, seenIndex, type SeenIndex, type SeenProposal } from "./near";
import { askOpenRouter } from "./openrouter";
import { extractJson, parseModelProposals, type ProposalDraft } from "./proposals";
import { gapFolderLabel, selectGapNames, type GapName } from "./scope";
import { insertToast, varreduraFailToast, type WaveCounts } from "./toast-line";

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

function stillDue(names: GapName[], lastReadAt: Map<string, string>, modifiedAt: Map<string, string>) {
  return names.filter((file) => {
    if (!file.driveId) return true;
    return isUnread(lastReadAt.get(file.driveId), modifiedAt.get(file.driveId) || null);
  });
}

type PendingText = {
  driveId: string;
  name: string;
  body: string;
  modifiedAt: string | null;
  exported: boolean;
};

/** Até 4 corpos. Não carimba: last_read_at só depois que a chamada B devolve texto. */
async function loadNewTexts(inboxLast: Map<string, string>) {
  const stamps = await listFileReads();
  const lastReadAt = new Map(inboxLast);
  for (const row of stamps) {
    const prev = lastReadAt.get(row.driveId);
    if (!prev || laterStamp(row.lastReadAt, prev) === row.lastReadAt) lastReadAt.set(row.driveId, row.lastReadAt);
  }
  const listed = await listAtaTranscriptFiles();
  if (!listed.ok) {
    return { files: [] as PendingText[], seen: stamps.length, lastReadAt, modifiedAt: new Map<string, string>() };
  }
  const plan = newestUnstamped(listed.files, lastReadAt);
  const modifiedAt = new Map(listed.files.map((file) => [file.id, file.modifiedAt]));
  const files: PendingText[] = [];
  if (plan.file) {
    const body = await exportDriveText(plan.file);
    files.push({
      driveId: plan.file.id,
      name: plan.file.name,
      body: body ? clipReading(body, AI_B_CHARS) : "não deu para ler o corpo",
      modifiedAt: plan.file.modifiedAt || null,
      exported: Boolean(body),
    });
  }
  return { files, seen: plan.seen, lastReadAt, modifiedAt };
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
 * A, depois B (um arquivo por chamada, até 4) e só então C.
 * Onda vazia segue. Chamada vazia de B segue para o próximo arquivo.
 * Vermelho só se A, B e C falharem. Não publica fato e não lê PDF nem áudio.
 */
export async function readDealProposals(slug: string): Promise<ReadOutcome> {
  if (!isOpenRouterConfigured()) {
    return { configured: false, message: AI_UNCONFIGURED, proposals: [] };
  }

  const bundle = await getDealBundle(slug, "operate");
  if (!bundle) return { configured: true, message: "Deal desconhecido.", proposals: [] };
  const dealId = bundle.deal.id;
  const dealSlug = bundle.deal.slug;

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
  const corpus = await loadNewTexts(inboxLast);
  const namesB = stillDue(
    selectGapNames({
    dealId: bundle.deal.id,
    slug: bundle.deal.slug,
    driveFolderId: bundle.deal.driveFolderId,
    documents: bundle.documents,
    inbox,
    wave: "B",
  }),
    corpus.lastReadAt,
    corpus.modifiedAt,
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
        corpus.lastReadAt,
        corpus.modifiedAt,
      );
  const status = statusBrief(bundle, decisions);
  const fronts = bundle.workstreams.map((item) => item.slug);
  const foldersB = gapFolderLabel(bundle.deal.slug, "B");
  let failPhrase = "";

  async function askWave(
    id: keyof WaveCounts,
    system: string,
    briefText: string,
    files: GapName[],
    stamp?: { driveId: string; driveModifiedAt: string | null },
    json = true,
    store = true,
  ): Promise<{ ok: true; content: string } | { ok: false; message: string }> {
    const brief = withPending(briefText, titlesOf(seen));
    const answer = await askOpenRouter(brief, { system, maxTokens: WAVE_TOKENS, json });
    if (!answer.ok) {
      console.error("[ai] leitura falhou", { slug, wave: id, status: answer.status });
      return { ok: false, message: answer.message };
    }
    if (stamp?.driveId) {
      await markFileReads([{ driveId: stamp.driveId, driveModifiedAt: stamp.driveModifiedAt }]);
    }
    if (!store) return { ok: true, content: answer.content };
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

  let bOk = false;
  let bPhrase = "";
  const fileB = corpus.files[0] ?? null;
  if (fileB) {
    const briefB = gapBrief(
      bundle,
      namesB.filter((item) => item.name === fileB.name),
      foldersB,
      [{ name: fileB.name, body: fileB.body }],
      "Uma ata neste clique.",
    );
    const linked = namesB.filter((item) => item.name === fileB.name);
    const hit = await askWave(
      "B",
      AI_SYSTEM_B,
      briefB,
      linked,
      fileB.exported ? { driveId: fileB.driveId, driveModifiedAt: fileB.modifiedAt } : undefined,
      false,
      false,
    );
    if (!hit.ok) {
      bPhrase = hit.message;
    } else {
      bOk = true;
      const json = extractJson(hit.content);
      const fromModel =
        json && typeof json === "object"
          ? parseModelProposals(hit.content, {
              brief: briefB,
              dealId,
              files: linked.filter((item) => item.inboxId).map((item) => ({ id: item.inboxId, name: item.name })),
              workstreamSlugs: fronts,
              limit: AI_PROPOSAL_CAP,
            })
          : [{ kind: "atencao" as const, payload: { text: fileB.name, title: fileB.name } }];
      const picked = takeNew(fromModel, index);
      skipped += picked.skipped;
      const drafts = picked.kept;
      if (drafts.length) {
        try {
          const rows = await addAiProposals(
            drafts.map((draft) => ({
              dealSlug,
              kind: draft.kind,
              payload: draft.kind === "classificacao" ? { ...draft.payload, dealId } : draft.payload,
            })),
          );
          counts.B += rows.length;
          saved.push(...rows);
          seen.push(
            ...rows.map((row) => ({
              kind: row.kind,
              status: row.status,
              text: row.payload.text,
              title: row.payload.title || "",
            })),
          );
        } catch (err) {
          bOk = false;
          bPhrase = err instanceof Error ? err.message : "Falha ao gravar a fila";
        }
      }
    }
  }
  if (!failPhrase && bPhrase) failPhrase = bPhrase;

  const waveC = await askWave(
    "C",
    radio ? AI_SYSTEM_C_HEALTH : AI_SYSTEM_C_LOOPERT,
    gapBrief(
      bundle,
      namesC,
      gapFolderLabel(bundle.deal.slug, "C"),
      [],
      radio
        ? "Sem corpo de ata. Só os nomes deste recorte e a OPL."
        : "Nomes de Relatorios e Open Point List. Sem corpo de ata.",
    ),
    namesC,
  );
  if (!waveC.ok && !failPhrase) failPhrase = waveC.message;

  const allFailed = !waveA.ok && !waveC.ok && (!fileB || !bOk);
  const inserted = insertToast(saved.length, skipped);
  const toast = allFailed
    ? `${varreduraFailToast(failPhrase || "A IA não devolveu texto.", counts)} · ${inserted}`
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
