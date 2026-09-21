import { formatDate, dueSortKey } from "@/lib/format";
import { workstreamLabel } from "@/lib/constants";
import { isUuid } from "@/lib/data/room-input";
import type { ActionItem } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, actionTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";
import { MutableStatus } from "./mutable-status";

const ACTION_OPTIONS: { value: ActionItem["status"]; label: string }[] = [
  { value: "open", label: "Aberta" },
  { value: "late", label: "Atrasada" },
  { value: "done", label: "Concluída" },
];

function rank(a: ActionItem) {
  if (a.status === "late") return 0;
  if (a.status === "open") return 1;
  return 2;
}

export function ActionBoard({
  items,
  query = "",
  compact = false,
  canEdit = false,
  emptyTitle = "Nenhuma ação neste pilar",
  pinFresh = false,
  toneRows = false,
}: {
  items: ActionItem[];
  query?: string;
  compact?: boolean;
  canEdit?: boolean;
  emptyTitle?: string;
  /** Itens novos ficam no topo. O corte do seed não se mistura no meio. */
  pinFresh?: boolean;
  toneRows?: boolean;
}) {
  const q = query.trim().toLowerCase();
  const filtered = items.filter((a) => {
    if (compact && a.status === "done") return false;
    if (!q) return true;
    const hay = `${a.title} ${a.owner} ${a.workstreamSlug ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
  const byDue = (a: ActionItem, b: ActionItem) => rank(a) - rank(b) || dueSortKey(a.due) - dueSortKey(b.due);
  const ordered = pinFresh
    ? [...filtered.filter((a) => isUuid(a.id)), ...filtered.filter((a) => !isUuid(a.id)).sort(byDue)]
    : [...filtered].sort(byDue);

  if (!items.length || ordered.length === 0) {
    return <EmptyState compact title={emptyTitle} />;
  }

  const late = ordered.filter((a) => a.status === "late").length;
  const open = ordered.filter((a) => a.status === "open").length;
  const done = ordered.filter((a) => a.status === "done").length;

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
            {ordered.map((a) => (
              <tr key={a.id} className={toneRows ? actionToneClass(a.status) : a.status === "late" ? "is-hot" : a.status === "done" ? "is-done" : undefined}>
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
                  {canEdit && isUuid(a.id) ? (
                    <MutableStatus
                      id={a.id}
                      kind="actions"
                      status={a.status}
                      options={ACTION_OPTIONS}
                      label={`Status de ${a.title}`}
                    />
                  ) : (
                    <ActionStatus status={a.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function actionToneClass(status: ActionItem["status"]) {
  if (status === "late") return "is-hot";
  if (status === "open") return "is-wash is-aberto";
  return "is-wash is-feita";
}

function ActionStatus({ status }: { status: ActionItem["status"] }) {
  const label = { late: "Atrasada", open: "Aberta", done: "Concluída" };
  return <StatusBadge tone={actionTone(status)}>{label[status]}</StatusBadge>;
}
