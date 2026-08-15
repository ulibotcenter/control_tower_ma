"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

export function PresentSwitch({ on }: { on: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = !on;
      await fetch("/api/present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: next }),
      });
      toast(next ? "Modo apresentação ligado." : "Modo apresentação desligado.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-keyshortcuts="P"
      aria-label={on ? "Sair do modo apresentação" : "Entrar no modo apresentação"}
      title="Esconde operação e deixa a tela limpa para o board. Atalho P."
      className={`no-print min-h-11 whitespace-nowrap rounded-sm px-2.5 py-1 text-[12px] sm:min-h-0 ${
        on ? "bg-cyan text-navy font-semibold" : "border border-white/25 text-cream hover:text-white"
      }`}
    >
      {on ? "Sair da apresentação" : "Apresentação"}
    </button>
  );
}
