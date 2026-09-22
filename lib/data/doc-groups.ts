import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, DRIVE_FOLDERS, folderUrl, fileUrl } from "../constants";
import { driveResourceId } from "../http";
import { isPillarSlug, pillarOf, type PillarSlug } from "../pillars";
import type { DriveDocument, MeetingMode } from "../types";

const FOLDER_ORDER: readonly string[] = Object.values(DRIVE_FOLDERS).map((folder) => folder.id);
const PROGRAM_FOLDER_IDS = new Set<string>(Object.values(DRIVE_FOLDERS).map((folder) => folder.id));

/** Pasta gravada pela varredura. Não é documento de pilar. */
export const SCAN_FOLDER_PREFIX = "scan-folder-";
export const SCAN_FOLDER_NOTE = "Pasta lida na varredura.";
export const SCAN_FILE_PREFIX = "scan-file-";
export const INBOX_TREE_PREFIX = "inbox-";

export function scanFolderDocId(folderId: string) {
  return `${SCAN_FOLDER_PREFIX}${folderId}`;
}

export function isScanFolderDoc(doc: { id: string; note?: string | null }) {
  return doc.id.startsWith(SCAN_FOLDER_PREFIX) || doc.note === SCAN_FOLDER_NOTE;
}

/** Arquivo novo da varredura, ainda na bandeja. Entra no finder; não conta no pilar. */
export function isPendingInboxDoc(doc: { id: string; classified?: boolean }) {
  return doc.id.startsWith(INBOX_TREE_PREFIX) && doc.classified === false;
}

export function isScanFileOverlay(doc: { id: string }) {
  return doc.id.startsWith(SCAN_FILE_PREFIX);
}

export function scanFileDocId(driveId: string) {
  return `${SCAN_FILE_PREFIX}${driveId}`;
}

/** Pasta-pai e nome da varredura vencem o seed quando o driveId já existia. */
export function applyScanFileHints(docs: DriveDocument[]): DriveDocument[] {
  const folderByDrive = new Map<string, string>();
  const nameByDrive = new Map<string, string>();
  for (const doc of docs) {
    if (!doc.driveId || !doc.folderId) continue;
    if (!folderByDrive.has(doc.driveId) || isScanFileOverlay(doc) || isPendingInboxDoc(doc)) {
      folderByDrive.set(doc.driveId, doc.folderId);
      nameByDrive.set(doc.driveId, doc.title);
    }
  }
  const seen = new Set<string>();
  const out: DriveDocument[] = [];
  for (const doc of docs) {
    if (isScanFileOverlay(doc)) continue;
    if (doc.driveId) {
      if (seen.has(doc.driveId)) continue;
      seen.add(doc.driveId);
      out.push({
        ...doc,
        folderId: folderByDrive.get(doc.driveId) ?? doc.folderId,
        title: nameByDrive.get(doc.driveId) ?? doc.title,
      });
      continue;
    }
    out.push(doc);
  }
  return out;
}

/**
 * Número já presente no nome: 01, 02, 5ª, 1.1, (2.9).
 * Ano de 4 dígitos e data com barra não contam.
 * O valor é major*100 + minor para ordenar 1.1 antes de 1.2 e de 2.
 */
export function fileNameNumber(name: string): number | null {
  const trimmed = name.trim();
  const lead = trimmed.match(/^(\d{1,3})(?:\.(\d{1,2}))?(?!\d)/);
  if (lead) return Number(lead[1]) * 100 + (lead[2] ? Number(lead[2]) : 0);
  const ordinal = trimmed.match(/(\d{1,3})\s*ª/i);
  if (ordinal) return Number(ordinal[1]) * 100;
  const section = trimmed.match(/(?:^|[^\d])(\d{1,2})\.(\d{1,2})(?!\d)/);
  if (section) return Number(section[1]) * 100 + Number(section[2]);
  return null;
}

export function compareDocNames(a: string, b: string): number {
  const na = fileNameNumber(a);
  const nb = fileNameNumber(b);
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;
  if (na != null && nb != null && na !== nb) return na - nb;
  return a.localeCompare(b, "pt", { sensitivity: "base" });
}

