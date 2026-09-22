import { createSign } from "crypto";
import { clipReading, readingKind } from "./ai/corpus";
import { textFromDocx } from "./ai/docx-text";
import {
  DRIVE_DO_NOT_INDEX,
  DRIVE_FOLDERS,
  DRIVE_ROOT_FILES,
  fileUrl,
  folderUrl,
} from "./constants";
import { isDriveConfigured } from "./config";

export type DriveStatus = {
  configured: boolean;
  reason: string;
  rootUrl: string;
  folders: { name: string; url: string }[];
  rootFiles: { name: string; url: string }[];
};

export type DriveListedFile = {
  id: string;
  name: string;
  folder: string;
  folderId: string;
  modifiedAt: string;
  webViewLink: string;
  mimeType: string;
};

export type DriveFolderIssue = {
  id: string;
  name: string;
  status: number;
};

export type DriveScannedFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type DriveScanResult = {
  ok: boolean;
  configured: boolean;
  message: string;
  files: DriveListedFile[];
  /** Pastas que a listagem leu de fato. O pai vem da varredura, não de um nome inventado. */
  folders: DriveScannedFolder[];
  foldersRead: number;
  /** Ids whose listing returned 200, including subfolders. */
  foldersOk: string[];
  /** Pasta lida, mas alguma subpasta falhou — não dá para julgar sumiço ali. */
  incompleteFolders: string[];
  folderIssues: DriveFolderIssue[];
  /** Limite de segurança. Não é o recorte antigo de 24 pastas. */
  truncated: boolean;
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
const DOCUMENT_MIME = "application/vnd.google-apps.document";
const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";
const PRESENTATION_MIME = "application/vnd.google-apps.presentation";
const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";
const SKIP_NAMES = /^(icon\r?|\.ds_store|~\$.*)$/i;
const SAFETY_FOLDERS = 400;
const SAFETY_FILES = 5000;

/** Qualquer coisa que não é pasta: PDF, Doc, Sheet, atalho resolvido, etc. */
export function isDriveFileMime(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType) && mimeType !== FOLDER_MIME;
}

export function driveItemUrl(id: string, mimeType?: string | null): string {
  if (mimeType === DOCUMENT_MIME) return `https://docs.google.com/document/d/${id}/edit`;
  if (mimeType === SPREADSHEET_MIME) return `https://docs.google.com/spreadsheets/d/${id}/edit`;
  if (mimeType === PRESENTATION_MIME) return `https://docs.google.com/presentation/d/${id}/edit`;
  return fileUrl(id);
}

export function formatAtaSyncLine(input: { read: number; saved: number; errors: number } | null | undefined): string | null {
  if (!input) return null;
  return `Pasta Ata: ${input.read} arquivos lidos, ${input.saved} gravados na bandeja, ${input.errors} erros de insert.`;
}

export function firstErrorLine(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || "falha");
  return raw.split(/\r?\n/)[0]?.trim() || "falha";
}

export function getDriveStatus(): DriveStatus {
  return {
    configured: isDriveConfigured(),
    reason: isDriveConfigured()
      ? "Credencial presente. Atualizar Drive percorre as pastas do programa; arquivo novo cai na bandeja, a classificar."
      : "API do Google não configurada. A torre não está lendo o Drive. Use a bandeja manual e os links das pastas.",
    rootUrl: folderUrl(DRIVE_FOLDERS.root.id),
    folders: Object.values(DRIVE_FOLDERS)
      .filter((f) => f.id !== DRIVE_FOLDERS.root.id)
      .map((f) => ({ name: f.name, url: folderUrl(f.id) })),
    rootFiles: DRIVE_ROOT_FILES.map((f) => ({ name: f.name, url: fileUrl(f.id) })),
  };
}

async function accessToken(): Promise<string> {
  const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT?.trim();
  if (saRaw) {
    const sa = JSON.parse(saRaw) as { client_email: string; private_key: string };
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claim = Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url");
    const sign = createSign("RSA-SHA256");
    sign.update(`${header}.${claim}`);
    const jwt = `${header}.${claim}.${sign.sign(sa.private_key.replace(/\\n/g, "\n"), "base64url")}`;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
    });
    const json = (await res.json()) as { access_token?: string; error?: string };
    if (!res.ok || !json.access_token) {
      throw new Error(json.error || `token ${res.status}`);
    }
    return json.access_token;
  }

  const id = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refresh = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (!id || !secret || !refresh) {
    throw new Error("credencial incompleta");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refresh,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || `token ${res.status}`);
  }
  return json.access_token;
}

type GFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  parents?: string[];
  webViewLink?: string;
  shortcutDetails?: { targetId?: string; targetMimeType?: string };
};

type ListedChildren =
  | { ok: true; files: GFile[] }
  | { ok: false; status: number; message: string };

