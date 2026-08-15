"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SHORTCUTS, isTypingTarget } from "@/lib/shortcuts";
import { toast } from "@/lib/toast";
import { openOnboarding } from "./onboarding";

export function Shortcuts({ present, allowTour = true }: { present: boolean; allowTour?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

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
      if (e.key === "1") {
        e.preventDefault();
        if (!path.startsWith("/deals/loopert")) router.push("/deals/loopert");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        if (!path.startsWith("/deals/radio-health")) router.push("/deals/radio-health");
        return;
      }
      if (e.key === "p" || e.key === "P") {
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
  }, [path, present, router]);

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
        className="min-h-11 min-w-11 rounded-sm border border-white/25 px-2 py-1 text-[12px] text-cream hover:text-white sm:min-h-0 sm:min-w-0"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Atalhos de teclado e como usar"
        title="Atalhos · ?"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Atalhos"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-72 paper p-3 text-ink shadow-lg"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c2410c]">
            Atalhos
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between gap-3">
                <span>{s.action}</span>
                <kbd className="kbd">{s.keys}</kbd>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <Link
              href="/glossary"
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