export type DocTreeFile = {
  kind: "file";
  id: string;
  name: string;
  /** Link do arquivo. Null = sem id, sem âncora. */
  href: string | null;
  /** Rótulo curto. Sem id de arquivo é só "—". */
  mark: string;
};

export type DocTreeFolder = {
  kind: "folder";
  id: string;
  name: string;
  href: string | null;
  children: DocTreeNode[];
};

export type DocTreeNode = DocTreeFolder | DocTreeFile;

function knownFolderName(id: string): string | null {
  return Object.values(DRIVE_FOLDERS).find((folder) => folder.id === id)?.name ?? null;
}

function urlFolderId(doc: DriveDocument): string | null {
  if (!doc.driveUrl.includes("/folders/")) return null;
  return driveResourceId(doc.driveUrl);
}

function cleanFolderTitle(title: string) {
  return title.replace(/^Pasta\s+/i, "").split("(")[0].trim();
}

function isFolderContainer(doc: DriveDocument): boolean {
  if (doc.driveId) return false;
  if (!urlFolderId(doc)) return false;
  return isScanFolderDoc(doc) || /^Pasta\s+/i.test(doc.title);
}

/** Só id de arquivo vira link. URL de pasta não vira âncora na linha. */
function fileHref(doc: DriveDocument): string | null {
  if (!doc.driveId) return null;
  const href = doc.driveUrl || "";
  if (href.includes("/file/") || (driveResourceId(href) && !href.includes("/folders/"))) return href;
  return fileUrl(doc.driveId);
}

function fileMark(doc: DriveDocument): string {
  if (!doc.driveId) return "—";
  if (doc.status && DOC_STATUS_LABEL[doc.status]) return DOC_STATUS_LABEL[doc.status];
  if (doc.type && DOC_TYPE_LABEL[doc.type]) return DOC_TYPE_LABEL[doc.type];
  return "—";
}

type FolderAcc = {
  id: string;
  name: string;
  href: string;
  parentId: string | null;
};

/**
 * Árvore do que a varredura e a bandeja já viram sob a raiz (folderId, pasta-pai, nome).
 * Não inventa pasta vazia a partir das chaves antigas do seed.
 * Pasta sem pai conhecido e que não é pasta do programa fica dentro da pasta oficial do deal.
 */
