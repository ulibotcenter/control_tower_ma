"use client";

import { useEffect, useState } from "react";
import { Term } from "@/components/ui/term";
import { TARGET_COPY } from "@/lib/mode-meta";
import type { MeetingMode } from "@/lib/types";

/** A ordem aqui é a ordem da página. Mexeu numa, mexa na outra. */
const ITEMS = [
  { id: "visao", label: "Visão", target: TARGET_COPY.navOverview },
  { id: "checklist", label: "Checklist", target: TARGET_COPY.navDocuments },
  { id: "riscos", label: "Riscos", target: TARGET_COPY.navRisks },
  { id: "acoes", label: "Ações", target: TARGET_COPY.navActions },
  { id: "docs", label: "Documentos", target: TARGET_COPY.navFiles },
  { id: "workstreams", label: "Workstreams", target: TARGET_COPY.navWorkstreams },
  { id: "indicadores", label: "Indicadores", target: TARGET_COPY.navMetrics },
  { id: "tese", label: "Sala da Eleva", target: null },
];

export function SectionNav({
  mode,
  hideThesis,
  present = false,
}: {
  mode: MeetingMode;
  hideThesis?: boolean;
  present?: boolean;
}) {
  const target = mode === "target";
  const items = ITEMS.filter((i) => {
    // A sala da Eleva nunca entra na navegação do alvo.
    if (i.id === "tese" && (hideThesis || target)) return false;
    if (present && ["checklist", "workstreams", "docs", "indicadores"].includes(i.id)) return false;
    return true;
  });
  const [active, setActive] = useState(items[0]?.id ?? "visao");

  useEffect(() => {
    const nodes = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActive(top);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [items.map((i) => i.id).join(",")]);

  if (!items.length) return null;

  return (
    <nav className={`section-nav no-print ${present ? "is-present" : ""}`} aria-label="Seções desta operação">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? "is-active" : ""}
              aria-current={active === item.id ? "location" : undefined}
              onClick={() => setActive(item.id)}
            >
              {target ? (
                (item.target ?? item.label)
              ) : item.id === "workstreams" ? (
                <Term id="workstream" interactive={false}>
                  Workstreams
                </Term>
              ) : (
                item.label
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
