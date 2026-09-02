"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryId } from "@/lib/glossary";

/**
 * Sigla com marca discreta. A definição é a mesma da página Glossário.
 * interactive={false} quando o termo está dentro de um <a>/<Link>: o clique
 * continua no link; o balão ainda abre no hover, em portal no document.body.
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
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const open = hover || pinned;

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const ar = anchor.getBoundingClientRect();
    const tip = tipRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const pad = 8;
    const maxW = Math.min(320, vw * 0.8);
    const width = tip && tip.offsetWidth > 0 ? Math.min(tip.offsetWidth, maxW) : maxW;
    const height = tip && tip.offsetHeight > 0 ? tip.offsetHeight : 0;
    let left = ar.left;
    if (left + width > vw - pad) left = ar.right - width;
    if (left < pad) left = pad;
    let top = ar.bottom + gap;
    if (height > 0 && top + height > vh - pad) top = ar.top - gap - height;
    if (top < pad) top = pad;
    setPos({ top, left });
  }, []);

  const setTipNode = useCallback(
    (node: HTMLSpanElement | null) => {
      tipRef.current = node;
      if (node) place();
    },
    [place],
  );

  useEffect(() => {
    if (!open) return;
    place();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setHover(false);
      }
    }
    function onDoc(e: MouseEvent) {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
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

  function show() {
    place();
    setHover(true);
  }

  function hide() {
    setHover(false);
  }

  const tip =
    open && typeof document !== "undefined"
      ? createPortal(
          <span
            ref={setTipNode}
            id={tipId}
            role="tooltip"
            className="term-tip is-portal"
            style={{
              display: "block",
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 200,
              visibility: "visible",
              pointerEvents: "none",
              maxWidth: "min(20rem, 80vw)",
            }}
          >
            <span className="term-tip-kicker">{entry.term}</span>
            {entry.def}
          </span>,
          document.body,
        )
      : null;

  return (
    <span
      ref={anchorRef}
      className={`term-mark${open ? " is-open" : ""}`}
      tabIndex={interactive ? 0 : undefined}
      aria-describedby={open ? tipId : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={() => {
        if (interactive) show();
      }}
      onBlur={hide}
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
