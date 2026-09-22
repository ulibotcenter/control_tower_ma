import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ActionItem,
  AiProposal,
  AiProposalKind,
  AiProposalPayload,
  AiProposalStatus,
  ChecklistItem,
  Decision,
  DocumentStatus,
  DocumentType,
  DriveDocument,
  InboxFile,
  Note,
  OpenPoint,
} from "../types";
import { folderUrl } from "../constants";
import { sanitizeDriveUrl } from "../http";
import { decisions as seedDecisions, inboxSeed } from "./seed";
import { SCAN_FOLDER_NOTE, scanFileDocId, scanFolderDocId } from "./doc-groups";
import { checklistFromInbox, documentFromInbox } from "./store-map";

type Store = {
  inbox: InboxFile[];
  decisions: Decision[];
  documents: DriveDocument[];
  checklist: ChecklistItem[];
  /** Itens novos. O seed de actions/notes continua sendo a base, fora daqui. */
  openPoints: OpenPoint[];
  actions: ActionItem[];
  notes: Note[];
  /** Última varredura do Drive que devolveu ok. ISO. */
  driveSyncedAt: string | null;
  /** Fila de propostas. A IA não grava fato aqui. */
  proposals: AiProposal[];
};

const defaultStore = (): Store => ({
  inbox: [...inboxSeed],
  decisions: [...seedDecisions],
  documents: [],
  checklist: [],
  openPoints: [],
  actions: [],
  notes: [],
  driveSyncedAt: null,
  proposals: [],
});

const filePath = path.join(process.cwd(), ".data", "store.json");

async function writeStore(store: Store) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Vercel / serverless sem disco gravável.
  }
}

let memory = defaultStore();

async function load(): Promise<Store> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Store;
    memory = {
      inbox: parsed.inbox ?? [],
      decisions: parsed.decisions?.length ? parsed.decisions : [...seedDecisions],
      documents: parsed.documents ?? [],
      checklist: parsed.checklist ?? [],
      openPoints: parsed.openPoints ?? [],
      actions: parsed.actions ?? [],
      notes: parsed.notes ?? [],
      driveSyncedAt: parsed.driveSyncedAt ?? null,
      proposals: parsed.proposals ?? [],
    };
    return memory;
  } catch {
    return memory;
  }
}

