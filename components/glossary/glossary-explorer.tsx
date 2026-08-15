"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_LABEL,
  GLOSSARY_LIST,
  glossaryVisible,
  type GlossaryCategory,
} from "@/lib/glossary";
import type { MeetingMode } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";

const FILTERS: { id: "all" | GlossaryCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "ma", label: CATEGORY_LABEL.ma },
  { id: "projeto", label: CATEGORY_LABEL.projeto },
  { id: "financeiro", label: CATEGORY_LABEL.financeiro },
];

export function GlossaryExplorer({ mode }: { mode: MeetingMode }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof FILTERS)[number]["id"]>("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY_LIST.filter((e) => glossaryVisible(e, mode))
      .filter((e) => (cat === "all" ? true : e.category === cat))
      .filter((e) => {
        if (!needle) return true;
        return `${e.term} ${e.def} ${(e.aliases ?? []).join(" ")}`.toLowerCase().includes(needle);
      })
      .slice()
      .sort((a, b) => a.term.localeCompare(b.term, "pt"));
  }, [q, cat, mode]);

  const grouped = useMemo(() => {
    const map = new Map<GlossaryCategory, typeof rows>();
    for (const e of rows) {
      const list = map.get(e.category) ?? [];
      list.push(e);
      map.set(e.category, list);
    }
    return (["ma", "projeto", "financeiro"] as GlossaryCategory[])
      .map((c) => ({ cat: c, items: map.get(c) ?? [] }))
      .filter((g) => g.items.length);
  }, [rows]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="m-0 max-w-md flex-1 text-[12px] font-normal normal-case tracking-normal text-muted">
          Buscar termo
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="LOI, NDA, semáforo…  (/)"
            data-search
            className="mt-1"
          />
        </label>
        <div className="inline-flex rounded-sm border border-line p-0.5 text-[13px]" role="tablist" aria-label="Categoria">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={cat === f.id}
              className={`min-h-11 px-3 sm:min-h-0 ${
                cat === f.id ? "bg-navy text-cream" : "text-muted hover:text-navy"
              }`}
              onClick={() => setCat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nenhum termo com este filtro" hint="Limpe a busca ou mude a categoria." />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map((g) => (
            <section key={g.cat}>
              <p className="kicker mb-3">{CATEGORY_LABEL[g.cat]}</p>
              <dl className="divide-y divide-line paper">
                {g.items.map((e) => (
                  <div key={e.id} id={e.id} className="px-4 py-3 sm:px-5">
                    <dt className="font-semibold text-navy">{e.term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink">{e.def}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
