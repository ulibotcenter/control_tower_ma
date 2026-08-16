"use client";

import { useEffect, useState } from "react";
import { Term } from "@/components/ui/term";

const ITEMS = [
  { id: "visao", label: "Visão" },
  { id: "tese", label: "Tese e preço" },
  { id: "checklist", label: "Checklist" },
  { id: "workstreams", label: "Workstreams" },
  { id: "riscos", label: "Riscos" },
  { id: "acoes", label: "Ações" },
  { id: "docs", label: "Documentos" },
  { id: "indicadores", label: "Indicadores" },
];

export function SectionNav({
  hideThesis,
  hasThesis,
  present = false,
}: {
  hideThesis?: boolean;
  hasThesis?: boolean;
  present?: boolean;
}) {
  const items = ITEMS.filter((i) => {
    if (i.id === "tese" && (hideThesis || hasThesis === false)) return false;
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
              {item.id === "workstreams" ? (
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
