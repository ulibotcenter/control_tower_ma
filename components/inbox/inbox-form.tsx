"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function InboxForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setError(
        data.error === "drive_url"
          ? "Cole um link do Google Drive (drive.google.com), ou deixe em branco."
          : data.message || "Não foi possível registrar.",
      );
      return;
    }
    form.reset();
    toast("Arquivo registrado na bandeja.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 paper p-5">
      <p className="kicker">Registrar arquivo</p>
      <p className="mt-1 text-sm text-muted">
        Use enquanto o Drive não está lendo. Cole só um link do Google Drive, ou deixe em branco.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name">Nome do arquivo</label>
          <input id="name" name="name" required placeholder="NDA ADR-Loopert - minuta.pdf" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="driveUrl">URL do Google Drive (opcional)</label>
          <input
            id="driveUrl"
            name="driveUrl"
            placeholder="https://drive.google.com/file/d/…/view"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn mt-4"
      >
        {busy ? "Registrando…" : "Registrar na bandeja"}
      </button>
    </form>
  );
}
