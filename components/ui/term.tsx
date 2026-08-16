"use client";

import { useEffect, useId, useRef, useState } from "react";
import { GLOSSARY, type GlossaryId } from "@/lib/glossary";

/**
 * Sigla com marca discreta. A definição é a mesma da página Glossário.
 * interactive={false} quando o termo está dentro de um <a>/<Link>.
 */
export function Term({
  id,
  children,
  interactive = true,
}: {
  id: GlossaryId;
  children?: React.ReactNode;
  interactive?: boolean;
}) {
  const entry = GLOSSARY[id];
  const tipId = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  if (!entry) return <>{children}</>;

  return (
    <span
      ref={ref}
      className={`term-mark${open ? " is-open" : ""}`}
      tabIndex={interactive ? 0 : undefined}
      aria-describedby={tipId}
      onClick={(e) => {
        if (!interactive) return;
        e.preventDefault();
        setOpen((v) => !v);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      <span className="term-word">{children ?? entry.term}</span>
      <span className="term-dot" aria-hidden>
        i
      </span>
      <span className="sr-only">. {entry.def}</span>
      <span id={tipId} role="tooltip" className="term-tip">
        <span className="term-tip-kicker">{entry.term}</span>
        {entry.def}
      </span>
    </span>
  );
}
