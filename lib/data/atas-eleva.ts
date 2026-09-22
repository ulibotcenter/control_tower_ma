import { buildDocTree, type DocTreeFile, type DocTreeNode } from "./doc-groups";
import type { DriveDocument } from "../types";

function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Arquivo da árvore com “Eleva” no nome, fora de ACS, ata de sócios, 1.4 e Radio Health. */
export function isAtaElevaName(name: string): boolean {
  const text = fold(name);
  if (!text.includes("eleva")) return false;
  if (/(^|[^a-z0-9])acs([^a-z0-9]|$)/.test(text)) return false;
  if (text.includes("ata de socios")) return false;
  if (text.includes("1.4")) return false;
  if (text.includes("radiohealth") || text.includes("radio healthy")) return false;
  return true;
}

function filesOf(nodes: DocTreeNode[], out: DocTreeFile[]) {
  for (const node of nodes) {
    if (node.kind === "file") out.push(node);
    else filesOf(node.children, out);
  }
}

export function atasEleva(items: DriveDocument[], roomId: string | null): DocTreeFile[] {
  const files: DocTreeFile[] = [];
  filesOf(buildDocTree(items, roomId), files);
  return files.filter((file) => isAtaElevaName(file.name));
}
