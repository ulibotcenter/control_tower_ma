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

export function DriveSyncButton({ variant = "nav" }: { variant?: "nav" | "page" }) {
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
      const files = data.files ?? [];
      if (files.length === 0) {
        toast(data.message || "Nada novo no Drive", "ok");
        return;
      }
      window.dispatchEvent(new CustomEvent(DRIVE_REVIEW_EVENT, { detail: { files } }));
    } catch {
      toast("Falha ao atualizar o Drive.", "err");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "page") {
    return (
      <button type="button" className="btn" onClick={run} disabled={busy}>
        {busy ? "Lendo o Drive…" : "Atualizar Drive"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="hdr-btn"
      onClick={run}
      disabled={busy}
      title="Ler a pasta do Drive. Arquivo novo cai na bandeja, a classificar."
    >
      {busy ? "Drive…" : "Atualizar Drive"}
    </button>
  );
}
