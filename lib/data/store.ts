/**
 * Store dinâmico — o que já tem caminho real para o Supabase.
 *
 * Ligado quando NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * existem (createSupabaseAdmin). Em Vercel sem isso, recusa escrita
 * local: produção não pode fingir persistência em .data/.
 *
 * Coleções aqui (já migráveis / já migradas):
 *   inbox_files, decisions, documents extras, checklist extras,
 *   open_points, actions novas, notes novas, ai_proposals.
 *
 * Actions do corte continuam no seed até a primeira gravação: aí viram linha
 * (origin_id) e a cópia só-leitura sai da lista. Notes do corte seguem no seed.
 *
 * Coleções que AINDA NÃO passam por aqui (seed.ts):
 *   deals, risks, milestones, metrics, thesis, prices, …
 *   → ver lib/data/sources.ts
 */
import type {
  ActionItem,
  AiProposal,
  AiProposalKind,
  AiProposalPayload,
  AiProposalStatus,
  Decision,
  DocumentStatus,
  DocumentType,
  InboxFile,
  Note,
  OpenPoint,
} from "../types";
import { forbidLocalStore, isSupabaseConfigured } from "../config";
import { createSupabaseAdmin } from "../supabase/server";
import { decisions as seedDecisions } from "./seed";
import {
  addActionLocal,
  addDecisionLocal,
  addInboxFileLocal,
  updateInboxDriveLocal,
  updateStoredDocumentDriveLocal,
  upsertDriveFolderLocal,
  upsertScannedFileLocal,
  addNoteLocal,
  addOpenPointLocal,
  classifyInboxFileLocal,
  dismissInboxFilesLocal,
  extraChecklistLocal,
  extraDocumentsLocal,
  getDecisionLocal,
  getInboxFileLocal,
  listDecisionsLocal,
  listExtraActionsLocal,
  listExtraNotesLocal,
  listInboxLocal,
  listOpenPointsLocal,
  unclassifiedCountLocal,
  deleteActionLocal,
  deleteNoteLocal,
  deleteOpenPointLocal,
  supersedeActionLocal,
  supersedeOpenPointLocal,
  updateActionLocal,
  updateNoteLocal,
  updateOpenPointLocal,
  getDriveSyncedAtLocal,
  setDriveSyncedAtLocal,
  listAiProposalsLocal,
  getAiProposalLocal,
  addAiProposalsLocal,
  setAiProposalStatusLocal,
} from "./store-local";
import {
  addActionRemote,
  addDecisionRemote,
  addInboxFileRemote,
  updateInboxDriveRemote,
  updateStoredDocumentDriveRemote,
  upsertDriveFolderRemote,
  upsertScannedFileRemote,
  addNoteRemote,
  addOpenPointRemote,
  classifyInboxFileRemote,
  dismissInboxFilesRemote,
  extraChecklistRemote,
  extraDocumentsRemote,
  getDecisionRemote,
  getInboxFileRemote,
  listDecisionsRemote,
  listExtraActionsRemote,
  listExtraNotesRemote,
  listInboxRemote,
  listOpenPointsRemote,
  unclassifiedCountRemote,
  deleteActionRemote,
  deleteNoteRemote,
  deleteOpenPointRemote,
  supersedeActionRemote,
  supersedeOpenPointRemote,
  updateActionRemote,
  updateNoteRemote,
  updateOpenPointRemote,
  listAiProposalsRemote,
  getAiProposalRemote,
  addAiProposalsRemote,
  setAiProposalStatusRemote,
} from "./store-supabase";

function remote() {
  return createSupabaseAdmin();
}

/** Leituras nunca derrubam a tela. Escrita continua falhando alto. */
async function safeRead<T>(kind: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error(`[data] ${kind}: leitura falhou — torre sobe com fallback`, err);
    return fallback;
  }
}

function dropSlug<T extends { slug: string }>(input: T): Omit<T, "slug"> {
  return Object.fromEntries(Object.entries(input).filter(([key]) => key !== "slug")) as Omit<T, "slug">;
}

function refuseLocalWrite(kind: string): never {
  const msg =
    `[data] ${kind}: Supabase não está ligado neste host (precisa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). ` +
    `Em Vercel não usamos .data/store.json.`;
  console.error(msg, {
    configured: isSupabaseConfigured(),
    vercel: process.env.VERCEL ?? null,
    node: process.env.NODE_ENV,
  });
  throw new Error(msg);
}

export async function listInbox(): Promise<InboxFile[]> {
  const sb = remote();
  if (sb) return safeRead("listInbox", () => listInboxRemote(sb), []);
  if (forbidLocalStore()) return [];
  return listInboxLocal();
}

export async function getInboxFile(id: string): Promise<InboxFile | null> {
  const sb = remote();
  if (sb) return safeRead("getInboxFile", () => getInboxFileRemote(sb, id), null);
  if (forbidLocalStore()) return null;
  return getInboxFileLocal(id);
}