export function buildDocTree(items: DriveDocument[], roomId: string | null): DocTreeNode[] {
  const folders = new Map<string, FolderAcc>();

  function ensure(id: string) {
    if (!id || folders.has(id)) return;
    const known = knownFolderName(id);
    folders.set(id, {
      id,
      name: known ?? "Pasta",
      href: folderUrl(id),
      parentId: null,
    });
  }

  const hasRoomEvidence =
    Boolean(roomId) &&
    items.some((doc) => doc.folderId === roomId || urlFolderId(doc) === roomId);
  if (hasRoomEvidence && roomId) ensure(roomId);
  for (const doc of items) {
    if (doc.folderId) ensure(doc.folderId);
    const self = urlFolderId(doc);
    if (self && !doc.driveId) ensure(self);
  }

  for (const doc of items) {
    const self = urlFolderId(doc);
    if (!self || doc.driveId) continue;
    const folder = folders.get(self);
    if (!folder) continue;
    if (!knownFolderName(self)) {
      const name = cleanFolderTitle(doc.title);
      if (name && (isScanFolderDoc(doc) || /^Pasta\s+/i.test(doc.title))) folder.name = name;
    }
    if (isScanFolderDoc(doc) && doc.folderId && doc.folderId !== self) {
      folder.parentId = doc.folderId;
      ensure(doc.folderId);
    }
  }

  const namedByPointer = new Set<string>();
  for (const [id, folder] of folders) {
    if (knownFolderName(id) || folder.name !== "Pasta") continue;
    const pointers = items.filter((doc) => !doc.driveId && !isScanFolderDoc(doc) && urlFolderId(doc) === id);
    if (pointers.length !== 1) continue;
    const name = cleanFolderTitle(pointers[0].title);
    if (!name) continue;
    folder.name = name;
    namedByPointer.add(pointers[0].id);
  }

  for (const folder of folders.values()) {
    if (folder.parentId || PROGRAM_FOLDER_IDS.has(folder.id)) continue;
    if (roomId && folder.id !== roomId && folders.has(roomId)) folder.parentId = roomId;
  }

  const filesByFolder = new Map<string, DocTreeFile[]>();
  const loose: DocTreeFile[] = [];
  for (const doc of items) {
    if (isFolderContainer(doc) || namedByPointer.has(doc.id)) continue;
    const file: DocTreeFile = {
      kind: "file",
      id: doc.id,
      name: doc.title,
      href: fileHref(doc),
      mark: fileMark(doc),
    };
    if (doc.folderId && folders.has(doc.folderId)) {
      const list = filesByFolder.get(doc.folderId) ?? [];
      list.push(file);
      filesByFolder.set(doc.folderId, list);
    } else {
      loose.push(file);
    }
  }

  function childrenOf(id: string, stack: Set<string>): DocTreeNode[] {
    if (stack.has(id)) return [];
    const next = new Set(stack);
    next.add(id);
    const subs = [...folders.values()]
      .filter((folder) => folder.parentId === id)
      .sort((a, b) => compareDocNames(a.name, b.name));
    const files = (filesByFolder.get(id) ?? []).slice().sort((a, b) => compareDocNames(a.name, b.name));
    return [
      ...subs.map(
        (folder): DocTreeFolder => ({
          kind: "folder",
          id: folder.id,
          name: folder.name,
          href: driveResourceId(folder.href) ? folder.href : null,
          children: childrenOf(folder.id, next),
        }),
      ),
      ...files,
    ];
  }

  const roots = [...folders.values()]
    .filter((folder) => !folder.parentId || !folders.has(folder.parentId))
    .sort((a, b) => {
      if (roomId) {
        if (a.id === roomId) return -1;
        if (b.id === roomId) return 1;
      }
      const ia = FOLDER_ORDER.indexOf(a.id);
      const ib = FOLDER_ORDER.indexOf(b.id);
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
      return compareDocNames(a.name, b.name);
    });

  const nodes: DocTreeNode[] = roots.map((folder) => ({
    kind: "folder" as const,
    id: folder.id,
    name: folder.name,
    href: driveResourceId(folder.href) ? folder.href : null,
    children: childrenOf(folder.id, new Set()),
  }));
  loose.sort((a, b) => compareDocNames(a.name, b.name));
  return [...nodes, ...loose];
}

/** Cartão de pasta do programa (Audio_in, auxiliares, …). Não é documento do pilar. */
export function isProgramFolderCard(doc: DriveDocument): boolean {
  if (doc.driveId) return false;
  if (!doc.driveUrl.includes("/folders/")) return false;
  return Boolean(doc.folderId && PROGRAM_FOLDER_IDS.has(doc.folderId));
}

/** Documento já classificado neste pilar. Sem frente e sem pilar explícito fica de fora. */
export function docClassifiedToPillar(doc: DriveDocument, pillar: PillarSlug): boolean {
  if (isScanFolderDoc(doc) || isPendingInboxDoc(doc)) return false;
  if (isPillarSlug(doc.pillarSlug)) return doc.pillarSlug === pillar;
  if (!doc.workstreamSlug) return false;
  return pillarOf(doc) === pillar;
}

export const FINDER_PIN_ATAS = "atas" as const;
export const FINDER_PIN_PESSOAS = "pessoas" as const;
export type FinderPin = typeof FINDER_PIN_ATAS | typeof FINDER_PIN_PESSOAS;

export const FINDER_PIN_LABEL: Record<FinderPin, string> = {
  atas: "Atas",
  pessoas: "Pessoas",
};

