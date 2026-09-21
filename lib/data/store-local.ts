import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ActionItem,
  ChecklistItem,
  Decision,
  DocumentStatus,
  DocumentType,
  DriveDocument,
  InboxFile,
  Note,
  OpenPoint,
} from "../types";
import { sanitizeDriveUrl } from "../http";
import { decisions as seedDecisions, inboxSeed } from "./seed";
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
};

const defaultStore = (): Store => ({
  inbox: [...inboxSeed],
  decisions: [...seedDecisions],
  documents: [],
  checklist: [],
  openPoints: [],
  actions: [],
  notes: [],
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
  source?: "manual" | "drive";
}): Promise<InboxFile> {
  const s = await load();
  const file: InboxFile = {
    id: randomUUID(),
    name: input.name.trim(),
    source: input.source ?? "manual",
    driveUrl: sanitizeDriveUrl(input.driveUrl),
    driveId: input.driveId?.trim() || null,
    receivedAt: new Date().toISOString(),
    classified: false,
  };
  s.inbox.unshift(file);
  memory = s;
  await writeStore(s);
  return file;
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
  return s.inbox.filter((f) => !f.classified).length;
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
  const row: OpenPoint = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
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
  const row: ActionItem = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
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
