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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <div key={m.id} className="paper p-4">
          <p className="kicker">
            <WithTerms text={m.label} />
          </p>
          <p className="serif mt-2 text-2xl text-navy">{m.value}</p>
          {m.context && (
            <p className="mt-1 text-[12px] text-muted">
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
    return (
      <EmptyState
        title="Nenhum documento nesta frente"
        hint="Quando um arquivo for classificado para esta frente, o link do Drive entra aqui."
      />
    );
  }
  return (
    <ul className="divide-y divide-line paper">
      {items.map((d) => (
        <DocRow key={d.id} d={d} />
      ))}
    </ul>
  );
}

function DocRow({ d }: { d: DriveDocument }) {
  const folderLink = Boolean(d.driveUrl && d.driveUrl.includes("/folders/"));
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {d.driveUrl && !folderLink ? (
          <DriveLink href={d.driveUrl}>
            <WithTerms text={d.title} interactive={false} />
          </DriveLink>
        ) : (
          <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-medium">
              <WithTerms text={d.title} />
            </span>
            {folderLink && d.driveUrl ? <DriveLink href={d.driveUrl} /> : null}
          </span>
        )}
        <span className="inline-flex flex-wrap items-center gap-2 text-[12px] text-muted">
          {DOC_TYPE_LABEL[d.type]}
          <StatusBadge tone={documentTone(d.status)}>{DOC_STATUS_LABEL[d.status]}</StatusBadge>
        </span>
      </div>
      {d.note && (
        <p className="mt-1 text-[13px] text-muted">
          <WithTerms text={d.note} />
        </p>
      )}
    </li>
  );
}

export function NotesList({ items }: { items: Note[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h3 className="serif mb-3 text-xl text-navy">Notas</h3>
      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id} className="border-l-2 border-brand pl-3 text-sm leading-relaxed">
            <WithTerms text={n.body} />
          </li>
        ))}
      </ul>
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
