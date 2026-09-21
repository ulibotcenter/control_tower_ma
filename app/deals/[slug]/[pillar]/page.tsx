import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ChecklistTable } from "@/components/deal/checklist-table";
import { DocsList } from "@/components/deal/lists";
import { ActionBoard } from "@/components/deal/action-board";
import { RisksBoard } from "@/components/deal/risks-board";
import { getDealBundle } from "@/lib/data/provider";
import {
  blockersFrom,
  ddOutsideSubgroups,
  ddSubgroupCounts,
  filterBySubgroup,
  firstOpenAction,
  getPillarViews,
} from "@/lib/data/pillar-view";
import { formatDate } from "@/lib/format";
import { isDealAllowed } from "@/lib/meeting";
import { semaphoreLabelFor, TARGET_COPY } from "@/lib/mode-meta";
import { WithTerms } from "@/components/ui/with-terms";
import { EmptyState } from "@/components/ui/empty-state";
import { getMeeting } from "@/lib/mode";
import {
  isDdSubgroup,
  isPillarSlug,
  pillarForLegacyWorkstream,
  pillarOfDealPhase,
  PILLAR_BY_SLUG,
} from "@/lib/pillars";
import type { Semaphore } from "@/lib/types";

/**
 * Um pilar do processo. A rota é a mesma que servia as frentes de trabalho:
 * `/deals/<deal>/legal` continua respondendo e manda para o pilar
 * equivalente, com o subgrupo já selecionado quando existe.
 */
