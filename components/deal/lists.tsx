import type { ReactNode } from "react";
import type { CapRow, DriveDocument, MeetingMode, Metric, Note } from "@/lib/types";
import { TARGET_COPY } from "@/lib/mode-meta";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL } from "@/lib/constants";
import { dataRoomGroups, docClassifiedToPillar, groupDocuments, isProgramFolderCard } from "@/lib/data/doc-groups";
import { driveResourceId } from "@/lib/http";
import type { PillarSlug } from "@/lib/pillars";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, documentTone } from "@/components/ui/status-badge";
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

export function DocsList({ items }: { items: DriveDocument[] }) {
  if (!items.length) {
    return <EmptyState compact title="Nenhum documento" />;
  }
  const groups = groupDocuments(items);
  return (
    <div className="doc-folders">
      {groups.map((group) => (
        <section key={group.folderId ?? "sem-pasta"} className="doc-folder">
          <h3 className="doc-folder-name">{group.folderName}</h3>
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
                {group.fronts.map((front) => (
                  <FrontRows key={front.slug ?? "geral"} front={front} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function FrontRows({
  front,
}: {
  front: { slug: string | null; label: string | null; items: DriveDocument[] };
}) {
  return (
    <>
      {front.label ? (
        <tr className="doc-front">
          <th scope="colgroup" colSpan={3}>
            {front.label}
          </th>
        </tr>
      ) : null}
      {front.items.map((d) => (
        <tr key={d.id}>
          <td>
            <span className="ops-strong">
              <WithTerms text={d.title} />
            </span>
            <span className="ops-meta">{DOC_TYPE_LABEL[d.type]}</span>
            {d.note ? (
              <span className="ops-meta">
                <WithTerms text={d.note} />
              </span>
            ) : null}
          </td>
          <td>
            {DOC_STATUS_LABEL[d.status] ? (
              <StatusBadge tone={documentTone(d.status)}>{DOC_STATUS_LABEL[d.status]}</StatusBadge>
            ) : (
              <span className="ops-missing">—</span>
            )}
          </td>
          <td className="ops-drive">
            <DriveLink href={d.driveUrl}>Abrir</DriveLink>
          </td>
        </tr>
      ))}
    </>
  );
}

export function DataRoomFinder({
  items,
  roomId,
  roomLabel,
}: {
  items: DriveDocument[];
  roomId: string | null;
  roomLabel: string;
}) {
  const groups = dataRoomGroups(items, { id: roomId ?? "", label: roomLabel });
  if (!groups.length) return <EmptyState compact title="Nenhum arquivo nesta pasta" />;
  return (
    <div className="doc-folders doc-finder">
      {groups.map((group) => (
        <section key={group.key} className="doc-folder">
          <div className="doc-finder-head">
            <h3 className="doc-folder-name">{group.label}</h3>
            {group.folderHref ? <DriveLink href={group.folderHref} kind="folder" /> : null}
          </div>
          {group.folders.length > 0 || group.files.length > 0 ? (
            <ul className="doc-finder-files">
              {group.folders.map((folder) => (
                <li key={folder.id}>
                  <span>{folder.title}</span>
                  <DriveLink href={folder.href} kind="folder" />
                </li>
              ))}
              {group.files.map((file) => (
                <li key={file.id}>
                  <DriveLink href={file.href}>{file.title}</DriveLink>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
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
                  <span className="ops-strong">
                    <WithTerms text={doc.title} />
                  </span>
                  {doc.note ? (
                    <span className="ops-meta">
                      <WithTerms text={doc.note} />
                    </span>
                  ) : null}
                </td>
                <td>
                  {DOC_STATUS_LABEL[doc.status] ? (
                    <StatusBadge tone={documentTone(doc.status)}>{DOC_STATUS_LABEL[doc.status]}</StatusBadge>
                  ) : (
                    <span className="ops-missing">—</span>
                  )}
                </td>
                <td className="ops-drive">
                  {href ? (
                    folder ? (
                      <DriveLink href={href} kind="folder" />
                    ) : (
                      <DriveLink href={href}>Abrir</DriveLink>
                    )
                  ) : (
                    <span className="ops-missing">—</span>
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
