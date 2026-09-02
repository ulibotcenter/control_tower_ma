import { createSign } from "crypto";
import {
  CORTE,
  DRIVE_DO_NOT_INDEX,
  DRIVE_FOLDERS,
  DRIVE_ROOT_FILES,
  fileUrl,
  folderUrl,
} from "./constants";
import { driveRootId, isDriveConfigured } from "./config";

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
  modifiedAt: string;
  webViewLink: string;
};

export type DriveListResult = {
  ok: boolean;
  configured: boolean;
  message: string;
  files: DriveListedFile[];
};

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SKIP_NAMES = /^(icon\r?|\.ds_store|~\$.*)$/i;
const MAX_FOLDERS = 24;
const MAX_FILES = 200;

export function getDriveStatus(): DriveStatus {
  return {
    configured: isDriveConfigured(),
    reason: isDriveConfigured()
      ? "Credencial presente. O botão Atualizar Drive e o cron de sexta leem a pasta; arquivo novo cai na bandeja, a classificar."
      : "API do Google não configurada. A torre não está lendo o Drive. Use a bandeja manual e os links das pastas.",
    rootUrl: folderUrl(DRIVE_FOLDERS.root.id),
    folders: Object.values(DRIVE_FOLDERS)
      .filter((f) => f.id !== DRIVE_FOLDERS.root.id)
      .map((f) => ({ name: f.name, url: folderUrl(f.id) })),
    rootFiles: DRIVE_ROOT_FILES.map((f) => ({ name: f.name, url: fileUrl(f.id) })),
  };
}

function folderLabel(parentId: string | undefined) {
  if (!parentId) return DRIVE_FOLDERS.root.name;
  const known = Object.values(DRIVE_FOLDERS).find((f) => f.id === parentId);
  return known?.name ?? DRIVE_FOLDERS.root.name;
}

function corteIso() {
  const m = CORTE.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "2026-09-02T00:00:00.000Z";
  return `${m[3]}-${m[2]}-${m[1]}T00:00:00.000Z`;
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

async function listChildren(token: string, parentId: string): Promise<GFile[]> {
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
    if (!res.ok) throw new Error(json.error?.message || `drive ${res.status}`);
    files.push(...(json.files ?? []));
    page = json.nextPageToken;
  } while (page && files.length < MAX_FILES);
  return files;
}

/**
 * Lista arquivos modificados depois do corte (ou do watermark) na pasta raiz.
 * Não indexa .obsidian. Não inventa arquivo. Não torna a pasta pública.
 */
export async function listNewDriveFiles(input?: {
  knownIds?: Set<string>;
  since?: string;
}): Promise<DriveListResult> {
  if (!isDriveConfigured()) {
    return {
      ok: false,
      configured: false,
      message: "API do Google não configurada. Use a bandeja manual.",
      files: [],
    };
  }

  try {
    const token = await accessToken();
    const root = driveRootId();
    const since = input?.since || corteIso();
    const known = input?.knownIds ?? new Set<string>();
    const skipFolder = new Set<string>([DRIVE_DO_NOT_INDEX.id]);
    const queue = [root];
    const seenFolder = new Set<string>();
    const found: DriveListedFile[] = [];

    while (queue.length && seenFolder.size < MAX_FOLDERS && found.length < MAX_FILES) {
      const folderId = queue.shift();
      if (!folderId || seenFolder.has(folderId) || skipFolder.has(folderId)) continue;
      seenFolder.add(folderId);
      const children = await listChildren(token, folderId);
      for (const child of children) {
        if (child.id === DRIVE_DO_NOT_INDEX.id || child.name === ".obsidian") {
          skipFolder.add(child.id);
          continue;
        }
        if (child.mimeType === FOLDER_MIME) {
          queue.push(child.id);
          continue;
        }
        if (SKIP_NAMES.test(child.name)) continue;
        if (known.has(child.id)) continue;
        const modified = child.modifiedTime ?? "";
        if (modified && modified <= since) continue;
        found.push({
          id: child.id,
          name: child.name,
          folder: folderLabel(child.parents?.[0] ?? folderId),
          modifiedAt: modified || new Date().toISOString(),
          webViewLink: child.webViewLink || fileUrl(child.id),
        });
        if (found.length >= MAX_FILES) break;
      }
    }

    return {
      ok: true,
      configured: true,
      message:
        found.length === 0
          ? "Nada novo no Drive."
          : `${found.length} arquivo${found.length === 1 ? "" : "s"} novo${found.length === 1 ? "" : "s"} na bandeja, a classificar.`,
      files: found,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "falha";
    return {
      ok: false,
      configured: true,
      message: `Credencial presente, mas a listagem falhou (${detail}). Nenhum arquivo foi inventado. Use a bandeja manual.`,
      files: [],
    };
  }
}
