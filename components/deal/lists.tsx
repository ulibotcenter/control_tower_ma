import type { CapRow, DriveDocument, MeetingMode, Metric, Note } from "@/lib/types";
import { TARGET_COPY } from "@/lib/mode-meta";
import { DOC_STATUS_LABEL, DOC_TYPE_LABEL } from "@/lib/constants";
import { DriveLink } from "@/components/ui/drive-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, documentTone } from "@/components/ui/status-badge";
import { Term } from "@/components/ui/term";
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

const DOC_GROUPS: { key: string; label: string; match: (d: DriveDocument) => boolean }[] = [
  { key: "nda", label: "NDAs", match: (d) => d.type === "nda" },
  { key: "legal", label: "Legal", match: (d) => d.workstreamSlug === "legal" && d.type !== "nda" },
  { key: "fin", label: "Financeiro", match: (d) => d.workstreamSlug === "financeiro" || d.type === "financeiro" },
  { key: "com", label: "Comercial", match: (d) => d.workstreamSlug === "comercial" },
  { key: "pi", label: "Pessoas / PI", match: (d) => d.workstreamSlug === "pessoas-pi" },
  { key: "ops", label: "Operacional", match: (d) => d.workstreamSlug === "operacional" },
  { key: "ata", label: "Atas e transcrições", match: (d) => d.type === "ata" || d.type === "transcricao" },
  { key: "folder", label: "Pastas no Drive", match: (d) => !d.driveId && Boolean(d.folderId) },
];

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

export function DocsByCategory({ items }: { items: DriveDocument[] }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nenhum documento nesta vista"
        hint="Pastas e arquivos classificados entram aqui. No modo Alvo, só o que o alvo pode ver."
      />
    );
  }
  const used = new Set<string>();
  const groups = DOC_GROUPS.map((g) => {
    const rows = items.filter((d) => !used.has(d.id) && g.match(d));
    rows.forEach((d) => used.add(d.id));
    return { ...g, rows };
  }).filter((g) => g.rows.length);
  const leftover = items.filter((d) => !used.has(d.id));
  if (leftover.length) groups.push({ key: "outros", label: "Outros", match: () => true, rows: leftover });

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.key}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {g.key === "nda" ? (
              <>
                <Term id="nda">NDAs</Term> (versão vigente / assinada)
              </>
            ) : g.key === "pi" ? (
              <>
                Pessoas / <Term id="pi">PI</Term>
              </>
            ) : (
              g.label
            )}
          </p>
          <ul className="divide-y divide-line paper">
            {g.rows.map((d) => (
              <DocRow key={d.id} d={d} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DocRow({ d }: { d: DriveDocument }) {
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {d.driveUrl ? (
          <DriveLink href={d.driveUrl} kind={d.driveId ? "file" : "folder"}>
            <WithTerms text={d.title} interactive={false} />
          </DriveLink>
        ) : (
          <span className="font-medium">
            <WithTerms text={d.title} />
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
