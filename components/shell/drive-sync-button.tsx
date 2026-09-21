"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

export type DriveReviewItem = {
  id: string;
  name: string;
  folder: string;
  date: string;
  driveUrl: string | null;
};

export const DRIVE_REVIEW_EVENT = "ct-drive-review";

export function DriveSyncButton({ variant = "nav" }: { variant?: "nav" | "page" | "work" }) {
  const [busy, setBusy] = useState(false);

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
        error?: string;
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
      const attention = (data.folderIssues?.length ?? 0) > 0 || (data.missing?.length ?? 0) > 0;
      toast(data.message || "Drive atualizado", attention ? "warn" : "ok");
      const files = data.files ?? [];
      if (files.length) {
        window.dispatchEvent(new CustomEvent(DRIVE_REVIEW_EVENT, { detail: { files } }));
      }
    } catch {
      toast("Falha ao atualizar o Drive.", "err");
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "Lendo o Drive…" : variant === "work" ? "Sincronizar Drive" : "Atualizar Drive";

  if (variant === "page") {
    return (
      <button type="button" className="btn" onClick={run} disabled={busy}>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={variant === "work" ? "work-btn" : "hdr-btn"}
      onClick={run}
      disabled={busy}
      title="Ler a árvore do Drive. Arquivo novo cai na bandeja, a classificar."
    >
      {busy ? "Drive…" : variant === "work" ? "Sincronizar Drive" : "Atualizar Drive"}
    </button>
  );
}
