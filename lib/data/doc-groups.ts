import { DRIVE_FOLDERS, WS_LABEL, workstreamLabel } from "../constants";
import { driveResourceId } from "../http";
import { isPillarSlug, pillarOf, type PillarSlug } from "../pillars";
import type { DriveDocument } from "../types";

const FOLDER_ORDER: readonly string[] = Object.values(DRIVE_FOLDERS).map((folder) => folder.id);
const FRONT_ORDER = Object.keys(WS_LABEL);

export type DocFront = {
  slug: string | null;
  label: string | null;
  items: DriveDocument[];
};

export type DocFolderGroup = {
  folderId: string | null;
  folderName: string;
  fronts: DocFront[];
};

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

function folderNameFor(folderId: string | null, items: DriveDocument[]): string {
  if (!folderId) return "Sem pasta";
  const known = Object.values(DRIVE_FOLDERS).find((folder) => folder.id === folderId);
  if (known) return known.name;
  const pointer = items.find(
    (doc) => doc.folderId === folderId && doc.driveUrl.includes(`/folders/${folderId}`),
  );
  if (pointer) return pointer.title.replace(/^Pasta\s+/i, "");
  return "Outra pasta";
}

/**
 * Agrupa o que o bundle já entregou (seed + o que a classificação gravou).
 * Pasta do Drive primeiro; frente só quando o arquivo já tem workstream.
 */
