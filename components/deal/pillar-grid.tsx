import Link from "next/link";
import type { PillarView } from "@/lib/data/pillar-view";
import { semaphoreShortFor } from "@/lib/mode-meta";
import type { MeetingMode, Semaphore } from "@/lib/types";
import type { PillarSlug } from "@/lib/pillars";

/**
 * Grade 2×3: o eixo da página do deal. Seis peças da mesma altura, mesma
 * superfície, mesma borda. A peça inteira é o alvo do clique e o hover só
 * firma a linha — nada de salto, sombra ou troca de cor no título.
 */
export function PillarGrid({
  dealSlug,
  pillars,
  mode,
  hereSlug = null,
}: {
  dealSlug: string;
  pillars: PillarView[];
  mode: MeetingMode;
  hereSlug?: PillarSlug | null;
}) {
  return (
    <ol className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pillars.map((p) => (
        <li key={p.slug} className="min-w-0">
          <Link
            href={`/deals/${dealSlug}/${p.slug}`}
            className={`pillar-card paper is-${p.health as Semaphore}${hereSlug === p.slug ? " is-here" : ""}`}
          >
            <span className="pillar-card-order">{p.order}</span>
            {hereSlug === p.slug && (
              <span className="stamp pillar-here">Estamos aqui</span>
            )}
            <h3 className="pillar-card-name">{p.name}</h3>
            <p className="pillar-card-meta">
              <span className="flex items-center gap-1.5">
                <span className={`dot dot-${p.health as Semaphore}`} aria-hidden />
                {p.total === 0 ? "Ainda não iniciado" : semaphoreShortFor(mode, p.health)}
              </span>
              {p.redRisks > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="pillar-card-crit">
                    {p.redRisks === 1 ? "1 crítico" : `${p.redRisks} críticos`}
                  </span>
                </>
              )}
              {p.total > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{contagem(p)}</span>
                </>
              )}
            </p>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Só o que tem número. "0 pendências" não informa, ocupa. */
function contagem(p: PillarView) {
  const partes: string[] = [];
  if (p.openChecks > 0) {
    partes.push(p.openChecks === 1 ? "1 pendência" : `${p.openChecks} pendências`);
  }
  if (p.documents.length > 0) {
    partes.push(p.documents.length === 1 ? "1 doc" : `${p.documents.length} docs`);
  }
  if (partes.length === 0) return `${p.total} ${p.total === 1 ? "item" : "itens"}`;
  return partes.join(" · ");
}
