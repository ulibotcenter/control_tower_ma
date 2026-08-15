import { formatDate } from "@/lib/format";
import type { ActionItem, CapRow, DriveDocument, Metric, Note, Risk } from "@/lib/types";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL, workstreamLabel } from "@/lib/constants";
import { DriveLink } from "@/components/ui/drive-link";
import { Dot } from "@/components/ui/semaphore";

export function RiskList({ items }: { items: Risk[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nenhum risco visível neste modo.</p>;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="paper p-4">
          <div className="flex items-start gap-3">
            <Dot tone={r.severity} />
            <div>
              <p className="font-semibold text-navy">{r.title}</p>
              <p className="mt-1 text-sm leading-relaxed">{r.detail}</p>
              {r.workstreamSlug && (
                <p className="mt-2 text-[12px] text-muted">
                  Frente · {workstreamLabel(r.workstreamSlug)}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ActionList({ items }: { items: ActionItem[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nenhuma ação visível neste modo.</p>;
  return (
    <ul className="divide-y divide-line paper">
      {items.map((a) => (
        <li key={a.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-[15px]">{a.title}</p>
            <p className="text-[12px] text-muted">
              {a.owner} · {a.workstreamSlug ? workstreamLabel(a.workstreamSlug) : "programa"}
            </p>
          </div>
          <p className={`text-sm ${a.status === "late" ? "text-alert font-semibold" : "text-muted"}`}>
            {a.status === "late" ? "Atrasada · " : a.status === "done" ? "Feita · " : ""}
            {formatDate(a.due)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function MetricsGrid({ items }: { items: Metric[] }) {
  if (!items.length) {
    return <p className="text-sm text-muted">Indicadores ocultos neste modo, ou a confirmar.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <div key={m.id} className="paper p-4">
          <p className="kicker">{m.label}</p>
          <p className="serif mt-2 text-2xl text-navy">{m.value}</p>
          {m.context && <p className="mt-1 text-[12px] text-muted">{m.context}</p>}
        </div>
      ))}
    </div>
  );
}

export function DocsList({ items }: { items: DriveDocument[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nenhum documento visível neste modo.</p>;
  return (
    <ul className="divide-y divide-line paper">
      {items.map((d) => (
        <li key={d.id} className="px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {d.driveUrl ? (
              <DriveLink href={d.driveUrl} kind={d.driveId ? "file" : "folder"}>
                {d.title}
              </DriveLink>
            ) : (
              <span className="font-medium">{d.title}</span>
            )}
            <span className="text-[12px] text-muted">
              {DOC_TYPE_LABEL[d.type]} · {DOC_STATUS_LABEL[d.status]}
            </span>
          </div>
          {d.note && <p className="mt-1 text-[13px] text-muted">{d.note}</p>}
        </li>
      ))}
    </ul>
  );
}

export function NotesList({ items }: { items: Note[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <p className="kicker">Notas</p>
      <ul className="mt-2 space-y-2">
        {items.map((n) => (
          <li key={n.id} className="border-l-2 border-gold pl-3 text-sm leading-relaxed">
            {n.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CapTable({ rows }: { rows: CapRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="paper overflow-hidden">
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
                {r.note && <span className="block text-[12px] text-muted">{r.note}</span>}
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
