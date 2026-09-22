import { inflateRawSync } from "zlib";

/** Texto de um .docx (ZIP) sem baixar biblioteca. Sem o XML, devolve null. */
export function textFromDocx(bytes: Buffer): string | null {
  const xml = unzipEntry(bytes, "word/document.xml");
  if (!xml) return null;
  const text = plainFromWordXml(xml.toString("utf8")).trim();
  return text || null;
}

function unzipEntry(buf: Buffer, wanted: string): Buffer | null {
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) return null;
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buf.toString("utf8", nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;
    if (!compSize) {
      if (method !== 0) return null;
      offset = dataStart;
      continue;
    }
    const dataEnd = dataStart + compSize;
    if (dataEnd > buf.length) return null;
    if (name === wanted) {
      const slice = buf.subarray(dataStart, dataEnd);
      if (method === 0) return Buffer.from(slice);
      if (method === 8) {
        try {
          return inflateRawSync(slice);
        } catch {
          return null;
        }
      }
      return null;
    }
    offset = dataEnd;
  }
  return null;
}

function plainFromWordXml(xml: string) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