async function listChildren(token: string, parentId: string): Promise<ListedChildren> {
  if (parentId.includes("'")) {
    return { ok: false, status: 400, message: "id de pasta inválido" };
  }
  const files: GFile[] = [];
  let page: string | undefined;
  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${parentId}' in parents and trashed = false`);
    url.searchParams.set(
      "fields",
      "nextPageToken,files(id,name,mimeType,modifiedTime,parents,webViewLink,shortcutDetails(targetId,targetMimeType))",
    );
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");
    if (page) url.searchParams.set("pageToken", page);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await res.json()) as { files?: GFile[]; nextPageToken?: string; error?: { message?: string } };
    if (!res.ok) {
      return { ok: false, status: res.status, message: json.error?.message || `drive ${res.status}` };
    }
    files.push(...(json.files ?? []));
    page = json.nextPageToken;
  } while (page);
  return { ok: true, files };
}

export function formatDriveSyncSummary(input: {
  created: number;
  updated: number;
  foldersRead: number;
  folderIssues: { name: string; status: number }[];
  missing: number;
  truncated: boolean;
  ata?: { read: number; saved: number; errors: number } | null;
  insertError?: string | null;
}): string {
  const novo = input.created === 1 ? "1 novo" : `${input.created} novos`;
  const atualizado = input.updated === 1 ? "1 atualizado" : `${input.updated} atualizados`;
  const pastas = input.foldersRead === 1 ? "1 pasta lida" : `${input.foldersRead} pastas lidas`;
  const parts = [`${novo}, ${atualizado}, ${pastas}`];
  const ataLine = formatAtaSyncLine(input.ata);
  if (ataLine) parts.push(ataLine.replace(/\.$/, ""));
  const notFound = input.folderIssues.filter((folder) => folder.status === 404);
  if (notFound.length) {
    parts.push(`Pasta não encontrada: ${notFound.map((folder) => `${folder.name} (404)`).join(", ")}`);
  }
  const other = input.folderIssues.filter((folder) => folder.status !== 404);
  if (other.length) {
    parts.push(other.map((folder) => `${folder.name} falhou (${folder.status})`).join(", "));
  }
  if (input.insertError) parts.push(input.insertError);
  if (input.missing === 1) parts.push("1 arquivo sumiu do Drive (registro mantido)");
  else if (input.missing > 1) parts.push(`${input.missing} arquivos sumiram do Drive (registro mantido)`);
  if (input.truncated) parts.push("Varredura interrompida no limite de segurança");
  return parts.join(". ");
}

/**
 * Varre a árvore inteira das pastas em DRIVE_FOLDERS, inclusive subpastas.
 * Ignora .obsidian. Não filtra por data nem por id já conhecido.
 * Pasta com 404 entra em folderIssues e a varredura segue nas outras.
 */
