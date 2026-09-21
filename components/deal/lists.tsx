import type { ReactNode } from "react";
import type { CapRow, DriveDocument, MeetingMode, Metric, Note } from "@/lib/types";
import { TARGET_COPY } from "@/lib/mode-meta";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL } from "@/lib/constants";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, documentTone } from "@/components/ui/status-badge";
import { WithTerms } from "@/components/ui/with-terms";

export function MetricsGrid({ items, mode }: { items: Metric[]; mode: MeetingMode }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nenhum indicador nesta vista"
        // "oculto neste modo" entrega a encenação para quem está na sala.
        hint={
          mode === "target"
            ? TARGET_COPY.metricsEmpty
            : "O número ainda é «a confirmar», ou está oculto neste modo de reunião."
        }
      />
    );
  }
  return (
    <div className="metric-row">
      {items.map((m) => (
        <div key={m.id} className="paper metric-cell">
          <p className="kicker">
            <WithTerms text={m.label} />
          </p>
          <p className="serif metric-value">{m.value}</p>
          {m.context && (
            <p className="metric-context">
              <WithTerms text={m.context} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function DocsList({ items }: { items: DriveDocument[] }) {
  if (!items.length) {
    return <EmptyState compact title="Nenhum documento" />;
  }
  return (
    <div className="ops-scroll">
      <table className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Drive</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td>
                <span className="ops-strong">
                  <WithTerms text={d.title} />
                </span>
                <span className="ops-meta">
                  {DOC_TYPE_LABEL[d.type]}
                  {" · "}
                  <StatusBadge tone={documentTone(d.status)}>{DOC_STATUS_LABEL[d.status]}</StatusBadge>
                </span>
                {d.note ? (
                  <span className="ops-meta">
                    <WithTerms text={d.note} />
                  </span>
                ) : null}
              </td>
              <td className="ops-drive">
                {d.driveUrl ? (
                  <DriveLink href={d.driveUrl}>Abrir</DriveLink>
                ) : (
                  <span className="ops-missing">sem link</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NotesList({ items, compose = null }: { items: Note[]; compose?: ReactNode }) {
  if (!items.length && !compose) return null;
  return (
    <section id="notas" className="mt-10">
      <h3 className="serif mb-3 text-xl text-navy">Notas</h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="border-l-2 border-brand pl-3 text-sm leading-relaxed">
              <WithTerms text={n.body} />
            </li>
          ))}
        </ul>
      ) : null}
      {compose}
    </section>
  );
}

export function CapTable({ rows }: { rows: CapRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="paper overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy text-cream text-[11px] uppercase tracking-wider">
            <th className="px-4 py-2 text-left font-medium">Sócio</th>
            <th className="px-4 py-2 text-left font-medium">Papel</th>
            <th className="px-4 py-2 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-line">
              <td className="px-4 py-2">
                {r.name}
                {r.note && (
                  <span className="block text-[12px] text-muted">
                    <WithTerms text={r.note} />
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-muted">{r.role}</td>
              <td className="px-4 py-2 text-right font-semibold">{r.pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
