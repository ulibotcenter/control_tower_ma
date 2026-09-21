import Link from "next/link";
import { semaphoreLabelFor, semaphoreShortFor, TARGET_COPY } from "@/lib/mode-meta";
import { blockersFrom, type PillarView } from "@/lib/data/pillar-view";
import { pillarOfDealPhase } from "@/lib/pillars";
import type { DealBundle, MeetingMode, Semaphore } from "@/lib/types";
import { WithTerms } from "@/components/ui/with-terms";
import { Timeline } from "./timeline";
import { DocsList, MetricsGrid } from "./lists";

/**
 * Apresentar é o mesmo bundle, outro cromo: uma sequência de lâminas.
 * O que cada modo pode ver já veio filtrado no bundle. Aqui só a ordem.
 */
export function PresentDeck({
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
  const frozen = deal.status === "standby";
  const milestone = target ? deal.nextMilestoneTarget : deal.nextMilestone;
  const hereSlug = pillarOfDealPhase(deal.phase);
  const travas = blockersFrom(bundle.risks, bundle.checklist, 3, bundle.actions);
  const showNumbers = bundle.metrics.length > 0;
  const showDocs = bundle.documents.length > 0;

  return (
    <article className="present-deck">
      <section id="visao" className="deck-slide">
        <h1 className="deck-title">{deal.name}</h1>
        <p className="deck-city">{deal.city}</p>
        {frozen && (
          <p className="stamp deck-stamp">
            {target ? "Em análise" : "Em análise · em paralelo"}
          </p>
        )}
        <dl className="deck-facts">
          <div>
            <dt>{TARGET_COPY.phaseLabel}</dt>
            <dd>
              <WithTerms text={deal.phaseLabel} interactive={false} />
            </dd>
          </div>
          <div className="deck-facts-signal">
            <dt>{TARGET_COPY.healthLabel}</dt>
            <dd>
              <span className={`health-chip deck-signal is-${deal.health as Semaphore}`}>
                <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
                {semaphoreLabelFor(mode, deal.health)}
              </span>
            </dd>
          </div>
          <div>
            <dt>{TARGET_COPY.nextMilestoneLabel}</dt>
            <dd>
              <WithTerms text={milestone} interactive={false} />
            </dd>
          </div>
        </dl>
      </section>

      <section id="travas" className="deck-slide">
        <h2 className="deck-heading">O que trava</h2>
        {travas.length === 0 ? (
          <p className="deck-empty">Nada trava o deal hoje.</p>
        ) : (
          <ul className="deck-blockers">
            {travas.map((t) => (
              <li key={t.id}>
                <WithTerms text={t.line} interactive={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="pilares" className="deck-slide">
        <h2 className="deck-heading">Pilares</h2>
        <ol className="pillar-strip deck-pillars" aria-label="Pilares do processo">
          {pillars.map((pilar) => {
            const here = hereSlug === pilar.slug;
            const saude = semaphoreShortFor(mode, pilar.health);
            return (
              <li key={pilar.slug}>
                <Link
                  href={`/deals/${deal.slug}/${pilar.slug}`}
                  className={`pillar-pip is-${pilar.health}${here ? " is-here" : ""}`}
                  aria-current={here ? "true" : undefined}
                >
                  <span className="pillar-pip-top">
                    <span className={`dot dot-${pilar.health}`} aria-hidden />
                    <span className="pillar-pip-ord">{pilar.order}</span>
                  </span>
                  <span className="pillar-pip-name">{pilar.short}</span>
                  <span className="deck-pillar-health">{saude}</span>
                  {here ? <span className="sr-only">Estamos aqui.</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {bundle.milestones.length > 0 && (
        <section id="onde" className="deck-slide">
          <h2 className="deck-heading">Onde estamos</h2>
          <Timeline items={bundle.milestones} mode={mode} compact />
        </section>
      )}

      {showNumbers && (
        <section id="indicadores" className="deck-slide">
          <h2 className="deck-heading">Números</h2>
          <MetricsGrid items={bundle.metrics} mode={mode} />
        </section>
      )}

      {showDocs && (
        <section id="documentos" className="deck-slide">
          <h2 className="deck-heading">Documentos</h2>
          <DocsList items={bundle.documents} />
        </section>
      )}

      <section id="perguntas" className="deck-slide">
        <h2 className="deck-heading">{TARGET_COPY.nextMilestoneLabel}</h2>
        <p className="deck-close">
          <WithTerms text={milestone} interactive={false} />
        </p>
        <p className="deck-perguntas">Perguntas</p>
      </section>
    </article>
  );
}
