import { DRIVE_FOLDERS, WS_LABEL, workstreamLabel } from "../constants";
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
