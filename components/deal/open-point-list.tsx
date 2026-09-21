import { formatDate } from "@/lib/format";
import { isUuid } from "@/lib/data/room-input";
import { isPillarSlug, PILLAR_BY_SLUG } from "@/lib/pillars";
import type { OpenPoint, OpenPointStatus } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { WithTerms } from "@/components/ui/with-terms";
import { MutableStatus } from "./mutable-status";
import { PointRowMenu } from "./room-bar";

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

function byFresh(a: OpenPoint, b: OpenPoint) {
  if (a.createdAt === b.createdAt) return a.title.localeCompare(b.title, "pt");
  return a.createdAt < b.createdAt ? 1 : -1;
}

function rowTone(status: OpenPointStatus) {
  if (status === "aberto") return "is-wash is-aberto";
  if (status === "em_curso") return "is-wash is-course";
  if (status === "travado") return "is-wash is-travado";
  return "is-wash is-feita";
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
  const open = items.filter((item) => item.status !== "resolvido").sort(byFresh);
  const done = items.filter((item) => item.status === "resolvido").sort(byFresh);

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
            <th scope="col">Responsável</th>
            <th scope="col">Prazo</th>
            <th scope="col">Pilar</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className={rowTone(item.status)}>
              <td>
                <span className="ops-strong">
                  <WithTerms text={item.title} interactive={false} />
                </span>
                {canEdit && isUuid(item.id) ? <PointRowMenu point={item} /> : null}
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