export async function scanDriveTree(): Promise<DriveScanResult> {
  if (!isDriveConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "API do Google não configurada. Use a bandeja manual.",
      files: [],
      folders: [],
      foldersRead: 0,
      foldersOk: [],
      incompleteFolders: [],
      folderIssues: [],
      truncated: false,
    };
  }

  try {
    const token = await accessToken();
    const skipFolder = new Set<string>([DRIVE_DO_NOT_INDEX.id]);
    const seenFolder = new Set<string>();
    const seenFile = new Set<string>();
    const parentOf = new Map<string, string | null>();
    const queue: { id: string; name: string; parentId: string | null }[] = Object.values(DRIVE_FOLDERS).map(
      (folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: null,
      }),
    );
    const files: DriveListedFile[] = [];
    const folders: DriveScannedFolder[] = [];
    const folderIssues: DriveFolderIssue[] = [];
    const foldersOk: string[] = [];
    const incomplete = new Set<string>();
    let foldersRead = 0;
    let truncated = false;

    const markIncomplete = (folderId: string) => {
      let cursor: string | null = folderId;
      while (cursor && !incomplete.has(cursor)) {
        incomplete.add(cursor);
        cursor = parentOf.get(cursor) ?? null;
      }
    };

    while (queue.length) {
      const item = queue.shift();
      if (!item || seenFolder.has(item.id) || skipFolder.has(item.id)) continue;
      if (item.name === ".obsidian" || item.id === DRIVE_DO_NOT_INDEX.id) {
        skipFolder.add(item.id);
        continue;
      }
      if (seenFolder.size >= SAFETY_FOLDERS || files.length >= SAFETY_FILES) {
        truncated = true;
        break;
      }
      seenFolder.add(item.id);
      if (!parentOf.has(item.id)) parentOf.set(item.id, item.parentId);
      const listed = await listChildren(token, item.id);
      if (!listed.ok) {
        folderIssues.push({ id: item.id, name: item.name, status: listed.status });
        markIncomplete(item.id);
        continue;
      }
      foldersRead += 1;
      foldersOk.push(item.id);
      folders.push({ id: item.id, name: item.name, parentId: item.parentId });
      for (const child of listed.files) {
        if (child.id === DRIVE_DO_NOT_INDEX.id || child.name === ".obsidian") {
          skipFolder.add(child.id);
          continue;
        }
        let mime = child.mimeType;
        let id = child.id;
        const name = child.name;
        if (mime === SHORTCUT_MIME) {
          const targetId = child.shortcutDetails?.targetId;
          const targetMime = child.shortcutDetails?.targetMimeType;
          if (targetId && (targetId === DRIVE_DO_NOT_INDEX.id || name === ".obsidian")) {
            skipFolder.add(targetId);
            continue;
          }
          if (targetId && targetMime === FOLDER_MIME) {
            if (!skipFolder.has(targetId)) queue.push({ id: targetId, name, parentId: item.id });
            continue;
          }
          if (targetId) {
            id = targetId;
            mime = targetMime || DOCUMENT_MIME;
          }
        }
        if (mime === FOLDER_MIME) {
          if (!skipFolder.has(id)) queue.push({ id, name, parentId: item.id });
          continue;
        }
        // PDF, google-apps.document / spreadsheet / shortcut resolvido e o resto que não é pasta.
        if (!isDriveFileMime(mime) || SKIP_NAMES.test(name) || seenFile.has(id)) continue;
        if (files.length >= SAFETY_FILES) {
          truncated = true;
          break;
        }
        seenFile.add(id);
        files.push({
          id,
          name,
          folder: item.name,
          folderId: item.id,
          modifiedAt: child.modifiedTime || "",
          webViewLink: child.webViewLink || driveItemUrl(id, mime),
          mimeType: mime,
        });
      }
      if (truncated) break;
    }

    return {
      ok: true,
      configured: true,
      message: "",
      files,
      folders,
      foldersRead,
      foldersOk,
      incompleteFolders: [...incomplete],
      folderIssues,
      truncated,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "falha";
    return {
      ok: false,
      configured: true,
      message: `Credencial presente, mas a listagem falhou (${detail}). Nenhum arquivo foi inventado. Use a bandeja manual.`,
      files: [],
      folders: [],
      foldersRead: 0,
      foldersOk: [],
      incompleteFolders: [],
      folderIssues: [],
      truncated: false,
    };
  }
}

const EXPORT_CAP_BYTES = 2_000_000;

/**
 * Só Ata e Transcricoes, para o delta do Pedir leitura.
 * Não percorre Doctos, áudio nem o resto da árvore.
 */
export async function listAtaTranscriptFiles(): Promise<
  { ok: true; files: DriveListedFile[] } | { ok: false; message: string }
> {
  if (!isDriveConfigured()) return { ok: false, message: "Drive sem credencial." };
  try {
    const token = await accessToken();
    const roots = [DRIVE_FOLDERS.atas, DRIVE_FOLDERS.transcricoes];
    const skipFolder = new Set<string>([DRIVE_DO_NOT_INDEX.id]);
    const queue: { id: string; name: string }[] = roots.map((folder) => ({ id: folder.id, name: folder.name }));
    const seenFolder = new Set<string>();
    const seenFile = new Set<string>();
    const files: DriveListedFile[] = [];
    while (queue.length) {
      const item = queue.shift();
      if (!item || seenFolder.has(item.id) || skipFolder.has(item.id)) continue;
      seenFolder.add(item.id);
      const listed = await listChildren(token, item.id);
      if (!listed.ok) continue;
      for (const child of listed.files) {
        if (child.id === DRIVE_DO_NOT_INDEX.id || child.name === ".obsidian") continue;
        let mime = child.mimeType;
        let id = child.id;
        const name = child.name;
        if (mime === SHORTCUT_MIME) {
          const targetId = child.shortcutDetails?.targetId;
          const targetMime = child.shortcutDetails?.targetMimeType;
          if (!targetId || targetId === DRIVE_DO_NOT_INDEX.id) continue;
          if (targetMime === FOLDER_MIME) {
            queue.push({ id: targetId, name });
            continue;
          }
          id = targetId;
          mime = targetMime || DOCUMENT_MIME;
        }
        if (mime === FOLDER_MIME) {
          queue.push({ id, name });
          continue;
        }
        if (!isDriveFileMime(mime) || SKIP_NAMES.test(name) || seenFile.has(id)) continue;
        if (readingKind(name, mime) === "audio") continue;
        seenFile.add(id);
        files.push({
          id,
          name,
          folder: item.name,
          folderId: item.id,
          modifiedAt: child.modifiedTime || "",
          webViewLink: child.webViewLink || driveItemUrl(id, mime),
          mimeType: mime,
        });
      }
    }
    return { ok: true, files };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "falha";
    return { ok: false, message: detail };
  }
}

