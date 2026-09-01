import Link from "next/link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import { WithTerms } from "@/components/ui/with-terms";
import { semaphoreLabelFor } from "@/lib/mode-meta";
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
      className={`deal-card paper flex h-full flex-col p-5 sm:min-h-[21rem] sm:p-7 ${
        priority ? "border-gold/70 shadow-[0_10px_30px_-18px_rgb(10_20_40_/_35%)]" : "border-line"
      }`}
    >
      <span className={`deal-card-bar ${priority ? "bg-gold" : "bg-cyan"}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pl-1">
          {/* Ordem de prioridade denuncia que existe outra operação. */}
          <p className="kicker">
            {target ? "Operação em avaliação" : priority ? "Prioridade do programa" : "Segunda operação"}
          </p>
          <h2 className="serif mt-1 text-[1.75rem] leading-none tracking-tight text-navy sm:text-3xl">
            {deal.name}
          </h2>
          <p className="mt-1.5 text-sm text-muted">{deal.legalName}</p>
        </div>
        {!target && (
          <span
            className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
              priority ? "bg-gold text-navy" : "border border-cyan/50 bg-cyan/10 text-[#0e7490]"
            }`}
          >
            {priority ? "Primeiro" : "Em análise"}
          </span>
        )}
      </div>

      <p className="mt-5 pl-1 text-[15px] leading-relaxed">
        <WithTerms text={headline} />
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 pl-1 text-sm">
        <SemaphoreBadge
          tone={deal.health as Semaphore}
          label={semaphoreLabelFor(mode, deal.health)}
        />
        <span className="text-muted">
          <WithTerms text={deal.phaseLabel} />
        </span>
      </div>

      <p className="mt-3 pl-1 text-sm">
        <span className="text-muted">Próximo marco · </span>
        <WithTerms text={target ? deal.nextMilestoneTarget : deal.nextMilestone} />
      </p>

      {redCount > 0 && (
        <ul className="mt-4 space-y-1.5 pl-1 text-sm">
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

      <div className="mt-auto flex flex-col gap-3 pt-6 pl-1 sm:flex-row sm:items-end sm:justify-between">
        <p className="font-mono text-[12px] text-muted">{deal.cnpj}</p>
        <Link href={`/deals/${deal.slug}`} className="btn min-h-11 w-full sm:min-h-0 sm:w-auto">
          Abrir operação
        </Link>
      </div>
    </article>
  );
}
