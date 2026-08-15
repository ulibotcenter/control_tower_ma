"use client";

import { memo, useMemo, useState } from "react";
import { formatDate, dueSortKey } from "@/lib/format";
import { workstreamLabel } from "@/lib/constants";
import type { ActionItem } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, actionTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";

type Sort = "priority" | "due";

function rank(a: ActionItem) {
  if (a.status === "late") return 0;
  if (a.status === "open") return 1;
  return 2;
}

export const ActionBoard = memo(function ActionBoard({
  items,
  query = "",
  compact = false,
}: {
  items: ActionItem[];
  query?: string;
  compact?: boolean;
}) {
  const [sort, setSort] = useState<Sort>("priority");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState<"all" | ActionItem["status"]>("all");

  const owners = useMemo(
    () => [...new Set(items.map((a) => a.owner))].sort((a, b) => a.localeCompare(b, "pt")),
    [items],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const copy = items.filter((a) => {
      if (owner !== "all" && a.owner !== owner) return false;
      if (status !== "all" && a.status !== status) return false;
      if (compact && a.status === "done") return false;
      if (!q) return true;
      const hay = `${a.title} ${a.owner} ${a.workstreamSlug ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort === "due") {
      copy.sort((a, b) => dueSortKey(a.due) - dueSortKey(b.due) || rank(a) - rank(b));
    } else {
      copy.sort((a, b) => rank(a) - rank(b) || dueSortKey(a.due) - dueSortKey(b.due));
    }
    return copy;
  }, [items, sort, owner, status, query, compact]);

  const late = items.filter((a) => a.status === "late").length;
  const open = items.filter((a) => a.status === "open").length;
  const done = items.filter((a) => a.status === "done").length;

  if (!items.length) {
    return (
      <EmptyState
        title="Nenhuma ação nesta vista"
        hint="Quando o board ou a Eleva definir um próximo passo, ele entra aqui com dono e prazo."
      />
    );
  }

  return (
    <div className="paper overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-semibold text-alert">{late} atrasada{late === 1 ? "" : "s"}</span>
          <span className="text-muted"> · {open} aberta{open === 1 ? "" : "s"} · {done} feita{done === 1 ? "" : "s"}</span>
        </p>
        {!compact && (
          <div className="no-print flex flex-wrap items-center gap-2">
            <label className="m-0 normal-case tracking-normal text-[12px] text-muted">
              Responsável
              <select
                className="mt-0.5 w-auto min-w-[8rem]"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              >
                <option value="all">Todos</option>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="m-0 normal-case tracking-normal text-[12px] text-muted">
              Status
              <select
                className="mt-0.5 w-auto"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="all">Todos</option>
                <option value="late">Atrasada</option>
                <option value="open">Aberta</option>
                <option value="done">Feita</option>
              </select>
            </label>
            <div className="no-print inline-flex rounded-sm border border-line p-0.5 text-[12px]" role="group" aria-label="Ordenar ações">
              <button
                type="button"
                className={`px-2.5 py-1 ${sort === "priority" ? "bg-navy text-cream" : "text-muted"}`}
                onClick={() => setSort("priority")}
              >
                Prioridade
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 ${sort === "due" ? "bg-navy text-cream" : "text-muted"}`}
                onClick={() => setSort("due")}
              >
                Prazo
              </button>
            </div>
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nenhuma ação com este filtro" hint="Limpe a busca ou mude o responsável e o status." />
      ) : null}
      <ul>
        {rows.map((a) => (
          <li
            key={a.id}
            className={`grid gap-2 border-t border-line px-4 py-3 sm:grid-cols-[1fr_9rem_7rem_6.5rem] sm:items-center ${
              a.status === "late" ? "bg-alert/5" : a.status === "done" ? "bg-go/5" : ""
            }`}
          >
            <div>
              <p className={`text-[15px] ${a.status === "done" ? "text-muted line-through" : "text-navy"}`}>
                <WithTerms text={a.title} />
              </p>
              <p className="text-[12px] text-muted">
                {a.workstreamSlug ? <WithTerms text={workstreamLabel(a.workstreamSlug)} /> : "Programa"}
              </p>
            </div>
            <p className="text-sm">
              <span className="block text-[11px] uppercase tracking-wide text-muted sm:hidden">Responsável</span>
              {a.owner}
            </p>
            <p className={`text-sm ${a.status === "late" ? "font-semibold text-alert" : ""}`}>
              <span className="block text-[11px] uppercase tracking-wide text-muted sm:hidden">Prazo</span>
              {formatDate(a.due)}
            </p>
            <p>
              <ActionStatus status={a.status} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
});

function ActionStatus({ status }: { status: ActionItem["status"] }) {
  const label = { late: "Atrasada", open: "Aberta", done: "Concluída" };
  return <StatusBadge tone={actionTone(status)}>{label[status]}</StatusBadge>;
}
