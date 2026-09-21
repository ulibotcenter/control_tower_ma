import { formatDate } from "@/lib/format";
import { isPillarSlug, PILLAR_BY_SLUG } from "@/lib/pillars";
import type { OpenPoint, OpenPointStatus } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { WithTerms } from "@/components/ui/with-terms";
import { MutableStatus } from "./mutable-status";

const RANK: Record<OpenPointStatus, number> = {
  travado: 0,
  em_curso: 1,
  aberto: 2,
  resolvido: 3,
};

const STATUS_OPTIONS: { value: OpenPointStatus; label: string }[] = [
  { value: "aberto", label: "Aberto" },
  { value: "em_curso", label: "Em curso" },
  { value: "travado", label: "Travado" },
  { value: "resolvido", label: "Resolvido" },
];

function pillarLabel(slug: string | null) {
  if (!slug) return "—";
  return isPillarSlug(slug) ? PILLAR_BY_SLUG[slug].short : slug;
}

function byRank(a: OpenPoint, b: OpenPoint) {
  return RANK[a.status] - RANK[b.status] || a.title.localeCompare(b.title, "pt");
}

export function OpenPointList({
  items,
  canEdit,
  empty,
}: {
  items: OpenPoint[];
  canEdit: boolean;
  empty: string;
}) {
  const open = items.filter((item) => item.status !== "resolvido").sort(byRank);
  const done = items.filter((item) => item.status === "resolvido").sort(byRank);

  if (!items.length) return <EmptyState compact title={empty} />;

  return (
    <div>
      {open.length === 0 ? (
        <p className="ops-empty">Nada em aberto.</p>
      ) : (
        <PointTable rows={open} canEdit={canEdit} />
      )}
      {done.length > 0 ? (
        <details className="opl-resolved">
          <summary>
            Resolvidos ({done.length})
          </summary>
          <PointTable rows={done} canEdit={canEdit} />
        </details>
      ) : null}
    </div>
  );
}

function PointTable({ rows, canEdit }: { rows: OpenPoint[]; canEdit: boolean }) {
  return (
    <div className="ops-scroll">
      <table className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Ponto</th>
            <th scope="col">Dono</th>
            <th scope="col">Prazo</th>
            <th scope="col">Pilar</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className={item.status === "resolvido" ? "is-done" : undefined}>
              <td>
                <span className={item.status === "resolvido" ? "ops-done" : "ops-strong"}>
                  <WithTerms text={item.title} interactive={false} />
                </span>
              </td>
              <td className="ops-owner">{item.owner || "—"}</td>
              <td className="ops-due">{item.due ? formatDate(item.due) : "—"}</td>
              <td className="ops-meta-cell">{pillarLabel(item.pillarSlug)}</td>
              <td>
                {canEdit ? (
                  <MutableStatus
                    id={item.id}
                    kind="open-points"
                    status={item.status}
                    options={STATUS_OPTIONS}
                    label={`Status de ${item.title}`}
                  />
                ) : (
                  <span className="ops-meta-cell">
                    {STATUS_OPTIONS.find((option) => option.value === item.status)?.label ?? item.status}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
