import Link from "next/link";
import { Term } from "@/components/ui/term";
import { Freshness } from "@/components/ui/freshness";
import { WithTerms } from "@/components/ui/with-terms";
import { blockersFrom, type PillarView } from "@/lib/data/pillar-view";
import { semaphoreShortFor } from "@/lib/mode-meta";
import { pillarOfDealPhase } from "@/lib/pillars";
import type { DealBundle, MeetingMode } from "@/lib/types";
import { MetricsGrid } from "./lists";

/**
 * O que a war room já mostrava como indicadores: semáforo dos 6 pilares,
 * a faixa “o que trava” e as métricas do bundle. Um cartão por pilar e por métrica.
 */
export function IndicatorsBoard({
  bundle,
  pillars,
  mode,
}: {
  bundle: DealBundle;
  pillars: PillarView[];
  mode: MeetingMode;
}) {
  const { deal } = bundle;
  const target = mode === "target";
  const review = deal.slug !== "loopert";
  const travas = blockersFrom(bundle.risks, bundle.checklist, 3, bundle.actions);
  const hereSlug = pillarOfDealPhase(deal.phase);
  const abrir = pillars.find((p) => p.slug === hereSlug) ?? pillars[0] ?? null;

  return (
    <>
      <section id="pilares" className="war-block war-pillars">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="war-label">Pilares</h2>
          {abrir && (
            <Link href={`/deals/${deal.slug}/${abrir.slug}`} className="war-open-pillar">
              abrir pilar
              <span className="sr-only"> {abrir.name}</span>
            </Link>
          )}
        </div>
        <ol className="pillar-strip" aria-label="Pilares do processo">
          {pillars.map((pilar) => {
            const here = hereSlug === pilar.slug;
            const saude = semaphoreShortFor(mode, pilar.health);
            return (
              <li key={pilar.slug}>
                <Link
                  href={`/deals/${deal.slug}/${pilar.slug}`}
                  className={`pillar-pip is-${pilar.health}${here ? " is-here" : ""}`}
                  aria-current={here ? "true" : undefined}
                  title={`${pilar.order}. ${pilar.name} · ${saude}`}
                >
                  <span className="pillar-pip-top">
                    <span className={`dot dot-${pilar.health}`} aria-hidden />
                    <span className="pillar-pip-ord">{pilar.order}</span>
                  </span>
                  <span className="pillar-pip-name">{pilar.short}</span>
                  <span className="sr-only">{here ? `${saude}. Estamos aqui.` : saude}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className={`war-trava paper war-block${travas.length > 0 ? " trava-band" : ""}`}>
        <p className={travas.length > 0 ? "trava-kicker" : "war-trava-calm"}>O que trava</p>
        {travas.length === 0 ? (
          <p className="war-trava-empty">Nada trava o deal hoje.</p>
        ) : (
          <ul>
            {travas.map((t) => (
              <li key={t.id}>
                <WithTerms text={t.line} interactive={false} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <section id="indicadores" className="war-block">
        <h2 className="war-label">Indicadores</h2>
        <Freshness trust={review ? "review" : "firm"} mode={mode} />
        <p className="war-note">
          {target ? (
            "Só números já formalizados. Dado ausente = a confirmar."
          ) : (
            <>
              Só o que está na história oficial. Dado ausente = a confirmar. Não há{" "}
              <Term id="loi">LOI</Term> nem <Term id="spa">SPA</Term>.
            </>
          )}
        </p>
        <MetricsGrid items={bundle.metrics} mode={mode} />
      </section>
    </>
  );
}
