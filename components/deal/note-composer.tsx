"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function NoteComposer({ dealSlug }: { dealSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setBusy(true);
    setError(null);
    const form = new FormData(formEl);
    let res: Response;
    try {
      res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealSlug,
          body: String(form.get("body") || ""),
          visibility: String(form.get("visibility") || "operate"),
        }),
      });
    } catch {
      setError("Falha de rede.");
      setBusy(false);
      return;
    }

    let data: { message?: string } = {};
    try {
      data = (await res.json()) as { message?: string };
    } catch {
      data = {};
    }
    if (!res.ok) {
      setError(data.message || "Não foi possível gravar a nota.");
      setBusy(false);
      return;
    }
    toast("Nota registrada.");
    formEl.reset();
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="note-compose no-print">
      <label htmlFor="nova-nota">Nova nota</label>
      <textarea id="nova-nota" name="body" rows={3} required maxLength={4000} />
      <div className="note-compose-row">
        <label className="sr-only" htmlFor="nota-vis">
          Quem vê
        </label>
        <select id="nota-vis" name="visibility" defaultValue="operate" aria-label="Quem vê a nota">
          <option value="operate">Operar</option>
          <option value="advisors">Assessores</option>
          <option value="target">Alvo</option>
        </select>
        <button type="submit" className="btn btn-soft" disabled={busy}>
          {busy ? "Gravando…" : "Guardar nota"}
        </button>
      </div>
      {error ? <p className="text-sm text-alert">{error}</p> : null}
    </form>
  );
}
