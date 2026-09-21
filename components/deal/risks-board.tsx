import { workstreamLabel } from "@/lib/constants";
import type { MeetingMode, Risk, Semaphore } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, riskTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";
import { Dot } from "@/components/ui/semaphore";

const SEV: Record<Semaphore, number> = { red: 0, amber: 1, gray: 2, green: 3 };

function sevLabel(severity: Semaphore) {
  if (severity === "red") return "Crítico";
  if (severity === "amber") return "Issue";
  return "Observar";
}

export function RisksBoard({
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
  const q = query.trim().toLowerCase();
  const rows = items
    .filter((r) => {
      if (compact && r.severity !== "red") return false;
      if (!q) return true;
      return `${r.title} ${r.detail} ${r.workstreamSlug ?? ""}`.toLowerCase().includes(q);
    })
    .sort((a, b) => SEV[a.severity] - SEV[b.severity]);

  if (!items.length || rows.length === 0) {
    return <EmptyState compact title={target ? "Nenhum ponto em aberto" : "Nenhum risco"} />;
  }

  return (
    <div className="ops-scroll">
      <table className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Sinal</th>
            <th scope="col">Item</th>
            <th scope="col">Frente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.severity === "red" ? "is-hot" : undefined}>
              <td className="ops-signal">
                <Dot tone={r.severity} />
                <StatusBadge tone={riskTone(r.severity)}>{sevLabel(r.severity)}</StatusBadge>
              </td>
              <td>
                <span className="ops-strong">
                  <WithTerms text={r.title} />
                </span>
                {r.detail ? (
                  <span className="ops-meta">
                    <WithTerms text={r.detail} />
                  </span>
                ) : null}
              </td>
              <td className="ops-meta-cell">{r.workstreamSlug ? workstreamLabel(r.workstreamSlug) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
