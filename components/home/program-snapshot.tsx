import Link from "next/link";
import { MODE_META, TARGET_COPY, semaphoreLabelFor } from "@/lib/mode-meta";
import type { Deal, MeetingMode, Semaphore } from "@/lib/types";
import { Hint } from "@/components/ui/hint";
import { WithTerms } from "@/components/ui/with-terms";
import { Freshness } from "@/components/ui/freshness";
import { Dot } from "@/components/ui/semaphore";

type Row = Deal & { redCount: number; amberCount: number; topReds: string[] };

export function ProgramSnapshot({
  deals,
  mode,
}: {
  deals: Row[];
  mode: MeetingMode;
}) {
  const meta = MODE_META[mode];
  return (
    <section className="paper overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div>
          <p className="kicker">
            {mode === "target" ? TARGET_COPY.snapshotKicker : "Visão do programa"}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-navy">
            {deals.length > 1 ? "As duas operações, lado a lado" : "Situação da operação"}
          </h2>
          <Freshness />
        </div>
        <p className="max-w-md text-[12px] text-muted">
          {mode === "target"
            ? "Verde segue. Âmbar pede acompanhamento. Vermelho é pendência formal em aberto."
            : "Verde segue. Âmbar pede atenção. Vermelho trava o avanço até alguém decidir ou entregar um documento."}
        </p>
      </div>
      <div className="grid lg:grid-cols-2">
        {deals.map((deal, i) => {
          const priority = deal.priority === 1;
          return (
            <Link
              key={deal.id}
              href={`/deals/${deal.slug}`}
              className={`block px-4 py-4 hover:bg-cream-2 ${i === 0 ? "border-b border-line lg:border-b-0 lg:border-r" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kicker">
                    {mode === "target" ? "Operação" : priority ? "Prioridade" : "Em análise"}
                  </p>
                  <p className="text-xl font-semibold tracking-tight text-navy">{deal.name}</p>
                </div>
                <Hint
                  interactive={false}
                  label={
                    deal.health === "red"
                      ? "Há algo que impede assinar ou avançar de fase."
                      : deal.health === "amber"
                        ? "Não está travado, mas precisa de acompanhamento."
                        : deal.health === "green"
                          ? "No ritmo combinado."
                          : "Esta frente ainda não começou."
                  }
                >
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <Dot tone={deal.health as Semaphore} />
                    {semaphoreLabelFor(mode, deal.health)}
                  </span>
                </Hint>
              </div>
              <p className="mt-2 text-sm text-muted">
                <WithTerms text={deal.phaseLabel} interactive={false} />
              </p>
              <p className="mt-1 text-[13px] leading-snug">
                <span className="text-muted">Próximo · </span>
                <WithTerms text={mode === "target" ? deal.nextMilestoneTarget : deal.nextMilestone} interactive={false} />
              </p>
              {deal.redCount > 0 && (
                <p className="mt-2 text-[12px] font-medium text-alert">
                  {meta.snapshotRedLabel(deal.redCount)}
                  {deal.topReds[0] ? (
                    <>
                      {" · "}
                      <WithTerms text={deal.topReds[0]} interactive={false} />
                    </>
                  ) : null}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
