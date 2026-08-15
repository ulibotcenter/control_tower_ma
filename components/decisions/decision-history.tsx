"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import type { Decision } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";

export function DecisionHistory({
  rows,
  summary,
  dealNames,
}: {
  rows: Decision[];
  summary: boolean;
  dealNames: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!needle) return list;
    return list.filter((d) =>
      `${d.decisionTaken} ${d.whoLabel} ${d.consequence} ${d.elevaRecommendation} ${dealNames[d.dealId ?? ""] ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, q, dealNames]);

  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhuma decisão neste recorte"
        hint="Use Registrar decisão para gravar o que o board decidiu — e se foi contra a recomendação da Eleva."
      />
    );
  }

  const groups = new Map<string, Decision[]>();
  for (const d of filtered) {
    const key = d.date.slice(0, 7) || "sem-data";
    const list = groups.get(key) ?? [];
    list.push(d);
    groups.set(key, list);
  }

  return (
    <div>
      <label className="m-0 max-w-md normal-case tracking-normal text-[12px] text-muted">
        Buscar no histórico
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pacta, preço, Radio Health…  (/)"
          data-search
          className="mt-1"
        />
      </label>
      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nenhuma decisão com este filtro" hint="Tente outro termo ou limpe a busca." />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {[...groups.entries()].map(([month, list]) => (
            <section key={month}>
              <p className="kicker mb-3">{monthLabel(month)}</p>
              <ol className="relative space-y-4 border-l border-line pl-4">
                {list.map((d) => (
                  <li key={d.id} className="paper p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                        {formatDate(d.date)} · {d.whoLabel} · {dealNames[d.dealId ?? ""] ?? "Programa"}
                      </p>
                      {d.againstRecommendation && (
                        <span className="stamp text-alert">Contra a Eleva</span>
                      )}
                    </div>
                    <p className="mt-2 text-[16px] font-medium leading-relaxed text-navy">
                      {d.decisionTaken}
                    </p>
                    {!summary && (
                      <p className="mt-2 text-sm text-muted">
                        Recomendação Eleva · {d.elevaRecommendation}
                      </p>
                    )}
                    <p className="mt-2 text-sm">
                      <span className="text-muted">Impacto · </span>
                      {d.consequence}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const names = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const i = Number(m) - 1;
  if (!y || i < 0 || i > 11) return ym;
  return `${names[i]} ${y}`;
}
