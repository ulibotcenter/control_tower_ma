"use client";

import { memo, useMemo, useState } from "react";
import { workstreamLabel } from "@/lib/constants";
import { TARGET_COPY } from "@/lib/mode-meta";
import type { MeetingMode, Risk, Semaphore } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, riskTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";
import { Dot } from "@/components/ui/semaphore";

export const RisksBoard = memo(function RisksBoard({
  items,
  mode,
  query = "",
  compact = false,
}: {
  items: Risk[];
  mode: MeetingMode;
  query?: string;
  compact?: boolean;
}) {
  const target = mode === "target";
  const [sev, setSev] = useState<"all" | Semaphore>("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (compact && r.severity !== "red") return false;
      if (sev !== "all" && r.severity !== sev) return false;
      if (!q) return true;
      return `${r.title} ${r.detail} ${r.workstreamSlug ?? ""}`.toLowerCase().includes(q);
    });
  }, [items, query, sev, compact]);

  const criticos = filtered.filter((r) => r.severity === "red");
  const issues = filtered.filter((r) => r.severity === "amber");
  const watch = filtered.filter((r) => r.severity === "gray" || r.severity === "green");

  if (!items.length) {
    return (
      <EmptyState
        title="Nenhum risco nesta vista"
        hint="Quando a Eleva ou a Pacta registrar um risco ou um issue, ele entra aqui com a severidade."
      />
    );
  }

  return (
    <div className="space-y-6">
      {!compact && (
        <label className="no-print m-0 inline-flex items-center gap-2 text-[12px] font-normal normal-case tracking-normal text-muted">
          Severidade
          <select className="w-auto" value={sev} onChange={(e) => setSev(e.target.value as typeof sev)}>
            <option value="all">Todas</option>
            <option value="red">Crítico</option>
            <option value="amber">Issue</option>
            <option value="gray">Observação</option>
          </select>
        </label>
      )}
      {filtered.length === 0 && items.length > 0 ? (
        <EmptyState title="Nenhum risco com este filtro" hint="Limpe a busca ou mude a severidade." />
      ) : null}
      <Block
        title={target ? "Pontos críticos" : "Riscos críticos"}
        hint={
          target
            ? TARGET_COPY.criticalHint
            : "Podem anular ou travar o deal. O board precisa ver estes primeiro."
        }
        items={criticos}
        empty={target ? TARGET_COPY.criticalEmpty : "Nenhum risco crítico visível neste modo."}
        accent="critical"
      />
      <Block
        title={target ? "Pontos em tratamento" : "Issues abertos"}
        hint={
          target
            ? TARGET_COPY.issuesHint
            : "Problemas já identificados, em tratamento. Ainda não são (sozinhos) deal-breakers."
        }
        items={issues}
        empty={target ? TARGET_COPY.issuesEmpty : "Nenhum issue aberto neste modo."}
        accent="issue"
      />
      {watch.length > 0 && (
        <Block
          title="Em observação"
          hint="Pontos para acompanhar. Sem ação urgente."
          items={watch}
          empty=""
          accent="watch"
        />
      )}
    </div>
  );
});

function Block({
  title,
  hint,
  items,
  empty,
  accent,
}: {
  title: string;
  hint: string;
  items: Risk[];
  empty: string;
  accent: "critical" | "issue" | "watch";
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="font-semibold text-navy">
          {title}{" "}
          <span className="text-muted font-normal">· {items.length}</span>
        </p>
        <p className="text-[12px] text-muted">{hint}</p>
      </div>
      {items.length === 0 ? (
        <p className="paper px-4 py-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li
              key={r.id}
              className={`paper p-4 ${
                accent === "critical" ? "border-alert/50 bg-alert/5" : accent === "issue" ? "border-wait/40" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <Dot tone={r.severity} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">
                      <WithTerms text={r.title} />
                    </p>
                    <StatusBadge tone={riskTone(r.severity)}>
                      {accent === "critical" ? "Crítico" : accent === "issue" ? "Issue" : "Observar"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">
                    <WithTerms text={r.detail} />
                  </p>
                  {r.workstreamSlug && (
                    <p className="mt-2 text-[12px] text-muted">Frente · {workstreamLabel(r.workstreamSlug)}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
