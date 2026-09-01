"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODE_META } from "@/lib/mode-meta";
import { TARGET_EXIT_PHRASE, type MeetingState } from "@/lib/meeting";
import { toast } from "@/lib/toast";
import type { MeetingMode } from "@/lib/types";

const OPTIONS: MeetingMode[] = ["operate", "advisors", "target"];

export type DealOption = { slug: string; name: string; priority: number };

export function ModeSwitch({ meeting, deals }: { meeting: MeetingState; deals: DealOption[] }) {
  const router = useRouter();
  const mode = meeting.mode;
  const [entering, setEntering] = useState(false);
  const [leavingTo, setLeavingTo] = useState<MeetingMode | null>(null);
  const [pickedDeal, setPickedDeal] = useState<string>(deals[0]?.slug ?? "");
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmId = useId();
  const phraseId = useId();

  const open = entering || leavingTo !== null;

  async function apply(next: MeetingMode, extra: { targetDeal?: string; confirm?: string } = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next, ...extra }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          data?.error === "confirm_required"
            ? `Digite exatamente ${TARGET_EXIT_PHRASE} para sair.`
            : data?.error === "target_deal_required"
              ? "Escolha qual operação está na sala."
              : "Não foi possível trocar de modo.",
        );
        return;
      }
      close();
      const line = `Modo ${MODE_META[next].label}.`;
      setLive(`${line} ${MODE_META[next].shareLine}`);
      toast(line);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setEntering(false);
    setLeavingTo(null);
    setPhrase("");
    setError(null);
  }

  function onPick(next: MeetingMode) {
    if (next === mode || busy) return;
    // Sair do Alvo nunca é um clique só: pede a frase por extenso.
    if (mode === "target") {
      setLeavingTo(next);
      return;
    }
    if (next === "target") {
      setEntering(true);
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
    if (!open) return;
    const node = dialogRef.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const lockedName = deals.find((d) => d.slug === meeting.targetDeal)?.name ?? meeting.targetDeal;
  const phraseOk = phrase.trim().toUpperCase() === TARGET_EXIT_PHRASE;

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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4"
          role="presentation"
          onClick={() => !busy && close()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmId}
            className="w-full max-w-md paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {entering ? (
              <>
                <p className="kicker">Confirmação</p>
                <h2 id={confirmId} className="serif mt-2 text-2xl text-navy">
                  Ligar modo Alvo?
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  Some o que o alvo não pode ver: preço, teses internas, pendências que não são
                  formais dele, bandeja e notas da Eleva. Ficam fase, documentos pedidos, checklist
                  formal e a timeline pública.
                </p>

                <fieldset className="mt-5">
                  <legend className="text-[15px] font-semibold text-alert">
                    Quem está na sala?
                  </legend>
                  <p className="mt-1 text-[13px] text-muted">
                    A reunião trava nesta operação. A outra some da tela até você sair do modo Alvo.
                  </p>
                  <div className="mt-3 space-y-2">
                    {deals.map((deal, i) => (
                      <label
                        key={deal.slug}
                        className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="target-deal"
                          value={deal.slug}
                          checked={pickedDeal === deal.slug}
                          onChange={() => setPickedDeal(deal.slug)}
                          data-autofocus={i === 0 ? "" : undefined}
                        />
                        <span>Estou apresentando {deal.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {error && (
                  <p className="mt-3 text-sm font-medium text-alert" role="alert">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm text-muted hover:text-navy"
                    onClick={close}
                    disabled={busy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="bg-alert px-4 py-2 text-sm font-semibold text-cream"
                    onClick={() => apply("target", { targetDeal: pickedDeal })}
                    disabled={busy || !pickedDeal}
                  >
                    {busy ? "Ligando…" : "Sim, alvo na sala"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="kicker">Sair do modo Alvo</p>
                <h2 id={confirmId} className="serif mt-2 text-2xl text-navy">
                  Voltar para {MODE_META[leavingTo ?? "operate"].label}?
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  A tela volta a mostrar preço, tese, quadro societário e notas internas
                  {lockedName ? ` — e a operação que não é ${lockedName}` : ""}. Faça isto só depois
                  que o alvo tiver saído da sala.
                </p>
                <div className="mt-5">
                  <label htmlFor={phraseId} className="text-[15px] font-semibold text-alert">
                    Digite {TARGET_EXIT_PHRASE} para confirmar
                  </label>
                  <input
                    id={phraseId}
                    data-autofocus
                    type="text"
                    value={phrase}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setPhrase(e.target.value)}
                    className="mt-2 w-full border border-line px-3 py-2 text-sm"
                    aria-describedby={`${phraseId}-hint`}
                  />
                  <p id={`${phraseId}-hint`} className="mt-1 text-[13px] text-muted">
                    Sem a frase exata a torre não troca de modo.
                  </p>
                </div>

                {error && (
                  <p className="mt-3 text-sm font-medium text-alert" role="alert">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm text-muted hover:text-navy"
                    onClick={close}
                    disabled={busy}
                  >
                    Continuar no Alvo
                  </button>
                  <button
                    type="button"
                    className="bg-alert px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50"
                    onClick={() => leavingTo && apply(leavingTo, { confirm: phrase })}
                    disabled={busy || !phraseOk}
                  >
                    {busy ? "Saindo…" : "Sair do modo Alvo"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
