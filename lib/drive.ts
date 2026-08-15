import { DRIVE_FOLDERS, DRIVE_ROOT_FILES, fileUrl, folderUrl } from "./constants";
import { isDriveConfigured } from "./config";

export type DriveStatus = {
  configured: boolean;
  reason: string;
  rootUrl: string;
  folders: { name: string; url: string }[];
  rootFiles: { name: string; url: string }[];
};

export function getDriveStatus(): DriveStatus {
  return {
    configured: isDriveConfigured(),
    reason: isDriveConfigured()
      ? "Credencial presente — o poll ainda precisa ser ligado no job /api/drive/sync."
      : "API do Google não configurada. A torre não está lendo o Drive. Use a bandeja manual e os links das pastas.",
    rootUrl: folderUrl(DRIVE_FOLDERS.root.id),
    folders: Object.values(DRIVE_FOLDERS)
      .filter((f) => f.id !== DRIVE_FOLDERS.root.id)
      .map((f) => ({ name: f.name, url: folderUrl(f.id) })),
    rootFiles: DRIVE_ROOT_FILES.map((f) => ({ name: f.name, url: fileUrl(f.id) })),
  };
}

/** Placeholder: never pretends to have listed the Drive. */
export async function listNewDriveFiles(): Promise<{
  ok: false;
  configured: boolean;
  message: string;
}> {
  return {
    ok: false,
    configured: isDriveConfigured(),
    message: isDriveConfigured()
      ? "Credencial detectada, mas o conector de listagem ainda não foi implementado neste corte. Não há sync automático."
      : "Sem GOOGLE_SERVICE_ACCOUNT / OAuth. Nenhum arquivo novo foi lido do Drive.",
  };
}
