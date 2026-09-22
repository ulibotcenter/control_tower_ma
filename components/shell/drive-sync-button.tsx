"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestAiReading } from "@/components/ai/request-reading";
import { toast } from "@/lib/toast";

export type DriveReviewItem = {
  id: string;
  name: string;
  folder: string;
  date: string;
  driveUrl: string | null;
};

export const DRIVE_REVIEW_EVENT = "ct-drive-review";
export const DRIVE_SYNCED_EVENT = "ct-drive-synced";
export const DRIVE_SYNCED_KEY = "ct-drive-synced-at";

export function readStoredDriveSyncedAt(): string | null {
  try {
    const raw = localStorage.getItem(DRIVE_SYNCED_KEY);
    return raw && !Number.isNaN(Date.parse(raw)) ? raw : null;
  } catch {
    return null;
  }
}

function rememberSyncedAt(iso: string) {
  try {
    localStorage.setItem(DRIVE_SYNCED_KEY, iso);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent(DRIVE_SYNCED_EVENT, { detail: { syncedAt: iso } }));
}

export function DriveSyncButton({
  variant = "nav",
  readDeals = [],
  readFocus = null,
}: {
  variant?: "nav" | "page" | "work";
  readDeals?: string[];
  readFocus?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [alsoRead, setAlsoRead] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/drive/sync", { method: "POST" });
      const data = (await res.json()) as {
        configured?: boolean;
        ok?: boolean;
        message?: string;
        files?: DriveReviewItem[];
        missing?: unknown[];
        folderIssues?: { status?: number }[];
        ata?: { errors?: number } | null;
        ataMessage?: string | null;
        error?: string;
        syncedAt?: string | null;
      };
      if (!res.ok) {
        toast(data.error === "unauthorized" ? "Sessão expirada." : "Falha ao atualizar o Drive.", "err");
        return;
      }
      if (!data.configured) {
        toast(data.message || "API do Google não configurada. Use a bandeja manual.", "warn");
        return;
      }
      if (!data.ok) {
        toast(data.message || "Falha ao atualizar o Drive.", "err");
        return;
      }
      const attention =
        (data.folderIssues?.length ?? 0) > 0 ||
        (data.missing?.length ?? 0) > 0 ||
        (data.ata?.errors ?? 0) > 0;
      toast(data.message || "Drive atualizado", attention ? "warn" : "ok");
      if (data.syncedAt) rememberSyncedAt(data.syncedAt);
      const files = data.files ?? [];
      if (files.length) {
        window.dispatchEvent(new CustomEvent(DRIVE_REVIEW_EVENT, { detail: { files } }));
      }
      if (alsoRead) await readAfterSync(readFocus ? [readFocus] : readDeals, router);
    } catch {
      toast("Falha ao atualizar o Drive.", "err");
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "Lendo o Drive…" : variant === "work" ? "Sincronizar Drive" : "Atualizar Drive";

  const checkbox = (
    <label className="ai-also">
      <input
        type="checkbox"
        checked={alsoRead}
        onChange={(event) => setAlsoRead(event.target.checked)}
        disabled={busy}
      />
      também pedir leitura
    </label>
  );

  if (variant === "page") {
    return (
      <span className="ai-sync">
        <button type="button" className="btn" onClick={run} disabled={busy}>
          {label}
        </button>
        {checkbox}
      </span>
    );
  }

  return (
    <span className="ai-sync">
      <button
        type="button"
        className={variant === "work" ? "work-btn" : "hdr-btn"}
        onClick={run}
        disabled={busy}
        title="Ler a árvore do Drive. Arquivo novo cai na bandeja, a classificar."
      >
        {busy ? "Drive…" : variant === "work" ? "Sincronizar Drive" : "Atualizar Drive"}
      </button>
      {checkbox}
    </span>
  );
}

async function readAfterSync(slugs: string[], router: { refresh: () => void }) {
  if (!slugs.length) {
    toast("Sync feito. Sem deal para a leitura.", "warn");
    return;
  }
  let any = false;
  for (const slug of slugs) {
    const ai = await requestAiReading(slug);
    if (!ai.configured) {
      toast("IA não configurada", "warn");
      return;
    }
    if (ai.error) {
      toast(ai.error, "err");
      return;
    }
    any = any || ai.count > 0;
    toast(ai.count ? `${ai.count} propostas para revisar.` : ai.message || "Nenhuma proposta.", ai.count ? "ok" : "warn");
  }
  if (any) router.refresh();
}
