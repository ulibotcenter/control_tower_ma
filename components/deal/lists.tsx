import type { ReactNode } from "react";
import type { CapRow, DriveDocument, MeetingMode, Metric, Note } from "@/lib/types";
import { TARGET_COPY } from "@/lib/mode-meta";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL } from "@/lib/constants";
import { docClassifiedToPillar, isProgramFolderCard } from "@/lib/data/doc-groups";
import { driveResourceId } from "@/lib/http";
import type { PillarSlug } from "@/lib/pillars";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { WithTerms } from "@/components/ui/with-terms";
import { NoteRowMenu } from "./room-bar";

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

function docShortMark(doc: DriveDocument): string {
  if (doc.status && DOC_STATUS_LABEL[doc.status]) return DOC_STATUS_LABEL[doc.status];
  if (doc.type && DOC_TYPE_LABEL[doc.type]) return DOC_TYPE_LABEL[doc.type];
  return "—";
}

export function pillarDocuments(items: DriveDocument[], pillar: PillarSlug): DriveDocument[] {
  return items.filter((doc) => docClassifiedToPillar(doc, pillar) && !isProgramFolderCard(doc));
}

export function PillarDocList({ items }: { items: DriveDocument[] }) {
  if (!items.length) return <EmptyState compact title="Nenhum documento neste pilar" />;
  return (
    <div className="ops-scroll">
      <table className="data-table ops-table">
        <thead>
          <tr>
            <th scope="col">Documento</th>
            <th scope="col">Status</th>
            <th scope="col">Drive</th>
          </tr>
        </thead>
        <tbody>
          {items.map((doc) => {
            const href = driveResourceId(doc.driveUrl) ? doc.driveUrl : "";
            const folder = href.includes("/folders/");
            return (
              <tr key={doc.id}>
                <td>
                  <span className="ops-strong ops-truncate" title={doc.title}>
                    <WithTerms text={doc.title} />
                  </span>
                </td>
                <td className="ops-meta-cell">
                  <span className="ops-short-mark">{docShortMark(doc)}</span>
                </td>
                <td className="ops-drive">
                  {href ? (
                    folder ? (
                      <DriveLink href={href} kind="folder" />
                    ) : (
                      <DriveLink href={href}>Abrir</DriveLink>
                    )
                  ) : (
                    <span className="ops-missing">sem link</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function NotesList({
  items,
  compose = null,
  compact = false,
  canEdit = false,
}: {
  items: Note[];
  compose?: ReactNode;
  compact?: boolean;
  canEdit?: boolean;
}) {
  if (!items.length && !compose) return null;
  return (
    <section id="notas" className={compact ? undefined : "mt-10"}>
      {compact ? null : <h3 className="serif mb-3 text-xl text-navy">Notas</h3>}
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="border-l-2 border-brand pl-3 text-sm leading-relaxed">
              <WithTerms text={n.body} />
              {canEdit ? <NoteRowMenu note={n} /> : null}
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
