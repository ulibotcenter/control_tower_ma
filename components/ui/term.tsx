"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryId } from "@/lib/glossary";

/**
 * Sigla com marca discreta. A definição é a mesma da página Glossário.
 * interactive={false} quando o termo está dentro de um <a>/<Link>.
 * O balão aberto vai para document.body (position:fixed) para não ficar
 * atrás dos cards da home.
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
  const tipRef = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const open = interactive && (hover || pinned);

  const place = useCallback(() => {
    const anchor = ref.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    const ar = anchor.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    const gap = 8;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(tr.width, vw * 0.8);
    let left = ar.left;
    if (left + width > vw - pad) left = ar.right - width;
    if (left < pad) left = pad;
    let top = ar.bottom + gap;
    if (top + tr.height > vh - pad) top = ar.top - gap - tr.height;
    if (top < pad) top = pad;
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place, entry?.def]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setHover(false);
      }
    }
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false);
    }
    function onMove() {
      place();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, place]);

  if (!entry) return <>{children}</>;

  const tip =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className="term-tip is-portal"
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: "hidden" }}
          >
            <span className="term-tip-kicker">{entry.term}</span>
            {entry.def}
          </span>,
          document.body,
        )
      : null;

  return (
    <span
      ref={ref}
      className={`term-mark${open ? " is-open" : ""}`}
      tabIndex={interactive ? 0 : undefined}
      aria-describedby={open ? tipId : undefined}
      onMouseEnter={() => {
        if (interactive) setHover(true);
      }}
      onMouseLeave={() => setHover(false)}
      onFocus={() => {
        if (interactive) setHover(true);
      }}
      onBlur={() => setHover(false)}
      onClick={(e) => {
        if (!interactive) return;
        e.preventDefault();
        setPinned((v) => !v);
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPinned((v) => !v);
        }
      }}
    >
      {children ?? entry.term}
      <span className="sr-only">. {entry.def}</span>
      {tip}
    </span>
  );
}
