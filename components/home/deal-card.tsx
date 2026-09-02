import Link from "next/link";
import { WithTerms } from "@/components/ui/with-terms";
import { semaphoreLabelFor } from "@/lib/mode-meta";
import type { Deal, MeetingMode, Semaphore } from "@/lib/types";

/**
 * A operação como instrumento: nome, situação, fase, próximo marco e uma
 * linha de leitura. A peça inteira é o alvo do clique — não há botão.
 * Os termos ficam não interativos porque tudo aqui está dentro de um link.
 */
export function DealCard({
  deal,
  mode,
}: {
  deal: Deal & { redCount: number; amberCount: number; topReds: string[] };
  mode: MeetingMode;
}) {
  const target = mode === "target";
  const priority = deal.priority === 1;

  return (
    <Link href={`/deals/${deal.slug}`} className="deal-card paper group flex h-full flex-col p-5">
      <span
        className={`deal-card-bar ${priority ? "bg-brand" : "bg-line-2"}`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">
            {target ? "Operação em avaliação" : priority ? "Prioridade" : "Segunda operação"}
          </p>
          <h2 className="serif mt-0.5 text-[25px] leading-tight tracking-tight text-navy group-hover:text-brand">
            {deal.name}
          </h2>
          <p className="mt-1 truncate text-[13px] text-muted">{deal.legalName}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-[13px] text-navy">
          <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
          {semaphoreLabelFor(mode, deal.health)}
        </span>
      </div>

      {deal.status === "standby" && (
        <p className="stamp mt-3 text-wait">
          {target ? "Em análise" : "Em análise · em paralelo"}
        </p>
      )}

      <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-y border-line py-3 text-[13px] sm:grid-cols-[7rem_minmax(0,1fr)]">
        <dt className="text-muted">Fase</dt>
        <dd className="text-navy">
          <WithTerms text={deal.phaseLabel} interactive={false} />
        </dd>
        <dt className="text-muted">O que trava</dt>
        <dd className={deal.topReds[0] ? "font-medium text-alert" : "text-navy"}>
          {deal.topReds[0] ? (
            <WithTerms text={deal.topReds[0]} interactive={false} />
          ) : (
            "Nada trava"
          )}
        </dd>
        <dt className="text-muted">Próximo</dt>
        <dd className="text-navy">
          <WithTerms
            text={target ? deal.nextMilestoneTarget : deal.nextMilestone}
            interactive={false}
          />
        </dd>
      </dl>

      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        <WithTerms text={target ? deal.headlineTarget : deal.headline} interactive={false} />
      </p>
    </Link>
  );
}
