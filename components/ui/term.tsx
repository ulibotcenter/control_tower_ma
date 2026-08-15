"use client";

import { useEffect, useRef, useState } from "react";
import { GLOSSARY } from "@/lib/glossary";

export function Term({ id, children }: { id: keyof typeof GLOSSARY; children?: React.ReactNode }) {
  const entry = GLOSSARY[id];
  const [first, setFirst] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const key = `ct-term-${id}`;
    if (!sessionStorage.getItem(key)) {
      setFirst(true);
      sessionStorage.setItem(key, "1");
    }
  }, [id]);

  useEffect(() => {
    if (!first && !open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setFirst(false);
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [first, open]);

  if (!entry) return <>{children}</>;

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        type="button"
        className="underline decoration-dotted decoration-gold underline-offset-4"
        onClick={() => {
          setOpen((v) => !v);
          setFirst(false);
        }}
        aria-expanded={open || first}
      >
        {children ?? entry.term}
      </button>
      {(first || open) && (
        <span className="absolute left-0 top-[1.45em] z-40 w-64 max-w-[80vw] paper px-3 py-2 text-[13px] leading-snug text-ink shadow-md">
          <span className="kicker block mb-1">{entry.term}</span>
          {entry.def}
        </span>
      )}
    </span>
  );
}