export async function addInboxFile(input: {
  name: string;
  driveUrl?: string | null;
  driveId?: string | null;
  folderId?: string | null;
  driveModifiedAt?: string | null;
  source?: "manual" | "drive";
}): Promise<InboxFile> {
  const sb = remote();
  if (sb) return addInboxFileRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addInboxFile");
  return addInboxFileLocal(input);
}

export async function updateInboxDrive(
  driveId: string,
  patch: { name?: string; driveUrl?: string | null; folderId?: string | null; driveModifiedAt?: string | null },
): Promise<InboxFile | null> {
  const sb = remote();
  if (sb) return updateInboxDriveRemote(sb, driveId, patch);
  if (forbidLocalStore()) refuseLocalWrite("updateInboxDrive");
  return updateInboxDriveLocal(driveId, patch);
}

export async function updateStoredDocumentDrive(
  driveId: string,
  patch: { title?: string; driveUrl?: string | null; folderId?: string | null },
): Promise<boolean> {
  const sb = remote();
  if (sb) return updateStoredDocumentDriveRemote(sb, driveId, patch);
  if (forbidLocalStore()) refuseLocalWrite("updateStoredDocumentDrive");
  return updateStoredDocumentDriveLocal(driveId, patch);
}

export async function upsertDriveFolder(input: {
  folderId: string;
  name: string;
  parentId: string | null;
  dealId: string | null;
}): Promise<void> {
  const sb = remote();
  if (sb) return upsertDriveFolderRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("upsertDriveFolder");
  return upsertDriveFolderLocal(input);
}

export async function upsertScannedFile(input: {
  driveId: string;
  name: string;
  folderId: string;
  driveUrl: string | null;
  dealId: string | null;
}): Promise<void> {
  const sb = remote();
  if (sb) return upsertScannedFileRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("upsertScannedFile");
  return upsertScannedFileLocal(input);
}

export async function classifyInboxFile(
  id: string,
  classification: {
    dealId: string;
    type: DocumentType;
    workstreamSlug: string | null;
    status: DocumentStatus;
  },
): Promise<InboxFile | null> {
  const sb = remote();
  if (sb) return classifyInboxFileRemote(sb, id, classification);
  if (forbidLocalStore()) refuseLocalWrite("classifyInboxFile");
  return classifyInboxFileLocal(id, classification);
}

export async function dismissInboxFiles(ids: string[]): Promise<number> {
  const sb = remote();
  if (sb) return dismissInboxFilesRemote(sb, ids);
  if (forbidLocalStore()) refuseLocalWrite("dismissInboxFiles");
  return dismissInboxFilesLocal(ids);
}

export async function extraDocuments() {
  const sb = remote();
  if (sb) return safeRead("extraDocuments", () => extraDocumentsRemote(sb), []);
  if (forbidLocalStore()) return [];
  return extraDocumentsLocal();
}

export async function extraChecklist() {
  const sb = remote();
  if (sb) return safeRead("extraChecklist", () => extraChecklistRemote(sb), []);
  if (forbidLocalStore()) return [];
  return extraChecklistLocal();
}

