"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const TYPES = [
  { id: "nda", label: "NDA" },
  { id: "ata", label: "Ata" },
  { id: "transcricao", label: "Transcrição" },
  { id: "contrato", label: "Contrato" },
  { id: "financeiro", label: "Financeiro" },
  { id: "outro", label: "Outro" },
];

const STATUSES = [
  { id: "rascunho", label: "Rascunho / minuta" },
  { id: "assinado", label: "Assinado" },
  { id: "vigente", label: "Vigente" },
  { id: "vencido", label: "Vencido" },
];

export function ClassifyForm({
  id,
  already,
  deals,
  workstreams,
}: {
  id: string;
  already: boolean;
  deals: { id: string; name: string; slug: string }[];
  workstreams: { dealId: string; slug: string; name: string }[];
}) {
  const router = useRouter();
  const [dealId, setDealId] = useState(deals[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useMemo(
    () => workstreams.filter((w) => w.dealId === dealId),
    [workstreams, dealId],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (!data.workstreamSlug) {
      setBusy(false);
      setError("Escolha a frente. Sem workstream o arquivo não entra no checklist.");
      return;
    }
    const res = await fetch(`/api/inbox/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Não foi possível classificar.");
      return;
    }
    const slug = deals.find((d) => d.id === String(data.dealId))?.slug ?? "loopert";
    router.push(`/deals/${slug}#checklist`);
    router.refresh();
  }

  if (already) {
    return <p className="mt-6 text-sm">Este arquivo já foi classificado.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-xl gap-4 paper p-5">
      <div>
        <label htmlFor="dealId">Deal</label>
        <select id="dealId" name="dealId" value={dealId} onChange={(e) => setDealId(e.target.value)}>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="type">Tipo</label>
        <select id="type" name="type" required>
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="workstreamSlug">Workstream</label>
        <select id="workstreamSlug" name="workstreamSlug" required>
          <option value="">Escolha a frente</option>
          {ws.map((w) => (
            <option key={w.slug} value={w.slug}>
              {w.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="status">Status do documento</label>
        <select id="status" name="status" required>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[13px] text-muted">
        O arquivo entra no checklist como <strong>em andamento</strong>. Mesmo que o nome diga
        &quot;assinado&quot;, o item não é concluído e o semáforo não muda sozinho.
      </p>
      {error && <p className="text-sm text-alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn">
        {busy ? "Salvando…" : "Classificar (entra no checklist, sem concluir)"}
      </button>
    </form>
  );
}
