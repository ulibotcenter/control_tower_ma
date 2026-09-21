import { formatDate, dueSortKey } from "@/lib/format";
import { workstreamLabel } from "@/lib/constants";
import type { ActionItem } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, actionTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";

function rank(a: ActionItem) {
  if (a.status === "late") return 0;
  if (a.status === "open") return 1;
  return 2;
}

export function ActionBoard({
  items,
  query = "",
  compact = false,
}: {
  items: ActionItem[];
  query?: string;
  compact?: boolean;
}) {
  const q = query.trim().toLowerCase();
  const rows = items
    .filter((a) => {
      if (compact && a.status === "done") return false;
      if (!q) return true;
      const hay = `${a.title} ${a.owner} ${a.workstreamSlug ?? ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => rank(a) - rank(b) || dueSortKey(a.due) - dueSortKey(b.due));

  if (!items.length || rows.length === 0) {
    return <EmptyState compact title="Nenhuma ação neste pilar" />;
  }

  const late = rows.filter((a) => a.status === "late").length;
  const open = rows.filter((a) => a.status === "open").length;
  const done = rows.filter((a) => a.status === "done").length;

  return (
    <div>
      <p className="ops-count">
        <span className={late > 0 ? "is-late" : undefined}>
          {late} atrasada{late === 1 ? "" : "s"}
        </span>
        <span>
          {" "}
          · {open} aberta{open === 1 ? "" : "s"} · {done} feita{done === 1 ? "" : "s"}
        </span>
      </p>
      <div className="ops-scroll">
        <table className="data-table ops-table">
          <thead>
            <tr>
              <th scope="col">Ação</th>
              <th scope="col">Responsável</th>
              <th scope="col">Prazo</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className={a.status === "late" ? "is-hot" : a.status === "done" ? "is-done" : undefined}>
                <td>
                  <span className={a.status === "done" ? "ops-done" : "ops-strong"}>
                    <WithTerms text={a.title} />
                  </span>
                  {a.workstreamSlug ? (
                    <span className="ops-meta">{workstreamLabel(a.workstreamSlug)}</span>
                  ) : null}
                </td>
                <td className="ops-owner">{a.owner}</td>
                <td className={a.status === "late" ? "ops-due is-late" : "ops-due"}>{formatDate(a.due)}</td>
                <td>
                  <ActionStatus status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionStatus({ status }: { status: ActionItem["status"] }) {
  const label = { late: "Atrasada", open: "Aberta", done: "Concluída" };
  return <StatusBadge tone={actionTone(status)}>{label[status]}</StatusBadge>;
}
