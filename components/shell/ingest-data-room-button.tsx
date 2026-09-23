"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

export function IngestDataRoomButton() {
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/drive/ingest", { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        configured?: boolean;
        ok?: boolean;
        toast?: string;
        failed?: number;
        error?: string;
      } | null;
      if (!data) {
        toast("Falha ao ingerir o data room.", "err");
        return;
      }
      if (!res.ok) {
        if (data.error === "unauthorized" || data.error === "idle") toast("Sessão expirada.", "err");
        else if (data.error === "hidden") toast("Só no modo Operar.", "err");
        else toast(data.toast || "Falha ao ingerir o data room.", "err");
        return;
      }
      if (!data.configured) {
        toast("Drive sem credencial", "warn");
        return;
      }
      if (!data.ok) {
        toast(data.toast || "Falha ao ingerir o data room.", "err");
        return;
      }
      toast(data.toast || "Falha ao ingerir o data room.", (data.failed ?? 0) > 0 ? "warn" : "ok");
    } catch {
      toast("Falha ao ingerir o data room.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="work-btn"
      onClick={run}
      disabled={busy}
      title="Grava texto do data room na memória. Não pede leitura."
    >
      {busy ? "Ingerindo…" : "Ingerir data room"}
    </button>
  );
}
