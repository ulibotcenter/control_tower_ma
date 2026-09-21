import { createSign } from "crypto";
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
};

export type DriveFolderIssue = {
  id: string;
  name: string;
  status: number;
};

export type DriveScanResult = {
  ok: boolean;
  configured: boolean;
  message: string;
  files: DriveListedFile[];
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
const SKIP_NAMES = /^(icon\r?|\.ds_store|~\$.*)$/i;
const SAFETY_FOLDERS = 400;
const SAFETY_FILES = 5000;

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
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,modifiedTime,parents,webViewLink)");
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
}): string {
  const novo = input.created === 1 ? "1 novo" : `${input.created} novos`;
  const atualizado = input.updated === 1 ? "1 atualizado" : `${input.updated} atualizados`;
  const pastas = input.foldersRead === 1 ? "1 pasta lida" : `${input.foldersRead} pastas lidas`;
  const parts = [`${novo}, ${atualizado}, ${pastas}`];
  const notFound = input.folderIssues.filter((folder) => folder.status === 404);
  if (notFound.length) {
    parts.push(`Pasta não encontrada: ${notFound.map((folder) => `${folder.name} (404)`).join(", ")}`);
  }
  const other = input.folderIssues.filter((folder) => folder.status !== 404);
  if (other.length) {
    parts.push(other.map((folder) => `${folder.name} falhou (${folder.status})`).join(", "));
  }
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
      for (const child of listed.files) {
        if (child.id === DRIVE_DO_NOT_INDEX.id || child.name === ".obsidian") {
          skipFolder.add(child.id);
          continue;
        }
        if (child.mimeType === FOLDER_MIME) {
          if (!skipFolder.has(child.id)) queue.push({ id: child.id, name: child.name, parentId: item.id });
          continue;
        }
        if (SKIP_NAMES.test(child.name) || seenFile.has(child.id)) continue;
        if (files.length >= SAFETY_FILES) {
          truncated = true;
          break;
        }
        seenFile.add(child.id);
        files.push({
          id: child.id,
          name: child.name,
          folder: item.name,
          folderId: item.id,
          modifiedAt: child.modifiedTime || "",
          webViewLink: child.webViewLink || fileUrl(child.id),
        });
      }
      if (truncated) break;
    }

    return {
      ok: true,
      configured: true,
      message: "",
      files,
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
      foldersRead: 0,
      foldersOk: [],
      incompleteFolders: [],
      folderIssues: [],
      truncated: false,
    };
  }
}
