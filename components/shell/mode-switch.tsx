"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODE_META } from "@/lib/mode-meta";
import { toast } from "@/lib/toast";
import type { MeetingMode } from "@/lib/types";

const OPTIONS: MeetingMode[] = ["operate", "advisors", "target"];

export function ModeSwitch({ mode }: { mode: MeetingMode }) {
  const router = useRouter();
  const [pending, setPending] = useState<MeetingMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmId = useId();

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
      const line = `Modo ${MODE_META[next].label}.`;
      setLive(`${line} ${MODE_META[next].shareLine}`);
      toast(line);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function onPick(next: MeetingMode) {
    if (next === mode || busy) return;
    if (next === "target") {
      setPending("target");
      return;
    }
    void apply(next);
  }

  function onRadioKey(e: React.KeyboardEvent, current: MeetingMode) {
    const i = OPTIONS.indexOf(current);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onPick(OPTIONS[(i + 1) % OPTIONS.length]);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onPick(OPTIONS[(i - 1 + OPTIONS.length) % OPTIONS.length]);
    }
  }

  useEffect(() => {
    if (pending !== "target") return;
    const node = dialogRef.current;
    const first = node?.querySelector<HTMLButtonElement>("[data-confirm]");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPending(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  return (
    <div className="relative no-print">
      <div className="hdr-seg" role="radiogroup" aria-label="Modo de tela">
        {OPTIONS.map((id) => {
          const opt = MODE_META[id];
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              data-mode={id}
              aria-checked={active}
              aria-label={`${opt.label}. ${opt.hint}`}
              title={opt.hint}
              onClick={() => onPick(id)}
              onKeyDown={(e) => onRadioKey(e, id)}
              disabled={busy}
              className="min-h-11 sm:min-h-0"
            >
              <span className="md:hidden">{opt.short}</span>
              <span className="hidden md:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {live || MODE_META[mode].audience}
      </p>

      {pending === "target" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4"
          role="presentation"
          onClick={() => !busy && setPending(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmId}
            className="w-full max-w-md paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="kicker">Confirmação</p>
            <h2 id={confirmId} className="serif mt-2 text-2xl text-navy">
              Ligar modo Alvo?
            </h2>
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
                className="px-3 py-2 text-sm text-muted hover:text-navy"
                onClick={() => setPending(null)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="button"
                data-confirm
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
