"use client";

import { useState } from "react";

export function PackButton({
  disabled,
  driveConfigured,
}: {
  disabled: boolean;
  driveConfigured: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  async function publish() {
    const res = await fetch("/api/export/pack", { method: "POST" });
    if (!res.ok) {
      setMsg("Não foi possível gerar o pack. Confirme que está no modo Operar.");
      return;
    }
    const data = (await res.json()) as { ok: boolean; markdown: string; message: string };
    if (!data.markdown) {
      setMsg(data.message || "Pack vazio.");
      return;
    }
    const blob = new Blob([data.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `control-tower-pack-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg(data.message);
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={disabled}
        onClick={publish}
        className="bg-gold px-5 py-2.5 font-semibold text-navy disabled:opacity-40"
      >
        Baixar pack (.md)
      </button>
      <p className="mt-2 text-[13px] text-muted">
        {driveConfigured
          ? "Credencial presente — o upload em Control Tower/Exports/ ainda é placeholder neste corte. O markdown baixa localmente."
          : "Drive não está gravando. O markdown baixa neste computador. Quando a API existir, o mesmo botão cria o arquivo em Control Tower/Exports/."}
      </p>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