export function groupDocuments(items: DriveDocument[]): DocFolderGroup[] {
  const byFolder = new Map<string, DriveDocument[]>();
  for (const item of items) {
    const key = item.folderId || "";
    const list = byFolder.get(key) ?? [];
    list.push(item);
    byFolder.set(key, list);
  }

  const keys = [...byFolder.keys()].sort((a, b) => {
    const ia = FOLDER_ORDER.indexOf(a);
    const ib = FOLDER_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    if (!a) return 1;
    if (!b) return -1;
    return folderNameFor(a, byFolder.get(a) ?? []).localeCompare(
      folderNameFor(b, byFolder.get(b) ?? []),
      "pt",
      { sensitivity: "base" },
    );
  });

  return keys.map((key) => {
    const docs = byFolder.get(key) ?? [];
    const byFront = new Map<string, DriveDocument[]>();
    for (const doc of docs) {
      const front = doc.workstreamSlug || "";
      const list = byFront.get(front) ?? [];
      list.push(doc);
      byFront.set(front, list);
    }
    const frontKeys = [...byFront.keys()].sort((a, b) => {
      if (!a) return -1;
      if (!b) return 1;
      const ia = FRONT_ORDER.indexOf(a);
      const ib = FRONT_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b, "pt", { sensitivity: "base" });
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return {
      folderId: key || null,
      folderName: folderNameFor(key || null, docs),
      fronts: frontKeys.map((front) => ({
        slug: front || null,
        label: front ? workstreamLabel(front) : null,
        items: (byFront.get(front) ?? []).slice().sort((a, b) => compareDocNames(a.title, b.title)),
      })),
    };
  });
}

/**
 * Pastas numeradas que o corte já indexa (1.1 societário, 2.1 demonstrações, …).
 * Só entra na tela quando há arquivo ou atalho de pasta de verdade.
 */
const SECTION_FOLDER: Record<number, string> = {
  1: "1. Societários",
  2: "2. Financeiros",
  3: "3. Tributários",
  4: "4. Trabalhistas",
  5: "5. Contratos",
  6: "6. Tecnologia",
  7: "7. Processos",
};

const PROGRAM_FOLDER_IDS = new Set<string>(Object.values(DRIVE_FOLDERS).map((folder) => folder.id));

export type RoomFile = { id: string; title: string; href: string };

export type RoomGroup = {
  key: string;
  label: string;
  order: number;
  /** Atalho da pasta do grupo, quando a pasta existe e não há linha interna. */
  folderHref: string | null;
  /** Conjuntos que são pasta de verdade. O rótulo não finge ser arquivo. */
  folders: RoomFile[];
  files: RoomFile[];
};

/** N.N no nome (1.1, 2.7, 7.1). Ano e número solto não viram pasta. */
export function sectionMajor(name: string): number | null {
  const match = name.trim().match(/(?:^|[^\d])(\d{1,2})\.(\d{1,2})(?!\d)/);
  if (!match) return null;
  const major = Number(match[1]);
  if (major < 1 || major > 12) return null;
  return major;
}

function linkKind(doc: DriveDocument): "file" | "folder" | "none" {
  const href = doc.driveUrl || "";
  if (!driveResourceId(href)) return "none";
  if (href.includes("/folders/")) return "folder";
  if (doc.driveId) return "file";
  return "none";
}

function inDataRoom(doc: DriveDocument, roomId: string): boolean {
  if (!doc.folderId) return Boolean(doc.driveId);
  if (doc.folderId === roomId) return true;
  if (PROGRAM_FOLDER_IDS.has(doc.folderId)) return false;
  return true;
}

function folderLabel(doc: DriveDocument): string {
  return doc.title.replace(/^Pasta\s+/i, "").split("(")[0].trim() || doc.title;
}

/**
 * Finder do Doctos Loopert / HeathData: grupos numerados e arquivos que o
 * seed ou a bandeja já classificou. Sem arquivo inventado.
 */
export function dataRoomGroups(items: DriveDocument[], room: { id: string; label: string }): RoomGroup[] {
  const groups = new Map<string, RoomGroup>();
  const inRoom = items.filter((doc) => room.id && inDataRoom(doc, room.id));
  const folderName = new Map<string, string>();
  for (const doc of inRoom) {
    if (linkKind(doc) === "folder" && doc.folderId && doc.folderId !== room.id && !sectionMajor(doc.title)) {
      if (!folderName.has(doc.folderId)) folderName.set(doc.folderId, folderLabel(doc));
    }
  }

  function group(key: string, label: string, order: number): RoomGroup {
    const found = groups.get(key);
    if (found) return found;
    const created: RoomGroup = { key, label, order, folderHref: null, folders: [], files: [] };
    groups.set(key, created);
    return created;
  }

  for (const doc of inRoom) {
    const kind = linkKind(doc);
    if (kind === "none") continue;
    const section = sectionMajor(doc.title);
    const isRoomPointer = kind === "folder" && doc.folderId === room.id && !section;

    if (kind === "file") {
      const target = section
        ? group(`sec-${section}`, SECTION_FOLDER[section] ?? `${section}.`, section)
        : doc.folderId && doc.folderId !== room.id
          ? group(`child-${doc.folderId}`, folderName.get(doc.folderId) ?? "Pasta", 800)
          : group("room", room.label, 900);
      target.files.push({ id: doc.id, title: doc.title, href: doc.driveUrl });
      continue;
    }

    if (isRoomPointer) {
      const target = group("room", room.label, 900);
      if (!target.folderHref) target.folderHref = doc.driveUrl;
      continue;
    }

    if (section) {
      const target = group(`sec-${section}`, SECTION_FOLDER[section] ?? `${section}.`, section);
      target.folders.push({ id: doc.id, title: doc.title, href: doc.driveUrl });
      continue;
    }

    const target = group(`folder-${doc.id}`, folderLabel(doc), 700);
    target.folderHref = doc.driveUrl;
  }

  return [...groups.values()]
    .map((entry) => ({
      ...entry,
      files: entry.files.slice().sort((a, b) => compareDocNames(a.title, b.title)),
      folders: entry.folders.slice().sort((a, b) => compareDocNames(a.title, b.title)),
      folderHref: entry.folders.length > 0 ? null : entry.folderHref,
    }))
    .filter((entry) => entry.files.length > 0 || entry.folders.length > 0 || Boolean(entry.folderHref))
    .filter((entry) => entry.key !== "room" || entry.files.length > 0)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt", { sensitivity: "base" }));
}

/** Cartão de pasta do programa (Audio_in, auxiliares, …). Não é documento do pilar. */
export function isProgramFolderCard(doc: DriveDocument): boolean {
  if (doc.driveId) return false;
  if (!doc.driveUrl.includes("/folders/")) return false;
  return Boolean(doc.folderId && PROGRAM_FOLDER_IDS.has(doc.folderId));
}

/** Documento já classificado neste pilar. Sem frente e sem pilar explícito fica de fora. */
export function docClassifiedToPillar(doc: DriveDocument, pillar: PillarSlug): boolean {
  if (isPillarSlug(doc.pillarSlug)) return doc.pillarSlug === pillar;
  if (!doc.workstreamSlug) return false;
  return pillarOf(doc) === pillar;
}
