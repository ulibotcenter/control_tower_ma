"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DecisionForm({ deals }: { deals: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      dealId: String(form.get("dealId") || "") || null,
      who: String(form.get("who")),
      whoLabel: String(form.get("whoLabel") || ""),
      date: String(form.get("date")),
      elevaRecommendation: String(form.get("elevaRecommendation")),
      decisionTaken: String(form.get("decisionTaken")),
      againstRecommendation: form.get("against") === "on",
      consequence: String(form.get("consequence")),
    };
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.message || "Não foi possível gravar a decisão no banco.");
        return;
      }
      router.push("/decisions");
      router.refresh();
    } catch {
      setError("Falha de rede ao gravar a decisão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-2xl gap-4 paper p-5">
      <div>
        <label htmlFor="dealId">Deal</label>
        <select id="dealId" name="dealId">
          <option value="">Programa (os dois)</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="who">Quem</label>
          <select id="who" name="who" required>
            <option value="board">Board AD+R</option>
            <option value="eleva">Eleva</option>
            <option value="pacta">Pacta</option>
          </select>
        </div>
        <div>
          <label htmlFor="whoLabel">Nome na ata (opcional)</label>
          <input id="whoLabel" name="whoLabel" placeholder="Camila / Matheus" />
        </div>
      </div>
      <div>
        <label htmlFor="date">Data</label>
        <input id="date" name="date" type="date" required />
      </div>
      <div>
        <label htmlFor="elevaRecommendation">Recomendação da Eleva</label>
        <textarea id="elevaRecommendation" name="elevaRecommendation" rows={3} required />
      </div>
      <div>
        <label htmlFor="decisionTaken">Decisão tomada</label>
        <textarea id="decisionTaken" name="decisionTaken" rows={3} required />
      </div>
      <label className="flex items-center gap-2 normal-case tracking-normal text-[15px] text-ink">
        <input name="against" type="checkbox" className="h-4 w-4" />
        Foi contra a recomendação da Eleva
      </label>
      <div>
        <label htmlFor="consequence">Consequência</label>
        <textarea id="consequence" name="consequence" rows={3} required />
      </div>
      {error && <p className="text-sm text-alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn">
        {busy ? "Gravando…" : "Registrar"}
      </button>
    </form>
  );
}
