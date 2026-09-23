import { inflateRawSync } from "zlib";
import { extractText, getDocumentProxy } from "unpdf";
import { textFromDocx } from "./ai/docx-text";
import { DOC_TEXT_MIME, bareMime, clipReason } from "./doc-text";

type Extracted = { ok: true; text: string } | { ok: false; reason: string };

const SLIDE_XML = /^ppt\/slides\/slide(\d+)\.xml$/i;
const LOCAL_ZIP = 0x04034b50;

/** Texto nativo do PDF. Sem OCR e sem marcador de página inventado. */
export async function textFromPdf(bytes: Buffer): Promise<Extracted> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | null = null;
  try {
    pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractText(pdf, { mergePages: true });
    const text = Array.isArray(result.text) ? result.text.join("\n") : String(result.text ?? "");
    if (!text.trim()) return { ok: false, reason: "pdf-sem-texto" };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, reason: clipReason(err instanceof Error ? err.message : "pdf ilegível") };
  } finally {
    const closer = pdf as { cleanup?: () => void | Promise<void> } | null;
    try {
      await closer?.cleanup?.();
    } catch {
      /* a página já foi lida */
    }
  }
}

function decodeXml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => fromCode(Number(num)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function fromCode(code: number) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function textFromSlideXml(xml: string) {
  const parts: string[] = [];
  const re = /<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) parts.push(decodeXml(match[1] ?? ""));
  return parts.join("");
}

function zipEntries(buf: Buffer): { name: string; data: Buffer | null }[] | null {
  if (buf.length < 22 || buf.readUInt32LE(0) !== LOCAL_ZIP) return null;
  let eocd = -1;
  const start = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= start; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  const offsetCd = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || offsetCd === 0xffffffff) return null;
  let offset = offsetCd;
  const out: { name: string; data: Buffer | null }[] = [];
  for (let n = 0; n < count; n++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(offset + 10);
    const compSize = buf.readUInt32LE(offset + 20);
    const nameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localOff = buf.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    if (nameStart + nameLen > buf.length) return null;
    const name = buf.toString("utf8", nameStart, nameStart + nameLen);
    offset = nameStart + nameLen + extraLen + commentLen;
    if (localOff + 30 > buf.length || buf.readUInt32LE(localOff) !== LOCAL_ZIP) continue;
    const localNameLen = buf.readUInt16LE(localOff + 26);
    const localExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buf.length) continue;
    const slice = buf.subarray(dataStart, dataEnd);
    try {
      if (method === 0) out.push({ name, data: Buffer.from(slice) });
      else if (method === 8) out.push({ name, data: inflateRawSync(slice) });
      else out.push({ name, data: null });
    } catch {
      out.push({ name, data: null });
    }
  }
  return out;
}

/** Texto das slides. Notas do apresentador ficam de fora. */
export function textFromPptx(bytes: Buffer): Extracted {
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== LOCAL_ZIP) return { ok: false, reason: "pptx ilegível" };
  const entries = zipEntries(bytes);
  if (!entries) return { ok: false, reason: "pptx ilegível" };
  const slides = entries
    .flatMap((entry) => {
      const match = entry.name.match(SLIDE_XML);
      if (!match) return [];
      return [{ n: Number(match[1]), data: entry.data }];
    })
    .sort((a, b) => a.n - b.n);
  if (!slides.length) return { ok: false, reason: "pptx sem slides" };
  const parts = slides
    .flatMap((slide) => (slide.data ? [textFromSlideXml(slide.data.toString("utf8")).trim()] : []))
    .filter(Boolean);
  if (parts.length) return { ok: true, text: parts.join("\n\n") };
  if (slides.some((slide) => !slide.data)) return { ok: false, reason: "pptx ilegível" };
  return { ok: false, reason: "pptx sem texto" };
}

export function textFromDocxBytes(bytes: Buffer): Extracted {
  if (bytes.length < 4 || bytes.readUInt32LE(0) !== LOCAL_ZIP) return { ok: false, reason: "docx ilegível" };
  try {
    const text = textFromDocx(bytes);
    if (!text?.trim()) return { ok: false, reason: "docx sem texto" };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, reason: clipReason(err instanceof Error ? err.message : "docx ilegível") };
  }
}

export function textFromPlainBytes(bytes: Buffer): Extracted {
  const text = bytes.toString("utf8");
  if (!text.trim()) return { ok: false, reason: "sem texto" };
  return { ok: true, text };
}

export async function textFromDownload(mime: string, bytes: Buffer): Promise<Extracted> {
  const type = bareMime(mime);
  if (type === DOC_TEXT_MIME.pdf) return textFromPdf(bytes);
  if (type === DOC_TEXT_MIME.pptx) return textFromPptx(bytes);
  if (type === DOC_TEXT_MIME.docx) return textFromDocxBytes(bytes);
  return textFromPlainBytes(bytes);
}
