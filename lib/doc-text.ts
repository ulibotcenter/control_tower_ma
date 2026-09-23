import { DRIVE_FOLDERS } from "./constants";
import { compareDocNames } from "./data/doc-groups";

/** Teto do corpo gravado. Não acrescenta reticências. */
export const DOC_TEXT_MAX_CHARS = 80_000;
/** Clique só com txt / md / Google Doc / docx. */
export const DOC_TEXT_LIGHT_BATCH = 8;
/** Clique com pdf, pptx ou Google Slides na leva. */
export const DOC_TEXT_HEAVY_BATCH = 3;

export const DRIVE_NO_CREDENTIAL = "Drive sem credencial";

export const DOC_TEXT_MIME = {
  text: "text/plain",
  markdown: "text/markdown",
  gdoc: "application/vnd.google-apps.document",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  gslides: "application/vnd.google-apps.presentation",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
} as const;

/** Apresentação Completa. Entra mesmo fora das pastas prioritárias. */
export const DOC_TEXT_EXTRA_FILE_ID = "15IjNus__YweAKBgl7dlue4O_pWymHnrQ";

export type DocTextRoot = {
  id: string;
  name: string;
  rank: number;
  dealSlug: string | null;
};

/** Ordem do clique: Ata primeiro, arquivo avulso por último. */
export const DOC_TEXT_FOLDERS: readonly DocTextRoot[] = [
  { id: DRIVE_FOLDERS.atas.id, name: DRIVE_FOLDERS.atas.name, rank: 0, dealSlug: null },
  { id: DRIVE_FOLDERS.transcricoes.id, name: DRIVE_FOLDERS.transcricoes.name, rank: 1, dealSlug: null },
  { id: DRIVE_FOLDERS.apresentacoes.id, name: DRIVE_FOLDERS.apresentacoes.name, rank: 2, dealSlug: null },
  { id: DRIVE_FOLDERS.loopert.id, name: DRIVE_FOLDERS.loopert.name, rank: 3, dealSlug: "loopert" },
  { id: DRIVE_FOLDERS.health.id, name: DRIVE_FOLDERS.health.name, rank: 4, dealSlug: "radio-health" },
  { id: DRIVE_FOLDERS.relatorios.id, name: DRIVE_FOLDERS.relatorios.name, rank: 5, dealSlug: null },
  { id: DRIVE_FOLDERS.opl.id, name: DRIVE_FOLDERS.opl.name, rank: 6, dealSlug: null },
];

export const DOC_TEXT_EXTRA_RANK = DOC_TEXT_FOLDERS.length;

const LIGHT_MIMES = new Set<string>([
  DOC_TEXT_MIME.text,
  DOC_TEXT_MIME.markdown,
  DOC_TEXT_MIME.gdoc,
  DOC_TEXT_MIME.docx,
]);

const ELIGIBLE_MIMES = new Set<string>([
  ...LIGHT_MIMES,
  DOC_TEXT_MIME.gslides,
  DOC_TEXT_MIME.pptx,
  DOC_TEXT_MIME.pdf,
]);

const AUDIO_EXT = /\.(m4a|mp3|wav|aac|ogg|flac|wma)$/i;
const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v)$/i;
const ZIP_EXT = /\.zip$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|svg|tiff?|bmp)$/i;

export type DocTextSkipKind = "audio" | "video" | "zip" | "image" | "nfe" | "obsidian";

export type DocTextCandidate = {
  id: string;
  name: string;
  mimeType: string;
  folderId: string;
  modifiedAt: string;
  rank: number;
  dealSlug: string | null;
};

export type DocTextStamp = {
  driveId: string;
  driveModifiedAt: string | null;
};

export type DocTextWrite = {
  driveId: string;
  name: string;
  mime: string;
  folderId: string | null;
  dealSlug: string | null;
  body: string;
  chars: number;
  ingestedAt: string;
  driveModifiedAt: string | null;
  skippedReason: string | null;
};

export function bareMime(mime: string) {
  return mime.toLowerCase().split(";")[0]?.trim() || "";
}

