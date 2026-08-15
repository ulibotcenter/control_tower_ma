"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MeetingMode } from "@/lib/types";

const OPTIONS: { id: MeetingMode; label: string; hint: string }[] = [
  { id: "operate", label: "Operar", hint: "Eleva sozinha" },
  { id: "advisors", label: "Reunião · Assessores", hint: "AD+R + Pacta + João Amorim" },
  { id: "target", label: "Reunião · Alvo", hint: "Loopert ou Radio Health na sala" },
];

export function ModeSwitch({ mode }: { mode: MeetingMode }) {
  const router = useRouter();
  const [pending, setPending] = useState<MeetingMode | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply(next: MeetingMode) {
    setBusy(true);
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      if (!res.ok) return;
      setPending(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onPick(next: MeetingMode) {
    if (next === mode) return;
    if (next === "target") {
      setPending("target");
      return;
    }
    void apply(next);
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap rounded-sm border border-gold/40 bg-navy-2 p-0.5"
        role="radiogroup"
        aria-label="Modo de tela"
      >
        {OPTIONS.map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.hint}
              onClick={() => onPick(opt.id)}
              className={`px-2.5 py-1.5 text-[12px] sm:text-[13px] tracking-wide ${
                active
                  ? "bg-gold text-navy font-semibold"
                  : "text-cream/80 hover:text-cream"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {pending === "target" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4">
          <div className="w-full max-w-md paper p-6 shadow-xl">
            <p className="kicker">Confirmação</p>
            <h2 className="serif mt-2 text-2xl text-navy">Ligar modo Reunião · Alvo?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink">
              Some o que o alvo não pode ver: preço, teses internas, pendências que não são
              formais dele, bandeja e notas da Eleva. Ficam fase, documentos pedidos, checklist
              formal e a timeline pública.
            </p>
            <p className="mt-3 text-[15px] font-semibold text-alert">
              Confirme que Loopert ou Radio Health está — ou pode entrar — na sala.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-3 py-2 text-sm text-muted"
                onClick={() => setPending(null)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bg-alert px-4 py-2 text-sm font-semibold text-cream"
                onClick={() => apply("target")}
                disabled={busy}
              >
                {busy ? "Ligando…" : "Sim, alvo na sala"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
