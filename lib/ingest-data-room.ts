import { textFromDownload } from "./doc-text-extract";
import {
  DRIVE_NO_CREDENTIAL,
  alreadyIngested,
  bareMime,
  clipDocBody,
  clipReason,
  docTextToast,
    isGoogleAppsExport,
    isLightDocMime,
    pickDocTextBatch,
  type DocTextCandidate,
  type DocTextWrite,
} from "./doc-text";
import { isDriveConfigured } from "./config";
import { listDocTextStamps, upsertDocText } from "./data/store";
import { downloadDriveFile, exportDrivePlainText, listDocTextFiles } from "./drive";

export type IngestDataRoomResult = {
  configured: boolean;
  ok: boolean;
  toast: string;
  ingested: number;
  memory: number;
  eligible: number;
  failed: number;
};

const EMPTY: IngestDataRoomResult = {
  configured: false,
  ok: false,
  toast: DRIVE_NO_CREDENTIAL,
  ingested: 0,
  memory: 0,
  eligible: 0,
  failed: 0,
};

/**
 * Um clique grava texto nativo na doc_text.
 * Não chama OpenRouter e não pede leitura.
 */
export async function ingestDataRoom(): Promise<IngestDataRoomResult> {
  if (!isDriveConfigured()) return { ...EMPTY };

  const scan = await listDocTextFiles();
  if (!scan.configured) return { ...EMPTY };
  if (!scan.ok) {
    return {
      configured: true,
      ok: false,
      toast: scan.message || "Listagem do data room falhou.",
      ingested: 0,
      memory: 0,
      eligible: 0,
      failed: 0,
    };
  }

  const stamps = await listDocTextStamps();
  const known = new Map(stamps.map((stamp) => [stamp.driveId, stamp.driveModifiedAt]));
  const pending = scan.files.filter(
    (file) => !alreadyIngested(file.modifiedAt, known.get(file.id) ?? null, known.has(file.id)),
  );
  const batch = pickDocTextBatch(pending);
  let ingested = 0;
  let failed = 0;

  for (const file of batch) {
    const read = await readCandidate(file);
    const body = read.body;
    const skippedReason = body ? null : read.skippedReason || "sem texto";
    const row: DocTextWrite = {
      driveId: file.id,
      name: file.name.trim(),
      mime: bareMime(file.mimeType),
      folderId: file.folderId.trim() || null,
      dealSlug: file.dealSlug,
      body,
      chars: body.length,
      ingestedAt: new Date().toISOString(),
      driveModifiedAt: file.modifiedAt.trim() || null,
      skippedReason,
    };
    try {
      await upsertDocText(row);
      known.set(file.id, row.driveModifiedAt);
      if (skippedReason) failed += 1;
      else ingested += 1;
    } catch (err) {
      failed += 1;
      console.error("[doc_text] upsert", file.id, err instanceof Error ? err.message : "falha");
    }
  }

  if (scan.truncated) console.error("[doc_text] varredura no limite de segurança");
  console.info(
    "[doc_text]",
    `ingeridos ${ingested}`,
    `memória ${known.size}/${scan.files.length}`,
    `falhou ${failed}`,
    `áudio ${scan.audioSkipped}`,
  );

  return {
    configured: true,
    ok: true,
    toast: docTextToast({
      ingested,
      memory: known.size,
      eligible: scan.files.length,
      failed,
    }),
    ingested,
    memory: known.size,
    eligible: scan.files.length,
    failed,
  };
}

async function readCandidate(file: DocTextCandidate): Promise<{ body: string; skippedReason: string | null }> {
  try {
    if (isGoogleAppsExport(file.mimeType)) {
      const exported = await exportDrivePlainText(file.id);
      if (!exported.ok) return { body: "", skippedReason: clipReason(exported.message) };
      const raw = exported.text.replace(/^\uFEFF/, "");
      if (/^\s*</.test(raw)) return { body: "", skippedReason: "export devolveu HTML" };
      const body = clipDocBody(raw);
      if (!body) {
        const reason = bareMime(file.mimeType) === "application/vnd.google-apps.presentation" ? "slides sem texto" : "documento sem texto";
        return { body: "", skippedReason: reason };
      }
      return { body, skippedReason: null };
    }
    const downloaded = await downloadDriveFile(file.id, isLightDocMime(file.mimeType) ? 25_000 : 50_000);
    if (!downloaded.ok) return { body: "", skippedReason: clipReason(downloaded.message) };
    const extracted = await textFromDownload(file.mimeType, downloaded.bytes);
    if (!extracted.ok) return { body: "", skippedReason: extracted.reason };
    const body = clipDocBody(extracted.text);
    if (!body) {
      if (bareMime(file.mimeType) === "application/pdf") return { body: "", skippedReason: "pdf-sem-texto" };
      return { body: "", skippedReason: "sem texto" };
    }
    return { body, skippedReason: null };
  } catch (err) {
    return { body: "", skippedReason: clipReason(err instanceof Error ? err.message : "falha") };
  }
}
