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
    // Vercel / serverless: persistência local pode falhar. O seed continua.
  }
}

let memory = defaultStore();

async function load(): Promise<Store> {
  // Always prefer disk so API route and página RSC não fiquem com cópias velhas.
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

export async function listInbox(): Promise<InboxFile[]> {
  const s = await load();
  return [...s.inbox].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

export async function getInboxFile(id: string): Promise<InboxFile | null> {
  const s = await load();
  return s.inbox.find((f) => f.id === id) ?? null;
}

export async function addInboxFile(input: {
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

export async function classifyInboxFile(
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
  const docId = `inbox-${file.id}`;
  const doc: DriveDocument = {
    id: docId,
    dealId: classification.dealId,
    title: file.name,
    driveUrl: file.driveUrl || "",
    driveId: file.driveId,
    folderId: null,
    type: classification.type,
    workstreamSlug: classification.workstreamSlug,
    status: classification.status,
    classified: true,
    note: "Classificado na bandeja. Arquivo classificado ≠ item concluído.",
    visibility: "advisors",
    sensitivities: [],
  };
  s.documents = [doc, ...s.documents.filter((d) => d.id !== doc.id)];

  if (classification.workstreamSlug) {
    const ck: ChecklistItem = {
      id: `ck-${docId}`,
      dealId: classification.dealId,
      workstreamSlug: classification.workstreamSlug,
      title: file.name,
      status: "em_andamento",
      documentId: docId,
      driveUrl: file.driveUrl,
      note: "Veio da bandeja. Classificar não conclui o item nem muda o semáforo.",
      visibility: "advisors",
      sensitivities: [],
    };
    s.checklist = [ck, ...s.checklist.filter((c) => c.id !== ck.id)];
  }

  memory = s;
  await writeStore(s);
  return file;
}

function checklistFromInbox(file: InboxFile): ChecklistItem | null {
  const ws = file.classification?.workstreamSlug;
  if (!file.classified || !file.classification || !ws) return null;
  return {
    id: `ck-inbox-${file.id}`,
    dealId: file.classification.dealId,
    workstreamSlug: ws,
    title: file.name,
    status: "em_andamento",
    documentId: `inbox-${file.id}`,
    driveUrl: file.driveUrl,
    note: "Veio da bandeja. Classificar não conclui o item nem muda o semáforo.",
    visibility: "advisors",
    sensitivities: [],
  };
}

export async function extraChecklist(): Promise<ChecklistItem[]> {
  const s = await load();
  const fromInbox = s.inbox
    .map(checklistFromInbox)
    .filter((c): c is ChecklistItem => Boolean(c));
  const seen = new Set(fromInbox.map((c) => c.documentId));
  return [...fromInbox, ...s.checklist.filter((c) => !seen.has(c.documentId))];
}

export async function extraDocuments(): Promise<DriveDocument[]> {
  const s = await load();
  const fromInbox: DriveDocument[] = s.inbox
    .filter((f) => f.classified && f.classification)
    .map((f) => ({
      id: `inbox-${f.id}`,
      dealId: f.classification!.dealId,
      title: f.name,
      driveUrl: f.driveUrl || "",
      driveId: f.driveId,
      folderId: null,
      type: f.classification!.type,
      workstreamSlug: f.classification!.workstreamSlug,
      status: f.classification!.status,
      classified: true,
      note: "Classificado na bandeja. Arquivo classificado ≠ item concluído.",
      visibility: "advisors",
      sensitivities: [],
    }));
  const seen = new Set(fromInbox.map((d) => d.id));
  return [...fromInbox, ...s.documents.filter((d) => !seen.has(d.id))];
}

export async function listDecisions(): Promise<Decision[]> {
  const s = await load();
  return [...s.decisions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getDecision(id: string): Promise<Decision | null> {
  const s = await load();
  return s.decisions.find((d) => d.id === id) ?? null;
}

export async function addDecision(input: Omit<Decision, "id">): Promise<Decision> {
  const s = await load();
  const row: Decision = { ...input, id: randomUUID() };
  s.decisions.unshift(row);
  memory = s;
  await writeStore(s);
  return row;
}

export async function unclassifiedCount() {
  const s = await load();
  return s.inbox.filter((f) => !f.classified).length;
}
