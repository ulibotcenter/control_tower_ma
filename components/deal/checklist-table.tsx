import { CHECK_STATUS_LABEL, workstreamLabel } from "@/lib/constants";
import type { ChecklistItem } from "@/lib/types";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, checklistTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";

export function ChecklistTable({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) {
    return <EmptyState compact title="Nenhuma pendência" />;
  }

  return (
    <div className="ops-scroll">
      <table className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Frente</th>
            <th scope="col">Status</th>
            <th scope="col">Drive</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={item.status === "bloqueado" || item.status === "inexistente" ? "is-hot" : undefined}
            >
              <td>
                <span className="ops-strong">
                  <WithTerms text={item.title} />
                </span>
                {item.note ? (
                  <span className="ops-meta">
                    <WithTerms text={item.note} />
                  </span>
                ) : null}
              </td>
              <td className="ops-meta-cell">{workstreamLabel(item.workstreamSlug)}</td>
              <td>
                <Status status={item.status} />
              </td>
              <td>
                <DriveLink href={item.driveUrl || ""}>Abrir</DriveLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Status({ status }: { status: ChecklistItem["status"] }) {
  return <StatusBadge tone={checklistTone(status)}>{CHECK_STATUS_LABEL[status]}</StatusBadge>;
}
