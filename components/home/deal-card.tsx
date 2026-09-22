import Link from "next/link";
import { WithTerms } from "@/components/ui/with-terms";
import { semaphoreLabelFor, TARGET_COPY } from "@/lib/mode-meta";
import type { Deal, MeetingMode, Semaphore } from "@/lib/types";

/**
 * Uma operação na capa: identidade do seed e o sinal de andamento.
 * Sem tabela, sem documentos, sem OPL — o miolo do deal fica do outro lado do Entrar.
 */
export function DealCard({
  deal,
  mode,
}: {
  deal: Deal;
  mode: MeetingMode;
}) {
  const target = mode === "target";
  const proximo = target ? deal.nextMilestoneTarget : deal.nextMilestone;
  const legal = [deal.legalName, deal.cnpj].filter(Boolean).join(" · ");
  const meta = [deal.product, deal.city, deal.since].filter(Boolean).join(" / ");

  return (
    <article className="cover-card paper">
      <div className="cover-body">
        <div className="cover-head">
          <div className="min-w-0">
            <h2 className="cover-name">{deal.name}</h2>
            {legal ? <p className="cover-legal">{legal}</p> : null}
            {meta ? <p className="cover-product">{meta}</p> : null}
          </div>
        </div>

        <dl className="cover-facts">
          <dt>{TARGET_COPY.phaseLabel}</dt>
          <dd>
            <WithTerms text={deal.phaseLabel} interactive={false} />
          </dd>
          <dt>{TARGET_COPY.healthLabel}</dt>
          <dd>
            <span className={`health-chip is-${deal.health as Semaphore}`}>
              <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
              {semaphoreLabelFor(mode, deal.health)}
            </span>
          </dd>
          <dt>{TARGET_COPY.nextMilestoneLabel}</dt>
          <dd>
            <WithTerms text={proximo} interactive={false} />
          </dd>
        </dl>
      </div>

      <div className="cover-lower">
        <Link href={`/deals/${deal.slug}`} className="btn btn-primary cover-enter">
          Entrar
        </Link>
      </div>
    </article>
  );
}
