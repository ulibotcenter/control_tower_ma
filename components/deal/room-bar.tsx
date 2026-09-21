"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PILLARS, type PillarSlug } from "@/lib/pillars";
import { toast } from "@/lib/toast";

const VISIBILITY = [
  { value: "operate", label: "Operar" },
  { value: "advisors", label: "Assessores" },
  { value: "target", label: "Alvo" },
] as const;

export function RoomBar({
  dealSlug,
  pillarSlug = null,
}: {
  dealSlug: string;
  pillarSlug?: PillarSlug | null;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<"opl" | "task">("opl");
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(next: "opl" | "task") {
    setKind(next);
    setError(null);
    setFormKey((key) => key + 1);
  }

  useEffect(() => {
    if (formKey === 0) return;
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, [formKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      dealSlug,
      title: String(form.get("title") || ""),
      owner: String(form.get("owner") || ""),
      due: String(form.get("due") || ""),
      pillarSlug: String(form.get("pillar") || "") || null,
      visibility: String(form.get("visibility") || "advisors"),
    };
    try {
      const res = await fetch(kind === "opl" ? "/api/open-points" : "/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data.message || "Não foi possível gravar.");
        return;
      }
      toast(kind === "opl" ? "Ponto em aberto registrado." : "Tarefa registrada.");
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
      router.refresh();
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="room-bar no-print">
        <button type="button" className="btn btn-primary" onClick={() => open("opl")}>
          + Ponto
        </button>
        <button type="button" className="btn" onClick={() => open("task")}>
          + Tarefa
        </button>
      </div>
      <dialog ref={dialogRef} className="room-dialog" aria-labelledby="room-dialog-title">
        <form key={formKey} onSubmit={onSubmit} className="grid gap-3">
          <h2 id="room-dialog-title" className="war-label">
            {kind === "opl" ? "Novo ponto" : "Nova tarefa"}
          </h2>
          <div>
            <label htmlFor="room-title">Descrição</label>
            <input id="room-title" name="title" required maxLength={280} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="room-owner">Responsável</label>
              <input id="room-owner" name="owner" maxLength={120} />
            </div>
            <div>
              <label htmlFor="room-due">Prazo</label>
              <input id="room-due" name="due" type="date" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="room-pillar">Pilar</label>
              <select id="room-pillar" name="pillar" defaultValue={pillarSlug ?? ""}>
                <option value="">Sem pilar</option>
                {PILLARS.map((pillar) => (
                  <option key={pillar.slug} value={pillar.slug}>
                    {pillar.short}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="room-visibility">Quem vê</label>
              <select id="room-visibility" name="visibility" defaultValue="advisors">
                {VISIBILITY.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p className="text-sm text-alert">{error}</p> : null}
          <div className="room-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Gravando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-quiet" onClick={() => dialogRef.current?.close()}>
              Cancelar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
