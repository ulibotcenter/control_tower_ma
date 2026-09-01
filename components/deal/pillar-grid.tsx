import Link from "next/link";
import type { PillarView } from "@/lib/data/pillar-view";
import { semaphoreLabelFor } from "@/lib/mode-meta";
import type { MeetingMode, Semaphore } from "@/lib/types";

/**
 * Grade 2×3 dos pilares: o eixo da página do deal. Cada peça é o alvo do
 * clique. A linha de baixo conta o que existe naquele pilar para este modo —
 * pilar sem nada visível diz isso, em vez de mostrar zeros.
 */
export function PillarGrid({
  dealSlug,
  pillars,
  mode,
}: {
  dealSlug: string;
  pillars: PillarView[];
  mode: MeetingMode;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pillars.map((p) => (
        <li key={p.slug}>
          <Link href={`/deals/${dealSlug}/${p.slug}`} className="pillar-card paper group">
            <div className="flex items-start justify-between gap-3">
              <span className="pillar-card-order">{p.order}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted">
                <span className={`dot dot-${p.health as Semaphore}`} aria-hidden />
                {semaphoreLabelFor(mode, p.health)}
              </span>
            </div>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug tracking-tight text-navy group-hover:text-brand">
              {p.name}
            </h3>
            <p className="mt-1.5 text-[13px] text-muted">{resumo(p)}</p>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function resumo(p: PillarView) {
  if (p.total === 0) return "Nada nesta vista.";
  const partes: string[] = [];
  partes.push(`${p.documents.length} doc${p.documents.length === 1 ? "" : "s"}`);
  partes.push(
    p.openChecks === 1 ? "1 pendência aberta" : `${p.openChecks} pendências abertas`,
  );
  if (p.redRisks > 0) {
    partes.push(p.redRisks === 1 ? "1 ponto crítico" : `${p.redRisks} pontos críticos`);
  }
  return partes.join(" · ");
}
