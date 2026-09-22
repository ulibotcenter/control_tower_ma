import { semaphoreLabelFor, TARGET_COPY, viewChrome } from "@/lib/mode-meta";
import type { PillarView } from "@/lib/data/pillar-view";
import type { TemaSlug } from "@/lib/data/temas";
import type { DealBundle, MeetingMode, Semaphore } from "@/lib/types";
import { ThemePanel, ThemeRail } from "./theme-rail";
import { WithTerms } from "@/components/ui/with-terms";
import { Timeline } from "./timeline";
import { Freshness } from "@/components/ui/freshness";
import { PresentDeck } from "./present-deck";

export function DealView({
  bundle,
  pillars,
  mode,
  present = false,
  tema = null,
}: {
  bundle: DealBundle;
  pillars: PillarView[];
  mode: MeetingMode;
  present?: boolean;
  tema?: TemaSlug | null;
}) {
  if (present) {
    return <PresentDeck bundle={bundle} pillars={pillars} mode={mode} />;
  }

  const { deal } = bundle;
  const chrome = viewChrome(mode, false);
  const frozen = deal.status === "standby";
  const review = deal.slug !== "loopert";
  const target = mode === "target";

  return (
    <article>
      <div className="war-top">
        <header id="visao">
          {!target && <p className="kicker">Deal {deal.priority}</p>}
          <h1 className="deal-name">{deal.name}</h1>
          <p className="deal-city">
            {deal.city}
            {deal.since ? ` · desde ${deal.since}` : ""}
          </p>
          {frozen && (
            <p className="stamp mt-2 text-wait">
              {mode === "target" ? "Em análise" : "Em análise · em paralelo"}
            </p>
          )}
          <p className="deal-legal">
            {deal.legalName} · {deal.cnpj}
          </p>
          {chrome.showProductLine && deal.product && (
            <p className="deal-product">{deal.product}</p>
          )}
        </header>

        <dl className="war-situation paper">
          <div>
            <dt>{TARGET_COPY.phaseLabel}</dt>
            <dd>
              <WithTerms text={deal.phaseLabel} interactive={false} />
            </dd>
          </div>
          <div>
            <dt>{TARGET_COPY.healthLabel}</dt>
            <dd>
              <span className={`health-chip is-${deal.health as Semaphore}`}>
                <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
                {semaphoreLabelFor(mode, deal.health)}
              </span>
            </dd>
          </div>
          <div>
            <dt>{TARGET_COPY.nextMilestoneLabel}</dt>
            <dd>
              <WithTerms
                text={target ? deal.nextMilestoneTarget : deal.nextMilestone}
                interactive={false}
              />
            </dd>
          </div>
        </dl>
      </div>

      <p className="war-headline">
        <WithTerms text={target ? deal.headlineTarget : deal.headline} />
      </p>

      <section className="war-block">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="war-label">Onde estamos</h2>
          <p className="text-[12px] text-muted">
            {bundle.milestones.filter((m) => m.status === "done").length} de{" "}
            {bundle.milestones.length} marcos concluídos
          </p>
        </div>
        <Freshness trust={review ? "review" : "firm"} mode={mode} />
        <div className="mt-2">
          <Timeline items={bundle.milestones} mode={mode} compact />
        </div>
      </section>

      <ThemeRail bundle={bundle} tema={tema} />
      {tema ? <ThemePanel bundle={bundle} tema={tema} target={target} /> : null}
    </article>
  );
}
