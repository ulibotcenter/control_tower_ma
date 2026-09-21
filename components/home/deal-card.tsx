import Link from "next/link";
import { DriveLink } from "@/components/ui/drive-link";
import { WithTerms } from "@/components/ui/with-terms";
import { hrefWithDeal } from "@/components/shell/focus-deal";
import { folderUrl } from "@/lib/constants";
import type { PillarView } from "@/lib/data/pillar-view";
import { semaphoreLabelFor, semaphoreShortFor, TARGET_COPY } from "@/lib/mode-meta";
import type { PillarSlug } from "@/lib/pillars";
import type { Deal, MeetingMode, Semaphore } from "@/lib/types";

export type CoverWeight = "lead" | "second" | "only";

/**
 * Uma operação na capa. O miolo leva ao deal; cada pilar da faixa leva à
 * página daquele pilar. Atalhos que saem de `/deals/` carregam `?deal=`.
 */
export function DealCard({
  deal,
  mode,
  weight,
  pillars,
  trava,
  redCount,
  emAberto,
  openActions,
  openChecks,
  hereSlug,
  showDrive,
  showDecisions,
}: {
  deal: Deal;
  mode: MeetingMode;
  weight: CoverWeight;
  pillars: PillarView[];
  trava: { id: string; line: string }[];
  redCount: number;
  emAberto: number | null;
  openActions: number | null;
  openChecks: number | null;
  hereSlug: PillarSlug | null;
  showDrive: boolean;
  showDecisions: boolean;
}) {
  const target = mode === "target";
  const rotulo = target
    ? "Operação em avaliação"
    : deal.priority === 1
      ? "Prioridade"
      : "Segunda operação";
  const vazio = target ? TARGET_COPY.criticalEmpty : "Nada trava";
  const proximo = target ? deal.nextMilestoneTarget : deal.nextMilestone;
  const shortcuts = showDrive || showDecisions;

  return (
    <article className={`cover-card paper is-${weight}`}>
      <Link href={`/deals/${deal.slug}`} className="cover-body">
        <div className="cover-head">
          <div className="min-w-0">
            <p className="kicker cover-kicker">{rotulo}</p>
            <h2 className="cover-name">{deal.name}</h2>
            <p className="cover-city">{deal.city}</p>
            {deal.status === "standby" && (
              <p className="stamp mt-3 text-wait">
                {target ? "Em análise" : "Em análise · em paralelo"}
              </p>
            )}
          </div>
          <span className={`health-chip is-${deal.health as Semaphore}`}>
            <span className={`dot dot-${deal.health as Semaphore}`} aria-hidden />
            {semaphoreLabelFor(mode, deal.health)}
          </span>
        </div>

        <dl className="cover-facts">
          <dt>{TARGET_COPY.phaseLabel}</dt>
          <dd>
            <WithTerms text={deal.phaseLabel} interactive={false} />
          </dd>
          <dt>O que trava</dt>
          <dd>
            {trava.length === 0 ? (
              vazio
            ) : (
              <ul className="cover-trava">
                {trava.map((item) => (
                  <li key={item.id}>
                    <WithTerms text={item.line} interactive={false} />
                  </li>
                ))}
              </ul>
            )}
          </dd>
          <dt>{TARGET_COPY.nextMilestoneLabel}</dt>
          <dd>
            <WithTerms text={proximo} interactive={false} />
          </dd>
        </dl>

        <p className="cover-counts">
          <span>{vermelhoLabel(mode, redCount)}</span>
          {emAberto !== null && (
            <>
              <span aria-hidden>·</span>
              <span>
                {abertoLabel(emAberto)}
                {mode !== "target" && openActions !== null && openChecks !== null && (
                  <span className="sr-only">
                    {` (${conta(openActions, "ação não concluída", "ações não concluídas")}, ${conta(openChecks, "pendência aberta", "pendências abertas")}, ${conta(redCount, "risco vermelho", "riscos vermelhos")})`}
                  </span>
                )}
              </span>
            </>
          )}
        </p>
      </Link>

      {(pillars.length > 0 || shortcuts) && (
        <div className="cover-lower">
          {pillars.length > 0 && (
            <ol className="pillar-strip" aria-label={`Pilares · ${deal.name}`}>
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
                    <span className="sr-only">
                      {here ? `${saude}. Estamos aqui.` : saude}
                    </span>
                  </Link>
                </li>
              );
            })}
            </ol>
          )}

          {shortcuts && (
            <div className="cover-shortcuts">
              {showDrive && (
                <span className="cover-drive">
                  <span>{deal.driveFolderLabel}</span>
                  <DriveLink href={deal.driveFolderId ? folderUrl(deal.driveFolderId) : ""} kind="folder" />
                </span>
              )}
              {showDecisions && (
                <Link href={hrefWithDeal("/decisions", deal.slug)} className="cover-jump">
                  Decisões
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function vermelhoLabel(mode: MeetingMode, n: number) {
  if (mode === "target") {
    if (n === 0) return "Nenhuma pendência formal";
    if (n === 1) return "1 pendência formal";
    return `${n} pendências formais`;
  }
  if (n === 0) return "Nenhum vermelho";
  if (n === 1) return "1 vermelho";
  return `${n} vermelhos`;
}

function abertoLabel(n: number) {
  if (n === 0) return "Nada em aberto";
  if (n === 1) return "1 em aberto";
  return `${n} em aberto`;
}

function conta(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}