export async function listInboxLocal(): Promise<InboxFile[]> {
  const s = await load();
  return [...s.inbox].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

export async function getInboxFileLocal(id: string): Promise<InboxFile | null> {
  const s = await load();
  return s.inbox.find((f) => f.id === id) ?? null;
}

export async function addInboxFileLocal(input: {
  name: string;
  driveUrl?: string | null;
  driveId?: string | null;
  folderId?: string | null;
  driveModifiedAt?: string | null;
  source?: "manual" | "drive";
}): Promise<InboxFile> {
  const s = await load();
  const driveId = input.driveId?.trim() || null;
  if (driveId) {
    const existing = s.inbox.find((file) => file.driveId === driveId);
    if (existing) return existing;
  }
  const file: InboxFile = {
    id: randomUUID(),
    name: input.name.trim(),
    source: input.source ?? "manual",
    driveUrl: sanitizeDriveUrl(input.driveUrl),
    driveId,
    folderId: input.folderId?.trim() || null,
    driveModifiedAt: input.driveModifiedAt || null,
    receivedAt: new Date().toISOString(),
    classified: false,
  };
  s.inbox.unshift(file);
  memory = s;
  await writeStore(s);
  return file;
}

/** Atualiza nome/link/hora. Não classifica e não conclui checklist. */
export async function updateInboxDriveLocal(
  driveId: string,
  patch: { name?: string; driveUrl?: string | null; folderId?: string | null; driveModifiedAt?: string | null },
): Promise<InboxFile | null> {
  const s = await load();
  const file = s.inbox.find((item) => item.driveId === driveId);
  if (!file) return null;
  if (patch.name != null) file.name = patch.name.trim();
  if (patch.driveUrl !== undefined) file.driveUrl = sanitizeDriveUrl(patch.driveUrl);
  if (patch.folderId !== undefined) file.folderId = patch.folderId?.trim() || null;
  if (patch.driveModifiedAt !== undefined) file.driveModifiedAt = patch.driveModifiedAt;
  if (patch.name != null || patch.driveUrl !== undefined || patch.folderId !== undefined) {
    for (const doc of s.documents) {
      if (doc.driveId !== driveId) continue;
      if (patch.name != null) doc.title = patch.name.trim();
      if (patch.driveUrl !== undefined) doc.driveUrl = file.driveUrl || "";
      if (patch.folderId !== undefined && !doc.folderId) doc.folderId = file.folderId ?? null;
    }
    const checklistId = `inbox-${file.id}`;
    for (const item of s.checklist) {
      if (item.documentId !== checklistId) continue;
      if (patch.name != null) item.title = patch.name.trim();
      if (patch.driveUrl !== undefined) item.driveUrl = file.driveUrl;
    }
  }
  memory = s;
  await writeStore(s);
  return file;
}

export async function updateStoredDocumentDriveLocal(
  driveId: string,
  patch: { title?: string; driveUrl?: string | null; folderId?: string | null },
): Promise<boolean> {
  const s = await load();
  let hit = false;
  for (const doc of s.documents) {
    if (doc.driveId !== driveId) continue;
    hit = true;
    if (patch.title != null) doc.title = patch.title.trim();
    if (patch.driveUrl !== undefined) doc.driveUrl = sanitizeDriveUrl(patch.driveUrl) || "";
    if (patch.folderId !== undefined && !doc.folderId) doc.folderId = patch.folderId;
  }
  if (!hit) return false;
  memory = s;
  await writeStore(s);
  return true;
}

export async function classifyInboxFileLocal(
  id: string,
  classification: {
    dealId: string;
    type: DocumentType;
    workstreamSlug: string | null;
    status: DocumentStatus;
  },
): Promise<InboxFile | null> {
  const s = await load();
  const file = s.inbox.find((f) => f.id === id);
  if (!file) return null;
  file.classified = true;
  file.classification = classification;
  const doc = documentFromInbox(file);
  if (doc) s.documents = [doc, ...s.documents.filter((d) => d.id !== doc.id)];
  const ck = checklistFromInbox(file);
  if (ck) s.checklist = [ck, ...s.checklist.filter((c) => c.id !== ck.id)];
  memory = s;
  await writeStore(s);
  return file;
}

/** Marca a lista visível como dispensada. Não apaga e não cria documento. */
export async function dismissInboxFilesLocal(ids: string[]): Promise<number> {
  const s = await load();
  const want = new Set(ids.filter(Boolean));
  let count = 0;
  for (const file of s.inbox) {
    if (!want.has(file.id) || file.classified || file.dismissed) continue;
    file.dismissed = true;
    count += 1;
  }
  if (count) {
    memory = s;
    await writeStore(s);
  }
  return count;
}

/** Pasta lida na varredura. O id estável não entra na conta do pilar. */
export async function upsertDriveFolderLocal(input: {
  folderId: string;
  name: string;
  parentId: string | null;
  dealId: string | null;
}): Promise<void> {
  const s = await load();
  const id = scanFolderDocId(input.folderId);
  const parentId = input.parentId && input.parentId !== input.folderId ? input.parentId : input.folderId;
  const existing = s.documents.find((doc) => doc.id === id);
  if (existing) {
    existing.title = input.name.trim();
    existing.driveUrl = folderUrl(input.folderId);
    existing.folderId = parentId;
    existing.dealId = input.dealId;
    existing.note = SCAN_FOLDER_NOTE;
  } else {
    s.documents.unshift({
      id,
      dealId: input.dealId,
      title: input.name.trim(),
      driveUrl: folderUrl(input.folderId),
      driveId: null,
      folderId: parentId,
      type: "outro",
      workstreamSlug: null,
      status: "vigente",
      classified: true,
      note: SCAN_FOLDER_NOTE,
      visibility: "advisors",
      sensitivities: [],
    });
  }
  memory = s;
  await writeStore(s);
}

/** drive_id já conhecido (seed): não cria bandeja; guarda pasta-pai para o finder. */
export async function upsertScannedFileLocal(input: {
  driveId: string;
  name: string;
  folderId: string;
  driveUrl: string | null;
  dealId: string | null;
}): Promise<void> {
  const s = await load();
  const driveId = input.driveId.trim();
  const existing = s.documents.find((doc) => doc.driveId === driveId);
  if (existing) {
    existing.title = input.name.trim() || existing.title;
    existing.folderId = input.folderId;
    if (input.driveUrl) existing.driveUrl = sanitizeDriveUrl(input.driveUrl) || existing.driveUrl;
    memory = s;
    await writeStore(s);
    return;
  }
  s.documents.unshift({
    id: scanFileDocId(driveId),
    dealId: input.dealId,
    title: input.name.trim(),
    driveUrl: sanitizeDriveUrl(input.driveUrl) || "",
    driveId,
    folderId: input.folderId,
    type: "outro",
    workstreamSlug: null,
    status: "vigente",
    classified: true,
    visibility: "advisors",
    sensitivities: [],
  });
  memory = s;
  await writeStore(s);
}

export async function extraChecklistLocal(): Promise<ChecklistItem[]> {
  const s = await load();
  const fromInbox = s.inbox
    .map(checklistFromInbox)
    .filter((c): c is ChecklistItem => Boolean(c));
  const seen = new Set(fromInbox.map((c) => c.documentId));
  return [...fromInbox, ...s.checklist.filter((c) => !seen.has(c.documentId))];
}

export async function extraDocumentsLocal(): Promise<DriveDocument[]> {
  const s = await load();
  const fromInbox = s.inbox
    .map(documentFromInbox)
    .filter((d): d is DriveDocument => Boolean(d));
  const seen = new Set(fromInbox.map((d) => d.id));
  return [...fromInbox, ...s.documents.filter((d) => !seen.has(d.id))];
}

export async function listDecisionsLocal(): Promise<Decision[]> {
  const s = await load();
  return [...s.decisions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getDecisionLocal(id: string): Promise<Decision | null> {
  const s = await load();
  return s.decisions.find((d) => d.id === id) ?? null;
}

export async function addDecisionLocal(input: Omit<Decision, "id">): Promise<Decision> {
  const s = await load();
  const row: Decision = { ...input, id: randomUUID() };
  s.decisions.unshift(row);
  memory = s;
  await writeStore(s);
  return row;
}

export async function unclassifiedCountLocal() {
  const s = await load();
  return s.inbox.filter((f) => !f.classified && !f.dismissed).length;
}

export async function listOpenPointsLocal(): Promise<OpenPoint[]> {
  const s = await load();
  return [...s.openPoints];
}

export async function addOpenPointLocal(
  input: Omit<OpenPoint, "id" | "createdAt" | "updatedAt">,
): Promise<OpenPoint> {
  const s = await load();
  const now = new Date().toISOString();
  const row: OpenPoint = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    originId: input.originId,
    superseded: input.superseded ?? false,
  };
  s.openPoints.unshift(row);
  memory = s;
  await writeStore(s);
  return row;
}

export async function updateOpenPointLocal(
  id: string,
  patch: Partial<Pick<OpenPoint, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<OpenPoint | null> {
  const s = await load();
  const row = s.openPoints.find((item) => item.id === id);
  if (!row) return null;
  if (patch.title != null) row.title = patch.title;
  if (patch.owner != null) row.owner = patch.owner;
  if (patch.due != null) row.due = patch.due;
  if (patch.pillarSlug !== undefined) row.pillarSlug = patch.pillarSlug;
  if (patch.status) row.status = patch.status;
  if (patch.visibility) row.visibility = patch.visibility;
  row.updatedAt = new Date().toISOString();
  memory = s;
  await writeStore(s);
  return row;
}

export async function supersedeOpenPointLocal(id: string): Promise<boolean> {
  const s = await load();
  const row = s.openPoints.find((item) => item.id === id);
  if (!row) return false;
  row.superseded = true;
  row.updatedAt = new Date().toISOString();
  memory = s;
  await writeStore(s);
  return true;
}

export async function deleteOpenPointLocal(id: string): Promise<boolean> {
  const s = await load();
  const next = s.openPoints.filter((item) => item.id !== id);
  if (next.length === s.openPoints.length) return false;
  s.openPoints = next;
  memory = s;
  await writeStore(s);
  return true;
}

export async function listExtraActionsLocal(): Promise<ActionItem[]> {
  const s = await load();
  return [...s.actions];
}

export async function addActionLocal(input: Omit<ActionItem, "id">): Promise<ActionItem> {
  const s = await load();
  const row: ActionItem = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    originId: input.originId,
    superseded: input.superseded ?? false,
  };
  s.actions.unshift(row);
  memory = s;
  await writeStore(s);
  return row;
}

export async function updateActionLocal(
  id: string,
  patch: Partial<Pick<ActionItem, "title" | "owner" | "due" | "pillarSlug" | "status" | "visibility">>,
): Promise<ActionItem | null> {
  const s = await load();
  const row = s.actions.find((item) => item.id === id);
  if (!row) return null;
  if (patch.title != null) row.title = patch.title;
  if (patch.owner != null) row.owner = patch.owner;
  if (patch.due != null) row.due = patch.due;
  if (patch.pillarSlug !== undefined) row.pillarSlug = patch.pillarSlug;
  if (patch.status) row.status = patch.status;
  if (patch.visibility) row.visibility = patch.visibility;
  memory = s;
  await writeStore(s);
  return row;
}

export async function supersedeActionLocal(id: string): Promise<boolean> {
  const s = await load();
  const row = s.actions.find((item) => item.id === id);
  if (!row) return false;
  row.superseded = true;
  memory = s;
  await writeStore(s);
  return true;
}

export async function deleteActionLocal(id: string): Promise<boolean> {
  const s = await load();
  const next = s.actions.filter((item) => item.id !== id);
  if (next.length === s.actions.length) return false;
  s.actions = next;
  memory = s;
  await writeStore(s);
  return true;
}

export async function listExtraNotesLocal(): Promise<Note[]> {
  const s = await load();
  return [...s.notes];
}

export async function addNoteLocal(input: Omit<Note, "id">): Promise<Note> {
  const s = await load();
  const row: Note = { ...input, id: randomUUID() };
  s.notes.unshift(row);
  memory = s;
  await writeStore(s);
  return row;
}

export async function updateNoteLocal(
  id: string,
  patch: Partial<Pick<Note, "body" | "visibility">>,
): Promise<Note | null> {
  const s = await load();
  const row = s.notes.find((item) => item.id === id);
  if (!row) return null;
  if (patch.body != null) row.body = patch.body;
  if (patch.visibility) row.visibility = patch.visibility;
  memory = s;
  await writeStore(s);
  return row;
}

export async function deleteNoteLocal(id: string): Promise<boolean> {
  const s = await load();
  const next = s.notes.filter((item) => item.id !== id);
  if (next.length === s.notes.length) return false;
  s.notes = next;
  memory = s;
  await writeStore(s);
  return true;
}

export async function getDriveSyncedAtLocal(): Promise<string | null> {
  const s = await load();
  return s.driveSyncedAt;
}

export async function setDriveSyncedAtLocal(iso: string): Promise<string> {
  const s = await load();
  s.driveSyncedAt = iso;
  memory = s;
  await writeStore(s);
  return iso;
}

const PROPOSAL_STATUSES: AiProposalStatus[] = ["pendente", "aceita", "descartada", "editada"];

function asProposal(row: AiProposal | null | undefined): AiProposal | null {
  if (!row?.id || !row.dealSlug || !row.kind || !row.payload || !row.status) return null;
  if (!PROPOSAL_STATUSES.includes(row.status)) return null;
  return row;
}

export async function listAiProposalsLocal(filter?: {
  dealSlug?: string;
  status?: AiProposalStatus;
}): Promise<AiProposal[]> {
  const s = await load();
  return [...(s.proposals ?? [])]
    .filter((row) => asProposal(row))
    .filter((row) => (filter?.dealSlug ? row.dealSlug === filter.dealSlug : true))
    .filter((row) => (filter?.status ? row.status === filter.status : true))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getAiProposalLocal(id: string): Promise<AiProposal | null> {
  const s = await load();
  return asProposal((s.proposals ?? []).find((row) => row.id === id) ?? null);
}

export async function addAiProposalsLocal(
  inputs: { dealSlug: string; kind: AiProposalKind; payload: AiProposalPayload }[],
): Promise<AiProposal[]> {
  const s = await load();
  const now = new Date().toISOString();
  const rows: AiProposal[] = inputs.map((input) => ({
    id: randomUUID(),
    dealSlug: input.dealSlug,
    kind: input.kind,
    payload: input.payload,
    status: "pendente",
    createdAt: now,
  }));
  s.proposals = [...rows, ...(s.proposals ?? [])];
  memory = s;
  await writeStore(s);
  return rows;
}

export async function setAiProposalStatusLocal(id: string, status: AiProposalStatus): Promise<AiProposal | null> {
  const s = await load();
  const row = (s.proposals ?? []).find((item) => item.id === id);
  if (!row || row.status !== "pendente") return null;
  row.status = status;
  memory = s;
  await writeStore(s);
  return row;
}
