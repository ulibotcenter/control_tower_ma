import Link from "next/link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { Hint } from "@/components/ui/hint";
import { WithTerms } from "@/components/ui/with-terms";
import type { Deal, MeetingMode, Semaphore } from "@/lib/types";

export function DealCard({
  deal,
  redCount,
  topReds,
  mode,
}: {
  deal: Deal & { redCount: number; amberCount: number; topReds: string[] };
  redCount: number;
  topReds: string[];
  mode: MeetingMode;
}) {
  const priority = deal.priority === 1;
  const target = mode === "target";
  const headline = target ? deal.headlineTarget : deal.headline;

  return (
    <article
      className={`paper relative flex h-full flex-col p-4 sm:min-h-[20rem] sm:p-6 lg:min-h-[22rem] ${priority ? "border-gold" : "border-cyan/40"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kicker">{priority ? "Prioridade do programa" : "Stand-by"}</p>
          <h2 className="serif mt-1 text-2xl text-navy sm:text-3xl">{deal.name}</h2>
          <p className="mt-1 text-sm text-muted">{deal.legalName}</p>
        </div>
        <Hint
          label={
            priority
              ? "O board trata esta operação antes da outra."
              : target
                ? "Sem andamento neste momento."
                : "Sem andamento de propósito. Não pressionar o alvo."
          }
        >
          <span className={`stamp ${priority ? "text-alert" : "text-[#0e7490]"}`}>
            {priority ? "Primeiro" : "Congelada"}
          </span>
        </Hint>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed">
        <WithTerms text={headline} />
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <SemaphoreBadge tone={deal.health as Semaphore} />
        <span className="text-muted">
          <WithTerms text={deal.phaseLabel} />
        </span>
      </div>

      <p className="mt-3 text-sm">
        <span className="text-muted">Próximo marco · </span>
        <WithTerms text={target ? deal.nextMilestoneTarget : deal.nextMilestone} />
      </p>

      {redCount > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {topReds.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="dot dot-red mt-1.5 shrink-0" aria-hidden />
              <span>
                <WithTerms text={t} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-end sm:justify-between sm:pt-6">
        <p className="font-mono text-[12px] text-muted">{deal.cnpj}</p>
        <Link href={`/deals/${deal.slug}`} className="btn min-h-11 w-full sm:min-h-0 sm:w-auto">
          Abrir deal
        </Link>
      </div>
    </article>
  );
}