function seedDecisionList() {
  return [...seedDecisions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function listDecisions(): Promise<Decision[]> {
  const sb = remote();
  if (sb) {
    return safeRead("listDecisions", async () => {
      const rows = await listDecisionsRemote(sb);
      console.info("[data] listDecisions supabase", rows.length);
      return rows;
    }, seedDecisionList());
  }
  if (forbidLocalStore()) {
    console.warn("[data] listDecisions seed only — Supabase ausente em produção");
    return seedDecisionList();
  }
  return listDecisionsLocal();
}

export async function getDecision(id: string): Promise<Decision | null> {
  const sb = remote();
  if (sb) {
    return safeRead(
      "getDecision",
      () => getDecisionRemote(sb, id),
      seedDecisions.find((d) => d.id === id) ?? null,
    );
  }
  if (forbidLocalStore()) return seedDecisions.find((d) => d.id === id) ?? null;
  return getDecisionLocal(id);
}

export async function addDecision(input: Omit<Decision, "id">): Promise<Decision> {
  const sb = remote();
  if (sb) return addDecisionRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addDecision");
  return addDecisionLocal(input);
}

export async function listOpenPoints(): Promise<OpenPoint[]> {
  const sb = remote();
  if (sb) return safeRead("listOpenPoints", () => listOpenPointsRemote(sb), []);
  if (forbidLocalStore()) return [];
  return listOpenPointsLocal();
}

export async function addOpenPoint(
  input: Omit<OpenPoint, "id" | "createdAt" | "updatedAt"> & { slug: string },
): Promise<OpenPoint> {
  const sb = remote();
  if (sb) return addOpenPointRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addOpenPoint");
  return addOpenPointLocal(dropSlug(input));
}

export async function updateOpenPoint(
  id: string,
  patch: Partial<Pick<OpenPoint, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<OpenPoint | null> {
  const sb = remote();
  if (sb) return updateOpenPointRemote(sb, id, patch);
  if (forbidLocalStore()) refuseLocalWrite("updateOpenPoint");
  return updateOpenPointLocal(id, patch);
}

export async function deleteOpenPoint(id: string): Promise<boolean> {
  const sb = remote();
  if (sb) return deleteOpenPointRemote(sb, id);
  if (forbidLocalStore()) refuseLocalWrite("deleteOpenPoint");
  return deleteOpenPointLocal(id);
}

export async function supersedeOpenPoint(id: string): Promise<boolean> {
  const sb = remote();
  if (sb) return supersedeOpenPointRemote(sb, id);
  if (forbidLocalStore()) refuseLocalWrite("supersedeOpenPoint");
  return supersedeOpenPointLocal(id);
}

export async function listExtraActions(): Promise<ActionItem[]> {
  const sb = remote();
  if (sb) return safeRead("listExtraActions", () => listExtraActionsRemote(sb), []);
  if (forbidLocalStore()) return [];
  return listExtraActionsLocal();
}

export async function addAction(input: Omit<ActionItem, "id"> & { slug: string }): Promise<ActionItem> {
  const sb = remote();
  if (sb) return addActionRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addAction");
  return addActionLocal(dropSlug(input));
}

export async function updateAction(
  id: string,
  patch: Partial<Pick<ActionItem, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<ActionItem | null> {
  const sb = remote();
  if (sb) return updateActionRemote(sb, id, patch);
  if (forbidLocalStore()) refuseLocalWrite("updateAction");
  return updateActionLocal(id, patch);
}

export async function deleteAction(id: string): Promise<boolean> {
  const sb = remote();
  if (sb) return deleteActionRemote(sb, id);
  if (forbidLocalStore()) refuseLocalWrite("deleteAction");
  return deleteActionLocal(id);
}

export async function supersedeAction(id: string): Promise<boolean> {
  const sb = remote();
  if (sb) return supersedeActionRemote(sb, id);
  if (forbidLocalStore()) refuseLocalWrite("supersedeAction");
  return supersedeActionLocal(id);
}

export async function listExtraNotes(): Promise<Note[]> {
  const sb = remote();
  if (sb) return safeRead("listExtraNotes", () => listExtraNotesRemote(sb), []);
  if (forbidLocalStore()) return [];
  return listExtraNotesLocal();
}

export async function addNote(input: Omit<Note, "id"> & { slug: string }): Promise<Note> {
  const sb = remote();
  if (sb) return addNoteRemote(sb, input);
  if (forbidLocalStore()) refuseLocalWrite("addNote");
  return addNoteLocal(dropSlug(input));
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, "body" | "visibility">>,
): Promise<Note | null> {
  const sb = remote();
  if (sb) return updateNoteRemote(sb, id, patch);
  if (forbidLocalStore()) refuseLocalWrite("updateNote");
  return updateNoteLocal(id, patch);
}

export async function deleteNote(id: string): Promise<boolean> {
  const sb = remote();
  if (sb) return deleteNoteRemote(sb, id);
  if (forbidLocalStore()) refuseLocalWrite("deleteNote");
  return deleteNoteLocal(id);
}

export async function unclassifiedCount() {
  const sb = remote();
  if (sb) return safeRead("unclassifiedCount", () => unclassifiedCountRemote(sb), 0);
  if (forbidLocalStore()) return 0;
  return unclassifiedCountLocal();
}

/** Hora da última varredura ok. Mora no store local; sem coluna no schema. */
export async function getDriveSyncedAt(): Promise<string | null> {
  return safeRead("getDriveSyncedAt", () => getDriveSyncedAtLocal(), null);
}

export async function setDriveSyncedAt(iso: string): Promise<string> {
  return setDriveSyncedAtLocal(iso);
}

export async function listAiProposals(filter?: {
  dealSlug?: string;
  status?: AiProposalStatus;
}): Promise<AiProposal[]> {
  const sb = remote();
  if (sb) return safeRead("listAiProposals", () => listAiProposalsRemote(sb, filter), []);
  if (forbidLocalStore()) return [];
  return listAiProposalsLocal(filter);
}

export async function getAiProposal(id: string): Promise<AiProposal | null> {
  const sb = remote();
  if (sb) return safeRead("getAiProposal", () => getAiProposalRemote(sb, id), null);
  if (forbidLocalStore()) return null;
  return getAiProposalLocal(id);
}

export async function addAiProposals(
  inputs: { dealSlug: string; kind: AiProposalKind; payload: AiProposalPayload }[],
): Promise<AiProposal[]> {
  const sb = remote();
  if (sb) return addAiProposalsRemote(sb, inputs);
  if (forbidLocalStore()) refuseLocalWrite("addAiProposals");
  return addAiProposalsLocal(inputs);
}

export async function setAiProposalStatus(id: string, status: AiProposalStatus): Promise<AiProposal | null> {
  const sb = remote();
  if (sb) return setAiProposalStatusRemote(sb, id, status);
  if (forbidLocalStore()) refuseLocalWrite("setAiProposalStatus");
  return setAiProposalStatusLocal(id, status);
}
