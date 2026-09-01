import { CHECK_STATUS_LABEL, workstreamLabel } from "@/lib/constants";
import type { ChecklistItem } from "@/lib/types";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, checklistTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";

export function ChecklistTable({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum item de checklist nesta vista"
        hint="Itens da due diligence e o que vier da bandeja entram aqui. Arquivo novo não conclui o item."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2 lg:hidden">
        {items.map((item) => (
          <li key={item.id} className="paper px-3 py-3 text-sm">
            <p className="font-medium text-navy">
              <WithTerms text={item.title} />
            </p>
            {item.note && <p className="mt-0.5 text-[12px] text-muted">{item.note}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
              <span className="text-muted">{workstreamLabel(item.workstreamSlug)}</span>
              <Status status={item.status} />
              {item.driveUrl ? <DriveLink href={item.driveUrl}>Abrir</DriveLink> : <span className="text-muted">sem arquivo</span>}
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto lg:block">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Frente</th>
              <th>Status</th>
              <th>Drive</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <WithTerms text={item.title} />
                  {item.note && (
                    <p className="mt-0.5 text-[12px] text-muted">
                      <WithTerms text={item.note} />
                    </p>
                  )}
                </td>
                <td className="text-muted">{workstreamLabel(item.workstreamSlug)}</td>
                <td>
                  <Status status={item.status} />
                </td>
                <td>
                  {item.driveUrl ? (
                    <DriveLink href={item.driveUrl}>Abrir</DriveLink>
                  ) : (
                    <span className="text-muted">sem arquivo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Status({ status }: { status: ChecklistItem["status"] }) {
  return <StatusBadge tone={checklistTone(status)}>{CHECK_STATUS_LABEL[status]}</StatusBadge>;
}
