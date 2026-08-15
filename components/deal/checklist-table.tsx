import { CHECK_STATUS_LABEL, workstreamLabel } from "@/lib/constants";
import type { ChecklistItem } from "@/lib/types";
import { DriveLink } from "@/components/ui/drive-link";

export function ChecklistTable({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Nenhum item visível neste modo.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
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
                {item.title}
                {item.note && <p className="mt-0.5 text-[12px] text-muted">{item.note}</p>}
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
  );
}

function Status({ status }: { status: ChecklistItem["status"] }) {
  const tone =
    status === "concluido"
      ? "text-go"
      : status === "inexistente" || status === "bloqueado"
        ? "text-alert"
        : status === "em_andamento"
          ? "text-wait"
          : "text-ink";
  return <span className={tone}>{CHECK_STATUS_LABEL[status]}</span>;
}