export default async function PillarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; pillar: string }>;
  searchParams: Promise<{ frente?: string }>;
}) {
  const { slug, pillar } = await params;

  // Antes de qualquer busca: URL antiga de frente vai para o pilar dela.
  // Aqui o redirect ainda sai como 307; depois do primeiro await o shell já
  // foi transmitido e o salto viraria coisa do cliente.
  if (!isPillarSlug(pillar)) {
    const legado = pillarForLegacyWorkstream(pillar);
    if (!legado) notFound();
    const query = legado.subgroup ? `?frente=${legado.subgroup}` : "";
    redirect(`/deals/${slug}/${legado.pillar}${query}`);
  }

  const { frente } = await searchParams;
  const meeting = await getMeeting();
  if (!isDealAllowed(meeting, slug)) redirect(`/deals/${meeting.targetDeal}`);
  const mode = meeting.mode;
  const bundle = await getDealBundle(slug, mode);
  if (!bundle) notFound();

  const pillars = getPillarViews(bundle);
  const view = pillars.find((p) => p.slug === pillar)!;
  const meta = PILLAR_BY_SLUG[pillar];
  const sub = isDdSubgroup(frente) ? frente : null;
  const chips = pillar === "dd" ? ddSubgroupCounts(view) : [];
  const fora = pillar === "dd" ? ddOutsideSubgroups(view) : 0;

  const checklist = filterBySubgroup(view.checklist, sub);
  const risks = filterBySubgroup(view.risks, sub);
  const actions = filterBySubgroup(view.actions, sub);
  const documents = filterBySubgroup(view.documents, sub);
  const travas = blockersFrom(risks, checklist, 3, actions);
  const proximo = firstOpenAction(actions);
  const pendencias = checklist.filter((c) => c.status !== "concluido");
  const target = mode === "target";
  const bloqueado = travas.length > 0;

  return (
    <AppShell
      nav={{
        slug: bundle.deal.slug,
        name: bundle.deal.name,
        phasePillar: pillarOfDealPhase(bundle.deal.phase),
        pillars: pillars.map((p) => ({
          slug: p.slug,
          order: p.order,
          short: p.short,
          health: p.health,
        })),
      }}
    >
      <p className="pillar-back no-print">
        <Link href={`/deals/${slug}`}>← {bundle.deal.name}</Link>
      </p>

      <header className="pillar-head">
        <div className="min-w-0">
          <p className="kicker">Pilar {meta.order} de 6</p>
          <h1 className="pillar-name">{meta.name}</h1>
        </div>
        <span className={`health-chip is-${view.health as Semaphore} pillar-signal`}>
          <span className={`dot dot-${view.health as Semaphore}`} aria-hidden />
          {semaphoreLabelFor(mode, view.health)}
        </span>
      </header>

      <dl className={`pillar-now paper${bloqueado ? " trava-band" : ""}`}>
        <div>
          <dt className={bloqueado ? "trava-kicker" : "pillar-dt"}>O que trava este pilar</dt>
          <dd>
            {travas.length === 0 ? (
              <p className="pillar-calm">Nada trava este pilar hoje.</p>
            ) : (
              <ul className="pillar-blockers">
                {travas.map((t) => (
                  <li key={t.id}>
                    <WithTerms text={t.line} interactive={false} />
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="pillar-dt">Próximo passo</dt>
          <dd>
            {proximo ? (
              <>
                <p className="pillar-next">
                  <WithTerms text={proximo.title} interactive={false} />
                </p>
                <p className="pillar-next-meta">
                  {proximo.owner ? <span className="pillar-owner">{proximo.owner}</span> : null}
                  {proximo.owner ? <span aria-hidden> · </span> : null}
                  <span className={proximo.status === "late" ? "is-late" : undefined}>
                    {formatDate(proximo.due)}
                  </span>
                </p>
              </>
            ) : (
              <p className="pillar-calm">Nenhum próximo passo neste pilar.</p>
            )}
          </dd>
        </div>
      </dl>

      {chips.length > 0 && (
        <nav className="pillar-filter no-print" aria-label="Filtrar por frente">
          <span className="pillar-filter-label">Frente</span>
          <Link href={`/deals/${slug}/dd`} className={`chip${sub ? "" : " is-on"}`}>
            Tudo
            <span className="chip-count">{view.total}</span>
          </Link>
          {chips.map((c) => (
            <Link
              key={c.slug}
              href={`/deals/${slug}/dd?frente=${c.slug}`}
              className={`chip${sub === c.slug ? " is-on" : ""}`}
            >
              {c.name}
              <span className="chip-count">{c.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {chips.length > 0 && fora > 0 && !sub && (
        <p className="pillar-aside no-print">
          {fora} fora dos subgrupos — só em Tudo.
        </p>
      )}

      <div className="pillar-bands">
        <section className="pillar-band pillar-band-block">
          {risks.length === 0 && pendencias.length === 0 ? (
            <>
              <h2 className="pillar-band-title">{target ? "Pontos em aberto" : "Riscos"}</h2>
              <EmptyState compact title="Nada em aberto neste pilar" />
            </>
          ) : (
            <>
              {risks.length > 0 && (
                <>
                  <h2 className="pillar-band-title">{target ? "Pontos em aberto" : "Riscos"}</h2>
                  <RisksBoard items={risks} mode={mode} />
                </>
              )}
              {pendencias.length > 0 && (
                <>
                  <h2 className={`pillar-band-title${risks.length > 0 ? " is-follow" : ""}`}>
                    {target ? TARGET_COPY.documentsTitle : "Pendências"}
                  </h2>
                  <ChecklistTable items={pendencias} />
                </>
              )}
            </>
          )}
        </section>

        <section className="pillar-band pillar-band-action">
          <h2 className="pillar-band-title">Ações</h2>
          <ActionBoard items={actions} />
        </section>

        <section id="documentos" className="pillar-band pillar-band-docs">
          <h2 className="pillar-band-title">Documentos</h2>
          <DocsList items={documents} />
        </section>
      </div>

      {view.unfiled > 0 && !sub && (
        <p className="pillar-aside">
          {view.unfiled} {view.unfiled === 1 ? "item ainda sem frente" : "itens ainda sem frente"}.
        </p>
      )}

      <nav className="pillar-others no-print" aria-label="Outros pilares">
        <ul>
          {pillars
            .filter((p) => p.slug !== pillar)
            .map((p) => (
              <li key={p.slug}>
                <Link href={`/deals/${slug}/${p.slug}`} className="chip">
                  <span className={`dot dot-${p.health as Semaphore}`} aria-hidden />
                  {p.short}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </AppShell>
  );
}
