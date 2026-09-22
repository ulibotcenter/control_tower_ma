import { DRIVE_FOLDERS } from "../constants";
import { INBOX_TREE_PREFIX, compareDocNames, isScanFolderDoc, scanParentMap } from "../data/doc-groups";
import { driveResourceId } from "../http";
import type { DriveDocument, InboxFile } from "../types";
import { isAudioName } from "./corpus";
import { foldProposalText } from "./near";

/** Nomes por onda. Não é a bandeja dispensada. */
export const AI_NAME_CAP = 40;

export type GapName = { name: string; inboxId: string; driveId: string };

function folderTargets(slug: string, driveFolderId: string, wave: "B" | "C") {
  if (wave === "B" || slug === "radio-health") {
    return [driveFolderId, DRIVE_FOLDERS.atas.id, DRIVE_FOLDERS.transcricoes.id];
  }
  return [DRIVE_FOLDERS.relatorios.id, DRIVE_FOLDERS.opl.id];
}

export function gapFolderLabel(slug: string, wave: "B" | "C") {
  if (wave === "B" || slug === "radio-health") {
    const doctos = slug === "radio-health" ? "Doctos HeathData" : "Doctos Loopert";
    return `Ata, Transcricoes, ${doctos}`;
  }
  return "Relatorios, Open Point List";
}

function parentMap(docs: DriveDocument[]) {
  const parentOf = scanParentMap(docs);
  for (const doc of docs) {
    if (doc.driveId || !doc.driveUrl.includes("/folders/")) continue;
    const self = driveResourceId(doc.driveUrl);
    if (!self || parentOf.has(self)) continue;
    parentOf.set(self, doc.folderId && doc.folderId !== self ? doc.folderId : null);
  }
  return parentOf;
}

function hitFolder(folderId: string | null, parentOf: Map<string, string | null>, targets: Set<string>) {
  let cursor = folderId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    if (targets.has(cursor)) return cursor;
    seen.add(cursor);
    cursor = parentOf.get(cursor) ?? null;
  }
  return null;
}

function isFolderNode(doc: DriveDocument) {
  if (isScanFolderDoc(doc)) return true;
  if (doc.driveId) return false;
  return /^Pasta\s+/i.test(doc.title);
}

function dismissedInbox(doc: DriveDocument, dismissedIds: Set<string>) {
  if (!doc.id.startsWith(INBOX_TREE_PREFIX)) return false;
  return dismissedIds.has(doc.id.slice(INBOX_TREE_PREFIX.length));
}

/**
 * Até 40 nomes por folder_id em DRIVE_FOLDERS, subpasta inclusa. Não usa a bandeja dispensada.
 * Onda B: Doctos do deal, depois Ata e Transcricoes (o teto não come o data room).
 * Onda C da Loopert: Relatorios e Open Point List, sem nome que B já levou.
 * Rádio Health na C repete essas pastas: o brief junta status e lacuna.
 */
export function selectGapNames(input: {
  dealId: string;
  slug: string;
  driveFolderId: string;
  documents: DriveDocument[];
  inbox: InboxFile[];
  wave: "B" | "C";
  skipNames?: string[];
}): GapName[] {
  const targets = folderTargets(input.slug, input.driveFolderId, input.wave);
  const targetSet = new Set(targets);
  const order = new Map(targets.map((id, index) => [id, index]));
  const parents = parentMap(input.documents);
  const dismissedIds = new Set(input.inbox.filter((file) => file.dismissed).map((file) => file.id));
  const skip = new Set((input.skipNames ?? []).map((name) => foldProposalText(name)));
  const seen = new Set<string>();
  const rows: { name: string; inboxId: string; driveId: string; sort: number }[] = [];

  for (const doc of input.documents) {
    if (doc.dealId && doc.dealId !== input.dealId) continue;
    if (isFolderNode(doc) || dismissedInbox(doc, dismissedIds)) continue;
    const name = doc.title.replace(/\s+/g, " ").trim();
    if (!name || isAudioName(name)) continue;
    const folder = hitFolder(doc.folderId, parents, targetSet);
    if (!folder) continue;
    const key = foldProposalText(name);
    if (!key || seen.has(key) || skip.has(key)) continue;
    seen.add(key);
    const inboxId = doc.id.startsWith(INBOX_TREE_PREFIX) ? doc.id.slice(INBOX_TREE_PREFIX.length) : "";
    rows.push({ name, inboxId, driveId: doc.driveId || "", sort: order.get(folder) ?? 99 });
  }

  rows.sort((a, b) => a.sort - b.sort || compareDocNames(a.name, b.name));
  return rows.slice(0, AI_NAME_CAP).map(({ name, inboxId, driveId }) => ({ name, inboxId, driveId }));
}
