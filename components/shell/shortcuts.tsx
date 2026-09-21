"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isTypingTarget, keyboardNavEnabled, shortcutsFor } from "@/lib/shortcuts";
import { toast } from "@/lib/toast";
import type { MeetingMode } from "@/lib/types";
import { focusSlugFromQuery, hrefWithDeal } from "./focus-deal";
import { openOnboarding } from "./onboarding";

export function Shortcuts({
  present,
  mode,
  allowTour = true,
}: {
  present: boolean;
  mode: MeetingMode;
  allowTour?: boolean;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const fromDeal = path.match(/^\/deals\/([^/]+)/)?.[1] ?? null;
  const focus = focusSlugFromQuery(fromDeal) ?? focusSlugFromQuery(params.get("deal"));
  const glossaryHref = focus ? hrefWithDeal("/glossary", focus) : "/glossary";
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; right: number } | null>(null);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const navKeys = keyboardNavEnabled(mode);
  const list = shortcutsFor(mode);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      // Modo Alvo: 1, 2 e P não respondem. Nada de trocar a tela no teclado
      // no meio de uma reunião com o alvo na sala.
      if (e.key === "1") {
        if (!navKeys) return;
        e.preventDefault();
        if (!path.startsWith("/deals/loopert")) router.push("/deals/loopert");
        return;
      }
      if (e.key === "2") {
        if (!navKeys) return;
        e.preventDefault();
        if (!path.startsWith("/deals/radio-health")) router.push("/deals/radio-health");
        return;
      }
      if (e.key === "p" || e.key === "P") {
        if (!navKeys) return;
        e.preventDefault();
        void togglePresent(!present).then(() => {
          toast(!present ? "Modo apresentação ligado." : "Modo apresentação desligado.");
          router.refresh();
        });
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        const box = document.querySelector<HTMLInputElement>("[data-search]");
        if (box) {
          box.focus();
          box.select();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [path, present, router, navKeys]);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative no-print" ref={wrapRef}>
      <button
        type="button"
        className="hdr-btn no-print min-h-11 min-w-11 sm:min-h-0 sm:min-w-8"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Atalhos de teclado e como usar"
        title="Atalhos · ?"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && box && (
        <div
          id={panelId}
          role="region"
          aria-label="Atalhos"
          className="w-72 paper p-3 text-ink shadow-lg"
          style={{ position: "fixed", top: box.top, right: box.right, zIndex: 80 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
            Atalhos
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {list.map((s) => (
              <li key={s.keys} className="flex items-center justify-between gap-3">
                <span>{s.action}</span>
                <kbd className="kbd">{s.keys}</kbd>
              </li>
            ))}
          </ul>
          {!navKeys && (
            <p className="mt-2 text-[12px] leading-snug text-muted">
              Modo Alvo: 1, 2 e P estão desligados. Trocar de operação ou de modo só pelo seletor,
              com confirmação.
            </p>
          )}
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <Link
              href={glossaryHref}
              className="text-[13px] font-semibold text-navy underline-offset-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              Glossário de termos
            </Link>
            {allowTour && (
              <button
                type="button"
                className="text-[13px] font-semibold text-navy underline-offset-2 hover:underline"
                onClick={() => {
                  setOpen(false);
                  openOnboarding();
                }}
              >
                Como usar a torre
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

async function togglePresent(on: boolean) {
  await fetch("/api/present", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ on }),
  });
}
