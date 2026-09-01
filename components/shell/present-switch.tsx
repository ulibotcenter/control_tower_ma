"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";

/** `quiet`: o alvo pode ler a tela — sem o tooltip que explica a encenação. */
export function PresentSwitch({ on, quiet = false }: { on: boolean; quiet?: boolean }) {
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
      aria-keyshortcuts={quiet ? undefined : "P"}
      aria-label={on ? "Sair do modo apresentação" : "Entrar no modo apresentação"}
      title={quiet ? undefined : "Esconde operação e deixa a tela limpa para o board. Atalho P."}
      className={
        quiet
          ? "hdr-btn no-print h-[1.6rem] px-2 text-[0.6875rem]"
          : `hdr-btn no-print min-h-11 sm:min-h-0 ${on ? "is-on" : ""}`
      }
    >
      {on ? "Sair da apresentação" : "Apresentação"}
    </button>
  );
}