/** Pin Atas = pasta Ata + Transcricoes + Audio_in. */
const ATA_FOLDER_IDS = new Set<string>([
  DRIVE_FOLDERS.atas.id,
  DRIVE_FOLDERS.transcricoes.id,
  DRIVE_FOLDERS.audio.id,
]);
const ATA_KEYS = ["transcricoes", "audio_in", "ata", "reuniao"] as const;
const PEOPLE_KEYS = ["socio", "cap", "pessoas", "societario", "folha"] as const;

function foldName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasPinWord(hay: string, needle: string) {
  let from = 0;
  while (from <= hay.length) {
    const i = hay.indexOf(needle, from);
    if (i < 0) return false;
    const before = i === 0 || /[^a-z0-9]/.test(hay[i - 1]!);
    const after = i + needle.length >= hay.length || /[^a-z0-9]/.test(hay[i + needle.length]!);
    if (before && after) return true;
    from = i + needle.length;
  }
  return false;
}

/** Pasta ou nome: Atas = Ata / Transcricoes / Audio_in / ata / reunião; Pessoas = sócio / cap / pessoas / societário / folha. */
export function nameMatchesPin(name: string, pin: FinderPin): boolean {
  const text = foldName(name);
  const keys = pin === FINDER_PIN_ATAS ? ATA_KEYS : PEOPLE_KEYS;
  return keys.some((key) => (key === "ata" || key === "cap" ? hasPinWord(text, key) : text.includes(key)));
}

export function nodeMatchesPin(node: DocTreeNode, pin: FinderPin): boolean {
  if (pin === FINDER_PIN_ATAS && ATA_FOLDER_IDS.has(node.id)) return true;
  return nameMatchesPin(node.name, pin);
}

export function scanParentMap(items: DriveDocument[]): Map<string, string | null> {
  const parentOf = new Map<string, string | null>();
  for (const doc of items) {
    if (!isScanFolderDoc(doc)) continue;
    const self = urlFolderId(doc);
    if (!self) continue;
    parentOf.set(self, doc.folderId && doc.folderId !== self ? doc.folderId : null);
  }
  return parentOf;
}

export function dealIdForDriveFolder(
  folderId: string | null,
  parentOf: Map<string, string | null>,
  rooms: readonly { id: string; driveFolderId: string }[],
): string | null {
  let cursor = folderId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const hit = rooms.find((room) => room.driveFolderId === cursor);
    if (hit) return hit.id;
    cursor = parentOf.get(cursor) ?? null;
  }
  return null;
}

export function treeHasPin(nodes: DocTreeNode[], pin: FinderPin): boolean {
  return nodes.some(
    (node) => nodeMatchesPin(node, pin) || (node.kind === "folder" && treeHasPin(node.children, pin)),
  );
}

/** Alvo não ganha Atas. O resto segue o que o bundle (já filtrado) ainda tem. */
export function finderPinsFor(nodes: DocTreeNode[], mode: MeetingMode): FinderPin[] {
  const pins: FinderPin[] = [];
  if (mode !== "target" && treeHasPin(nodes, FINDER_PIN_ATAS)) pins.push(FINDER_PIN_ATAS);
  if (treeHasPin(nodes, FINDER_PIN_PESSOAS)) pins.push(FINDER_PIN_PESSOAS);
  return pins;
}

export function filterTreeByPin(nodes: DocTreeNode[], pin: FinderPin): DocTreeNode[] {
  const out: DocTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "file") {
      if (nodeMatchesPin(node, pin)) out.push(node);
      continue;
    }
    if (nodeMatchesPin(node, pin)) {
      out.push(node);
      continue;
    }
    const children = filterTreeByPin(node.children, pin);
    if (children.length) out.push({ ...node, children });
  }
  return out;
}

export function folderIdsToOpen(nodes: DocTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.kind !== "folder") continue;
    ids.push(node.id, ...folderIdsToOpen(node.children));
  }
  return ids;
}

/** Deck: pastas fechadas, sem PDF solto na raiz. */
export function withoutLooseFiles(nodes: DocTreeNode[]): DocTreeNode[] {
  return nodes.filter((node) => node.kind === "folder");
}
