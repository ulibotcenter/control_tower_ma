/** O que a leitura pode abrir. Áudio nunca entra no contexto. */

export const AI_TEXT_FILES = 4;
export const AI_TEXT_CHARS = 4000;

const AUDIO_NAME = /\.(m4a|mp3|wav|aac|ogg|flac|wma)$/i;
const VIDEO_NAME = /\.(mp4|mov|mkv|webm|avi)$/i;
const PACK_NAME = /\.(zip|key|pptx?|png|jpe?g|gif|webp|heic|svg|tiff?)$/i;
const PDF_NAME = /\.pdf$/i;
const DOCX_NAME = /\.docx$/i;
const DOC_NAME = /\.doc$/i;
const PLAIN_NAME = /\.(txt|md|vtt|srt)$/i;

export type ReadingKind = "text" | "docx" | "pdf" | "audio" | "skip";

export function readingKind(name: string, mime = ""): ReadingKind {
  const type = mime.toLowerCase();
  if (type.startsWith("audio/") || AUDIO_NAME.test(name) || type === "application/vnd.google-apps.audio") return "audio";
  if (type.startsWith("video/") || VIDEO_NAME.test(name)) return "skip";
  if (type.startsWith("image/") || PACK_NAME.test(name) || type.includes("presentation") || type.includes("zip")) return "skip";
  if (type === "application/pdf" || PDF_NAME.test(name)) return "pdf";
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    DOCX_NAME.test(name)
  ) {
    return "docx";
  }
  if (type === "application/msword" || DOC_NAME.test(name)) return "docx";
  if (
    type === "application/vnd.google-apps.document" ||
    PLAIN_NAME.test(name) ||
    type.startsWith("text/")
  ) {
    return "text";
  }
  return "skip";
}

export function isAudioName(name: string, mime = "") {
  return readingKind(name, mime) === "audio";
}

/** Já lido fica de fora, salvo se o Drive mudou depois de last_read_at. */
export function isUnread(lastReadAt: string | null | undefined, modifiedAt: string | null | undefined) {
  if (!lastReadAt) return true;
  if (!modifiedAt) return false;
  const read = Date.parse(lastReadAt);
  const mod = Date.parse(modifiedAt);
  if (Number.isNaN(read) || Number.isNaN(mod)) return modifiedAt > lastReadAt;
  return mod > read;
}

/** O carimbo mais recente. ISO com Z e com offset não se compara como texto. */
export function laterStamp(a: string, b: string) {
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return a > b ? a : b;
  return left >= right ? a : b;
}

export type ReadingFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedAt: string;
};

export function planReading(files: ReadingFile[], lastReadAt: Map<string, string>) {
  const readable = files.filter((file) => {
    const kind = readingKind(file.name, file.mimeType);
    return kind === "text" || kind === "docx";
  });
  const fresh = readable.filter((file) => isUnread(lastReadAt.get(file.id), file.modifiedAt || null));
  fresh.sort((a, b) => {
    const delta = timeOf(b.modifiedAt) - timeOf(a.modifiedAt);
    return delta || a.name.localeCompare(b.name, "pt");
  });
  return {
    batch: fresh.slice(0, AI_TEXT_FILES),
    seen: readable.length - fresh.length,
    audio: files.some((file) => readingKind(file.name, file.mimeType) === "audio"),
  };
}

function timeOf(iso: string) {
  const value = Date.parse(iso);
  return Number.isNaN(value) ? 0 : value;
}

export function clipReading(text: string) {
  const clean = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
  if (clean.length <= AI_TEXT_CHARS) return clean;
  return `${clean.slice(0, AI_TEXT_CHARS - 1)}…`;
}
