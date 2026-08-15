"use client";

import { useEffect, useId, useRef, useState } from "react";
import { markOnboarded } from "@/lib/onboarding";

const STEPS = [
  {
    title: "O que é a Control Tower",
    body: "A tela compartilhada do programa Go Live. Status das duas operações, o que precisa de decisão e o que está atrasado. O Drive continua sendo a pasta dos arquivos — a torre não substitui o data room.",
  },
  {
    title: "Três modos de reunião",
    body: "Operar é só a Eleva, com tudo visível. Assessores é a mesa com AD+R, Pacta e João — sem notas internas. Alvo é quando Loopert ou Radio Health entra na sala: só fase, documentos pedidos e pendências formais.",
  },
  {
    title: "Modo apresentação",
    body: "Esconde bandeja, busca e edição. Use na reunião com o board. Atalho P. Se precisar enviar depois, use Exportar PDF — sai um documento limpo, sem botões.",
  },
];

export function Onboarding({ openOnMount }: { openOnMount: boolean }) {
  const [open, setOpen] = useState(openOnMount);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onReopen() {
      setOpen(true);
    }
    window.addEventListener("ct-onboarding", onReopen);
    return () => window.removeEventListener("ct-onboarding", onReopen);
  }, []);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLButtonElement>("[data-dismiss]")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    markOnboarded();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-navy/65 p-4"
      role="presentation"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg paper p-6 shadow-xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="kicker">Primeira visita</p>
        <h2 id={titleId} className="serif mt-2 text-2xl text-navy">
          Como ler esta tela
        </h2>
        <ol className="mt-5 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <p className="text-[13px] font-semibold text-navy">
                <span className="mr-2 text-[#c2410c]">{i + 1}.</span>
                {step.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">Não mostra de novo depois de fechar.</p>
          <button type="button" data-dismiss className="btn" onClick={dismiss}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

export function openOnboarding() {
  window.dispatchEvent(new Event("ct-onboarding"));
}
