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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 pr-3 font-medium">Item</th>
              <th className="py-2 pr-3 font-medium">Frente</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Drive</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line/70 align-top">
                <td className="py-2.5 pr-3">
                  <WithTerms text={item.title} />
                  {item.note && (
                    <p className="mt-0.5 text-[12px] text-muted">
                      <WithTerms text={item.note} />
                    </p>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-muted">{workstreamLabel(item.workstreamSlug)}</td>
                <td className="py-2.5 pr-3">
                  <Status status={item.status} />
                </td>
                <td className="py-2.5">
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
