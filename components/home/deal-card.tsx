import Link from "next/link";
import { SemaphoreBadge } from "@/components/ui/semaphore";
import type { Deal, Semaphore } from "@/lib/types";

export function DealCard({
  deal,
  redCount,
  topReds,
  modeTarget,
}: {
  deal: Deal & { redCount: number; amberCount: number; topReds: string[] };
  redCount: number;
  topReds: string[];
  modeTarget: boolean;
}) {
  const priority = deal.priority === 1;
  const headline = modeTarget ? deal.headlineTarget : deal.headline;

  return (
    <article
      className={`paper relative flex flex-col p-5 sm:p-6 ${priority ? "border-gold" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="kicker">{priority ? "Prioridade do programa" : "Stand-by"}</p>
          <h2 className="serif mt-1 text-3xl text-navy">{deal.name}</h2>
          <p className="mt-1 text-sm text-muted">{deal.legalName}</p>
        </div>
        <span
          className={`stamp ${priority ? "text-alert" : "text-wait"}`}
        >
          {priority ? "Primeiro" : "Congelada"}
        </span>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed">{headline}</p>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
        <SemaphoreBadge tone={deal.health as Semaphore} />
        <span className="text-muted">{deal.phaseLabel}</span>
      </div>

      <p className="mt-3 text-sm">
        <span className="text-muted">Próximo marco · </span>
        {modeTarget ? deal.nextMilestoneTarget : deal.nextMilestone}
      </p>

      {redCount > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {topReds.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="dot dot-red mt-1.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-end justify-between">
        <p className="font-mono text-[12px] text-muted">{deal.cnpj}</p>
        <Link
          href={`/deals/${deal.slug}`}
          className="btn"
        >
          Abrir deal
        </Link>
      </div>
    </article>
  );
}
