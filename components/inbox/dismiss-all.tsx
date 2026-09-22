"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function DismissInboxButton({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!ids.length) return null;

  async function run() {
    const n = ids.length;
    if (!window.confirm(n === 1 ? "Dispensar este arquivo da lista?" : `Dispensar os ${n} da lista?`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/inbox/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json().catch(() => ({}))) as { count?: number; error?: string };
      if (!res.ok) {
        toast(data.error === "unauthorized" ? "Sessão expirada." : "Não foi possível dispensar.", "err");
        return;
      }
      const count = data.count ?? n;
      toast(count === 1 ? "1 dispensado." : `${count} dispensados.`);
      router.refresh();
    } catch {
      toast("Não foi possível dispensar.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-line" onClick={run} disabled={busy}>
      {busy ? "Dispensando…" : "Já vi / dispensar todos"}
    </button>
  );
}