export function isLightDocMime(mime: string) {
  return LIGHT_MIMES.has(bareMime(mime));
}

export function isGoogleAppsExport(mime: string) {
  const type = bareMime(mime);
  return type === DOC_TEXT_MIME.gdoc || type === DOC_TEXT_MIME.gslides;
}

export function docTextSkipKind(name: string, mime = ""): DocTextSkipKind | null {
  const type = bareMime(mime);
  const base = name.trim();
  if (base === ".obsidian" || /(^|[\\/])\.obsidian($|[\\/])/i.test(base)) return "obsidian";
  if (type.startsWith("audio/") || type === "application/vnd.google-apps.audio" || AUDIO_EXT.test(base)) return "audio";
  if (type.startsWith("video/") || type === "application/vnd.google-apps.video" || VIDEO_EXT.test(base)) return "video";
  if (type.startsWith("image/") || IMAGE_EXT.test(base)) return "image";
  if (
    type === "application/zip" ||
    type === "application/x-zip-compressed" ||
    type === "application/x-zip" ||
    ZIP_EXT.test(base)
  ) {
    return "zip";
  }
  if (/\.xml$/i.test(base) && /nfe|nf-e|nota\s*fiscal/i.test(base)) return "nfe";
  return null;
}

/** Mime da lista e nada de áudio, vídeo, zip, imagem, NF-e ou .obsidian. */
export function isDocTextEligible(name: string, mime: string) {
  if (docTextSkipKind(name, mime)) return false;
  return ELIGIBLE_MIMES.has(bareMime(mime));
}

export function dealSlugForFolder(folderId: string | null | undefined): string | null {
  if (folderId === DRIVE_FOLDERS.loopert.id) return "loopert";
  if (folderId === DRIVE_FOLDERS.health.id) return "radio-health";
  return null;
}

/**
 * Já gravado e o Drive não ficou mais novo. Sem carimbo no banco, reingere.
 * Sem hora no Drive e com linha já gravada, não há mudança para provar.
 */
export function alreadyIngested(
  modifiedAt: string | null | undefined,
  storedModifiedAt: string | null | undefined,
  hasRow: boolean,
) {
  if (!hasRow) return false;
  const drive = (modifiedAt ?? "").trim();
  const stored = (storedModifiedAt ?? "").trim();
  if (!stored) return false;
  if (!drive) return true;
  const left = Date.parse(drive);
  const right = Date.parse(stored);
  if (Number.isNaN(left) || Number.isNaN(right)) return drive <= stored;
  return left <= right;
}

export function compareDocText(a: DocTextCandidate, b: DocTextCandidate) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const byName = compareDocNames(a.name, b.name);
  if (byName) return byName;
  return a.id.localeCompare(b.id);
}

/**
 * A leva segue a prioridade. Pdf, pptx ou Google Slides no meio limita o clique a 3,
 * incluindo esse arquivo quando ele cabe. Antes dele, txt/md/gdoc/docx seguem até 8.
 */
export function pickDocTextBatch<T extends { mimeType: string }>(pending: readonly T[]): T[] {
  const batch: T[] = [];
  for (const file of pending) {
    const next = batch.concat(file);
    const limit = next.some((item) => !isLightDocMime(item.mimeType)) ? DOC_TEXT_HEAVY_BATCH : DOC_TEXT_LIGHT_BATCH;
    if (next.length > limit) break;
    batch.push(file);
  }
  return batch;
}

export function clipDocBody(raw: string) {
  const clean = raw
    .replace(/\u0000/g, "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  if (clean.length <= DOC_TEXT_MAX_CHARS) return clean;
  return clean.slice(0, DOC_TEXT_MAX_CHARS);
}

export function clipReason(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return (clean || "falha").slice(0, 240);
}

/** Frase fixa. Áudio não entra número. */
export function docTextToast(input: { ingested: number; memory: number; eligible: number; failed: number }) {
  return `Ingeridos ${input.ingested} · memória ${input.memory}/${input.eligible} · pulou áudio · falhou ${input.failed}`;
}
