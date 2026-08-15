import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ChecklistItem,
  Decision,
  DocumentStatus,
  DocumentType,
  DriveDocument,
  InboxFile,
} from "../types";
import { sanitizeDriveUrl } from "../http";
import { decisions as seedDecisions, inboxSeed } from "./seed";
import { checklistFromInbox, documentFromInbox } from "./store-map";

type Store = {
  inbox: InboxFile[];
  decisions: Decision[];
  documents: DriveDocument[];
  checklist: ChecklistItem[];
};

const defaultStore = (): Store => ({
  inbox: [...inboxSeed],
  decisions: [...seedDecisions],
  documents: [],
  checklist: [],
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