/** Google Doc exporta text/plain. Docx sai do ZIP. Áudio não é pedido. */
export async function exportDriveText(file: { id: string; name: string; mimeType: string }): Promise<string | null> {
  const kind = readingKind(file.name, file.mimeType);
  if (kind === "audio" || kind === "skip" || kind === "pdf") return null;
  if (!isDriveConfigured()) return null;
  try {
    const token = await accessToken();
    if (kind === "text" && file.mimeType === DOCUMENT_MIME) {
      const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export`);
      url.searchParams.set("mimeType", "text/plain");
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
      if (!res.ok) return null;
      const raw = await res.text();
      if (!raw.trim() || /^\s*</.test(raw)) return null;
      return clipReading(raw);
    }
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}`);
    url.searchParams.set("alt", "media");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.length || bytes.length > EXPORT_CAP_BYTES) return null;
    if (kind === "docx") {
      const text = textFromDocx(bytes);
      return text ? clipReading(text) : null;
    }
    const raw = bytes.toString("utf8");
    if (!raw.trim()) return null;
    return clipReading(raw);
  } catch {
    return null;
  }
}

export type SlidesText =
  | { ok: true; text: string }
  | { ok: false; message: string };

/** Frase curta da API. Não devolve o token. */
async function apiPhrase(res: Response): Promise<string> {
  const body = await res.text();
  try {
    const json = JSON.parse(body) as { error?: { message?: string } | string };
    if (typeof json.error === "string" && json.error.trim()) return json.error.trim();
    if (json.error && typeof json.error === "object" && json.error.message?.trim()) return json.error.message.trim();
  } catch {
    /* corpo não é JSON */
  }
  const line = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return line.slice(0, 240) || `export ${res.status}`;
}

type SlideTextEl = {
  shape?: { text?: { textElements?: Array<{ textRun?: { content?: string } }> } };
};

function slideElementText(elements: SlideTextEl[] | undefined): string {
  const parts: string[] = [];
  for (const el of elements ?? []) {
    for (const run of el.shape?.text?.textElements ?? []) {
      if (run.textRun?.content) parts.push(run.textRun.content);
    }
  }
  return parts.join("");
}

/** Notas do apresentador, só se o text/plain não vier. Áudio não entra. */
async function speakerNotesText(token: string, fileId: string): Promise<SlidesText> {
  const url = new URL(`https://slides.googleapis.com/v1/presentations/${encodeURIComponent(fileId)}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, message: await apiPhrase(res) };
  const doc = (await res.json()) as {
    slides?: Array<{
      pageElements?: SlideTextEl[];
      slideProperties?: { notesPage?: { pageElements?: SlideTextEl[] } };
    }>;
  };
  const chunks: string[] = [];
  for (const slide of doc.slides ?? []) {
    const body = slideElementText(slide.pageElements);
    const notes = slideElementText(slide.slideProperties?.notesPage?.pageElements);
    if (body.trim()) chunks.push(body);
    if (notes.trim()) chunks.push(notes);
  }
  const text = chunks.join("\n\n").trim();
  if (!text) return { ok: false, message: "apresentação sem texto" };
  return { ok: true, text: text.slice(0, 400_000) };
}

/**
 * Slides → text/plain. Se a exportação falhar ou vier vazia, tenta as notas.
 * Sem credencial, devolve a frase e não inventa corpo.
 */
export async function exportSlidesPlain(fileId: string): Promise<SlidesText> {
  if (!isDriveConfigured()) return { ok: false, message: "Drive sem credencial." };
  try {
    const token = await accessToken();
    const metaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    metaUrl.searchParams.set("fields", "mimeType,name");
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!metaRes.ok) return { ok: false, message: await apiPhrase(metaRes) };
    const meta = (await metaRes.json()) as { mimeType?: string; name?: string };
    const mime = meta.mimeType || "";
    const name = meta.name || "";
    if (readingKind(name, mime) === "audio" || mime.startsWith("audio/")) {
      return { ok: false, message: "áudio não é lido" };
    }
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    url.searchParams.set("mimeType", "text/plain");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) {
      const phrase = await apiPhrase(res);
      const notes = await speakerNotesText(token, fileId);
      if (notes.ok) return notes;
      return { ok: false, message: phrase };
    }
    const raw = await res.text();
    if (!raw.trim() || /^\s*</.test(raw)) {
      const notes = await speakerNotesText(token, fileId);
      if (notes.ok) return notes;
      return { ok: false, message: notes.message };
    }
    return { ok: true, text: raw.slice(0, 400_000) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "falha" };
  }
}
